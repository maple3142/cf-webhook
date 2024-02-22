import { Env } from '../';
import { KVFileSystem, KVRequestLogger } from './kv';
import { D1FileSystem, D1RequestLogger } from './d1';

export interface VirtualFile {
	content: string;
	headers: Record<string, string>;
}

export interface FileSystem {
	createFile(path: string, content: string, headers: Record<string, string>): Promise<void>;
	getFile(path: string): Promise<VirtualFile | null>;
	deleteFile(path: string): Promise<void>;
	fileExists(path: string): Promise<boolean>;
	getFilePaths(): Promise<string[]>;
	deleteFiles(): Promise<void>;
}

export function normalizePath(path: string): string {
	if (!path.startsWith('/')) {
		throw new Error('Path must start with /');
	}
	return new URL(path, 'https://example.com').pathname;
}

export function createFileSystem(env: Env): FileSystem {
	if (env.BACKING_STORAGE === 'kv') {
		return new KVFileSystem(env);
	} else if (env.BACKING_STORAGE === 'd1') {
		return new D1FileSystem(env);
	}
	throw new Error(`Invalid backing storage type: ${env.BACKING_STORAGE}`);
}

export interface RequestLog {
	id: string;
	method: string;
	path: string;
	search: string;
	headers: Record<string, string>;
	body: string | null;
	date: Date;
}

export interface RequestLogger {
	log(request: Request): Promise<void>;
	deleteLog(id: string): Promise<void>;
	deleteLogs(): Promise<void>;
	getLogs(): Promise<RequestLog[]>;
}

export function createRequestLogger(env: Env): RequestLogger {
	if (env.BACKING_STORAGE === 'kv') {
		return new KVRequestLogger(env);
	} else if (env.BACKING_STORAGE === 'd1') {
		return new D1RequestLogger(env);
	}
	throw new Error(`Invalid backing storage type: ${env.BACKING_STORAGE}`);
}
