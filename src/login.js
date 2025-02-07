import util from './util.js';

async function handle(req, env, ctx) {
	const url = new URL(req.url);
	const callback = url.searchParams.get('callback');
	await _checkCallback(env, callback);
	const loginUrl = await _getGithubLoginUrl(req, env, ctx);
	const html = `
	<!DOCTYPE html>
	<html lang="zh-CN">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>GitHub 登录</title>
		<style>
			body {
				display: flex;
				justify-content: center;
				align-items: center;
				height: 100vh;
				margin: 0;
				background-color: #e0e0e0;
			}
			.login-button {
				padding: 10px 20px;
				font-size: 16px;
				color: white;
				background-color: #24292e;
				border: none;
				border-radius: 5px;
				cursor: pointer;
			}
			.login-button:hover {
				background-color: #1c1f23;
			}
		</style>
	</head>
	<body>
		<button class="login-button" onclick="window.location.href='${loginUrl}'">
			使用 GitHub 登录
		</button>
	</body>
	</html>
	`
	return new Response(html, {
		headers: { 'Content-Type': 'text/html' },
	});
}

async function _checkCallback(env, callback) {
	if (callback == null) {
		return
	}
	const cburl = new URL(decodeURIComponent(callback));
	const hosts = await env.authdata.get('legal_domain');
	if (!hosts.split(',').includes(cburl.host)) {
		throw new Error('callback error!');
	}
}

async function _getGithubLoginUrl(req, env, ctx) {
	const url = new URL(req.url);
	const state = util.genUUID();
	const cb = url.searchParams.get('callback');
	await _saveCallback(env, state, cb);
	const clientId = env.GITHUB_CLIENT_ID;
	const uri = encodeURIComponent(`https://${url.host}/github/auth`);
	return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${uri}&scope=user&state=${state}`;
}

async function _saveCallback(env, state, cb) {
	if (cb == null) {
		return
	}
	await env.authdata.put(`callback-${state}`, cb, {
		expirationTtl: 1 * 60 * 60,
	});
}

export default {
	handle
}
