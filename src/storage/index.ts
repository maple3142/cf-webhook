import { Env } from '../';
import { KVFileSystem, KVRequestLogger } from './kv';
import { D1FileSystem, D1RequestLogger } from './d1';
import { MemoryFileSystem, MemoryRequestLogger } from './memory';

export interface VirtualFile {
	content: string;
	headers: Record<string, string>;
	status: number;
	statusText: string;
}

export interface FileSystem {
	createFile(path: string, file: VirtualFile): Promise<void>;
	getFile(path: string): Promise<VirtualFile | null>;
	deleteFile(path: string): Promise<void>;
	fileExists(path: string): Promise<boolean>;
	getFilePaths(): Promise<string[]>;
	deleteFiles(): Promise<void>;
}

const GLOBAL_MEMORY_SINGLETONS: {
	fs: MemoryFileSystem | null;
	logger: MemoryRequestLogger | null;
} = {
	fs: null,
	logger: null,
};

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
	} else if (env.BACKING_STORAGE === 'memory') {
		if (GLOBAL_MEMORY_SINGLETONS.fs === null) {
			GLOBAL_MEMORY_SINGLETONS.fs = new MemoryFileSystem();
		}
		return GLOBAL_MEMORY_SINGLETONS.fs;
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
	} else if (env.BACKING_STORAGE === 'memory') {
		if (GLOBAL_MEMORY_SINGLETONS.logger === null) {
			GLOBAL_MEMORY_SINGLETONS.logger = new MemoryRequestLogger();
		}
		return GLOBAL_MEMORY_SINGLETONS.logger;
	}
	throw new Error(`Invalid backing storage type: ${env.BACKING_STORAGE}`);
}
