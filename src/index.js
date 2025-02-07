import login from './login.js';
import github from './github.js';

export default {
	async fetch(request, env, ctx) {
		try {
			return await _handle(request, env, ctx);
		} catch (err) {
			console.error('Unhandled error:', err);
			return new Response(err.message, { status: 500 });
		}
	},
};

async function _handle(req, env, ctx) {
	const url = new URL(req.url);
	if (url.pathname === '/login') {
		return login.handle(req, env, ctx);
	}
	if (url.pathname === '/github/auth') {
		return github.handle(req, env, ctx);
	}
	return new Response(`Hello`);
}
