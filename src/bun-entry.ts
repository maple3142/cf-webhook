import handler, { Env } from './index';
import wrangler from '../wrangler.toml';
import Bun from 'bun';

declare global {
	const process: {
		env: {
			ADMIN_USERNAME: string;
			ADMIN_PASSWORD: string;
		} & typeof wrangler.vars;
	};
}

const fakeenv: Env = {
	...wrangler.vars, // defaults
	...process.env, // overrides

	files: null,
	requests: null,
	db: null,
};

Bun.serve({
	port: 8787,
	development: false,
	fetch(req: Request) {
		return handler.fetch(req, fakeenv, {} as any);
	},
});
