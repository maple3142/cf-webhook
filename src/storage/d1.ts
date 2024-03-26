import { Env } from '../';
import { VirtualFile, FileSystem, normalizePath, RequestLog, RequestLogger } from './';

export class D1FileSystem implements FileSystem {
	constructor(private env: Env) {}
	async createFile(path: string, file: VirtualFile) {
		path = normalizePath(path);
		await this.env.db
			.prepare('REPLACE INTO files (path, status, statusText, content, headers) VALUES (?, ?, ?, ?, ?)')
			.bind(path, file.status, file.statusText, file.content, JSON.stringify(file.headers))
			.run();
	}
	async getFile(path: string): Promise<VirtualFile | null> {
		path = normalizePath(path);
		const file = await this.env.db.prepare('SELECT * FROM files WHERE path = ?').bind(path).first();
		if (file === null) {
			return null;
		}
		return {
			status: file.status as number,
			statusText: file.statusText as string,
			content: file.content as string,
			headers: JSON.parse(file.headers as string),
		};
	}
	async deleteFile(path: string) {
		path = normalizePath(path);
		await this.env.db.prepare('DELETE FROM files WHERE path = ?').bind(path).run();
	}
	async fileExists(path: string): Promise<boolean> {
		path = normalizePath(path);
		return (await this.env.db.prepare('SELECT 1 FROM files WHERE path = ?').bind(path).first()) !== null;
	}
	async getFilePaths(): Promise<string[]> {
		const { results } = await this.env.db.prepare('SELECT path FROM files').all();
		return results.map((r) => r.path as string);
	}
	async deleteFiles() {
		await this.env.db.prepare('DELETE FROM files').run();
	}
}

export class D1RequestLogger implements RequestLogger {
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
			body: method === 'GET' || method === 'HEAD' ? null : await request.text(),
		};
		await this.env.db
			.prepare('REPLACE INTO requests (id, method, path, search, headers, body, date) VALUES (?, ?, ?, ?, ?, ?, ?)')
			.bind(id, method, pathname, search, JSON.stringify(log.headers), log.body, log.date.toISOString())
			.run();
	}
	async deleteLog(id: string): Promise<void> {
		await this.env.db.prepare('DELETE FROM requests WHERE id = ?').bind(id).run();
	}
	async deleteLogs(): Promise<void> {
		await this.env.db.prepare('DELETE FROM requests').run();
	}
	async getLogs(): Promise<RequestLog[]> {
		const { results } = await this.env.db.prepare('SELECT * FROM requests').all();
		const logs = results.map((r) => ({
			id: r.id as string,
			method: r.method as string,
			path: r.path as string,
			search: r.search as string,
			headers: JSON.parse(r.headers as string),
			body: r.body as string,
			date: new Date(r.date as string),
		}));
		return logs.sort((a, b) => (a.date > b.date ? -1 : 1));
	}
}
