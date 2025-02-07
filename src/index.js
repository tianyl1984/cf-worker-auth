
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
	return new Response(`Hello`);
}
