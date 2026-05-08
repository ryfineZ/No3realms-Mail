<template>
  <div class="portal-wrap">
    <!-- Grid overlay -->
    <div class="grid-overlay"></div>

    <!-- ── Nav ── -->
    <nav class="portal-nav">
      <div class="nav-logo">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ siteTitle }}</span>
      </div>
      <div class="nav-links">
        <a @click="scrollTo('features')">功能</a>
        <a @click="scrollTo('dev')">开发者</a>
        <a @click="router.push('/api-docs')">API 文档</a>
        <a @click="scrollTo('domains')">域名</a>
      </div>
      <div class="nav-right">
        <button class="icon-action" title="API 文档" @click="router.push('/api-docs')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="btn-ghost" @click="router.push('/login')">登录</button>
        <button class="btn-primary" @click="router.push('/login')">免费使用 →</button>
      </div>
    </nav>

    <!-- ── Hero ── -->
    <section class="hero" id="hero">
      <!-- floating deco -->
      <div class="deco deco-star">✦</div>
      <div class="deco deco-dot">·</div>

      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          免费 · 安全 · 开箱即用
        </div>
        <h1 class="hero-title">
          {{ siteTitle }}
          <span class="title-line2">让邮件<span class="word-highlight">更</span>自由</span>
        </h1>
        <p class="hero-desc">
          免费邮箱服务，支持自定义域名与子域名，实时接收邮件。<br>
          无需繁琐配置，注册即用，隐私优先。
        </p>
        <div class="hero-cta">
          <button class="cta-primary" @click="router.push('/login')">立即使用 →</button>
          <button class="cta-ghost" @click="router.push('/api-docs')">API 文档</button>
        </div>
        <div class="hero-tags">
          <span><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> 实时收件</span>
          <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> 隐私保护</span>
          <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" stroke-width="2"/></svg> 自定义域名</span>
        </div>
      </div>

      <!-- ── Temp Widget ── -->
      <div class="temp-widget">
        <!-- WS notification -->
        <div class="ws-badge" v-if="inbox.length > 0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>新邮件到达</span>
        </div>
        <div class="ws-badge ws-badge-idle" v-else>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>实时监听</span>
        </div>

        <div class="widget-header">
          <div class="widget-icon">⭐</div>
          <div class="widget-header-info">
            <div class="widget-title">您的临时邮箱</div>
            <div class="widget-timer" v-if="tempEmail">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              {{ countdown }}
              <span class="sep">·</span>
              <span class="live-tag">
                <span class="live-dot"></span>实时
              </span>
            </div>
          </div>
        </div>

        <div class="widget-body">
          <!-- loading -->
          <div class="widget-loading" v-if="creating">
            <div class="spinner"></div>
            <span>生成临时邮箱...</span>
          </div>

          <template v-else-if="tempEmail">
            <div class="email-bar">
              <span class="email-text">{{ tempEmail }}</span>
              <div class="email-btns">
                <button class="icon-btn" @click="copyEmail" :title="copied ? '已复制！' : '复制地址'">
                  <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="2"/></svg>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <button class="icon-btn" @click="refreshEmail" title="换一个">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </div>
            </div>

            <div class="inbox-wrap">
              <div class="inbox-title-row">
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 8l9 6 9-6M3 8v11a1 1 0 001 1h16a1 1 0 001-1V8M3 8l9 6 9-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  收件箱
                </span>
                <button class="icon-btn small" @click="fetchInbox">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </div>

              <div class="inbox-scroll">
                <div v-if="inbox.length">
                  <div class="inbox-row" v-for="item in inbox" :key="item.id" @click="openEmail(item)">
                    <div class="i-avatar" :style="{background: avatarColor(item.name || item.from)}">
                      {{ (item.name || item.from || '?')[0].toUpperCase() }}
                    </div>
                    <div class="i-info">
                      <div class="i-sender">{{ item.name || item.from }}</div>
                      <div class="i-subject">{{ item.subject }}</div>
                    </div>
                    <div class="i-time">{{ relativeTime(item.time) }}</div>
                  </div>
                </div>
                <div class="inbox-empty" v-else>
                  <div class="empty-star">⭐</div>
                  <div class="empty-title">暂无邮件</div>
                  <div class="empty-sub">等待接收邮件…邮件将实时显示在此处。</div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Progress bar -->
        <div class="widget-progress" v-if="tempEmail">
          <div class="progress-bar" :style="{width: progressPct + '%'}"></div>
        </div>
      </div>
    </section>

    <!-- ── Features ── -->
    <section class="section features-section" id="features">
      <div class="section-inner">
        <div class="section-eyebrow">FEATURES</div>
        <h2 class="section-heading">为什么选择 {{ siteTitle }}？</h2>
        <div class="features-grid">
          <div class="feat-card" v-for="f in features" :key="f.title">
            <div class="feat-icon-box">{{ f.icon }}</div>
            <h3>{{ f.title }}</h3>
            <p>{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Developer ── -->
    <section class="section dev-section" id="dev">
      <div class="section-inner dev-inner">
        <div class="dev-left">
          <div class="section-eyebrow">DEVELOPER EXPERIENCE</div>
          <h2 class="section-heading">简单直接，<br>开发者快速集成</h2>
          <p class="section-sub">标准化 RESTful API，清晰的响应格式，完善的文档。只需几行代码，即可接入邮件服务。</p>
          <ul class="dev-list">
            <li v-for="d in devFeatures" :key="d.text">
              <div class="dev-feat-icon">
                <span v-html="d.icon"></span>
              </div>
              <span>{{ d.text }}</span>
            </li>
          </ul>
          <div class="dev-cta">
            <button class="cta-primary" @click="router.push('/api-docs')">查看 API 文档</button>
          </div>
        </div>
        <div class="dev-right">
          <div class="code-win">
            <div class="code-bar">
              <div class="dots">
                <span class="dot-r"></span>
                <span class="dot-y"></span>
                <span class="dot-g"></span>
              </div>
              <span class="code-label">&gt;_ terminal</span>
              <button class="copy-code" @click="copyCode">{{ codeCopied ? '✓' : '⧉' }}</button>
            </div>
            <pre class="code-body"><span class="c-cmt"># 创建临时邮箱（无需 API Key）</span>
<span class="c-prompt">$</span> curl {{ origin }}/api/temp/create \
  -X POST

<span class="c-obj">{</span>
  <span class="c-key">"code"</span>: <span class="c-num">200</span>,
  <span class="c-key">"data"</span>: <span class="c-obj">{</span>
    <span class="c-key">"email"</span>: <span class="c-str">"ab3x7k@{{ firstDomain }}"</span>,
    <span class="c-key">"token"</span>: <span class="c-str">"eyJhbG..."</span>,
    <span class="c-key">"ttl"</span>: <span class="c-num">1800</span>
  <span class="c-obj">}</span>
<span class="c-obj">}</span></pre>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Domains ── -->
    <section class="section domains-section" id="domains" v-if="publicDomains.length">
      <div class="section-inner">
        <div class="section-eyebrow">DOMAINS</div>
        <h2 class="section-heading">公开域名</h2>
        <p class="section-sub">以下域名无需归属权限即可使用；登录后还可以在域名管理中添加自己的私有域名。</p>
        <div class="domain-list">
          <div class="domain-chip" v-for="d in publicDomains" :key="d.domainId">
            <span class="chip-at">@</span>{{ d.domain }}
          </div>
        </div>
        <p class="domain-tip">还可以绑定您自己的域名 — <a class="link" @click="router.push('/login')">注册后前往域名管理</a></p>
      </div>
    </section>

    <!-- ── Footer ── -->
    <footer class="portal-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="footer-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ siteTitle }}</span>
          </div>
          <p class="footer-desc">免费临时邮箱服务，支持自定义域名，开发者友好的 API。</p>
        </div>
        <div class="footer-links-wrap">
          <div class="footer-col">
            <div class="footer-col-title">产品</div>
            <a @click="scrollTo('features')">功能</a>
            <a @click="scrollTo('domains')">域名</a>
            <a @click="router.push('/login')">立即使用</a>
          </div>
          <div class="footer-col">
            <div class="footer-col-title">开发者</div>
            <a @click="router.push('/api-docs')">API 文档</a>
            <a @click="scrollTo('dev')">快速接入</a>
          </div>
          <div class="footer-col">
            <div class="footer-col-title">账户</div>
            <a @click="router.push('/login')">登录</a>
            <a @click="router.push('/login')">注册</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© {{ new Date().getFullYear() }} {{ siteTitle }}. All rights reserved.</span>
      </div>
    </footer>

    <!-- Email detail modal -->
    <Teleport to="body">
      <div class="email-modal" v-if="selectedEmail" @click.self="selectedEmail = null">
        <div class="email-modal-card">
          <div class="modal-hd">
            <div>
              <div class="modal-subject">{{ selectedEmail.subject }}</div>
              <div class="modal-from">来自：{{ selectedEmail.name || selectedEmail.from }}</div>
            </div>
            <button class="modal-close" @click="selectedEmail = null">✕</button>
          </div>
          <div class="modal-bd">{{ selectedEmail.text || '（无内容）' }}</div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useSettingStore } from '@/store/setting.js';
import router from '@/router/index.js';
import http from '@/axios/index.js';

const settingStore = useSettingStore();
const siteTitle = computed(() => settingStore.settings.title || 'Cloud Mail');
const origin = computed(() => window.location.origin);
const firstDomain = computed(() => publicDomains.value[0]?.domain || 'example.com');

// ── Temp mailbox ──────────────────────────────────────
const TTL = 1800;
const tempEmail = ref('');
const tempToken = ref('');
const tempExpiry = ref(0);
const creating = ref(false);
const inbox = ref([]);
const copied = ref(false);
const selectedEmail = ref(null);
const countdown = ref('');
const progressPct = ref(100);
let pollTimer = null;
let countdownTimer = null;

async function createTempEmail() {
  creating.value = true;
  inbox.value = [];
  tempEmail.value = '';
  try {
    const d = await http.post('/temp/create', {});
    tempEmail.value = d.email;
    tempToken.value = d.token;
    tempExpiry.value = d.expiry;
    startCountdown();
    startPolling();
  } catch (e) {
    console.error(e);
  } finally {
    creating.value = false;
  }
}

function refreshEmail() {
  stopAll();
  createTempEmail();
}

async function fetchInbox() {
  if (!tempToken.value) return;
  try {
    const d = await http.get('/temp/inbox', { params: { token: tempToken.value } });
    inbox.value = d.emails || [];
  } catch (e) {
    if (e?.status === 404) stopAll();
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(fetchInbox, 5000);
}

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

function stopAll() {
  stopPolling();
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
}

function startCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);
  const update = () => {
    const remaining = Math.max(0, Math.round((tempExpiry.value - Date.now()) / 1000));
    progressPct.value = Math.max(0, Math.round((remaining / TTL) * 100));
    if (remaining === 0) { countdown.value = '已过期'; stopAll(); return; }
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    countdown.value = `将在 ${m}m ${String(s).padStart(2, '0')}s 后过期`;
  };
  update();
  countdownTimer = setInterval(update, 1000);
}

async function copyEmail() {
  await navigator.clipboard.writeText(tempEmail.value).catch(() => {});
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

const codeCopied = ref(false);
function copyCode() {
  const code = `curl ${origin.value}/api/temp/create -X POST`;
  navigator.clipboard.writeText(code).catch(() => {});
  codeCopied.value = true;
  setTimeout(() => (codeCopied.value = false), 2000);
}

function openEmail(item) { selectedEmail.value = item; }

const AVATAR_COLORS = ['#1890ff','#52c41a','#fa8c16','#722ed1','#13c2c2','#f5222d','#eb2f96'];
function avatarColor(name) {
  return AVATAR_COLORS[(name || '?').charCodeAt(0) % AVATAR_COLORS.length];
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  return `${Math.floor(diff / 3600000)} 小时前`;
}

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

// ── Domains ───────────────────────────────────────────
const publicDomains = ref([]);
async function loadDomains() {
  try {
    const d = await http.get('/domain/public');
    publicDomains.value = d || [];
  } catch {}
}

// ── Static data ───────────────────────────────────────
const features = [
  { icon: '⚡', title: '实时收件', desc: '邮件秒级送达，自动轮询刷新，第一时间看到新邮件。' },
  { icon: '🌐', title: '自定义域名', desc: '绑定自己的域名，通过 DNS 验证后即可使用，支持子域名。' },
  { icon: '🔒', title: '隐私保护', desc: '数据托管在 Cloudflare 边缘，无第三方追踪，账户权限精细管控。' },
  { icon: '📬', title: '临时邮箱', desc: '无需注册即可生成一次性临时邮箱，30 分钟有效，用完即弃。' },
  { icon: '👥', title: '多账户管理', desc: '一个账号管理多个邮箱地址，统一收件，灵活切换。' },
  { icon: '🛡️', title: '权限控制', desc: '精细化角色权限系统，支持多用户独立权限配置与管理。' },
];

const devFeatures = [
  { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', text: 'RESTful API 接口，语义清晰' },
  { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', text: '临时邮箱，免 Key 即用' },
  { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', text: '完善的 API 文档和示例' },
  { icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', text: '完整的自托管部署支持' },
];

onMounted(() => {
  loadDomains();
  createTempEmail();
});

onUnmounted(() => stopAll());
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.portal-wrap {
  min-height: 100vh;
  background: #07090f;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* ── Grid overlay ── */
.grid-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* ── Nav ── */
.portal-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 48px;
  height: 60px;
  background: rgba(7,9,15,0.8);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  gap: 32px;
}
.nav-logo {
  display: flex; align-items: center; gap: 9px;
  font-size: 15px; font-weight: 700; color: #f0f6ff;
  flex-shrink: 0; cursor: pointer; user-select: none;
}
.nav-links {
  display: flex; gap: 28px; flex: 1; justify-content: center;
}
.nav-links a {
  font-size: 14px; color: #64748b; cursor: pointer;
  transition: color 0.15s; position: relative;
}
.nav-links a:hover { color: #e2e8f0; }
.nav-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.icon-action {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
  background: transparent; color: #64748b;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s;
}
.icon-action:hover { color: #e2e8f0; border-color: rgba(255,255,255,0.2); }
.btn-ghost {
  padding: 6px 16px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.12);
  background: transparent; color: #64748b;
  font-size: 14px; cursor: pointer; transition: all 0.15s;
}
.btn-ghost:hover { border-color: rgba(255,255,255,0.25); color: #e2e8f0; }
.btn-primary {
  padding: 6px 16px; border-radius: 8px; border: none;
  background: #2563eb; color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s;
}
.btn-primary:hover { background: #1d4ed8; }

/* ── Hero ── */
.hero {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: space-between;
  gap: 48px;
  padding: 80px 48px 72px;
  max-width: 1200px; margin: 0 auto; width: 100%;
}

/* Floating decorations */
.deco {
  position: absolute; pointer-events: none; user-select: none;
  font-size: 24px; color: rgba(255,255,255,0.06); font-weight: 900;
}
.deco-star { left: -20px; top: 160px; font-size: 40px; }
.deco-dot { left: 8px; top: 320px; font-size: 60px; }

.hero-content { flex: 1; max-width: 500px; }

.hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 5px 14px; margin-bottom: 24px;
  background: rgba(37,99,235,0.1);
  border: 1px solid rgba(37,99,235,0.25);
  border-radius: 20px; font-size: 12px; color: #93c5fd;
}
.badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #3b82f6;
  animation: pulse 2s infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

.hero-title {
  font-size: 52px; font-weight: 800;
  line-height: 1.12; color: #f0f6ff; margin-bottom: 20px;
}
.title-line2 { display: block; }
.word-highlight {
  position: relative;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.word-highlight::after {
  content: '';
  position: absolute;
  bottom: 2px; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
  border-radius: 2px;
}

.hero-desc {
  font-size: 15px; line-height: 1.75; color: #64748b;
  margin-bottom: 28px;
}
.hero-cta { display: flex; gap: 12px; margin-bottom: 28px; flex-wrap: wrap; }
.cta-primary {
  padding: 11px 24px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #fff; font-size: 15px; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 20px rgba(37,99,235,0.3);
}
.cta-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(37,99,235,0.45); }
.cta-ghost {
  padding: 11px 24px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);
  background: transparent; color: #94a3b8;
  font-size: 15px; cursor: pointer; transition: all 0.2s;
}
.cta-ghost:hover { border-color: rgba(255,255,255,0.22); color: #e2e8f0; }
.hero-tags {
  display: flex; gap: 20px; flex-wrap: wrap;
}
.hero-tags span {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: #475569;
}
.hero-tags svg { flex-shrink: 0; }

/* ── Temp Widget ── */
.temp-widget {
  flex: 1; max-width: 480px;
  background: #0f1520;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03);
  position: relative;
  display: flex; flex-direction: column;
}
.ws-badge {
  position: absolute; top: 14px; right: 14px;
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  background: rgba(37,99,235,0.18);
  border: 1px solid rgba(37,99,235,0.3);
  border-radius: 10px;
  font-size: 11px; font-weight: 600; color: #93c5fd;
  z-index: 2;
}
.ws-badge-idle { background: rgba(15,20,30,0.8); border-color: rgba(255,255,255,0.08); color: #334155; }
.widget-header {
  display: flex; align-items: center; gap: 12px;
  padding: 18px 20px 14px;
}
.widget-icon { font-size: 26px; line-height: 1; }
.widget-title { font-size: 14px; font-weight: 600; color: #f0f6ff; }
.widget-timer {
  display: flex; align-items: center; gap: 5px;
  margin-top: 3px; font-size: 11px; color: #475569;
}
.widget-timer svg { flex-shrink: 0; }
.sep { color: #1e293b; }
.live-tag { display: flex; align-items: center; gap: 4px; color: #34d399; }
.live-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #34d399; animation: pulse 1.5s infinite;
}

.widget-body { padding: 0 16px 16px; flex: 1; }

.widget-loading {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 40px 0; color: #334155; font-size: 13px;
}
.spinner {
  width: 22px; height: 22px;
  border: 2px solid rgba(255,255,255,0.08);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.email-bar {
  display: flex; align-items: center;
  background: #080c14;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px; padding: 11px 12px;
  margin-bottom: 12px;
}
.email-text {
  flex: 1; min-width: 0;
  font-size: 13px; color: #cbd5e1;
  font-family: 'JetBrains Mono', monospace;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.email-btns { display: flex; gap: 6px; flex-shrink: 0; }
.icon-btn {
  width: 28px; height: 28px; border-radius: 7px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: #475569; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.icon-btn:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
.icon-btn.small { width: 22px; height: 22px; }

.inbox-wrap {
  background: #080c14;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
  overflow: hidden;
}
.inbox-title-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px;
  font-size: 12px; font-weight: 600; color: #475569;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.inbox-title-row span { display: flex; align-items: center; gap: 5px; }
.inbox-scroll { max-height: 220px; overflow-y: auto; }

.inbox-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  cursor: pointer; transition: background 0.15s;
}
.inbox-row:last-child { border-bottom: none; }
.inbox-row:hover { background: rgba(255,255,255,0.04); }
.i-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0;
}
.i-info { flex: 1; min-width: 0; }
.i-sender { font-size: 12px; font-weight: 600; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.i-subject { font-size: 11px; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px; }
.i-time { font-size: 10px; color: #1e293b; white-space: nowrap; }

.inbox-empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 28px 16px; gap: 6px;
}
.empty-star { font-size: 30px; margin-bottom: 4px; }
.empty-title { font-size: 13px; color: #334155; font-weight: 500; }
.empty-sub { font-size: 11px; color: #1e293b; text-align: center; }

/* Progress bar */
.widget-progress {
  height: 3px; background: rgba(255,255,255,0.05);
}
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  transition: width 1s linear;
}

/* ── Sections shared ── */
.section {
  position: relative; z-index: 1;
  padding: 80px 48px;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.section-inner { max-width: 1200px; margin: 0 auto; width: 100%; }
.section-eyebrow {
  font-size: 11px; font-weight: 700; letter-spacing: 2px;
  color: #2563eb; margin-bottom: 12px;
}
.section-heading {
  font-size: 36px; font-weight: 800;
  color: #f0f6ff; margin-bottom: 14px; line-height: 1.2;
}
.section-sub {
  font-size: 15px; color: #475569; line-height: 1.7;
  max-width: 540px; margin-bottom: 40px;
}

/* ── Features grid ── */
.features-section { background: rgba(255,255,255,0.012); }
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px; margin-top: 40px;
}
.feat-card {
  padding: 26px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  transition: border-color 0.2s, background 0.2s;
}
.feat-card:hover {
  border-color: rgba(37,99,235,0.22);
  background: rgba(37,99,235,0.04);
}
.feat-icon-box {
  width: 40px; height: 40px; border-radius: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; margin-bottom: 14px;
}
.feat-card h3 { font-size: 15px; font-weight: 700; color: #f0f6ff; margin-bottom: 8px; }
.feat-card p { font-size: 13px; line-height: 1.65; color: #475569; }

/* ── Dev section ── */
.dev-inner { display: flex; gap: 64px; align-items: center; }
.dev-left { flex: 1; max-width: 440px; }
.dev-right { flex: 1; }

.dev-list { list-style: none; display: flex; flex-direction: column; gap: 14px; margin-bottom: 0; }
.dev-list li { display: flex; align-items: center; gap: 12px; font-size: 14px; color: #64748b; }
.dev-feat-icon {
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  display: flex; align-items: center; justify-content: center;
  color: #475569; flex-shrink: 0;
}
.dev-cta { margin-top: 28px; }

/* Code window */
.code-win {
  background: #060a12;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; overflow: hidden;
}
.code-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 14px;
  background: #040710;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.dots { display: flex; gap: 5px; }
.dot-r, .dot-y, .dot-g {
  width: 10px; height: 10px; border-radius: 50%;
}
.dot-r { background: #ff5f57; }
.dot-y { background: #febc2e; }
.dot-g { background: #28c840; }
.code-label { margin-left: 6px; font-size: 12px; color: #1e293b; font-family: monospace; flex: 1; }
.copy-code {
  background: transparent; border: none;
  color: #334155; font-size: 14px; cursor: pointer;
  transition: color 0.15s; padding: 2px 4px;
}
.copy-code:hover { color: #64748b; }
.code-body {
  padding: 20px; font-size: 13px; line-height: 1.7;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  overflow-x: auto; white-space: pre; color: #64748b;
}
.c-cmt { color: #334155; }
.c-prompt { color: #34d399; }
.c-str { color: #86efac; }
.c-key { color: #93c5fd; }
.c-num { color: #fbbf24; }
.c-obj { color: #94a3b8; }

/* ── Domains ── */
.domains-section { background: rgba(255,255,255,0.012); }
.domain-list { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
.domain-chip {
  display: flex; align-items: center; gap: 4px;
  padding: 8px 16px;
  background: rgba(37,99,235,0.08);
  border: 1px solid rgba(37,99,235,0.18);
  border-radius: 24px;
  font-size: 14px; color: #93c5fd; font-family: monospace;
}
.chip-at { color: #3b5bdb; }
.chip-badge {
  font-size: 10px; padding: 1px 6px;
  background: #2563eb; color: #fff;
  border-radius: 10px; font-family: sans-serif; margin-left: 4px;
}
.domain-tip { font-size: 13px; color: #334155; }
.link { color: #60a5fa; cursor: pointer; }

/* ── Footer ── */
.portal-footer {
  position: relative; z-index: 1;
  border-top: 1px solid rgba(255,255,255,0.05);
  padding: 48px 48px 0;
}
.footer-inner {
  max-width: 1200px; margin: 0 auto;
  display: flex; gap: 64px; align-items: flex-start;
  padding-bottom: 40px;
}
.footer-brand { max-width: 260px; }
.footer-logo {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 700; color: #475569;
  margin-bottom: 12px;
}
.footer-desc { font-size: 13px; line-height: 1.65; color: #1e293b; }
.footer-links-wrap { display: flex; gap: 48px; flex: 1; }
.footer-col { display: flex; flex-direction: column; gap: 10px; }
.footer-col-title { font-size: 12px; font-weight: 700; color: #334155; letter-spacing: 0.5px; margin-bottom: 4px; }
.footer-col a { font-size: 13px; color: #1e293b; cursor: pointer; transition: color 0.15s; }
.footer-col a:hover { color: #475569; }
.footer-bottom {
  max-width: 1200px; margin: 0 auto;
  padding: 16px 0;
  border-top: 1px solid rgba(255,255,255,0.04);
  font-size: 12px; color: #1e293b;
}

/* ── Email modal ── */
.email-modal {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.75);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}
.email-modal-card {
  background: #0f1520;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  width: 100%; max-width: 600px;
  max-height: 80vh; display: flex; flex-direction: column; overflow: hidden;
}
.modal-hd {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.modal-subject { font-size: 16px; font-weight: 700; color: #f0f6ff; margin-bottom: 4px; }
.modal-from { font-size: 12px; color: #475569; }
.modal-close {
  width: 26px; height: 26px; border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.08); background: transparent;
  color: #475569; font-size: 13px; cursor: pointer; flex-shrink: 0;
}
.modal-bd {
  padding: 20px; overflow-y: auto;
  font-size: 14px; line-height: 1.7; color: #64748b; flex: 1;
  white-space: pre-wrap; word-break: break-word;
}

/* ── Responsive ── */
@media (max-width: 960px) {
  .portal-nav { padding: 0 20px; }
  .nav-links { display: none; }
  .hero { flex-direction: column; padding: 48px 20px 40px; gap: 36px; }
  .hero-content, .temp-widget { max-width: 100%; }
  .hero-title { font-size: 38px; }
  .section { padding: 56px 20px; }
  .features-grid { grid-template-columns: 1fr 1fr; }
  .dev-inner { flex-direction: column; gap: 36px; }
  .dev-left { max-width: 100%; }
  .footer-inner { flex-direction: column; gap: 36px; padding-bottom: 32px; }
  .footer-links-wrap { gap: 32px; flex-wrap: wrap; }
  .portal-footer { padding: 36px 20px 0; }
}
@media (max-width: 580px) {
  .features-grid { grid-template-columns: 1fr; }
  .hero-title { font-size: 32px; }
}
</style>
