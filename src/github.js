import util from './util.js';

async function handle(req, env, ctx) {
	const url = new URL(req.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const redirectUri = `https://${url.host}/github/auth`;
	// 获取accesstoken
	const tokenJson = await _getAccessToken(env, code, redirectUri);
	console.log(tokenJson);
	// 获取登录用户信息
	const userinfo = await _getUserInfo(env, tokenJson.access_token);
	// 校验用户 && 保存登录信息
	await _checkLoginUser(env, userinfo);
	const token = util.genUUID();
	await _saveToken(env, token, userinfo);
	// 重定向回client
	let jumpUrl = `https://${url.host}/`;
	const cb = await _getCallback(env, state);
	if (cb == null) {
		console.log('没有回调，返回首页');
	} else {
		// cb 暂不支持参数
		jumpUrl = `${cb}?token=${token}`;
	}
	return new Response(null, {
		status: 302,
		headers: {
			"Location": jumpUrl,
		},
	});
}

async function _getCallback(env, state) {
	return await env.authdata.get(`callback-${state}`);
}

async function _saveToken(env, token, userinfo) {
	await env.authdata.put(`token-${token}`, JSON.stringify(userinfo), {
		expirationTtl: 10 * 60,
	});
}

async function _checkLoginUser(env, userinfo) {
	// const users = await env.authdata.get('legal_user');
	// if (!users.split(',').includes(userinfo.)) {
	// 	throw new Error('callback error!');
	// }
}

async function _getUserInfo(env, accessToken) {
	return (await fetch('https://api.github.com/user', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `token ${accessToken}`
		}
	})).json();
}

async function _getAccessToken(env, code, redirectUri) {
	return (await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			client_id: env.GITHUB_CLIENT_ID,
			client_secret: env.GITHUB_CLIENT_SECRET,
			code: code,
			redirect_uri: redirectUri
		})
	})).json();
}

export default {
	handle
}
