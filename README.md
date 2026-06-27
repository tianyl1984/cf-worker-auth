# cf-worker-auth

基于 Cloudflare Worker 的轻量级 GitHub OAuth 登录鉴权服务。

业务站点把登录入口指向本服务，用户用 GitHub 授权后，本服务校验用户是否在白名单内，
生成一个临时 token 回调给业务站点。业务站点凭 token 即可换取用户信息，无需自己对接 GitHub OAuth。

## 工作流程

```
浏览器                    cf-worker-auth                GitHub
  │  1. GET /login?callback=业务回调地址  │                  │
  │ ────────────────────────────────────▶│                  │
  │  返回登录页（含 GitHub 登录按钮）       │                  │
  │ ◀────────────────────────────────────│                  │
  │  2. 点击按钮跳转 GitHub 授权           │ ────────────────▶│
  │  3. 授权后回调 /github/auth?code&state│ ◀────────────────│
  │ ────────────────────────────────────▶│                  │
  │                                       │ 4. 用 code 换 access_token，拉取用户信息
  │                                       │ ────────────────▶│
  │                                       │ 5. 校验白名单 → 生成 token 存入 KV（10 分钟）
  │  6. 302 跳回 业务回调地址?token=xxx    │                  │
  │ ◀────────────────────────────────────│                  │
  │  7. 业务站点用 token 调 /userinfo 换取用户信息             │
```

## 接口说明

### `GET /login`

登录入口，返回一个包含「使用 GitHub 登录」按钮的 HTML 页面。

| 参数       | 必填 | 说明                                                                 |
| ---------- | ---- | -------------------------------------------------------------------- |
| `callback` | 否   | 登录成功后跳回的业务地址（需 URL 编码）。其 host 必须在 `legal_domain` 白名单内。不传则登录后跳回首页。 |

登录成功后会 302 跳转到 `callback?token=<token>`。

### `GET /github/auth`

GitHub OAuth 回调地址，由 GitHub 在用户授权后自动调用，**业务方无需关心**。
（需在 GitHub OAuth App 中将 Authorization callback URL 配置为 `https://<你的域名>/github/auth`）

### `GET /userinfo`

根据 token 获取登录用户信息。token 二选一传入：

- Query 参数：`GET /userinfo?token=<token>`
- 请求头：`Authorization: Bearer <token>`

响应：

- `200`：返回 GitHub 用户信息 JSON（即 GitHub `/user` 接口的原始返回）
- `401`：未携带 token，或 token 无效 / 已过期

> token 有效期为 **10 分钟**，建议业务站点在拿到 token 后立即换取用户信息并自行维护会话。

## 业务接入步骤

1. **引导用户登录**：把业务站点的登录入口指向

   ```
   https://<你的域名>/login?callback=<URL编码后的业务回调地址>
   ```

2. **接收 token**：用户授权成功后会被 302 跳回 `业务回调地址?token=xxx`，从 URL query 中取出 `token`。

3. **换取用户信息**：业务后端凭 token 调用 `/userinfo`：

   ```bash
   curl "https://<你的域名>/userinfo?token=<token>"
   # 或
   curl -H "Authorization: Bearer <token>" "https://<你的域名>/userinfo"
   ```

   拿到用户信息后，业务站点据此建立自己的登录会话。

> 注意：业务回调地址的 host 必须预先加入 `legal_domain` 白名单，否则 `/login` 会报 `callback error!`。

## 部署配置

### KV Namespace（绑定名 `authdata`）

在 KV 中预置以下键：

| 键             | 说明                                                  | 示例                          |
| -------------- | ----------------------------------------------------- | ----------------------------- |
| `legal_domain` | 允许的业务回调域名白名单，逗号分隔                     | `xxx.xxx.com,yyy.yyy.com`     |
| `legal_user`   | 允许登录的 GitHub 用户名（login）白名单，逗号分隔      | `octocat,torvalds`            |

> 运行期间服务还会自动写入临时键：`callback-<state>`（1 小时）、`token-<token>`（10 分钟），无需手动维护。

KV 绑定已在 `wrangler.toml` 中配置：

```toml
[[kv_namespaces]]
binding = "authdata"
id = "<你的 KV namespace id>"
```

### 环境变量 / Secrets

| 变量                   | 说明                       |
| ---------------------- | -------------------------- |
| `GITHUB_CLIENT_ID`     | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Secret    |

生产环境建议用 secret 存储：

```bash
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
```

本地开发可写在 `wrangler.toml` 的 `[env.dev.vars]` 下。

## 本地开发与部署

```bash
npm install

# 本地开发（使用 dev 环境变量）
npm run dev

# 部署到 Cloudflare
npm run deploy
```
