import EDIT_HTML from './edit.html';
import LOGS_HTML from './logs.html';
import FILES_HTML from './files.html';
import { createFileSystem, VirtualFile } from './storage';

export interface Env {
	// generic configs
	ADMIN_USERNAME: string;
	ADMIN_PASSWORD: string;
	EDIT_PREFIX: string;
	LOGS_PREFIX: string;
	REQUEST_LOG_MAX_BODY: number;

	// kv
	files: KVNamespace;
	requests: KVNamespace;
	FILE_RETENTION_SECONDS: number;
	REQUEST_LOG_RETENTION_SECONDS: number;

	// d1
	db: D1Database;
}

function doAuth(env: Env, request: Request) {
	const { headers } = request;
	const auth = headers.get('authorization');
	if (!auth) {
		return new Response('Unauthorized', {
			status: 401,
			headers: {
				'WWW-Authenticate': 'Basic realm="Admin Access"',
			},
		});
	}
	try {
		const [username, password] = atob(auth.slice('Basic '.length)).split(':');
		const good = username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD;
		if (good) {
			return;
		}
	} catch {
		// if any error happens, just return unauthorized
	}
	return new Response('Unauthorized', {
		status: 401,
		headers: {
			'WWW-Authenticate': 'Basic realm="Admin Access"',
		},
	});
}

interface RequestLog {
	id: string;
	method: string;
	path: string;
	search: string;
	headers: Record<string, string>;
	body?: string;
	date: Date;
}

class RequestLogger {
	constructor(private env: Env) {}
	async log(request: Request): Promise<void> {
		const { method, headers } = request;
		const { pathname, search } = new URL(request.url);
		const id = crypto.randomUUID();
		const log: RequestLog = {
			id,
			method,
			path: pathname,
			search,
			headers: Object.fromEntries(headers),
			date: new Date(),
			body: method === 'GET' || method === 'HEAD' ? undefined : await request.text(),
		};
		return this.env.requests.put(id, RequestLogger.logToStr(log), { expirationTtl: this.env.REQUEST_LOG_RETENTION_SECONDS });
	}
	async deleteLog(id: string): Promise<void> {
		return this.env.requests.delete(id);
	}
	async deleteLogs(): Promise<void> {
		const logKeys = (await this.env.requests.list()).keys;
		await Promise.all(logKeys.map((k) => this.env.requests.delete(k.name)));
	}
	async getLogs(): Promise<RequestLog[]> {
		const logKeys = (await this.env.requests.list()).keys;
		const logs = (await Promise.all(logKeys.map((k) => this.env.requests.get(k.name)))).filter(Boolean) as string[];
		return logs.map((l) => RequestLogger.logFromStr(l)).sort((a, b) => (a.date > b.date ? -1 : 1));
	}
	static logToStr(log: RequestLog): string {
		return JSON.stringify(log);
	}
	static logFromStr(logStr: string): RequestLog {
		const ret = JSON.parse(logStr, (key: string, value: any) => (key === 'date' ? new Date(value) : value));
		return ret;
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const fs = createFileSystem('d1', env);
		const logger = new RequestLogger(env);

		const { method, headers } = request;
		const accept = headers.get('accept') || '';
		const { pathname } = new URL(request.url);
		if (pathname.startsWith(env.EDIT_PREFIX)) {
			const auth = doAuth(env, request);
			if (auth) {
				return auth;
			}
			const filepath = pathname.slice(env.EDIT_PREFIX.length);
			if (method === 'GET') {
				if (accept === 'application/json') {
					const ct = filepath ? await fs.getFile(filepath) : await fs.getFilePaths();
					return new Response(JSON.stringify(ct), {
						headers: {
							'content-type': 'application/json',
							'cache-control': 'no-store',
						},
					});
				}
				return new Response(filepath ? EDIT_HTML : FILES_HTML, {
					headers: {
						'content-type': 'text/html',
						'cache-control': 'no-store',
					},
				});
			} else if (method === 'PUT') {
				if (!filepath) {
					return new Response('Bad Request', { status: 400 });
				}
				const vf: VirtualFile = await request.json();
				await fs.createFile(filepath, vf.content, vf.headers);
				return new Response('OK');
			} else if (method === 'DELETE') {
				if (filepath) {
					await fs.deleteFile(filepath);
				} else {
					await fs.deleteFiles();
				}
				return new Response('OK');
			}
		}
		if (pathname.startsWith(env.LOGS_PREFIX)) {
			const auth = doAuth(env, request);
			if (auth) {
				return auth;
			}
			const id = pathname.slice(env.LOGS_PREFIX.length).slice(1);
			if (method === 'GET') {
				if (accept === 'application/json') {
					const logs = await logger.getLogs();
					return new Response(JSON.stringify(logs), {
						headers: {
							'content-type': 'application/json',
							'cache-control': 'no-store',
						},
					});
				}
				return new Response(LOGS_HTML, {
					headers: {
						'content-type': 'text/html',
						'cache-control': 'no-store',
					},
				});
			} else if (method === 'DELETE') {
				if (id) {
					await logger.deleteLog(id);
				} else {
					await logger.deleteLogs();
				}
				return new Response('OK');
			}
		}

		await logger.log(request);

		const file = await fs.getFile(pathname);
		if (file === null) {
			return new Response('Not Found', { status: 404 });
		}
		return new Response(file.content, { headers: file.headers });
	},
};
