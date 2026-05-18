# No3realms-Mail API Key 调用改造说明

本文档面向 No3realms-Mail 接口调用方，说明如何从“登录 token 调用”改为“API Key 调用”。

## 1. 为什么需要改造

旧调用方式通常是：

1. 第三方项目调用 `/api/login` 登录。
2. 拿到登录 token。
3. 后续接口使用这个登录 token 调用。

这种方式可以继续使用，但不适合第三方项目高频调用。原因是 No3realms-Mail 会限制同一用户的网页登录 token 数量。第三方项目如果频繁登录，会不断生成新 token，可能把网页登录状态挤掉，导致网页端需要重新登录。

新的推荐方式是：第三方项目使用 **API Key** 调用接口。

API Key 的特点：

- 不占用网页登录 token。
- 不影响网页端登录状态。
- 不需要每次先调用 `/api/login`。
- 权限与创建它的 No3realms-Mail 用户一致。
- 完整密钥只在创建时显示一次，请创建后立即保存。

---

## 2. 如何获取 API Key

由 No3realms-Mail 管理员或对应账号登录 No3realms-Mail 网页端：

```txt
个人设置 → API Key → 创建 API Key
```

创建时可以填写一个名称，例如：

```txt
自动化脚本
官网项目
客户系统 A
```

创建成功后，页面会显示完整 API Key，例如：

```txt
cm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

请立即复制保存。

注意：

- 完整 API Key 只显示一次。
- 关闭页面后，只能看到脱敏后的 key 预览。
- 如果忘记或泄露，请删除旧 API Key 后重新创建。

---

## 3. 调用方需要怎么改

### 3.1 改造前：登录 token 调用

旧方式示例：

```js
const loginRes = await fetch('https://mail.example.com/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'password'
  })
});

const loginData = await loginRes.json();
const token = loginData.data.token;

const res = await fetch('https://mail.example.com/api/account/random', {
  headers: {
    Authorization: token
  }
});
```

这种方式需要停止用于高频接口调用。

---

### 3.2 改造后：API Key 调用

调用方不再需要调用 `/api/login`。

直接在请求头中传入 API Key：

```js
const API_KEY = 'cm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

const res = await fetch('https://mail.example.com/api/account/random', {
  headers: {
    Authorization: API_KEY
  }
});

const data = await res.json();
```

也支持 Bearer 写法：

```js
const res = await fetch('https://mail.example.com/api/account/random', {
  headers: {
    Authorization: `Bearer ${API_KEY}`
  }
});
```

两种写法都可以，推荐统一使用第一种简单写法：

```http
Authorization: cm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 4. 最小改造点

如果调用方项目已有统一请求封装，只需要改认证头。

### 旧代码

```js
headers.Authorization = loginToken;
```

### 新代码

```js
headers.Authorization = process.env.CLOUDMAIL_API_KEY;
```

并删除或停止高频调用：

```http
POST /api/login
```

---

## 5. 推荐封装示例

```js
const CLOUDMAIL_BASE_URL = process.env.CLOUDMAIL_BASE_URL;
const CLOUDMAIL_API_KEY = process.env.CLOUDMAIL_API_KEY;

async function cloudMailRequest(path, options = {}) {
  const res = await fetch(`${CLOUDMAIL_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: CLOUDMAIL_API_KEY,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const data = await res.json();

  if (data.code !== 200) {
    throw new Error(data.message || 'No3realms-Mail API 请求失败');
  }

  return data.data;
}
```

环境变量示例：

```env
CLOUDMAIL_BASE_URL=https://mail.example.com/api
CLOUDMAIL_API_KEY=cm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 6. 常用接口示例

### 6.1 随机生成邮箱

```http
GET /api/account/random
Authorization: cm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

示例：

```js
const email = await cloudMailRequest('/account/random');
```

Curl 示例：

```bash
curl 'https://mail.example.com/api/account/random' \
  -H 'Authorization: cm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
```

---

### 6.2 查询邮箱账号列表

```http
GET /api/account/list?accountId=0&size=30
Authorization: cm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

示例：

```js
const accounts = await cloudMailRequest('/account/list?accountId=0&size=30');
```

---

### 6.3 查询邮件列表

```http
GET /api/email/list?accountId=1&type=0&size=30
Authorization: cm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

示例：

```js
const emails = await cloudMailRequest('/email/list?accountId=1&type=0&size=30');
```

---

### 6.4 创建邮箱分享链接

```http
POST /api/share/email
Authorization: cm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

请求体：

```json
{
  "accountId": 1,
  "expiresIn": 2592000000,
  "password": "可选密码"
}
```

示例：

```js
const share = await cloudMailRequest('/share/email', {
  method: 'POST',
  body: JSON.stringify({
    accountId: 1,
    expiresIn: 2592000000,
    password: '123456'
  })
});
```

返回数据中会包含分享链接。

---

## 7. 权限说明

API Key 的权限与创建它的 No3realms-Mail 用户一致。

例如：

- 创建 API Key 的用户可以创建邮箱，则 API Key 也可以创建邮箱。
- 创建 API Key 的用户无权删除邮件，则 API Key 也不能删除邮件。
- 管理员创建的 API Key 拥有管理员账号对应权限。

如果接口返回：

```json
{
  "code": 403,
  "message": "无权限"
}
```

说明当前 API Key 所属用户没有该接口权限。

---

## 8. 安全建议

- 不要把 API Key 写在前端网页代码里。
- 不要把 API Key 提交到 Git 仓库。
- 推荐保存到服务端环境变量。
- 不同项目建议使用不同 API Key，方便单独删除。
- 如果怀疑泄露，请立即删除旧 API Key，并重新创建。

---

## 9. 改造检查清单

调用方改造完成后，请确认：

- [ ] 不再高频调用 `/api/login`。
- [ ] 请求头中已使用 `Authorization: cm_xxx`。
- [ ] API Key 保存在服务端环境变量中。
- [ ] 接口返回 `code === 200` 时再读取 `data`。
- [ ] 如果出现 401，检查 API Key 是否正确或是否已被删除。
- [ ] 如果出现 403，检查创建 API Key 的用户是否有对应权限。

---

## 10. 常见问题

### API Key 可以替代网页登录吗？

不可以。API Key 面向第三方项目和服务端脚本调用接口，不用于网页登录。

### 旧登录 token 还能用吗？

可以。API Key 是新增认证方式，不会让旧登录 token 失效。

### 为什么不要继续频繁调用 `/api/login`？

频繁登录会生成大量登录 token，可能挤掉网页登录状态，导致网页端掉登录。

### API Key 忘记了怎么办？

无法查看完整 API Key。请删除旧 API Key 后重新创建。

### API Key 泄露了怎么办？

立即在 No3realms-Mail 个人设置里删除该 API Key，然后创建新的 API Key，并更新调用方环境变量。
