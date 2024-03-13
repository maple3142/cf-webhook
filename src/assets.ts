let EDIT_HTML: string;
let LOGS_HTML: string;
let FILES_HTML: string;

declare const Bun: any;

const isBun = typeof Bun !== 'undefined';

declare global {
	interface ImportMeta {
		url: string;
	}
}

if (isBun) {
	EDIT_HTML = await Bun.file(new URL('./edit.html', import.meta.url)).text();
	LOGS_HTML = await Bun.file(new URL('./logs.html', import.meta.url)).text();
	FILES_HTML = await Bun.file(new URL('./files.html', import.meta.url)).text();
} else {
	// cf worker
	EDIT_HTML = (await import('./edit.html')).default;
	LOGS_HTML = (await import('./logs.html')).default;
	FILES_HTML = (await import('./files.html')).default;
}

export default { EDIT_HTML, LOGS_HTML, FILES_HTML };
