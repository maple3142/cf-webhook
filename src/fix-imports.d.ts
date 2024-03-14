declare module '*.html' {
	const content: string;
	export default content;
}
declare module '*.toml' {
	const content: {
		vars: {
			EDIT_PREFIX: string;
			LOGS_PREFIX: string;
			REQUEST_LOG_MAX_BODY: number;
			BACKING_STORAGE: 'kv' | 'd1' | 'memory';
			FILE_RETENTION_SECONDS: number;
			REQUEST_LOG_RETENTION_SECONDS: number;
		};
	};
	export default content;
}
