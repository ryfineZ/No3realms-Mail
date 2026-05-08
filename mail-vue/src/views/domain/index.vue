<template>
  <div class="domain-page">
    <!-- 头部 -->
    <div class="page-header">
      <div class="page-header__left">
        <h1 class="page-title">域名管理</h1>
        <p class="page-desc">统一管理可用域名，完成验证后即可创建邮箱地址</p>
      </div>
      <button class="btn-primary" @click="openAdd">
        <Icon icon="ion:add-outline" width="16" height="16"/>
        添加域名
      </button>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--blue">
          <Icon icon="mingcute:earth-2-line" width="20" height="20"/>
        </div>
        <div>
          <div class="stat-card__num">{{ domains.length }}</div>
          <div class="stat-card__label">域名总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--green">
          <Icon icon="mingcute:check-circle-line" width="20" height="20"/>
        </div>
        <div>
          <div class="stat-card__num">{{ verifiedCount }}</div>
          <div class="stat-card__label">已验证</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--orange">
          <Icon icon="mingcute:user-3-line" width="20" height="20"/>
        </div>
        <div>
          <div class="stat-card__num">{{ publicCount }}</div>
          <div class="stat-card__label">公开共享</div>
        </div>
      </div>
    </div>

    <!-- 域名列表 -->
    <div class="domain-list" v-if="!loading">
      <div class="domain-empty" v-if="domains.length === 0">
        <Icon icon="mingcute:earth-2-line" width="48" height="48" color="var(--el-text-color-placeholder)"/>
        <p>还没有添加域名</p>
        <button class="btn-primary" @click="openAdd">添加第一个域名</button>
      </div>

      <div class="domain-card" v-for="d in domains" :key="d.domainId">
        <div class="domain-card__left">
          <div class="domain-card__name">{{ d.domain }}</div>
          <div class="domain-card__meta">
            <span class="badge" :class="statusClass(d.status)">{{ statusLabel(d.status) }}</span>
            <span class="badge badge--disabled" v-if="!d.enabled">已停用</span>
            <span class="badge badge--public" v-if="d.isPublic && d.status === 'verified' && d.enabled">公开</span>
            <span class="domain-card__time">{{ formatTime(d.createTime) }}</span>
          </div>
        </div>
        <div class="domain-card__actions">
          <button class="btn-ghost" @click="showDnsGuide(d)" v-if="d.status !== 'verified'">
            <Icon icon="mingcute:information-line" width="15" height="15"/>
            DNS 配置
          </button>
          <button class="btn-ghost" @click="showDnsGuide(d)" v-else :title="'重新配置 DNS 和 Email Routing'">
            <Icon icon="mingcute:settings-2-line" width="15" height="15"/>
            配置
          </button>
          <button class="btn-ghost btn-ghost--primary" @click="verify(d)" :disabled="verifyingId === d.domainId"
                  v-if="d.status !== 'verified'">
            <Icon v-if="verifyingId === d.domainId" icon="mingcute:loading-line" width="15" height="15" class="spin"/>
            <Icon v-else icon="mingcute:refresh-2-line" width="15" height="15"/>
            验证
          </button>
          <button class="btn-ghost" @click="toggleEnabled(d)" v-if="d.status === 'verified'"
                  :title="d.enabled ? '停用域名' : '启用域名'">
            <Icon :icon="d.enabled ? 'mingcute:pause-circle-line' : 'mingcute:play-circle-line'" width="15" height="15"/>
            {{ d.enabled ? '停用' : '启用' }}
          </button>
          <button class="btn-ghost" @click="togglePublic(d)" v-if="d.status === 'verified' && d.enabled"
                  :title="d.isPublic ? '取消公开' : '设为公开'">
            <Icon :icon="d.isPublic ? 'mingcute:eye-close-line' : 'mingcute:eye-2-line'" width="15" height="15"/>
            {{ d.isPublic ? '取消公开' : '设为公开' }}
          </button>
          <button class="btn-ghost btn-ghost--danger" @click="remove(d)">
            <Icon icon="mingcute:delete-line" width="15" height="15"/>
          </button>
        </div>
      </div>
    </div>

    <div class="loading-wrap" v-if="loading">
      <Icon icon="mingcute:loading-line" width="24" height="24" class="spin" color="var(--el-color-primary)"/>
    </div>

    <!-- 添加域名弹窗 -->
    <el-dialog v-model="showAdd" :show-close="false" class="domain-dialog" width="480px" align-center>
      <div class="dialog-inner">
        <div class="dialog-header">
          <div>
            <div class="dialog-title">添加域名</div>
            <div class="dialog-subtitle">添加后需要配置 DNS 记录完成验证</div>
          </div>
          <button class="dialog-close" @click="showAdd = false">
            <Icon icon="mingcute:close-line" width="18" height="18"/>
          </button>
        </div>

        <div class="form-section">
          <label class="form-label">域名</label>
          <input class="form-input" v-model="addForm.domain" placeholder="example.com" autocomplete="off"/>
        </div>

        <div class="form-section">
          <label class="toggle-label">
            <input type="checkbox" v-model="addForm.isPublic" class="toggle-checkbox"/>
            <span class="toggle-switch"></span>
            <span>公开共享此域名</span>
          </label>
          <p class="form-hint">开启后，其他用户可以用此域名创建邮箱地址</p>
        </div>

        <div class="dialog-actions">
          <button class="btn-cancel" @click="showAdd = false">取消</button>
          <button class="btn-submit" @click="submitAdd" :disabled="addLoading">
            <Icon v-if="addLoading" icon="mingcute:loading-line" width="15" height="15" class="spin"/>
            添加
          </button>
        </div>
      </div>
    </el-dialog>

    <!-- DNS 配置指南弹窗 -->
    <el-dialog v-model="showGuide" :show-close="false" class="domain-dialog" width="540px" align-center>
      <div class="dialog-inner" v-if="guideDomain">
        <div class="dialog-header">
          <div>
            <div class="dialog-title">DNS 配置</div>
            <div class="dialog-subtitle">{{ guideDomain.domain }}</div>
          </div>
          <button class="dialog-close" @click="showGuide = false">
            <Icon icon="mingcute:close-line" width="18" height="18"/>
          </button>
        </div>

        <!-- 自动配置区域 -->
        <template v-if="autoStep === 'detecting'">
          <div class="auto-detecting">
            <Icon icon="mingcute:loading-line" width="20" height="20" class="spin" color="var(--el-color-primary)"/>
            <span>正在检测域名托管商...</span>
          </div>
        </template>

        <template v-if="autoStep === 'cloudflare'">
          <div class="auto-box">
            <div class="auto-detected">
              <Icon icon="logos:cloudflare" width="18" height="18"/>
              <span>检测到域名托管在 <strong>Cloudflare</strong>，可一键自动配置</span>
            </div>
            <div class="form-section">
              <label class="form-label">Cloudflare API Token</label>
              <input class="form-input" v-model="cfToken" type="password" placeholder="粘贴你的 Cloudflare API Token" autocomplete="off"/>
              <p class="form-hint">需要 Zone &gt; DNS &gt; Edit 权限。<a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank">前往创建 →</a></p>
            </div>
            <div class="dialog-actions">
              <button class="btn-cancel" @click="autoStep = 'manual'">手动配置</button>
              <button class="btn-submit" @click="autoConfigure" :disabled="autoLoading || !cfToken.trim()">
                <Icon v-if="autoLoading" icon="mingcute:loading-line" width="15" height="15" class="spin"/>
                一键配置
              </button>
            </div>
          </div>
        </template>

        <template v-if="autoStep === 'result'">
          <div class="auto-result">
            <div class="auto-result__item" v-for="r in autoResults" :key="r.type">
              <Icon v-if="r.success" icon="mingcute:check-circle-fill" width="16" height="16" color="var(--el-color-success)"/>
              <Icon v-else icon="mingcute:close-circle-fill" width="16" height="16" color="var(--el-color-danger)"/>
              <span class="dns-type" :class="'dns-type--' + r.type.toLowerCase()">{{ r.type }}</span>
              <span class="auto-result__name">{{ r.name }}</span>
              <span class="auto-result__status">{{ r.alreadyExists ? '已存在' : r.success ? '已创建' : '失败' }}</span>
            </div>
          </div>
          <div class="guide-note" v-if="autoResults.every(r => r.success)">
            <Icon icon="mingcute:check-circle-fill" width="15" height="15" color="var(--el-color-success)"/>
            DNS 记录已配置完成，点击下方「验证」完成域名绑定。
          </div>
          <div class="guide-note" v-else>
            <Icon icon="mingcute:information-line" width="15" height="15" color="var(--el-color-warning)"/>
            部分记录配置失败，可切换到手动配置补充。
          </div>
          <div class="dialog-actions">
            <button class="btn-cancel" @click="autoStep = 'manual'">手动配置</button>
            <button class="btn-submit" @click="verifyFromGuide" :disabled="verifyingId === guideDomain.domainId">
              <Icon v-if="verifyingId === guideDomain.domainId" icon="mingcute:loading-line" width="15" height="15" class="spin"/>
              验证 DNS
            </button>
          </div>
        </template>

        <!-- 手动配置 -->
        <template v-if="autoStep === 'manual'">
          <p class="guide-intro">请在你的 DNS 服务商处添加以下 <strong>4 条</strong> 记录，全部配置完成后点击「验证」。</p>
          <div class="dns-records">
            <div class="dns-record" v-for="rec in dnsRecords" :key="rec.type + rec.name">
              <div class="dns-record__header">
                <span class="dns-type" :class="'dns-type--' + rec.type.toLowerCase()">{{ rec.type }}</span>
                <span class="dns-record__desc">{{ rec.desc }}</span>
              </div>
              <div class="dns-record__row">
                <div class="dns-field">
                  <div class="dns-field__label">主机记录</div>
                  <div class="dns-field__value">
                    <code>{{ rec.name }}</code>
                    <button class="copy-btn" @click="copy(rec.name)"><Icon icon="mingcute:copy-2-line" width="13" height="13"/></button>
                  </div>
                </div>
                <div class="dns-field">
                  <div class="dns-field__label">记录值</div>
                  <div class="dns-field__value">
                    <code>{{ rec.value }}</code>
                    <button class="copy-btn" @click="copy(rec.value)"><Icon icon="mingcute:copy-2-line" width="13" height="13"/></button>
                  </div>
                </div>
                <div class="dns-field dns-field--sm" v-if="rec.priority">
                  <div class="dns-field__label">优先级</div>
                  <div class="dns-field__value"><code>{{ rec.priority }}</code></div>
                </div>
              </div>
            </div>
          </div>
          <div class="guide-note">
            <Icon icon="mingcute:information-line" width="15" height="15" color="var(--el-color-warning)"/>
            DNS 生效通常需要几分钟到数小时，配置完成后再点击验证。
          </div>
          <div class="dialog-actions">
            <button class="btn-cancel" @click="showGuide = false">关闭</button>
            <button class="btn-submit" @click="verifyFromGuide" :disabled="verifyingId === guideDomain.domainId">
              <Icon v-if="verifyingId === guideDomain.domainId" icon="mingcute:loading-line" width="15" height="15" class="spin"/>
              验证 DNS
            </button>
          </div>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { domainMyList, domainAdminList, domainAdd, domainVerify, domainSetPublic, domainSetEnabled, domainDelete, domainDetectProvider, domainAutoConfigure } from '@/request/domain.js';
import { useUserStore } from '@/store/user.js';

const userStore = useUserStore();

const domains = ref([]);
const loading = ref(true);
const verifyingId = ref(null);

// 添加弹窗
const showAdd = ref(false);
const addLoading = ref(false);
const addForm = ref({ domain: '', isPublic: false });

// DNS 指南弹窗
const showGuide = ref(false);
const guideDomain = ref(null);
const autoStep = ref('detecting'); // 'detecting' | 'cloudflare' | 'result' | 'manual'
const cfToken = ref('');
const autoLoading = ref(false);
const autoResults = ref([]);

const verifiedCount = computed(() => domains.value.filter(d => d.status === 'verified').length);
const publicCount = computed(() => domains.value.filter(d => d.isPublic && d.status === 'verified').length);

const dnsRecords = computed(() => {
  if (!guideDomain.value) return [];
  const d = guideDomain.value.domain;
  return [
    {
      type: 'MX',
      desc: '接收邮件',
      name: d,
      value: 'route1.mx.cloudflare.net',
      priority: 10,
    },
    {
      type: 'MX',
      desc: '子域名邮件接收',
      name: `*.${d}`,
      value: 'route1.mx.cloudflare.net',
      priority: 10,
    },
    {
      type: 'CNAME',
      desc: '邮件路由',
      name: `mail.${d}`,
      value: 'route1.mx.cloudflare.net',
    },
    {
      type: 'TXT',
      desc: '所有权验证',
      name: `_cloudmail-verify.${d}`,
      value: guideDomain.value.verifyToken,
    },
  ];
});

onMounted(loadDomains);

async function loadDomains() {
  loading.value = true;
  try {
    const isAdmin = userStore.user?.type === 0;
    domains.value = isAdmin ? await domainAdminList() : await domainMyList();
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function openAdd() {
  addForm.value = { domain: '', isPublic: false };
  showAdd.value = true;
}

async function submitAdd() {
  if (!addForm.value.domain.trim()) {
    ElMessage({ message: '请输入域名', type: 'error', plain: true });
    return;
  }
  addLoading.value = true;
  try {
    const row = await domainAdd(addForm.value);
    domains.value.unshift(row);
    showAdd.value = false;
    ElMessage({ message: '添加成功，请配置 DNS 记录后验证', type: 'success', plain: true });
    showDnsGuide(row);
  } catch (e) {
    ElMessage({ message: e.message || '添加失败', type: 'error', plain: true });
  } finally {
    addLoading.value = false;
  }
}

function showDnsGuide(d) {
  guideDomain.value = d;
  cfToken.value = '';
  autoResults.value = [];
  showGuide.value = true;
  autoStep.value = 'detecting';
  detectProvider(d.domainId);
}

async function detectProvider(domainId) {
  try {
    const res = await domainDetectProvider({ domainId });
    if (res.provider === 'cloudflare') {
      autoStep.value = 'cloudflare';
    } else {
      autoStep.value = 'manual';
    }
  } catch {
    autoStep.value = 'manual';
  }
}

async function autoConfigure() {
  autoLoading.value = true;
  try {
    const res = await domainAutoConfigure({
      domainId: guideDomain.value.domainId,
      provider: 'cloudflare',
      credentials: { apiToken: cfToken.value },
    });
    autoResults.value = res.results;
    autoStep.value = 'result';
    if (res.allSuccess) {
      ElMessage({ message: 'DNS 记录配置成功！', type: 'success', plain: true });
    } else {
      ElMessage({ message: '部分记录配置失败', type: 'warning', plain: true });
    }
  } catch (e) {
    if (e.message === 'ZONE_NOT_FOUND') {
      ElMessage({ message: '未找到该域名的 Cloudflare Zone，请确认域名已在 Cloudflare 添加', type: 'error', plain: true, duration: 5000 });
    } else {
      ElMessage({ message: e.message || '自动配置失败，请检查 API Token 权限', type: 'error', plain: true });
    }
  } finally {
    autoLoading.value = false;
  }
}

async function verify(d) {
  verifyingId.value = d.domainId;
  try {
    const res = await domainVerify({ domainId: d.domainId });
    if (res.verified) {
      d.status = 'verified';
      ElMessage({ message: '验证成功！', type: 'success', plain: true });
      showGuide.value = false;
    } else {
      const detail = [];
      if (!res.checks?.txtOk) detail.push('TXT 记录未找到');
      if (!res.checks?.mxOk) detail.push('MX 记录未找到');
      ElMessage({ message: `验证失败：${detail.join('、') || 'DNS 未生效，请稍后重试'}`, type: 'warning', plain: true, duration: 5000 });
    }
  } catch (e) {
    ElMessage({ message: '验证请求失败', type: 'error', plain: true });
  } finally {
    verifyingId.value = null;
  }
}

async function verifyFromGuide() {
  if (guideDomain.value) await verify(guideDomain.value);
}

async function toggleEnabled(d) {
  try {
    await domainSetEnabled({ domainId: d.domainId, enabled: !d.enabled });
    d.enabled = d.enabled ? 0 : 1;
    ElMessage({ message: d.enabled ? '已启用' : '已停用', type: 'success', plain: true });
  } catch (e) {
    ElMessage({ message: '操作失败', type: 'error', plain: true });
  }
}

async function togglePublic(d) {
  try {
    await domainSetPublic({ domainId: d.domainId, isPublic: !d.isPublic });
    d.isPublic = !d.isPublic;
    ElMessage({ message: d.isPublic ? '已设为公开' : '已取消公开', type: 'success', plain: true });
  } catch (e) {
    ElMessage({ message: '操作失败', type: 'error', plain: true });
  }
}

async function remove(d) {
  try {
    await ElMessageBox.confirm(`确定删除域名 ${d.domain}？`, { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' });
    await domainDelete(d.domainId);
    domains.value = domains.value.filter(x => x.domainId !== d.domainId);
    ElMessage({ message: '已删除', type: 'success', plain: true });
  } catch {}
}

function statusClass(s) {
  return { pending: 'badge--warning', verified: 'badge--success', rejected: 'badge--danger' }[s] || '';
}
function statusLabel(s) {
  return { pending: '待验证', verified: '已验证', rejected: '已拒绝' }[s] || s;
}
function formatTime(t) {
  if (!t) return '';
  return t.slice(0, 10);
}
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage({ message: '已复制', type: 'success', plain: true, duration: 1500 });
  } catch {}
}
</script>

<style scoped lang="scss">
.domain-page {
  padding: 28px 32px;
  max-width: 860px;
  margin: 0 auto;
}

/* ===== 头部 ===== */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}
.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.page-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

/* ===== 统计卡片 ===== */
.stat-cards {
  display: flex;
  gap: 14px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  flex: 1;
  min-width: 140px;
}
.stat-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  &--blue { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
  &--green { background: var(--el-color-success-light-9); color: var(--el-color-success); }
  &--orange { background: var(--el-color-warning-light-9); color: var(--el-color-warning); }
}
.stat-card__num { font-size: 22px; font-weight: 700; color: var(--el-text-color-primary); }
.stat-card__label { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 2px; }

/* ===== 域名列表 ===== */
.domain-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 60px 20px;
  border: 1px dashed var(--el-border-color);
  border-radius: 12px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
.domain-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--el-bg-color);
  margin-bottom: 10px;
  transition: border-color 0.15s;
  &:hover { border-color: var(--el-color-primary-light-5); }
}
.domain-card__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-family: monospace;
}
.domain-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.domain-card__time { font-size: 12px; color: var(--el-text-color-placeholder); }
.domain-card__actions { display: flex; align-items: center; gap: 8px; }

/* ===== Badge ===== */
.badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 500;
  &--success { background: var(--el-color-success-light-9); color: var(--el-color-success); }
  &--warning { background: var(--el-color-warning-light-9); color: var(--el-color-warning); }
  &--danger  { background: var(--el-color-danger-light-9);  color: var(--el-color-danger);  }
  &--public  { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
  &--disabled { background: var(--el-fill-color); color: var(--el-text-color-secondary); }
}

/* ===== 按钮 ===== */
.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 8px;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
  &:hover { opacity: 0.88; }
}
.btn-ghost {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 7px;
  border: 1px solid var(--el-border-color);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: var(--el-fill-color-light); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &--primary { color: var(--el-color-primary); border-color: var(--el-color-primary-light-5); &:hover { background: var(--el-color-primary-light-9); }}
  &--danger  { color: var(--el-color-danger);  border-color: transparent; &:hover { background: var(--el-color-danger-light-9); border-color: var(--el-color-danger-light-5); }}
}
.btn-cancel {
  padding: 8px 18px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 14px;
  cursor: pointer;
  &:hover { background: var(--el-fill-color-light); }
}
.btn-submit {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: 8px;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
  &:hover:not(:disabled) { opacity: 0.88; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

/* ===== 弹窗 ===== */
:deep(.domain-dialog) {
  .el-dialog { border-radius: 14px; padding: 0; overflow: hidden; }
  .el-dialog__header { display: none; }
  .el-dialog__body { padding: 0; }
}
.dialog-inner { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.dialog-header { display: flex; align-items: flex-start; justify-content: space-between; }
.dialog-title { font-size: 17px; font-weight: 700; }
.dialog-subtitle { font-size: 13px; color: var(--el-text-color-secondary); margin-top: 3px; }
.dialog-close {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--el-fill-color-light); color: var(--el-text-color-secondary);
  cursor: pointer;
  &:hover { background: var(--el-fill-color); }
}
.dialog-actions { display: flex; gap: 10px; justify-content: flex-end; }

.form-section { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 13px; font-weight: 500; }
.form-input {
  height: 40px; padding: 0 12px; border-radius: 8px;
  border: 1px solid var(--el-border-color); background: var(--el-fill-color-blank);
  color: var(--el-text-color-primary); font-size: 14px;
  &::placeholder { color: var(--el-text-color-placeholder); }
  &:focus { border-color: var(--el-color-primary); outline: none; }
}
.form-hint { font-size: 12px; color: var(--el-text-color-placeholder); }

/* toggle */
.toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; }
.toggle-checkbox { display: none; }
.toggle-switch {
  width: 34px; height: 18px; border-radius: 9px; background: var(--el-border-color);
  position: relative; transition: background 0.2s; flex-shrink: 0;
  &::after { content: ''; width: 14px; height: 14px; border-radius: 50%; background: #fff; position: absolute; top: 2px; left: 2px; transition: transform 0.2s; }
}
.toggle-checkbox:checked + .toggle-switch { background: var(--el-color-primary); &::after { transform: translateX(16px); } }

/* ===== DNS 指南 ===== */
.guide-intro { font-size: 13px; color: var(--el-text-color-regular); }
.dns-records { display: flex; flex-direction: column; gap: 12px; }
.dns-record {
  border: 1px solid var(--el-border-color); border-radius: 10px; overflow: hidden;
}
.dns-record__header {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 14px; background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color);
}
.dns-type {
  font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px;
  &--mx    { background: #dbeafe; color: #1d4ed8; }
  &--cname { background: #dcfce7; color: #16a34a; }
  &--txt   { background: #fef3c7; color: #d97706; }
}
.dns-record__desc { font-size: 12px; color: var(--el-text-color-secondary); }
.dns-record__row { display: flex; gap: 0; flex-wrap: wrap; }
.dns-field {
  flex: 1; min-width: 160px; padding: 10px 14px;
  border-right: 1px solid var(--el-border-color);
  &:last-child { border-right: none; }
  &--sm { flex: 0 0 80px; min-width: 80px; }
}
.dns-field__label { font-size: 11px; color: var(--el-text-color-placeholder); margin-bottom: 4px; }
.dns-field__value {
  display: flex; align-items: center; gap: 6px;
  code { font-size: 12px; font-family: monospace; color: var(--el-text-color-primary); word-break: break-all; }
}
.copy-btn {
  display: flex; align-items: center; padding: 2px; border-radius: 4px; color: var(--el-text-color-placeholder);
  cursor: pointer; flex-shrink: 0;
  &:hover { color: var(--el-color-primary); background: var(--el-fill-color-light); }
}
.guide-note {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-radius: 8px;
  background: var(--el-color-warning-light-9); font-size: 12px; color: var(--el-text-color-regular);
}

/* ===== 自动配置 ===== */
.auto-detecting {
  display: flex; align-items: center; gap: 10px;
  padding: 24px; justify-content: center;
  color: var(--el-text-color-secondary); font-size: 14px;
}
.auto-box { display: flex; flex-direction: column; gap: 16px; }
.auto-detected {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 14px; border-radius: 8px;
  background: var(--el-color-primary-light-9);
  font-size: 13px; color: var(--el-text-color-regular);
}
.auto-result { display: flex; flex-direction: column; gap: 6px; }
.auto-result__item {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-radius: 8px;
  background: var(--el-fill-color-light); font-size: 13px;
}
.auto-result__name {
  flex: 1; font-family: monospace; font-size: 12px; color: var(--el-text-color-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.auto-result__status { font-size: 12px; color: var(--el-text-color-secondary); }

.form-hint a { color: var(--el-color-primary); text-decoration: none; }

.loading-wrap { display: flex; justify-content: center; padding: 60px; }

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }
</style>
