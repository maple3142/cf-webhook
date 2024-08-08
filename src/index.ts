// import EDIT_HTML from './edit.html';
// import LOGS_HTML from './logs.html';
// import FILES_HTML from './files.html';
import assets from './assets';
import { createFileSystem, VirtualFile, createRequestLogger } from './storage';

export interface Env {
	// generic configs
	ADMIN_USERNAME: string;
	ADMIN_PASSWORD: string;
	EDIT_PREFIX: string;
	LOGS_PREFIX: string;
	REQUEST_LOG_MAX_BODY: number;
	BACKING_STORAGE: 'kv' | 'd1' | 'memory';

	// kv
	files: KVNamespace | null;
	requests: KVNamespace | null;
	FILE_RETENTION_SECONDS: number;
	REQUEST_LOG_RETENTION_SECONDS: number;

	// d1
	db: D1Database | null;
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

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const fs = createFileSystem(env);
		const logger = createRequestLogger(env);

		const { method, headers } = request;
		const accept = headers.get('accept') || '';
		const { pathname } = new URL(request.url);
		if (pathname.startsWith(env.EDIT_PREFIX)) {
			const authError = doAuth(env, request);
			if (authError) {
				await logger.log(request);
				return authError;
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
				return new Response(filepath ? assets.EDIT_HTML : assets.FILES_HTML, {
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
				await fs.createFile(filepath, vf);
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
			const authError = doAuth(env, request);
			if (authError) {
				await logger.log(request);
				return authError;
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
				return new Response(assets.LOGS_HTML, {
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
		return new Response(file.content, { headers: file.headers, status: file.status, statusText: file.statusText });
	},
};
