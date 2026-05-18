<template>
  <div class="account-box">
    <!-- 顶部操作栏 -->
    <div class="head-opt">
      <button v-perm="'account:add'" class="btn-create" @click="add">
        <Icon icon="ion:add-outline" width="15" height="15"/>
        <span>{{ $t('addAccount') }}</span>
      </button>
      <button class="btn-icon" @click="refresh" :title="$t('refresh')">
        <Icon icon="ion:reload" width="16" height="16"/>
      </button>
    </div>

    <div class="account-search" v-if="isAdmin">
      <Icon icon="mingcute:search-line" width="15" height="15" color="var(--el-text-color-secondary)"/>
      <input v-model="accountSearch" placeholder="搜索邮箱或标签" autocomplete="off" />
      <button v-if="accountSearch" @click="accountSearch = ''" title="清空">
        <Icon icon="mingcute:close-line" width="14" height="14"/>
      </button>
    </div>

    <!-- 账号列表 -->
    <el-scrollbar class="scrollbar" ref="scrollbarRef">
      <div v-infinite-scroll="getAccountList" :infinite-scroll-distance="600" :infinite-scroll-immediate="false">

        <div class="account-item" :class="{ 'account-item--active': accountStore.currentAccountId === item.accountId }"
             v-for="(item, index) in accounts" :key="item.accountId" @click="changeAccount(item)">
          <div class="account-item__avatar">
            {{ (item.name || item.email).charAt(0).toUpperCase() }}
          </div>
          <div class="account-item__info">
            <el-tooltip :content="item.email" placement="right" :show-after="400" :disabled="!item.email || item.email.length < 25">
              <div class="account-item__email">{{ item.email }}</div>
            </el-tooltip>
            <div class="account-item__name" v-if="item.name && item.name !== item.email.split('@')[0]">{{ item.name }}</div>
            <div class="account-item__meta" v-if="isAdmin && (item.createTime || accountTags(item).length > 0)">
              <span class="account-item__time" v-if="item.createTime">创建于 {{ formatAccountCreateTime(item.createTime) }}</span>
              <div class="account-item__tags" v-if="accountTags(item).length > 0">
                <span class="account-tag" v-for="tag in accountTags(item)" :key="tag">{{ tag }}</span>
              </div>
            </div>
          </div>
          <div class="account-item__actions" @click.stop>
            <button class="action-btn" @click="copyAccount(item.email)" :title="$t('copy')">
              <Icon icon="fluent-color:clipboard-24" width="17" height="17"/>
            </button>
            <button class="action-btn" @click="setAllReceive(item)" :title="item.allReceive ? $t('cancelReceive') : $t('setReceive')">
              <Icon v-if="!item.allReceive" icon="eva:email-fill" width="17" height="17" color="#f5a623"/>
              <Icon v-else icon="flat-color-icons:folder" width="17" height="17"/>
            </button>
            <el-dropdown v-if="!showNullSetting(item)" trigger="click">
              <button class="action-btn">
                <Icon icon="ri:more-2-fill" width="17" height="17"/>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="hasPerm('email:send')" @click="openSetName(item)">
                    <Icon icon="mingcute:edit-line" width="14" height="14" style="margin-right:6px"/>{{ $t('rename') }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="isAdmin" @click="shareInbox(item)">
                    <Icon icon="mingcute:share-forward-line" width="14" height="14" style="margin-right:6px"/>分享收件箱
                  </el-dropdown-item>
                  <el-dropdown-item v-if="item.accountId !== userStore.user.account.accountId" @click="setAsTop(item, index)">
                    <Icon icon="mingcute:pin-line" width="14" height="14" style="margin-right:6px"/>{{ $t('pin') }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="item.accountId !== userStore.user.account.accountId && hasPerm('account:delete')"
                                    @click="remove(item)" style="color: var(--el-color-danger)">
                    <Icon icon="mingcute:delete-line" width="14" height="14" style="margin-right:6px"/>{{ $t('delete') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 骨架屏 -->
        <template v-if="loading">
          <div class="account-skeleton" v-for="i in skeletonRows" :key="i">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-info">
              <div class="skeleton-line skeleton-line--long"></div>
              <div class="skeleton-line skeleton-line--short"></div>
            </div>
          </div>
        </template>

        <div class="list-footer" v-if="noLoading && accounts.length > 0">{{ $t('noMoreData') }}</div>
        <div class="list-empty" v-if="noLoading && accounts.length === 0">
          <Icon icon="mdi:inbox-outline" width="40" height="40" color="var(--el-text-color-secondary)"/>
          <p>{{ $t('noMessagesFound') }}</p>
        </div>
      </div>
    </el-scrollbar>

    <!-- 创建邮箱弹窗 -->
    <Teleport to="body">
    <el-dialog v-model="showAdd" :show-close="false" class="create-dialog" width="440px" align-center>
      <div class="dialog-inner">
        <!-- 头部 -->
        <div class="dialog-header">
          <div>
            <div class="dialog-title">{{ $t('addAccount') }}</div>
            <div class="dialog-subtitle">创建一个专属邮箱地址</div>
          </div>
          <button class="dialog-close" @click="showAdd = false">
            <Icon icon="mingcute:close-line" width="18" height="18"/>
          </button>
        </div>

        <!-- 邮箱前缀 -->
        <div class="form-section">
          <label class="form-label">邮箱前缀</label>
          <div class="prefix-input-wrap">
            <input
              ref="addRef"
              v-model="addForm.prefix"
              class="form-input"
              :placeholder="'留空则自动生成随机前缀'"
              autocomplete="off"
              @keydown.enter="submit"
            />
            <button class="btn-random" @click="generateRandom" :title="'随机生成'" :disabled="randomLoading">
              <Icon v-if="!randomLoading" icon="mingcute:refresh-2-line" width="16" height="16"/>
              <Icon v-else icon="mingcute:loading-line" width="16" height="16" class="spin"/>
            </button>
          </div>
        </div>

        <!-- 域名选择 -->
        <div class="form-section">
          <div class="subdomain-row">
            <label class="form-label">域名</label>
            <el-checkbox v-model="useSubdomain" label="子域名" size="small" />
            <template v-if="useSubdomain">
              <span class="subdomain-level-label">层级</span>
              <el-checkbox-group v-model="subdomainLevels" size="small" class="level-group">
                <el-checkbox-button v-for="n in 4" :key="n" :value="n + 1">{{ n + 1 }}</el-checkbox-button>
              </el-checkbox-group>
            </template>
          </div>
          <div class="domain-selector" @click="toggleDomainDropdown" ref="domainSelectorRef">
            <Icon icon="mingcute:earth-2-line" width="16" height="16" color="var(--el-text-color-secondary)"/>
            <span class="domain-selector__value" :class="{ 'placeholder': !selectedDomain }">
              {{ selectedDomain ? '@' + selectedDomain.domain : '选择域名...' }}
            </span>
            <Icon icon="mingcute:down-small-fill" width="18" height="18" color="var(--el-text-color-secondary)"
                  :style="{ transform: domainDropdownOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }"/>
          </div>
          <div class="domain-dropdown" v-if="domainDropdownOpen">
            <div class="domain-dropdown__loading" v-if="domainsLoading">
              <Icon icon="mingcute:loading-line" width="16" height="16" class="spin"/> 加载中...
            </div>
            <div v-else>
              <div class="domain-dropdown__item"
                   v-for="d in publicDomains" :key="d.domainId"
                   :class="{ 'domain-dropdown__item--active': selectedDomain?.domainId === d.domainId }"
                   @click.stop="selectDomain(d)">
                <span>@{{ d.domain }}</span>
              </div>
              <div class="domain-dropdown__empty" v-if="publicDomains.length === 0">暂无可用域名</div>
            </div>
          </div>
          <div class="domain-hint" v-if="!domainDropdownOpen">
            不手动指定时，系统将自动选择可用域名
          </div>
          <!-- 子域名 -->
          <div class="subdomain-section" v-if="useSubdomain">
            <div class="subdomain-input-wrap">
              <input
                v-model="subdomainInput"
                class="form-input"
                :placeholder="'留空随机，支持多级如 a.b.c'"
                autocomplete="off"
                @keydown.enter="submit"
              />
              <button class="btn-random" @click="randomSubdomain" title="随机子域名">
                <Icon icon="mingcute:refresh-2-line" width="16" height="16"/>
              </button>
            </div>
            <div class="subdomain-preview" v-if="subdomainInput">
              {{ subdomainInput }}.{{ selectedDomain?.domain || '随机域名' }}
            </div>
          </div>
        </div>

        <!-- 预览 -->
        <div class="email-preview" v-if="emailPreview">
          <Icon icon="eva:email-outline" width="15" height="15" color="var(--el-color-primary)"/>
          <span>{{ emailPreview }}</span>
        </div>

        <!-- 标签 -->
        <div class="form-section">
          <label class="form-label">标签</label>
          <input
            v-model="addForm.tags"
            class="form-input"
            placeholder="如：注册、测试项目，用逗号分隔"
            autocomplete="off"
            @keydown.enter.prevent="submit"
          />
          <div class="tag-hint" v-if="createTags.length > 0">
            <span class="account-tag" v-for="tag in createTags" :key="tag">{{ tag }}</span>
          </div>
        </div>

        <!-- Turnstile 验证 -->
        <div class="add-email-turnstile" :class="verifyShow ? 'turnstile-show' : 'turnstile-hide'"
             :data-sitekey="settingStore.settings.siteKey"
             data-callback="onTurnstileSuccess"
             data-error-callback="onTurnstileError">
          <span style="font-size: 12px;color: var(--el-color-danger)" v-if="botJsError">{{ $t('verifyModuleFailed') }}</span>
        </div>

        <!-- 操作按钮 -->
        <div class="dialog-actions">
          <button class="btn-cancel" @click="showAdd = false">取消</button>
          <button class="btn-submit" @click="submit" :disabled="addLoading">
            <Icon v-if="addLoading" icon="mingcute:loading-line" width="15" height="15" class="spin"/>
            <span>{{ addLoading ? '创建中...' : '创建邮箱' }}</span>
          </button>
        </div>
      </div>
    </el-dialog>
    </Teleport>

    <!-- 重命名弹窗 -->
    <Teleport to="body">
    <el-dialog v-model="setNameShow" :title="$t('changeUserName')" width="380px" align-center>
      <div class="simple-form">
        <el-input v-model="accountName" type="text" :placeholder="$t('username')" autocomplete="off"/>
        <el-button class="simple-btn" type="primary" @click="setName" :loading="setNameLoading">{{ $t('save') }}</el-button>
      </div>
    </el-dialog>
    </Teleport>

    <!-- 分享收件箱弹窗 -->
    <Teleport to="body">
    <el-dialog v-model="shareDialogShow" title="分享收件箱" width="380px" align-center>
      <div class="simple-form">
        <div class="share-email" v-if="sharingAccount">{{ sharingAccount.email }}</div>
        <el-input-number v-model="shareDays" :min="1" :max="365" :step="1" controls-position="right" />
        <el-input v-model="sharePassword" type="text" placeholder="分享密码，可选" autocomplete="off" />
        <div class="share-tip">链接有效期，默认 30 天，最长 365 天。填写密码后会展示在分享页邮箱旁。</div>
        <el-button class="simple-btn" type="primary" @click="confirmShareInbox" :loading="shareLoading">生成并复制链接</el-button>
      </div>
    </el-dialog>
    </Teleport>
  </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
import { nextTick, reactive, ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import {
  accountList, accountAdd, accountDelete, accountSetName,
  accountSetAllReceive, accountSetAsTop
} from "@/request/account.js";
import { domainAvailableList, accountRandom } from "@/request/domain.js";
import { shareEmail } from "@/request/share.js";
import { sleep } from "@/utils/time-utils.js";
import { isEmail } from "@/utils/verify-utils.js";
import { tzDayjs } from "@/utils/day.js";
import { useSettingStore } from "@/store/setting.js";
import { useAccountStore } from "@/store/account.js";
import { useEmailStore } from "@/store/email.js";
import { useUserStore } from "@/store/user.js";
import { hasPerm } from "@/perm/perm.js";
import { useI18n } from "vue-i18n";
import { AccountAllReceiveEnum } from "@/enums/account-enum.js";

const { t } = useI18n();
const userStore = useUserStore();
const accountStore = useAccountStore();
const settingStore = useSettingStore();
const emailStore = useEmailStore();
const isAdmin = computed(() => userStore.user?.type === 0);

// --- 列表状态 ---
const accounts = reactive([]);
const noLoading = ref(false);
const loading = ref(false);
const followLoading = ref(false);
const scrollbarRef = ref({});
const accountSearch = ref('');
let skeletonRows = ref(8);
const queryParams = { size: 30 };
let searchTimer = null;

// --- 弹窗状态 ---
const showAdd = ref(false);
const addLoading = ref(false);
const addRef = ref({});
const verifyShow = ref(false);
const botJsError = ref(false);
let turnstileId = null;
let verifyToken = '';
let verifyErrorCount = 0;

// --- 域名相关 ---
const publicDomains = ref([]);
const domainsLoading = ref(false);
const selectedDomain = ref(null);
const domainDropdownOpen = ref(false);
const domainSelectorRef = ref(null);
const useSubdomain = ref(false);
const subdomainInput = ref('');
const subdomainLevels = ref([2]);
const randomLoading = ref(false);

// --- 表单 ---
const addForm = reactive({ prefix: '', tags: '' });

// --- 重命名 ---
const setNameShow = ref(false);
const setNameLoading = ref(false);
const accountName = ref(null);
let renamingAccount = null;

// --- 分享收件箱 ---
const shareDialogShow = ref(false);
const shareLoading = ref(false);
const shareDays = ref(30);
const sharePassword = ref('');
const sharingAccount = ref(null);

// 邮件预览
const emailPreview = computed(() => {
  const prefix = addForm.prefix || '随机前缀';
  let domain = selectedDomain.value?.domain || '自动选择域名';
  if (useSubdomain.value) {
    domain = (subdomainInput.value || '随机子域') + '.' + domain;
  }
  return `${prefix}@${domain}`;
});

const createTags = computed(() => parseTagInput(addForm.tags));

// 初始化
if (hasPerm('account:query')) {
  getAccountList();
}

watch(() => accountStore.changeUserAccountName, () => {
  if (accounts[0]) accounts[0].name = accountStore.changeUserAccountName;
});

watch(() => accountStore.addEmailTrigger, () => {
  add();
});

watch(accountSearch, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(refresh, 300);
});

// 点击外部关闭域名下拉
function handleClickOutside(e) {
  if (domainSelectorRef.value && !domainSelectorRef.value.contains(e.target)) {
    domainDropdownOpen.value = false;
  }
}
onMounted(() => document.addEventListener('click', handleClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside));

// Turnstile 回调
window.onTurnstileError = (e) => {
  if (verifyErrorCount >= 4) return;
  verifyErrorCount++;
  setTimeout(() => {
    nextTick(() => {
      if (!turnstileId) {
        turnstileId = window.turnstile.render('.add-email-turnstile');
      } else {
        window.turnstile.reset(turnstileId);
      }
    });
  }, 1500);
};
window.onTurnstileSuccess = (token) => { verifyToken = token; };

// 加载当前用户可用于创建邮箱的域名
async function loadPublicDomains() {
  if (publicDomains.value.length > 0) return;
  domainsLoading.value = true;
  try {
    publicDomains.value = await domainAvailableList();
  } catch (e) {
    console.error(e);
  } finally {
    domainsLoading.value = false;
  }
}

function toggleDomainDropdown() {
  domainDropdownOpen.value = !domainDropdownOpen.value;
  if (domainDropdownOpen.value) loadPublicDomains();
}

function selectDomain(d) {
  selectedDomain.value = d;
  domainDropdownOpen.value = false;
  subdomainInput.value = '';
}

// 随机生成子域名
function randomSubdomain() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const randomLen = () => Math.floor(Math.random() * 3) + 1;
  const seg = () => Array.from({ length: randomLen() }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const levels = subdomainLevels.value.length > 0 ? [...subdomainLevels.value].sort() : [2];
  const level = levels[Math.floor(Math.random() * levels.length)];
  subdomainInput.value = Array.from({ length: level - 1 }, () => seg()).join('.');
}

// 随机生成邮箱
async function generateRandom() {
  randomLoading.value = true;
  try {
    await loadPublicDomains();
    const params = {};
    if (selectedDomain.value?.domainId) params.domainId = selectedDomain.value.domainId;
    if (useSubdomain.value && subdomainLevels.value.length > 0) {
      params.subLevels = subdomainLevels.value.join(',');
    }
    const res = await accountRandom(params);
    // 解析生成结果
    const [prefix, fullDomain] = res.email.split('@');
    addForm.prefix = prefix;
    // 找到匹配的域名（可能是子域名）
    const match = publicDomains.value.find(d =>
      fullDomain === d.domain || fullDomain.endsWith('.' + d.domain)
    );
    if (match) {
      selectedDomain.value = match;
      if (fullDomain !== match.domain) {
        // 提取子域名部分
        subdomainInput.value = fullDomain.replace('.' + match.domain, '');
      } else {
        subdomainInput.value = '';
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    randomLoading.value = false;
  }
}

// 打开添加弹窗
function add() {
  showAdd.value = true;
  addForm.prefix = '';
  addForm.tags = '';
  selectedDomain.value = null;
  subdomainInput.value = '';
  useSubdomain.value = false;
  subdomainLevels.value = [2];
  domainDropdownOpen.value = false;
  loadPublicDomains();
  setTimeout(() => addRef.value?.focus?.(), 100);
}

// 提交创建
async function submit() {
  let prefix = addForm.prefix.trim();
  let domain = '';

  if (selectedDomain.value) {
    if (useSubdomain.value && subdomainInput.value.trim()) {
      domain = subdomainInput.value.trim() + '.' + selectedDomain.value.domain;
    } else if (useSubdomain.value && !subdomainInput.value.trim()) {
      // 启用二级域名但留空，需要随机子域名
      domain = null;
    } else {
      domain = selectedDomain.value.domain;
    }
  }

  // 如果没有填前缀且没选域名，直接随机生成
  if (!prefix && !domain) {
    await generateRandom();
    prefix = addForm.prefix;
    if (useSubdomain.value && subdomainInput.value.trim()) {
      domain = subdomainInput.value.trim() + '.' + (selectedDomain.value?.domain || '');
    } else {
      domain = selectedDomain.value?.domain || null;
    }
  }

  // 启用二级域名但未指定子域名，调用 random 接口获取
  if (useSubdomain.value && !subdomainInput.value.trim() && !domain) {
    try {
      const res = await accountRandom({ domainId: selectedDomain.value?.domainId });
      const [p, d] = res.email.split('@');
      if (!prefix) prefix = p;
      domain = d;
    } catch (e) {
      console.error(e);
    }
  }

  if (!prefix) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const len = Math.floor(Math.random() * 4) + 1;
    prefix = Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  const email = prefix + '@' + (domain || (publicDomains.value[0]?.domain || settingStore.domainList[0]?.replace('@', '')));

  if (!isEmail(email)) {
    ElMessage({ message: t('notEmailMsg'), type: 'error', plain: true });
    return;
  }

  // Turnstile 验证检查
  const needVerify = settingStore.settings.addEmailVerify === 0 ||
    (settingStore.settings.addEmailVerify === 2 && settingStore.settings.addVerifyOpen);
  if (!verifyToken && needVerify) {
    if (!verifyShow.value) {
      verifyShow.value = true;
      nextTick(() => {
        try {
          turnstileId = turnstileId
            ? (window.turnstile.reset(turnstileId), turnstileId)
            : window.turnstile.render('.add-email-turnstile');
        } catch { botJsError.value = true; }
      });
    } else if (!botJsError.value) {
      ElMessage({ message: t('botVerifyMsg'), type: 'error', plain: true });
    }
    return;
  }

  addLoading.value = true;
  accountAdd(email, verifyToken, createTags.value).then(account => {
    addLoading.value = false;
    showAdd.value = false;
    addForm.prefix = '';
    addForm.tags = '';
    refresh();
    verifyToken = '';
    settingStore.settings.addVerifyOpen = account.addVerifyOpen;
    ElMessage({ message: t('addSuccessMsg'), type: 'success', plain: true });
    verifyShow.value = false;
    userStore.refreshUserInfo();
  }).catch(res => {
    if (res.code === 400) {
      verifyToken = '';
      nextTick(() => {
        try {
          turnstileId = turnstileId
            ? (window.turnstile.reset(turnstileId), turnstileId)
            : window.turnstile.render('.add-email-turnstile');
        } catch { botJsError.value = true; }
        verifyShow.value = true;
      });
    }
    addLoading.value = false;
  });
}

// 账号列表
function getAccountList() {
  if (loading.value || followLoading.value || noLoading.value) return;
  if (accounts.length === 0) { loading.value = true; }
  else { followLoading.value = true; }

  const start = Date.now();
  const lastAccount = accounts.length > 0 ? accounts.at(-1) : null;
  const accountId = lastAccount?.accountId || 0;
  const lastEmailTime = lastAccount ? (lastAccount.latestEmailTime || lastAccount.createTime) : null;
  const searchEmail = accountSearch.value.trim();

  accountList(accountId, queryParams.size, lastEmailTime, searchEmail).then(async list => {
    const duration = Date.now() - start;
    if (duration < 300) await sleep(300 - duration);
    if (list.length < queryParams.size) noLoading.value = true;
    if (accounts.length === 0) accountStore.currentAccount = list[0];
    accounts.push(...list);
    loading.value = false;
    followLoading.value = false;
  }).catch(() => {
    loading.value = false;
    followLoading.value = false;
  });
}

function refresh() {
  if (loading.value) return;
  loading.value = false;
  followLoading.value = false;
  noLoading.value = false;
  scrollbarRef.value.setScrollTop?.(0);
  accounts.splice(0, accounts.length);
  getAccountList();
}

function parseTagInput(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map(tag => String(tag || '').trim()).filter(Boolean))].slice(0, 20);
  }

  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      return parseTagInput(JSON.parse(value));
    } catch {}
  }

  return [...new Set(String(value || '')
    .split(/[,，\n]/)
    .map(tag => tag.trim())
    .filter(Boolean))]
    .slice(0, 20);
}

function accountTags(item) {
  return parseTagInput(item.tags);
}

function formatAccountCreateTime(time) {
  if (!time) return '';
  return tzDayjs(time).format('YYYY-MM-DD HH:mm');
}

function changeAccount(account) {
  accountStore.currentAccountId = account.accountId;
  accountStore.currentAccount = account;
}

function showNullSetting(item) {
  return !isAdmin.value &&
    !hasPerm('email:send') &&
    !(item.accountId !== userStore.user.account.accountId && hasPerm('account:delete'));
}

function remove(account) {
  ElMessageBox.confirm(t('delConfirm', { msg: account.email }), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    accountDelete(account.accountId).then(() => {
      const index = accounts.findIndex(i => i.accountId === account.accountId);
      accounts.splice(index, 1);
      if (accounts.length < queryParams.size) getAccountList();
      ElMessage({ message: t('delSuccessMsg'), type: 'success', plain: true });
    });
  });
}

function setAllReceive(account) {
  const prev = accounts.find(a => a.allReceive === AccountAllReceiveEnum.ENABLED);
  if (prev && prev.accountId !== account.accountId) prev.allReceive = AccountAllReceiveEnum.DISABLED;
  account.allReceive = account.allReceive === AccountAllReceiveEnum.DISABLED
    ? AccountAllReceiveEnum.ENABLED : AccountAllReceiveEnum.DISABLED;
  accountSetAllReceive(account.accountId).catch(() => {
    account.allReceive = account.allReceive === AccountAllReceiveEnum.DISABLED
      ? AccountAllReceiveEnum.ENABLED : AccountAllReceiveEnum.DISABLED;
    if (prev) prev.allReceive = AccountAllReceiveEnum.ENABLED;
  }).then(() => {
    if (account.allReceive === AccountAllReceiveEnum.ENABLED) {
      ElMessage({ message: t('setSuccess'), type: 'success', plain: true });
    }
    changeAccount(account);
    emailStore.emailScroll?.refreshList();
    emailStore.sendScroll?.refreshList();
  });
}

function openSetName(accountItem) {
  accountName.value = accountItem.name;
  renamingAccount = accountItem;
  setNameShow.value = true;
}

function setName() {
  const name = accountName.value;
  if (name === renamingAccount.name) { setNameShow.value = false; return; }
  if (!name) {
    ElMessage({ message: t('emptyUserNameMsg'), type: 'error', plain: true });
    return;
  }
  setNameLoading.value = true;
  accountSetName(renamingAccount.accountId, name).then(() => {
    renamingAccount.name = name;
    setNameShow.value = false;
    if (renamingAccount.accountId === userStore.user.account.accountId) userStore.user.name = name;
    ElMessage({ message: t('saveSuccessMsg'), type: 'success', plain: true });
  }).finally(() => { setNameLoading.value = false; });
}

function setAsTop(account, index) {
  accountSetAsTop(account.accountId).then(() => {
    ElMessage({ message: t('setSuccess'), type: 'success', plain: true });
    const [item] = accounts.splice(index, 1);
    accounts.splice(1, 0, item);
  });
}

function shareInbox(account) {
  if (!isAdmin.value) return;
  sharingAccount.value = account;
  shareDays.value = 30;
  sharePassword.value = '';
  shareDialogShow.value = true;
}

async function confirmShareInbox() {
  if (!sharingAccount.value) return;
  shareLoading.value = true;
  try {
    const expiresIn = shareDays.value * 24 * 60 * 60 * 1000;
    const data = await shareEmail(sharingAccount.value.accountId, expiresIn, sharePassword.value.trim());
    await navigator.clipboard.writeText(data.shareUrl);
    shareDialogShow.value = false;
    ElMessage({ message: `分享链接已复制，有效期 ${shareDays.value} 天`, type: 'success', plain: true });
  } catch {
    ElMessage({ message: '分享失败', type: 'error', plain: true });
  } finally {
    shareLoading.value = false;
  }
}

async function copyAccount(email) {
  try {
    await navigator.clipboard.writeText(email);
    ElMessage({ message: t('copySuccessMsg'), type: 'success', plain: true });
  } catch {
    ElMessage({ message: t('copyFailMsg'), type: 'error', plain: true });
  }
}
</script>

<style>
path[fill="#ffdda1"] { fill: #ffdd7d; }
</style>

<style scoped lang="scss">
/* ===== 容器 ===== */
.account-box {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color);
  overflow: hidden;
}

/* ===== 顶部操作栏 ===== */
.head-opt {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--el-border-color);
  flex-shrink: 0;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 6px;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  flex: 1;
  justify-content: center;
  transition: opacity 0.15s;
  &:hover { opacity: 0.88; }
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  border: 1px solid var(--el-border-color);
  transition: background 0.15s;
  &:hover { background: var(--el-fill-color-light); }
}

.account-search {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 10px 6px;
  padding: 7px 9px;
  border: 1px solid var(--el-border-color);
  border-radius: 7px;
  background: var(--el-fill-color-blank);
  flex-shrink: 0;

  input {
    min-width: 0;
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    color: var(--el-text-color-primary);
    font-size: 13px;

    &::placeholder {
      color: var(--el-text-color-placeholder);
    }
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--el-text-color-secondary);
    cursor: pointer;

    &:hover {
      background: var(--el-fill-color-light);
    }
  }
}

/* ===== 账号列表 ===== */
.scrollbar {
  flex: 1;
  overflow: hidden;
}

.account-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  margin: 4px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;

  &:hover {
    background: var(--el-fill-color-light);
    .account-item__actions { opacity: 1; }
  }

  &--active {
    background: var(--choose-account-background, var(--el-fill-color));
    .account-item__actions { opacity: 1; }
  }
}

.account-item__avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.account-item__info {
  flex: 1;
  min-width: 0;
}

.account-item__email {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--el-text-color-primary);
}

.account-item__name {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 1px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.account-item__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

.account-item__time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.account-item__tags,
.tag-hint {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.account-tag {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.4;
}

.account-item__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 5px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: var(--el-fill-color); }
  :deep(.el-dropdown__caret-button) { display: none; }
}

/* ===== 骨架屏 ===== */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.account-skeleton {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  margin: 4px 8px;
}

.skeleton-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(90deg, var(--el-fill-color) 25%, var(--el-fill-color-light) 50%, var(--el-fill-color) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  flex-shrink: 0;
}

.skeleton-info { flex: 1; }
.skeleton-line {
  height: 10px;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--el-fill-color) 25%, var(--el-fill-color-light) 50%, var(--el-fill-color) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  &--long { width: 75%; margin-bottom: 6px; }
  &--short { width: 40%; }
}

.list-footer {
  text-align: center;
  padding: 12px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 10px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

/* ===== 创建弹窗 ===== */
:deep(.create-dialog) {
  .el-dialog {
    border-radius: 14px;
    padding: 0;
    overflow: hidden;
  }
  .el-dialog__header { display: none; }
  .el-dialog__body { padding: 0; }
}

.dialog-inner {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.dialog-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.dialog-subtitle {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 3px;
}

.dialog-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: var(--el-fill-color); }
}

/* ===== 表单 ===== */
.form-section { display: flex; flex-direction: column; gap: 8px; }

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.prefix-input-wrap {
  display: flex;
  gap: 8px;
  align-items: center;
}

.form-input {
  flex: 1;
  height: 40px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-primary);
  font-size: 14px;
  transition: border-color 0.2s;
  &::placeholder { color: var(--el-text-color-placeholder); }
  &:focus { border-color: var(--el-color-primary); outline: none; }
}

.btn-random {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
  &:hover:not(:disabled) {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

/* ===== 域名选择器 ===== */
.domain-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color-blank);
  cursor: pointer;
  transition: border-color 0.2s;
  position: relative;
  &:hover { border-color: var(--el-color-primary-light-3); }

  .domain-selector__value {
    flex: 1;
    font-size: 14px;
    color: var(--el-text-color-primary);
    &.placeholder { color: var(--el-text-color-placeholder); }
  }
}

.domain-dropdown {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color-overlay);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  max-height: 200px;
  overflow-y: auto;
  margin-top: -4px;

  .domain-dropdown__loading {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .domain-dropdown__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s;
    &:hover { background: var(--el-fill-color-light); }
    &--active { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
  }

  .domain-dropdown__empty {
    padding: 16px;
    text-align: center;
    font-size: 13px;
    color: var(--el-text-color-placeholder);
  }
}


.domain-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.tag-hint {
  min-height: 18px;
}

/* ===== 子域名输入 ===== */
.subdomain-toggle {
  margin-bottom: 4px;
}

.subdomain-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;

  .form-label {
    margin-bottom: 0;
  }

  .subdomain-level-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-left: 4px;
  }

  .level-group {
    flex-shrink: 0;

    :deep(.el-checkbox-button__inner) {
      padding: 4px 8px;
      font-size: 12px;
    }
  }
}

.subdomain-section {
  margin-top: 4px;
}

.subdomain-optional {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  font-weight: 400;
}

.subdomain-input-wrap {
  display: flex;
  gap: 6px;
  align-items: center;
}

.subdomain-preview {
  font-size: 12px;
  color: var(--el-color-primary);
  margin-top: 4px;
  font-family: monospace;
}

/* ===== 邮件预览 ===== */
.email-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  font-size: 13px;
  color: var(--el-color-primary);
  font-family: monospace;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* ===== 操作按钮 ===== */
.dialog-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 8px 18px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
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

/* ===== 简单表单（重命名弹窗） ===== */
.simple-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.simple-btn { width: 100%; }

/* ===== Turnstile ===== */
.add-email-turnstile { }
.turnstile-show { opacity: 1; }
.turnstile-hide {
  opacity: 0;
  pointer-events: none;
  position: fixed;
}

/* ===== 旋转动画 ===== */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spin { animation: spin 0.8s linear infinite; }
</style>
