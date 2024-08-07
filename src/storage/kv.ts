import { Env } from '../';
import { VirtualFile, FileSystem, normalizePath, RequestLog, RequestLogger } from './';
import { getRequsetBody } from '../utils';

export class KVFileSystem implements FileSystem {
	constructor(private env: Env) {}
	async createFile(path: string, file: VirtualFile) {
		path = normalizePath(path);
		await this.env.files.put(path, JSON.stringify(file), {
			expirationTtl: this.env.FILE_RETENTION_SECONDS,
		});
	}
	async getFile(path: string): Promise<VirtualFile | null> {
		path = normalizePath(path);
		const file = await this.env.files.get(path);
		if (file === null) {
			return null;
		}
		return JSON.parse(file);
	}
	async deleteFile(path: string) {
		path = normalizePath(path);
		await this.env.files.delete(path);
	}
	async fileExists(path: string): Promise<boolean> {
		path = normalizePath(path);
		return (await this.env.files.get(path)) !== null;
	}
	async getFilePaths(): Promise<string[]> {
		const fileKeys = (await this.env.files.list()).keys;
		return fileKeys.map((k) => k.name);
	}
	async deleteFiles() {
		const fileKeys = (await this.env.files.list()).keys;
		await Promise.all(fileKeys.map((k) => this.env.files.delete(k.name)));
	}
}

export class KVRequestLogger implements RequestLogger {
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
			body: method === 'GET' || method === 'HEAD' ? null : await getRequsetBody(request),
		};
		return this.env.requests.put(id, KVRequestLogger.logToStr(log), { expirationTtl: this.env.REQUEST_LOG_RETENTION_SECONDS });
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
		return logs.map((l) => KVRequestLogger.logFromStr(l)).sort((a, b) => (a.date > b.date ? -1 : 1));
	}
	static logToStr(log: RequestLog): string {
		return JSON.stringify(log);
	}
	static logFromStr(logStr: string): RequestLog {
		const ret = JSON.parse(logStr, (key: string, value: any) => (key === 'date' ? new Date(value) : value));
		return ret;
	}
}
