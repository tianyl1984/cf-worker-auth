async function handle(req, env, ctx) {
	const token = _getToken(req);
	if (token == null) {
		return new Response('Missing token', { status: 401 });
	}
	const userinfo = await _getUserInfo(env, token);
	if (userinfo == null) {
		return new Response('Invalid or expired token', { status: 401 });
	}
	return new Response(userinfo, {
		headers: { 'Content-Type': 'application/json' },
	});
}

function _getToken(req) {
	const url = new URL(req.url);
	const token = url.searchParams.get('token');
	if (token != null) {
		return token;
	}
	const auth = req.headers.get('Authorization');
	if (auth != null && auth.startsWith('Bearer ')) {
		return auth.slice('Bearer '.length);
	}
	return null;
}

async function _getUserInfo(env, token) {
	return await env.authdata.get(`token-${token}`);
}

export default {
	handle
}
