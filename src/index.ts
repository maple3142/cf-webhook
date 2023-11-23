import EDIT_HTML from './edit.html';
import { Router, Context } from 'cloudworker-router';

export interface Env {
	files: KVNamespace;
	requests: KVNamespace;
	EDIT_PREFIX: string;
}

interface VirtualFile {
	path: string;
	content: string;
	headers?: Record<string, string>;
}

function normalizePath(path: string): string {
	if (!path.startsWith('/')) {
		throw new Error('Path must start with /');
	}
	return new URL(path, 'https://example.com').pathname;
}

class FileSystem {
	constructor(private env: Env) {}
	createFile(path: string, content: string, headers: Record<string, string> = {}): void {
		path = normalizePath(path);
		this.env.files.put(path, JSON.stringify({ path, content, headers }));
	}
	async getFile(path: string): Promise<VirtualFile | null> {
		path = normalizePath(path);
		const file = await this.env.files.get(path);
		if (file === null) {
			return null;
		}
		return JSON.parse(file);
	}
	async deleteFile(path: string): Promise<void> {
		path = normalizePath(path);
		await this.env.files.delete(path);
	}
	async fileExists(path: string): Promise<boolean> {
		path = normalizePath(path);
		return (await this.env.files.get(path)) !== null;
	}
}

// const adminRouter = new Router<Env>();

// adminRouter.get('/', async (ctx: Context<Env>) => {
// 	return new Response(ADMIN_HTML, {
// 		headers: {
// 			'content-type': 'text/html',
// 		},
// 	});
// });

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const fs = new FileSystem(env);

		const { method, headers } = request;
		const accept = headers.get('accept') || '';
		const { pathname } = new URL(request.url);
		if (pathname.startsWith(env.EDIT_PREFIX)) {
			const filepath = pathname.slice(env.EDIT_PREFIX.length) || '/';
			if (method === 'GET') {
				if (accept === 'application/json') {
					const ct = await fs.getFile(filepath);
					return new Response(JSON.stringify(ct), {
						headers: {
							'content-type': 'application/json',
							'cache-control': 'no-store',
						},
					});
				}
				return new Response(EDIT_HTML, {
					headers: {
						'content-type': 'text/html',
						'cache-control': 'no-store',
					},
				});
			} else if (method === 'PUT') {
				const vf: VirtualFile = await request.json(); // vf.path will be ignored
				fs.createFile(filepath, vf.content, vf.headers);
				return new Response('OK');
			} else if (method === 'DELETE') {
				await fs.deleteFile(filepath);
				return new Response('OK');
			}
		}

		const file = await fs.getFile(pathname);
		if (file === null) {
			return new Response('Not Found', { status: 404 });
		}
		return new Response(file.content, { headers: file.headers });
	},
};
