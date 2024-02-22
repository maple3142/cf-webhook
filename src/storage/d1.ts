import { Env } from '../';
import { VirtualFile, FileSystem, normalizePath } from './';

export class D1FileSystem implements FileSystem {
	constructor(private env: Env) {}
	async createFile(path: string, content: string, headers: Record<string, string> = {}) {
		path = normalizePath(path);
		await this.env.db
			.prepare('REPLACE INTO files (path, content, headers) VALUES (?, ?, ?)')
			.bind(path, content, JSON.stringify(headers))
			.run();
	}
	async getFile(path: string): Promise<VirtualFile | null> {
		path = normalizePath(path);
		const file = await this.env.db.prepare('SELECT content, headers FROM files WHERE path = ?').bind(path).first();
		if (file === null) {
			return null;
		}
		return {
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
