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

export function createFileSystem(backingStorageType: 'kv' | 'd1', env: Env): FileSystem {
	if (backingStorageType === 'kv') {
		return new KVFileSystem(env);
	} else if (backingStorageType === 'd1') {
		return new D1FileSystem(env);
	}
	throw new Error(`Invalid backing storage type: ${backingStorageType}`);
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

export function createRequestLogger(backingStorageType: 'kv' | 'd1', env: Env): RequestLogger {
	if (backingStorageType === 'kv') {
		return new KVRequestLogger(env);
	} else if (backingStorageType === 'd1') {
		return new D1RequestLogger(env);
	}
	throw new Error(`Invalid backing storage type: ${backingStorageType}`);
}
