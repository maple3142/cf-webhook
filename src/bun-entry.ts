import handler, { Env } from './index';
import wrangler from '../wrangler.toml';

declare const Bun: any;

declare global {
	const process: {
		env: {
			PORT?: string;
			ADMIN_USERNAME?: string;
			ADMIN_PASSWORD?: string;
		} & typeof wrangler.vars;
	};
}

const fakeenv: Env = {
	ADMIN_USERNAME: 'admin',
	ADMIN_PASSWORD: 'admin',
	...wrangler.vars, // defaults
	...process.env, // overrides
	BACKING_STORAGE: 'memory', // the only supported value for Bun

	files: null,
	requests: null,
	db: null,
};

Bun.serve({
	port: parseInt(process.env.PORT || '8787'),
	development: false,
	fetch(req: Request) {
		return handler.fetch(req, fakeenv, {} as any);
	},
});
