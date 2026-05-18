<template>
  <div class="docs-wrap">
    <div class="grid-overlay"></div>

    <!-- Nav -->
    <nav class="docs-nav">
      <div class="nav-logo" @click="router.push('/')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ siteTitle }}</span>
        <span class="nav-sep">/</span>
        <span class="nav-page">API 文档</span>
      </div>
      <div class="nav-actions">
        <button class="btn-ghost" @click="router.push('/')">← 返回首页</button>
        <button class="btn-primary" @click="router.push('/login')">登录使用</button>
      </div>
    </nav>

    <div class="docs-layout">
      <!-- Sidebar -->
      <aside class="docs-sidebar">
        <div class="sidebar-group">
          <div class="sidebar-label">入门</div>
          <a v-for="s in sidebar.intro" :key="s.id"
             :class="['sidebar-link', activeSection === s.id && 'active']"
             @click="scrollTo(s.id)">{{ s.title }}</a>
        </div>
        <div class="sidebar-group">
          <div class="sidebar-label">临时邮箱</div>
          <a v-for="s in sidebar.temp" :key="s.id"
             :class="['sidebar-link', activeSection === s.id && 'active']"
             @click="scrollTo(s.id)">{{ s.title }}</a>
        </div>
        <div class="sidebar-group">
          <div class="sidebar-label">账户（需登录）</div>
          <a v-for="s in sidebar.account" :key="s.id"
             :class="['sidebar-link', activeSection === s.id && 'active']"
             @click="scrollTo(s.id)">{{ s.title }}</a>
        </div>
        <div class="sidebar-group">
          <div class="sidebar-label">邮件（需登录）</div>
          <a v-for="s in sidebar.email" :key="s.id"
             :class="['sidebar-link', activeSection === s.id && 'active']"
             @click="scrollTo(s.id)">{{ s.title }}</a>
        </div>
        <div class="sidebar-group">
          <div class="sidebar-label">域名</div>
          <a v-for="s in sidebar.domain" :key="s.id"
             :class="['sidebar-link', activeSection === s.id && 'active']"
             @click="scrollTo(s.id)">{{ s.title }}</a>
        </div>
      </aside>

      <!-- Content -->
      <main class="docs-main">

        <!-- Intro -->
        <section class="doc-section" id="intro">
          <div class="badge">入门</div>
          <h1 class="doc-h1">API 文档</h1>
          <p class="doc-p">{{ siteTitle }} 提供标准化 RESTful API，所有接口均返回 JSON 格式响应。</p>
          <div class="base-url-box">
            <span class="base-label">Base URL</span>
            <code>{{ origin }}/api</code>
            <button class="copy-btn" @click="copy(origin + '/api')">⧉ 复制</button>
          </div>
          <div class="callout">
            <span>ℹ️</span>
            <span>临时邮箱接口<strong>无需任何认证</strong>，可直接调用。其余接口支持登录 token 或 API Key。</span>
          </div>
        </section>

        <!-- Auth -->
        <section class="doc-section" id="auth">
          <h2 class="doc-h2">认证</h2>
          <p class="doc-p">调用需认证的接口时，在 Header 中携带登录返回的 token 或 API Key：</p>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">HTTP</span><button class="copy-btn" @click="copy('Authorization: your_token_here')">⧉ 复制</button></div>
            <pre>Authorization: your_token_here</pre>
          </div>
          <p class="doc-p">通过 <code class="ic">POST /api/login</code> 获取 token，响应 <code class="ic">data.token</code> 即为 Bearer Token；也可以在个人设置或用户管理中创建 API Key 后直接放入 <code class="ic">Authorization</code>。</p>
        </section>

        <!-- Response format -->
        <section class="doc-section" id="response">
          <h2 class="doc-h2">响应格式</h2>
          <p class="doc-p">所有接口均返回统一的 JSON 结构：</p>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">JSON</span></div>
            <pre v-html="codes.responseFormat"></pre>
          </div>
          <table class="tbl">
            <thead><tr><th>code</th><th>含义</th></tr></thead>
            <tbody>
              <tr><td><code class="ic">200</code></td><td>成功</td></tr>
              <tr><td><code class="ic">401</code></td><td>未认证或 token 过期</td></tr>
              <tr><td><code class="ic">403</code></td><td>权限不足</td></tr>
              <tr><td><code class="ic">500</code></td><td>服务器错误</td></tr>
            </tbody>
          </table>
        </section>

        <!-- Temp create -->
        <section class="doc-section" id="temp-create">
          <div class="badge green">临时邮箱</div>
          <h2 class="doc-h2">创建临时邮箱</h2>
          <p class="doc-p">无需任何认证，创建一个有效期 30 分钟的临时邮箱地址。</p>
          <div class="endpoint-row">
            <span class="method post">POST</span>
            <code class="ep-path">/api/temp/create</code>
            <span class="auth-tag free">无需认证</span>
          </div>
          <h3 class="doc-h3">请求体</h3>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">JSON</span></div>
            <pre>{ "domainId": 1  <span class="cmt">// 可选，指定域名 ID</span> }</pre>
          </div>
          <h3 class="doc-h3">响应</h3>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">JSON</span></div>
            <pre v-html="codes.tempCreate"></pre>
          </div>
          <h3 class="doc-h3">示例</h3>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">cURL</span><button class="copy-btn" @click="copy(codes.tempCreateCurl)">⧉ 复制</button></div>
            <pre v-html="codes.tempCreateCurlHtml"></pre>
          </div>
        </section>

        <!-- Temp inbox -->
        <section class="doc-section" id="temp-inbox">
          <h2 class="doc-h2">查询临时邮箱收件</h2>
          <p class="doc-p">使用创建时返回的 token 轮询收件箱内容（建议每 5 秒轮询一次）。</p>
          <div class="endpoint-row">
            <span class="method get">GET</span>
            <code class="ep-path">/api/temp/inbox</code>
            <span class="auth-tag free">无需认证</span>
          </div>
          <h3 class="doc-h3">Query 参数</h3>
          <table class="tbl">
            <thead><tr><th>参数</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
            <tbody>
              <tr><td><code class="ic">token</code></td><td>string</td><td>✓</td><td>创建临时邮箱时返回的 token</td></tr>
            </tbody>
          </table>
          <h3 class="doc-h3">响应</h3>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">JSON</span></div>
            <pre v-html="codes.tempInbox"></pre>
          </div>
          <h3 class="doc-h3">示例</h3>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">cURL</span></div>
            <pre v-html="codes.tempInboxCurl"></pre>
          </div>
        </section>

        <!-- Account list -->
        <section class="doc-section" id="account-list">
          <div class="badge blue">账户</div>
          <h2 class="doc-h2">邮箱账户列表</h2>
          <p class="doc-p">获取当前登录用户的所有邮箱账户。</p>
          <div class="endpoint-row">
            <span class="method get">GET</span>
            <code class="ep-path">/api/account/list</code>
            <span class="auth-tag need">需要认证</span>
          </div>
          <h3 class="doc-h3">Query 参数</h3>
          <table class="tbl">
            <thead><tr><th>参数</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
            <tbody>
              <tr><td><code class="ic">email</code></td><td>string</td><td>×</td><td>按邮箱或标签关键字搜索</td></tr>
            </tbody>
          </table>
          <h3 class="doc-h3">响应</h3>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">JSON</span></div>
            <pre v-html="codes.accountList"></pre>
          </div>
        </section>

        <!-- Account add -->
        <section class="doc-section" id="account-add">
          <h2 class="doc-h2">添加邮箱</h2>
          <div class="endpoint-row">
            <span class="method post">POST</span>
            <code class="ep-path">/api/account/add</code>
            <span class="auth-tag need">需要认证</span>
          </div>
          <h3 class="doc-h3">请求体</h3>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">JSON</span></div>
            <pre v-html="codes.accountAdd"></pre>
          </div>
        </section>

        <!-- Account random -->
        <section class="doc-section" id="account-random">
          <h2 class="doc-h2">随机生成邮箱</h2>
          <p class="doc-p">随机生成一个含子域名的邮箱地址，用于预览或添加前使用。</p>
          <div class="endpoint-row">
            <span class="method get">GET</span>
            <code class="ep-path">/api/account/random</code>
            <span class="auth-tag need">需要认证</span>
          </div>
          <h3 class="doc-h3">Query 参数</h3>
          <table class="tbl">
            <thead><tr><th>参数</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
            <tbody>
              <tr><td><code class="ic">domainId</code></td><td>number</td><td>×</td><td>指定域名 ID，不传则随机选</td></tr>
            </tbody>
          </table>
          <h3 class="doc-h3">响应</h3>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">JSON</span></div>
            <pre v-html="codes.accountRandom"></pre>
          </div>
        </section>

        <!-- API Key -->
        <section class="doc-section" id="api-key-list">
          <div class="badge blue">API Key</div>
          <h2 class="doc-h2">API Key 列表</h2>
          <p class="doc-p">获取当前登录用户的 API Key。超级管理员可传 <code class="ic">userId</code> 查看指定用户。</p>
          <div class="endpoint-row">
            <span class="method get">GET</span>
            <code class="ep-path">/api/apiKey/list</code>
            <span class="auth-tag need">需要认证</span>
          </div>
          <h3 class="doc-h3">Query 参数</h3>
          <table class="tbl">
            <thead><tr><th>参数</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
            <tbody>
              <tr><td><code class="ic">userId</code></td><td>number</td><td>×</td><td>超级管理员专用，不传则查询当前用户</td></tr>
            </tbody>
          </table>
          <h3 class="doc-h3">响应</h3>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">JSON</span></div>
            <pre v-html="codes.apiKeyList"></pre>
          </div>
        </section>

        <section class="doc-section" id="api-key-create">
          <div class="badge blue">API Key</div>
          <h2 class="doc-h2">创建 API Key</h2>
          <p class="doc-p">为当前用户创建 API Key。超级管理员可传 <code class="ic">userId</code> 为指定用户创建。返回的 <code class="ic">key</code> 是完整密钥，请复制保存。</p>
          <div class="endpoint-row">
            <span class="method post">POST</span>
            <code class="ep-path">/api/apiKey/create</code>
            <span class="auth-tag need">需要认证</span>
          </div>
          <h3 class="doc-h3">请求体</h3>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">JSON</span></div>
            <pre v-html="codes.apiKeyCreate"></pre>
          </div>
          <h3 class="doc-h3">响应</h3>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">JSON</span></div>
            <pre v-html="codes.apiKeyCreateResponse"></pre>
          </div>
        </section>

        <section class="doc-section" id="api-key-delete">
          <div class="badge blue">API Key</div>
          <h2 class="doc-h2">删除 API Key</h2>
          <div class="endpoint-row">
            <span class="method delete">DELETE</span>
            <code class="ep-path">/api/apiKey/delete</code>
            <span class="auth-tag need">需要认证</span>
          </div>
          <h3 class="doc-h3">Query 参数</h3>
          <table class="tbl">
            <thead><tr><th>参数</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
            <tbody>
              <tr><td><code class="ic">apiKeyId</code></td><td>number</td><td>✓</td><td>要删除的 API Key ID</td></tr>
              <tr><td><code class="ic">userId</code></td><td>number</td><td>×</td><td>超级管理员专用，不传则删除当前用户的 API Key</td></tr>
            </tbody>
          </table>
        </section>

        <!-- Email list -->
        <section class="doc-section" id="email-list">
          <div class="badge blue">邮件</div>
          <h2 class="doc-h2">邮件列表</h2>
          <div class="endpoint-row">
            <span class="method get">GET</span>
            <code class="ep-path">/api/email/list</code>
            <span class="auth-tag need">需要认证</span>
          </div>
          <h3 class="doc-h3">Query 参数</h3>
          <table class="tbl">
            <thead><tr><th>参数</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
            <tbody>
              <tr><td><code class="ic">accountId</code></td><td>number</td><td>✓</td><td>邮箱账户 ID</td></tr>
              <tr><td><code class="ic">pageNo</code></td><td>number</td><td>×</td><td>页码，默认 1</td></tr>
              <tr><td><code class="ic">pageSize</code></td><td>number</td><td>×</td><td>每页数量，默认 20</td></tr>
              <tr><td><code class="ic">emailId</code></td><td>number</td><td>×</td><td>游标（比此 ID 更早的邮件）</td></tr>
            </tbody>
          </table>
        </section>

        <!-- Email read -->
        <section class="doc-section" id="email-read">
          <h2 class="doc-h2">标记已读</h2>
          <div class="endpoint-row">
            <span class="method put">PUT</span>
            <code class="ep-path">/api/email/read</code>
            <span class="auth-tag need">需要认证</span>
          </div>
          <h3 class="doc-h3">请求体</h3>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">JSON</span></div>
            <pre>{ <span class="str">"emailId"</span>: <span class="num">123</span> }</pre>
          </div>
        </section>

        <!-- Email delete -->
        <section class="doc-section" id="email-delete">
          <h2 class="doc-h2">删除邮件</h2>
          <div class="endpoint-row">
            <span class="method delete">DELETE</span>
            <code class="ep-path">/api/email/delete</code>
            <span class="auth-tag need">需要认证</span>
          </div>
          <h3 class="doc-h3">Query 参数</h3>
          <table class="tbl">
            <thead><tr><th>参数</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
            <tbody>
              <tr><td><code class="ic">emailId</code></td><td>number</td><td>✓</td><td>要删除的邮件 ID</td></tr>
            </tbody>
          </table>
        </section>

        <!-- Domain public -->
        <section class="doc-section" id="domain-public">
          <div class="badge green">域名</div>
          <h2 class="doc-h2">公开域名列表</h2>
          <p class="doc-p">获取所有对外公开的已验证域名。未登录用户、注册页和公共页面应使用这个接口。</p>
          <div class="endpoint-row">
            <span class="method get">GET</span>
            <code class="ep-path">/api/domain/public</code>
            <span class="auth-tag free">无需认证</span>
          </div>
          <h3 class="doc-h3">响应</h3>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">JSON</span></div>
            <pre v-html="codes.domainPublic"></pre>
          </div>
          <h3 class="doc-h3">示例</h3>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">cURL</span></div>
            <pre v-html="codes.domainPublicCurl"></pre>
          </div>
        </section>

        <section class="doc-section" id="domain-my">
          <div class="badge green">域名</div>
          <h2 class="doc-h2">我的域名列表</h2>
          <p class="doc-p">获取当前登录用户添加的域名，包括待验证、已验证和拒绝的域名。域名管理页应使用这个接口。</p>
          <div class="endpoint-row">
            <span class="method get">GET</span>
            <code class="ep-path">/api/domain/my</code>
            <span class="auth-tag need">需要认证</span>
          </div>
          <h3 class="doc-h3">示例</h3>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">cURL</span></div>
            <pre v-html="codes.domainMyCurl"></pre>
          </div>
        </section>

        <section class="doc-section" id="domain-available">
          <div class="badge green">域名</div>
          <h2 class="doc-h2">当前可用域名</h2>
          <p class="doc-p">获取当前登录用户可以用来创建邮箱的已验证域名。普通用户返回公开域名和自己的域名；管理员返回全部已验证域名。</p>
          <div class="endpoint-row">
            <span class="method get">GET</span>
            <code class="ep-path">/api/domain/available</code>
            <span class="auth-tag need">需要认证</span>
          </div>
          <h3 class="doc-h3">响应</h3>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">JSON</span></div>
            <pre v-html="codes.domainAvailable"></pre>
          </div>
          <h3 class="doc-h3">示例</h3>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">cURL</span></div>
            <pre v-html="codes.domainAvailableCurl"></pre>
          </div>
        </section>

        <section class="doc-section" id="domain-admin">
          <div class="badge green">域名</div>
          <h2 class="doc-h2">全部域名列表</h2>
          <p class="doc-p">管理员查看系统内全部域名，用于后台管理和审批。</p>
          <div class="endpoint-row">
            <span class="method get">GET</span>
            <code class="ep-path">/api/domain/admin</code>
            <span class="auth-tag need">需要管理员</span>
          </div>
          <h3 class="doc-h3">示例</h3>
          <div class="code-block">
            <div class="code-bar"><span class="code-lang">cURL</span></div>
            <pre v-html="codes.domainAdminCurl"></pre>
          </div>
        </section>

      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useSettingStore } from '@/store/setting.js';
import router from '@/router/index.js';
import http from '@/axios/index.js';

const settingStore = useSettingStore();
const siteTitle = computed(() => settingStore.settings.title || 'No3realms-Mail');
const origin = computed(() => window.location.origin);
const publicDomains = ref([]);
const firstDomain = computed(() => publicDomains.value[0]?.domain || 'example.com');
const activeSection = ref('intro');

function copy(text) {
  navigator.clipboard.writeText(text.replace(/<[^>]+>/g, '')).catch(() => {});
}

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  activeSection.value = id;
}

async function loadDomains() {
  try {
    const d = await http.get('/domain/public');
    publicDomains.value = d || [];
  } catch {}
}

// Code examples — computed so they update when firstDomain/origin loads
const codes = computed(() => {
  const d = firstDomain.value;
  const o = origin.value;
  const g = (s) => `<span class="str">"${s}"</span>`;
  const n = (s) => `<span class="num">${s}</span>`;
  const k = (s) => `<span class="key">"${s}"</span>`;
  const c = (s) => `<span class="cmt">${s}</span>`;
  const p = (s) => `<span class="prompt">$</span> ${s}`;

  return {
    responseFormat:
`{
  ${k('code')}: ${n('200')},       ${c('// 200 成功，其他为失败')}
  ${k('message')}: ${g('success')},
  ${k('data')}: { ... }   ${c('// 实际数据')}
}`,

    tempCreate:
`{
  ${k('code')}: ${n('200')},
  ${k('data')}: {
    ${k('email')}: ${g(`ab3x7kp2@${d}`)},
    ${k('token')}: ${g('eyJhbGci...')},  ${c('// 查询收件用的令牌')}
    ${k('expiry')}: ${n('1748000000000')},  ${c('// 过期时间戳 (ms)')}
    ${k('ttl')}: ${n('1800')}               ${c('// 有效期（秒）')}
  }
}`,

    tempCreateCurl: `curl ${o}/api/temp/create -X POST -H "Content-Type: application/json" -d "{}"`,

    tempCreateCurlHtml:
`${p(`curl ${o}/api/temp/create \\`)}
  -X POST \\
  -H ${g('Content-Type: application/json')} \\
  -d ${g('{}')}`,

    tempInbox:
`{
  ${k('code')}: ${n('200')},
  ${k('data')}: {
    ${k('email')}: ${g(`ab3x7kp2@${d}`)},
    ${k('expiry')}: ${n('1748000000000')},
    ${k('emails')}: [
      {
        ${k('id')}: ${n('1748000001234')},
        ${k('from')}: ${g('sender@example.com')},
        ${k('name')}: ${g('Sender Name')},
        ${k('subject')}: ${g('邮件主题')},
        ${k('text')}: ${g('纯文本内容...')},
        ${k('html')}: ${g('<p>HTML 内容</p>')},
        ${k('time')}: ${g('2025-01-01T12:00:00.000Z')}
      }
    ]
  }
}`,

    tempInboxCurl: `${p(`curl "${o}/api/temp/inbox?token=YOUR_TOKEN"`)}`,

    accountList:
`{
  ${k('code')}: ${n('200')},
  ${k('data')}: [
    {
      ${k('accountId')}: ${n('1')},
      ${k('email')}: ${g(`you@${d}`)},
      ${k('name')}: ${g('you')},
      ${k('tags')}: [${g('注册')}, ${g('测试项目')}],
      ${k('createTime')}: ${g('2025-01-01T00:00:00')}
    }
  ]
}`,

    accountAdd:
`{
  ${k('email')}: ${g(`mynewbox@${d}`)},
  ${k('token')}: ${g('TURNSTILE_TOKEN')},  ${c('// 按站点设置决定是否必填')}
  ${k('tags')}: [${g('注册')}, ${g('测试项目')}]  ${c('// 可选')}
}`,

    accountRandom:
`{
  ${k('code')}: ${n('200')},
  ${k('data')}: {
    ${k('email')}: ${g(`random8ab@sub.${d}`)},
    ${k('prefix')}: ${g('random8ab')},
    ${k('domain')}: ${g(`sub.${d}`)},
    ${k('domainId')}: ${n('1')}
  }
}`,

    apiKeyList:
`{
  ${k('code')}: ${n('200')},
  ${k('data')}: [
    {
      ${k('apiKeyId')}: ${n('1')},
      ${k('name')}: ${g('后台脚本')},
      ${k('key')}: ${g('cm_xxxxx')},        ${c('// 新版密钥可查看完整值')}
      ${k('keyPreview')}: ${g('cm_xxxx...abcd')},
      ${k('createTime')}: ${g('2025-01-01T00:00:00')},
      ${k('lastUsedTime')}: ${g('2025-01-02T00:00:00')}
    }
  ]
}`,

    apiKeyCreate:
`{
  ${k('name')}: ${g('后台脚本')},  ${c('// 可选')}
  ${k('userId')}: ${n('12')}          ${c('// 可选，仅超级管理员可用')}
}`,

    apiKeyCreateResponse:
`{
  ${k('code')}: ${n('200')},
  ${k('data')}: {
    ${k('apiKeyId')}: ${n('1')},
    ${k('name')}: ${g('后台脚本')},
    ${k('key')}: ${g('cm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')},
    ${k('keyPreview')}: ${g('cm_xxxx...abcd')},
    ${k('createTime')}: ${g('2025-01-01T00:00:00')},
    ${k('lastUsedTime')}: null
  }
}`,

    domainPublic:
`{
  ${k('code')}: ${n('200')},
  ${k('data')}: [
    {
      ${k('domainId')}: ${n('1')},
      ${k('domain')}: ${g(d)},
      ${k('isPublic')}: ${n('1')},
      ${k('allowSubdomain')}: ${n('1')}
    }
  ]
}`,

    domainAvailable:
`{
  ${k('code')}: ${n('200')},
  ${k('data')}: [
    {
      ${k('domainId')}: ${n('1')},
      ${k('domain')}: ${g(d)},
      ${k('status')}: ${g('verified')},
      ${k('isPublic')}: ${n('1')},
      ${k('allowSubdomain')}: ${n('1')}
    }
  ]
}`,

    domainPublicCurl: `${p(`curl ${o}/api/domain/public`)}`,
    domainMyCurl: `${p(`curl ${o}/api/domain/my \\`)}
  -H ${g('Authorization: YOUR_TOKEN')}`,
    domainAvailableCurl: `${p(`curl ${o}/api/domain/available \\`)}
  -H ${g('Authorization: YOUR_TOKEN')}`,
    domainAdminCurl: `${p(`curl ${o}/api/domain/admin \\`)}
  -H ${g('Authorization: ADMIN_TOKEN')}`,

  };
});

const sidebar = {
  intro: [
    { id: 'intro', title: '简介' },
    { id: 'auth', title: '认证' },
    { id: 'response', title: '响应格式' },
  ],
  temp: [
    { id: 'temp-create', title: '创建临时邮箱' },
    { id: 'temp-inbox', title: '查询收件' },
  ],
  account: [
    { id: 'account-list', title: '邮箱列表' },
    { id: 'account-add', title: '添加邮箱' },
    { id: 'account-random', title: '随机生成' },
    { id: 'api-key-list', title: 'API Key 列表' },
    { id: 'api-key-create', title: '创建 API Key' },
    { id: 'api-key-delete', title: '删除 API Key' },
  ],
  email: [
    { id: 'email-list', title: '邮件列表' },
    { id: 'email-read', title: '标记已读' },
    { id: 'email-delete', title: '删除邮件' },
  ],
  domain: [
    { id: 'domain-public', title: '公开域名列表' },
    { id: 'domain-my', title: '我的域名列表' },
    { id: 'domain-available', title: '当前可用域名' },
    { id: 'domain-admin', title: '全部域名列表' },
  ],
};

let observer;
onMounted(() => {
  loadDomains();
  observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) activeSection.value = e.target.id; });
  }, { rootMargin: '-20% 0px -70% 0px' });
  document.querySelectorAll('.doc-section').forEach(s => observer.observe(s));
});
onUnmounted(() => observer?.disconnect());
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }
.docs-wrap {
  min-height: 100vh; background: #07090f; color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  display: flex; flex-direction: column;
}
.grid-overlay {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 60px 60px;
}
/* Nav */
.docs-nav {
  position: sticky; top: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 32px; height: 56px;
  background: rgba(7,9,15,0.88); backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.nav-logo { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #475569; cursor: pointer; }
.nav-sep { color: #1e293b; }
.nav-page { color: #f0f6ff; }
.nav-actions { display: flex; gap: 10px; }
.btn-ghost { padding: 5px 14px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #64748b; font-size: 13px; cursor: pointer; }
.btn-ghost:hover { color: #e2e8f0; }
.btn-primary { padding: 5px 14px; border-radius: 7px; border: none; background: #2563eb; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }

/* Layout */
.docs-layout { display: flex; flex: 1; max-width: 1100px; margin: 0 auto; width: 100%; padding: 0 24px; gap: 48px; position: relative; z-index: 1; }

/* Sidebar */
.docs-sidebar { width: 200px; flex-shrink: 0; padding: 28px 0; position: sticky; top: 56px; height: calc(100vh - 56px); overflow-y: auto; }
.sidebar-group { margin-bottom: 24px; }
.sidebar-label { font-size: 10px; font-weight: 700; letter-spacing: 1.2px; color: #1e293b; text-transform: uppercase; margin-bottom: 8px; padding-left: 10px; }
.sidebar-link { display: block; padding: 5px 10px; font-size: 13px; color: #334155; cursor: pointer; border-radius: 6px; transition: all 0.15s; margin-bottom: 1px; border-left: 2px solid transparent; }
.sidebar-link:hover { color: #64748b; background: rgba(255,255,255,0.03); }
.sidebar-link.active { color: #60a5fa; background: rgba(37,99,235,0.08); border-left-color: #2563eb; }

/* Main */
.docs-main { flex: 1; padding: 28px 0 80px; min-width: 0; }
.doc-section { padding-bottom: 52px; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.04); }
.doc-section:last-child { border-bottom: none; }

/* Badges */
.badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; margin-bottom: 10px; background: rgba(37,99,235,0.1); color: #60a5fa; border: 1px solid rgba(37,99,235,0.2); }
.badge.green { background: rgba(16,185,129,0.1); color: #34d399; border-color: rgba(16,185,129,0.2); }
.badge.blue { background: rgba(37,99,235,0.1); color: #60a5fa; border-color: rgba(37,99,235,0.2); }

/* Typography */
.doc-h1 { font-size: 30px; font-weight: 800; color: #f0f6ff; margin-bottom: 14px; }
.doc-h2 { font-size: 20px; font-weight: 700; color: #f0f6ff; margin-bottom: 10px; }
.doc-h3 { font-size: 13px; font-weight: 600; color: #64748b; margin: 18px 0 8px; }
.doc-p { font-size: 14px; line-height: 1.7; color: #64748b; margin-bottom: 14px; }

/* Base URL */
.base-url-box { display: flex; align-items: center; gap: 12px; background: #0a0f1c; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 11px 16px; margin-bottom: 14px; }
.base-label { font-size: 10px; font-weight: 700; color: #334155; letter-spacing: 0.5px; }
.base-url-box code { flex: 1; font-family: monospace; font-size: 13px; color: #86efac; }

/* Callout */
.callout { display: flex; align-items: flex-start; gap: 10px; background: rgba(251,191,36,0.05); border: 1px solid rgba(251,191,36,0.12); border-radius: 10px; padding: 12px 14px; font-size: 13px; line-height: 1.6; color: #64748b; }

/* Endpoint row */
.endpoint-row { display: flex; align-items: center; gap: 10px; background: #0a0f1c; border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 9px 14px; margin-bottom: 18px; flex-wrap: wrap; }
.method { padding: 2px 9px; border-radius: 5px; font-size: 11px; font-weight: 700; font-family: monospace; }
.method.get { background: rgba(16,185,129,0.12); color: #34d399; }
.method.post { background: rgba(37,99,235,0.12); color: #60a5fa; }
.method.put { background: rgba(245,158,11,0.12); color: #fbbf24; }
.method.delete { background: rgba(239,68,68,0.12); color: #f87171; }
.ep-path { font-family: monospace; font-size: 13px; color: #f0f6ff; flex: 1; }
.auth-tag { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
.auth-tag.free { background: rgba(16,185,129,0.1); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }
.auth-tag.need { background: rgba(245,158,11,0.1); color: #fbbf24; border: 1px solid rgba(245,158,11,0.2); }

/* Code block */
.code-block { background: #060a12; border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; overflow: hidden; margin-bottom: 16px; }
.code-bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px; background: #040710; border-bottom: 1px solid rgba(255,255,255,0.05); }
.code-lang { font-size: 11px; color: #1e293b; font-family: monospace; font-weight: 700; }
.copy-btn { background: transparent; border: none; color: #334155; font-size: 12px; cursor: pointer; padding: 2px 4px; transition: color 0.15s; }
.copy-btn:hover { color: #64748b; }
.code-block pre { padding: 16px; font-size: 13px; line-height: 1.65; font-family: 'JetBrains Mono', 'Fira Code', monospace; overflow-x: auto; white-space: pre; color: #64748b; margin: 0; }

/* Inline code */
.ic { font-family: monospace; font-size: 12px; background: rgba(255,255,255,0.06); padding: 1px 6px; border-radius: 4px; color: #86efac; }

/* Table */
.tbl { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
.tbl th { text-align: left; padding: 8px 12px; background: rgba(255,255,255,0.03); color: #475569; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.06); }
.tbl td { padding: 9px 12px; color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.04); }

/* Syntax colors (applied via v-html) */
:deep(.key) { color: #93c5fd; }
:deep(.str) { color: #86efac; }
:deep(.num) { color: #fbbf24; }
:deep(.cmt) { color: #334155; }
:deep(.prompt) { color: #34d399; }

@media (max-width: 768px) {
  .docs-layout { padding: 0 16px; }
  .docs-sidebar { display: none; }
  .docs-nav { padding: 0 16px; }
}
</style>
