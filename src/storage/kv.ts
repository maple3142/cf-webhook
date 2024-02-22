import { Env } from '../';
import { VirtualFile, FileSystem, normalizePath } from './';

export class KVFileSystem implements FileSystem {
	constructor(private env: Env) {}
	async createFile(path: string, content: string, headers: Record<string, string> = {}) {
		path = normalizePath(path);
		await this.env.files.put(path, JSON.stringify({ content, headers }), {
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
