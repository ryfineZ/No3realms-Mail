# No3realms-Mail API 文档

本文档面向 No3realms-Mail 接口调用方，说明第三方或前端可直接调用的主要接口。

## 1. 基础信息

### Base URL

请将示例中的域名替换为你的实际部署地址：

```txt
https://mail.example.com/api
```

例如：

```txt
https://mail.example.com/api/login
```

### 返回格式

接口统一返回 JSON：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

调用方通常读取 `data` 字段作为业务数据。

### 认证方式

大多数管理类接口需要登录后携带 token：

```http
Authorization: <login_token>
```

第三方项目建议使用 API Key，避免频繁登录挤掉网页登录状态：

```http
Authorization: cm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

也支持 Bearer 写法：

```http
Authorization: Bearer cm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

公共接口、分享接口、临时邮箱接口按各自说明处理。

### Content-Type

POST / PUT 请求默认使用：

```http
Content-Type: application/json
```

---

## 2. 登录与注册

### 登录

```http
POST /login
```

请求体：

```json
{
  "email": "admin@example.com",
  "password": "password",
  "token": "turnstile-token，可选"
}
```

返回 `data` 中包含登录 token 和用户信息。

---

### 注册

```http
POST /register
```

请求体：

```json
{
  "email": "user@example.com",
  "password": "password",
  "key": "注册码，可选",
  "token": "turnstile-token，可选"
}
```

---

### 退出登录

```http
DELETE /logout
Authorization: <login_token>
```

---

## 3. 邮箱账号

### 查询邮箱账号列表

```http
GET /account/list?accountId=0&size=30&lastSort=9999999999&email=keyword
Authorization: <login_token>
```

Query 参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `accountId` | number | 否 | 分页游标账号 ID，默认 `0` |
| `size` | number | 否 | 每页数量，最大 `30` |
| `lastSort` | number | 否 | 分页游标排序值 |
| `email` | string | 否 | 按邮箱地址搜索 |

---

### 添加邮箱账号

```http
POST /account/add
Authorization: <login_token>
```

请求体：

```json
{
  "email": "abc@example.com",
  "token": "turnstile-token，可选"
}
```

---

### 删除邮箱账号

```http
DELETE /account/delete?accountId=1
Authorization: <login_token>
```

---

### 随机生成邮箱地址

```http
GET /account/random?domainId=1&subLevels=2,3,4
Authorization: <login_token>
```

Query 参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `domainId` | number | 否 | 指定使用的域名 ID |
| `subLevels` | string | 否 | 随机子域名层级，例如 `2,3,4` |

返回示例：

```json
{
  "email": "a@x.example.com",
  "prefix": "a",
  "domain": "x.example.com",
  "domainId": 1
}
```

规则：

- 邮箱前缀随机 1-4 位。
- 随机子域名每段随机 1-3 位。
- 已停用域名不会参与随机生成。

---

## 4. 域名管理

### 获取公开可用域名

```http
GET /domain/public
```

无需登录。

只返回已验证、已启用、公开共享的域名。

---

### 获取当前用户可用域名

```http
GET /domain/available
Authorization: <login_token>
```

返回当前用户创建邮箱时可选的域名。

---

### 添加域名

```http
POST /domain/add
Authorization: <login_token>
```

请求体：

```json
{
  "domain": "example.com",
  "isPublic": true
}
```

返回数据中会包含 DNS 验证所需的 `verifyToken`。

---

### 验证域名 DNS

```http
POST /domain/verify
Authorization: <login_token>
```

请求体：

```json
{
  "domainId": 1
}
```

返回示例：

```json
{
  "verified": true,
  "checks": {
    "txtOk": true,
    "mxOk": true
  }
}
```

---

### 启用 / 停用域名

```http
POST /domain/setEnabled
Authorization: <login_token>
```

请求体：

```json
{
  "domainId": 1,
  "enabled": false
}
```

说明：

- 停用后域名仍保留在系统中。
- 不会删除 Cloudflare DNS 记录。
- 停用后不会用于注册、创建邮箱、随机邮箱和公开域名列表。
- 需要恢复时传 `enabled: true`。

---

### 设置 / 取消公开共享

```http
POST /domain/setPublic
Authorization: <login_token>
```

请求体：

```json
{
  "domainId": 1,
  "isPublic": true
}
```

---

### 删除域名

```http
DELETE /domain/delete?domainId=1
Authorization: <login_token>
```

说明：

- 只删除 No3realms-Mail 数据库中的域名记录。
- 不会删除 Cloudflare 上的 DNS 记录。

---

### 检测 DNS 托管商

```http
POST /domain/detectProvider
Authorization: <login_token>
```

请求体：

```json
{
  "domainId": 1
}
```

返回示例：

```json
{
  "provider": "cloudflare"
}
```

---

### 自动配置 DNS

```http
POST /domain/autoConfigure
Authorization: <login_token>
```

请求体：

```json
{
  "domainId": 1,
  "provider": "cloudflare",
  "credentials": {
    "apiToken": "Cloudflare API Token"
  }
}
```

---

## 5. 邮件接口

### 获取邮件列表

```http
GET /email/list?accountId=1&type=0&size=30&timeSort=0&allReceive=0
Authorization: <login_token>
```

常见 Query 参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `accountId` | number | 是 | 邮箱账号 ID |
| `type` | number | 否 | 邮件类型 |
| `size` | number | 否 | 每页数量 |
| `timeSort` | number | 否 | 时间分页游标 |
| `allReceive` | number | 否 | 是否查询全局收件 |

---

### 发送邮件

```http
POST /email/send
Authorization: <login_token>
```

请求体按发信表单传入，通常包含收件人、主题、正文、附件等字段。

---

### 删除邮件

```http
DELETE /email/delete?emailId=1
Authorization: <login_token>
```

---

### 标记邮件已读

```http
PUT /email/read
Authorization: <login_token>
```

请求体：

```json
{
  "emailId": 1
}
```

---

## 6. 分享接口

### 创建邮箱分享链接

```http
POST /share/email
Authorization: <login_token>
```

请求体：

```json
{
  "accountId": 1,
  "expiresIn": 2592000000,
  "password": "可选密码"
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `accountId` | number | 是 | 要分享的邮箱账号 ID |
| `expiresIn` | number | 否 | 有效期，单位毫秒，默认 24 小时 |
| `password` | string | 否 | 展示在分享页邮箱旁边的密码 |

返回示例：

```json
{
  "shareId": "AbCdEf123456",
  "shareUrl": "https://mail.example.com/share/AbCdEf123456?email=abc@example.com",
  "expiresAt": "2026-06-01T00:00:00.000Z"
}
```

说明：

- 同一个邮箱再次创建分享时，旧分享链接会自动作废。
- 新分享链接会带 `?email=邮箱地址`，方便调用方识别。
- `password` 不是访问控制密码，只是随分享展示给访问者并提供复制按钮。

---

### 创建单封邮件分享链接

```http
POST /share/message
Authorization: <login_token>
```

请求体：

```json
{
  "emailId": 1,
  "expiresIn": 86400000,
  "password": "可选密码"
}
```

---

### 获取分享内容

```http
GET /share/:shareId
```

无需登录。

邮箱分享返回示例：

```json
{
  "type": "email",
  "email": "abc@example.com",
  "password": "123456",
  "messages": [
    {
      "emailId": 1,
      "sendEmail": "sender@example.com",
      "name": "Sender",
      "subject": "Hello",
      "text": "邮件文本内容",
      "html": "<html>...</html>",
      "createTime": "2026-05-05 12:00:00",
      "unread": 1
    }
  ]
}
```

单封邮件分享返回示例：

```json
{
  "type": "message",
  "password": "123456",
  "email": {
    "emailId": 1,
    "sendEmail": "sender@example.com",
    "name": "Sender",
    "subject": "Hello",
    "text": "邮件文本内容",
    "html": "<html>...</html>",
    "toEmail": "abc@example.com",
    "createTime": "2026-05-05 12:00:00"
  },
  "attachments": []
}
```

---

### 删除分享链接

```http
DELETE /share/:shareId
Authorization: <login_token>
```

---

## 7. 临时邮箱接口

### 创建临时邮箱

```http
POST /temp/create
```

无需登录。

请求体可选：

```json
{
  "domainId": 1
}
```

返回示例：

```json
{
  "email": "abc@example.com",
  "token": "temp-token",
  "expiresIn": 1800
}
```

---

### 查询临时邮箱收件箱

```http
GET /temp/inbox?token=temp-token
```

无需登录。

---

## 8. API Key 管理

API Key 用于第三方项目调用需要登录权限的接口，不占用网页登录 token。新创建的 API Key 可以在个人设置中查看和复制；旧版本创建的 API Key 因历史上只保存哈希，无法查看完整密钥，需要重新创建。

### 查询 API Key 列表

```http
GET /apiKey/list
Authorization: <login_token>
```

返回示例：

```json
[
  {
    "apiKeyId": 1,
    "name": "自动化脚本",
    "key": "cm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "keyPreview": "cm_AbCd...abcd",
    "createTime": "2026-05-03 12:00:00",
    "lastUsedTime": "2026-05-03T12:30:00.000Z"
  }
]
```

---

### 创建 API Key

```http
POST /apiKey/create
Authorization: <login_token>
```

请求体：

```json
{
  "name": "自动化脚本"
}
```

返回示例：

```json
{
  "apiKeyId": 1,
  "name": "自动化脚本",
  "key": "cm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "keyPreview": "cm_xxxx...abcd",
  "createTime": "2026-05-03 12:00:00",
  "lastUsedTime": null
}
```

说明：

- 新创建的完整 `key` 会在创建接口和列表接口中返回，可在个人设置中查看和复制。
- 历史旧 key 如果列表中没有 `key` 字段，只能继续使用，无法查看完整值；需要查看时请删除后重新创建。

---

### 删除 API Key

```http
DELETE /apiKey/delete?apiKeyId=1
Authorization: <login_token>
```

---

## 9. Public API

Public API 不使用登录 token，而使用公共 API Token。

### 生成 Public Token

```http
POST /public/genToken
```

无需登录。

---

### 查询邮件列表

```http
POST /public/emailList
Authorization: <PUBLIC_KEY>
```

请求体按实际业务参数传入。

---

### 添加用户

```http
POST /public/addUser
Authorization: <PUBLIC_KEY>
```

请求体按实际业务参数传入。

---

## 10. 错误处理建议

调用方建议按以下方式处理：

```js
if (res.code !== 200) {
  throw new Error(res.message || '请求失败');
}
return res.data;
```

常见错误：

| message | 说明 |
|---|---|
| `分享链接不存在或已过期` | 分享 ID 无效或已过期 |
| `分享链接已过期` | 分享过期 |
| `无权限分享此邮箱` | 当前登录用户不是邮箱所有者 |
| `账号不存在` | 邮箱账号不存在 |
| `No available domains` | 没有可用域名 |
| `域名不存在` | 域名 ID 无效或无权操作 |

---

## 11. 调用示例

### 创建分享链接

```bash
curl -X POST 'https://mail.example.com/api/share/email' \
  -H 'Authorization: YOUR_LOGIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "accountId": 1,
    "expiresIn": 2592000000,
    "password": "123456"
  }'
```

### 获取分享内容

```bash
curl 'https://mail.example.com/api/share/AbCdEf123456'
```

### 随机生成邮箱

```bash
curl 'https://mail.example.com/api/account/random?domainId=1&subLevels=2,3' \
  -H 'Authorization: YOUR_LOGIN_TOKEN'
```

### 停用域名

```bash
curl -X POST 'https://mail.example.com/api/domain/setEnabled' \
  -H 'Authorization: YOUR_LOGIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "domainId": 1,
    "enabled": false
  }'
```
