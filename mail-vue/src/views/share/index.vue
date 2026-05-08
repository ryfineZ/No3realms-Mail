<template>
  <div class="share-page">
    <main class="share-card">
      <header class="share-header">
        <div>
          <p class="eyebrow">只读分享</p>
          <h1>{{ title }}</h1>
        </div>
        <button class="refresh-btn" @click="loadShare" :disabled="loading">
          <Icon icon="ion:reload" width="16" height="16" :class="{ spin: loading }" />
          刷新
        </button>
      </header>

      <section v-if="loading && !share" class="state-box">
        <Icon icon="mingcute:loading-line" width="28" height="28" class="spin" />
        <span>正在加载分享内容...</span>
      </section>

      <section v-else-if="error" class="state-box state-box--error">
        <Icon icon="mingcute:warning-line" width="30" height="30" />
        <strong>{{ error }}</strong>
        <span>请确认分享链接是否正确，或联系分享者重新生成。</span>
      </section>

      <template v-else-if="share">
        <div class="summary">
          <Icon icon="mingcute:mail-line" width="18" height="18" />
          <button class="email-copy" @click="copyShareEmail">{{ share.email }}</button>
          <button class="copy-btn" @click="copyShareEmail">
            <Icon icon="fluent-color:clipboard-24" width="16" height="16" />
            复制
          </button>
          <span class="copy-tip" v-if="copiedEmail">邮箱已复制</span>
          <template v-if="share.password">
            <span class="password-label">密码</span>
            <button class="password-copy" @click="copySharePassword">{{ share.password }}</button>
            <button class="copy-btn" @click="copySharePassword">
              <Icon icon="mingcute:copy-2-line" width="15" height="15" />
              复制
            </button>
            <span class="copy-tip" v-if="copiedPassword">密码已复制</span>
          </template>
          <em>最近 {{ messages.length }} 封 · 未读 {{ unreadCount }} 封</em>
        </div>

        <div class="filter-bar" v-if="messages.length > 0">
          <button :class="{ active: filter === 'all' }" @click="filter = 'all'">全部 {{ messages.length }}</button>
          <button :class="{ active: filter === 'unread' }" @click="filter = 'unread'">未读 {{ unreadCount }}</button>
          <button :class="{ active: filter === 'read' }" @click="filter = 'read'">已读 {{ readCount }}</button>
        </div>

        <div v-if="messages.length === 0" class="state-box">
          <Icon icon="mdi:inbox-outline" width="34" height="34" />
          <span>这个收件箱暂时没有邮件</span>
        </div>

        <div v-else-if="visibleMessages.length === 0" class="state-box">
          <Icon icon="mdi:email-search-outline" width="34" height="34" />
          <span>没有符合筛选条件的邮件</span>
        </div>

        <article
          v-for="message in visibleMessages"
          :key="message.emailId"
          class="message-card"
          :class="{ 'message-card--read': isRead(message.emailId), 'message-card--expanded': isExpanded(message.emailId) }"
        >
          <div class="message-summary" @click="toggleMessage(message.emailId)">
            <span class="read-dot" v-if="!isRead(message.emailId)"></span>
            <div class="message-main">
              <div class="message-top">
                <div class="sender">
                  <strong>{{ message.name || message.sendEmail }}</strong>
                  <span>{{ message.sendEmail }}</span>
                </div>
                <time>{{ formatBeijingTime(message.createTime) }}</time>
              </div>
              <div class="code-row" v-if="extractVerifyCode(message)">
                <button class="code-copy-btn" @click.stop="copyVerifyCode(message)">
                  <Icon icon="mingcute:copy-2-line" width="15" height="15" />
                  复制验证码 {{ extractVerifyCode(message) }}
                </button>
                <span class="copy-tip" v-if="copiedCodeId === Number(message.emailId)">验证码已复制</span>
              </div>
              <h2>{{ message.subject || '（无主题）' }}</h2>
            </div>
            <button class="expand-btn">
              <Icon :icon="isExpanded(message.emailId) ? 'mingcute:up-line' : 'mingcute:down-line'" width="18" height="18" />
            </button>
          </div>
          <div class="message-body" v-if="isExpanded(message.emailId)">
            <div class="message-actions">
              <button @click="toggleRead(message.emailId)">{{ isRead(message.emailId) ? '标为未读' : '标为已读' }}</button>
            </div>
            <iframe v-if="message.html" class="message-html" sandbox :srcdoc="message.html"></iframe>
            <p v-else>{{ message.text || '（无正文内容）' }}</p>
          </div>
        </article>
      </template>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Icon } from '@iconify/vue';
import http from '@/axios/index.js';

const route = useRoute();
const loading = ref(false);
const error = ref('');
const share = ref(null);
const filter = ref('all');
const copiedEmail = ref(false);
const copiedPassword = ref(false);
const copiedCodeId = ref(null);
const readIds = ref(new Set());
const expandedIds = ref(new Set());
const storageKey = computed(() => `share-read:${route.params.shareId}`);
let emailCopyTimer = null;
let passwordCopyTimer = null;
let codeCopyTimer = null;

const messages = computed(() => share.value?.messages || []);
const title = computed(() => share.value?.email || '收件箱分享');
const readCount = computed(() => messages.value.filter(message => isRead(message.emailId)).length);
const unreadCount = computed(() => messages.value.length - readCount.value);
const visibleMessages = computed(() => {
  if (filter.value === 'read') return messages.value.filter(message => isRead(message.emailId));
  if (filter.value === 'unread') return messages.value.filter(message => !isRead(message.emailId));
  return messages.value;
});

async function loadShare() {
  loading.value = true;
  error.value = '';
  try {
    share.value = await http.get(`/share/${route.params.shareId}`, { noMsg: true });
  } catch (e) {
    share.value = null;
    error.value = e?.message || e?.data?.message || '分享内容不可访问';
  } finally {
    loading.value = false;
  }
}

function formatBeijingTime(value) {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date).reduce((acc, item) => {
    acc[item.type] = item.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

async function copyShareEmail() {
  if (!share.value?.email) return;
  await navigator.clipboard.writeText(share.value.email);
  copiedEmail.value = true;
  clearTimeout(emailCopyTimer);
  emailCopyTimer = setTimeout(() => {
    copiedEmail.value = false;
  }, 1600);
}

async function copySharePassword() {
  if (!share.value?.password) return;
  await navigator.clipboard.writeText(share.value.password);
  copiedPassword.value = true;
  clearTimeout(passwordCopyTimer);
  passwordCopyTimer = setTimeout(() => {
    copiedPassword.value = false;
  }, 1600);
}

function extractVerifyCode(message) {
  const text = [message.subject, message.text, stripHtml(message.html)].filter(Boolean).join('\n');
  const keywordPattern = /(验证码|校验码|动态码|确认码|认证码|verification code|verify code|security code|code)/i;
  if (!keywordPattern.test(text)) return '';
  const patterns = [
    /(?:验证码|校验码|动态码|确认码|认证码)[^\d]{0,30}(\d{4,8})/i,
    /(?:verification code|verify code|security code|code)[^\d]{0,30}(\d{4,8})/i,
    /(?<!\d)\d{4,8}(?!\d)/
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1] || match[0];
  }
  return '';
}

function stripHtml(html) {
  if (!html) return '';
  return String(html).replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ');
}

async function copyVerifyCode(message) {
  const code = extractVerifyCode(message);
  if (!code) return;
  await navigator.clipboard.writeText(code);
  copiedCodeId.value = Number(message.emailId);
  clearTimeout(codeCopyTimer);
  codeCopyTimer = setTimeout(() => {
    copiedCodeId.value = null;
  }, 1600);
}

function loadReadIds() {
  try {
    readIds.value = new Set(JSON.parse(localStorage.getItem(storageKey.value) || '[]'));
  } catch {
    readIds.value = new Set();
  }
}

function saveReadIds() {
  localStorage.setItem(storageKey.value, JSON.stringify([...readIds.value]));
}

function isRead(emailId) {
  return readIds.value.has(Number(emailId));
}

function isExpanded(emailId) {
  return expandedIds.value.has(Number(emailId));
}

function markRead(emailId) {
  const next = new Set(readIds.value);
  next.add(Number(emailId));
  readIds.value = next;
  saveReadIds();
}

function toggleRead(emailId) {
  const id = Number(emailId);
  const next = new Set(readIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  readIds.value = next;
  saveReadIds();
}

function toggleMessage(emailId) {
  const id = Number(emailId);
  const next = new Set(expandedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
    markRead(id);
  }
  expandedIds.value = next;
}

watch(storageKey, () => {
  filter.value = 'all';
  copiedEmail.value = false;
  copiedPassword.value = false;
  copiedCodeId.value = null;
  expandedIds.value = new Set();
  loadReadIds();
});

onMounted(() => {
  loadReadIds();
  loadShare();
});
</script>

<style scoped lang="scss">
.share-page {
  min-height: 100vh;
  padding: 32px 16px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-primary);
}

.share-card {
  width: min(920px, 100%);
  margin: 0 auto;
}

.share-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;

  h1 {
    margin: 4px 0 0;
    font-size: 24px;
    line-height: 1.3;
    word-break: break-word;
  }
}

.eyebrow {
  margin: 0;
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
}

.summary,
.message-card,
.state-box {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}

.summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  margin-bottom: 12px;
  color: var(--el-text-color-regular);

  em {
    margin-left: auto;
    font-style: normal;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

.email-copy,
.password-copy,
.copy-btn {
  border: 0;
  background: transparent;
  cursor: pointer;
}

.email-copy,
.password-copy {
  min-width: 0;
  padding: 0;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.password-label {
  padding-left: 8px;
  border-left: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.password-copy {
  max-width: 160px;
  font-family: monospace;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  border-radius: 999px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  flex-shrink: 0;
}

.copy-tip {
  font-size: 13px;
  color: var(--el-color-success);
  flex-shrink: 0;
}

.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;

  button {
    padding: 8px 13px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 999px;
    background: var(--el-bg-color);
    color: var(--el-text-color-regular);
    cursor: pointer;
  }

  button.active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 600;
  }
}

.state-box {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--el-text-color-secondary);
  text-align: center;
  padding: 28px;
}

.state-box--error {
  color: var(--el-color-danger);

  span {
    color: var(--el-text-color-secondary);
  }
}

.message-card {
  padding: 0;
  margin-bottom: 12px;
  overflow: hidden;
}

.message-card--read {
  opacity: 0.82;
}

.message-card--expanded {
  opacity: 1;
}

.message-summary {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 18px;
  cursor: pointer;
}

.read-dot {
  width: 8px;
  height: 8px;
  margin-top: 7px;
  border-radius: 999px;
  background: var(--el-color-primary);
  flex-shrink: 0;
}

.message-main {
  min-width: 0;
  flex: 1;
}

.message-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.expand-btn {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  flex-shrink: 0;
}

.sender {
  min-width: 0;

  strong,
  span {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  span {
    margin-top: 3px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

time {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.code-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.code-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 9px;
  border: 0;
  border-radius: 999px;
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning-dark-2);
  cursor: pointer;
  font-weight: 600;
}

.message-card h2 {
  margin: 0;
  font-size: 17px;
}

.message-card:not(.message-card--read) h2,
.message-card:not(.message-card--read) .sender strong {
  font-weight: 700;
}

.message-body {
  padding: 0 18px 18px;
}

.message-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;

  button {
    border: 0;
    background: transparent;
    color: var(--el-color-primary);
    cursor: pointer;
  }
}

.message-card p {
  margin: 0;
  color: var(--el-text-color-regular);
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-html {
  width: 100%;
  min-height: 520px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: #fff;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .share-page { padding: 20px 12px; }
  .share-header { align-items: flex-start; flex-direction: column; }
  .refresh-btn { width: 100%; justify-content: center; }
  .summary { align-items: flex-start; flex-direction: column; }
  .summary em { margin-left: 0; }
  .filter-bar { overflow-x: auto; }
  .message-top { flex-direction: column; }
  time { flex-shrink: 1; }
}
</style>
