import { Env } from '../';
import { VirtualFile, FileSystem, normalizePath, RequestLog, RequestLogger } from './';
import { getRequsetBody } from '../utils';

export class MemoryFileSystem implements FileSystem {
	private files: Record<string, VirtualFile> = {};
	async createFile(path: string, file: VirtualFile) {
		path = normalizePath(path);
		this.files[path] = file;
	}
	async getFile(path: string): Promise<VirtualFile | null> {
		path = normalizePath(path);
		return this.files[path] || null;
	}
	async deleteFile(path: string) {
		path = normalizePath(path);
		delete this.files[path];
	}
	async fileExists(path: string): Promise<boolean> {
		path = normalizePath(path);
		return this.files[path] !== undefined;
	}
	async getFilePaths(): Promise<string[]> {
		return Object.keys(this.files);
	}
	async deleteFiles() {
		this.files = {};
	}
}

export class MemoryRequestLogger implements RequestLogger {
	private logs: Record<string, RequestLog> = {};
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
			body: method === 'GET' || method === 'HEAD' ? null : await getRequsetBody(request),
		};
		this.logs[id] = log;
	}
	async deleteLog(id: string): Promise<void> {
		delete this.logs[id];
	}
	async deleteLogs(): Promise<void> {
		this.logs = {};
	}
	async getLogs(): Promise<RequestLog[]> {
		return Object.values(this.logs).reverse();
	}
}
