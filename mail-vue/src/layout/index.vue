<template>
  <el-container class="layout">
    <!-- Aside -->
    <el-aside
      class="aside"
      :class="[
        uiStore.asideShow ? 'aside-show' : 'el-aside-hide',
        uiStore.asideCollapsed ? 'aside-collapsed' : ''
      ]"
      :width="(uiStore.asideCollapsed ? 64 : uiStore.asideWidth) + 'px'"
    >
      <Aside />
    </el-aside>

    <!-- Aside resize handle -->
    <div
      v-if="uiStore.asideShow && !uiStore.asideCollapsed && !isMobile"
      class="resize-handle resize-aside"
      @mousedown="startResize('aside', $event)"
    ></div>

    <div
      :class="(uiStore.asideShow && isMobile)? 'overlay-show':'overlay-hide'"
      @click="uiStore.asideShow = false"
    ></div>

    <el-container class="main-container">
      <el-main>
        <el-header>
          <Header />
        </el-header>
        <Main />
      </el-main>
    </el-container>
  </el-container>
  <writer ref="writerRef" />
</template>

<script setup>
import Aside from '@/layout/aside/index.vue'
import Header from '@/layout/header/index.vue'
import Main from '@/layout/main/index.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useUiStore } from "@/store/ui.js";
import writer from '@/layout/write/index.vue'

const uiStore = useUiStore();
const writerRef = ref({})
const isMobile = ref(window.innerWidth < 1025)

const handleResize = () => {
  isMobile.value = window.innerWidth < 1025
  uiStore.asideShow = window.innerWidth > 1024
}

// ── Drag resize ──
let resizeTarget = null
let startX = 0
let startWidth = 0

function startResize(target, e) {
  e.preventDefault()
  resizeTarget = target
  startX = e.clientX
  startWidth = target === 'aside' ? uiStore.asideWidth : uiStore.accountWidth
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function onResize(e) {
  if (!resizeTarget) return
  const diff = e.clientX - startX
  if (resizeTarget === 'aside') {
    uiStore.asideWidth = Math.max(180, Math.min(400, startWidth + diff))
  } else {
    uiStore.accountWidth = Math.max(180, Math.min(400, startWidth + diff))
  }
}

function stopResize() {
  resizeTarget = null
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

onMounted(() => {
  uiStore.writerRef = writerRef
  window.addEventListener('resize', handleResize)
  handleResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  stopResize()
})
</script>

<style lang="scss" scoped>
.el-aside-hide {
  position: fixed;
  left: 0;
  height: 100%;
  z-index: 100;
  transform: translateX(-100%);
  transition: transform 100ms ease;
}

.aside-show {
  box-shadow: var(--aside-right-border);
  transform: translateX(0);
  transition: width 150ms ease;
  z-index: 101;
  @media (max-width: 1025px) {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 101;
    height: 100%;
    background: var(--el-bg-color);
  }
}

.aside-collapsed {
  width: 64px !important;
}

.el-aside {
  width: auto;
  overflow: hidden;
}

.layout {
  height: 100%;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
}

.main-container {
  min-height: 100%;
  background: var(--el-bg-color);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  flex: 1;
  min-width: 0;
}

.el-main {
  padding: 0;
}

.el-header {
  background: var(--el-bg-color);
  border-bottom: solid 1px var(--el-border-color);
  padding: 0 0 0 0;
}

.overlay-show {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 99;
  transition: all 0.3s;
}

.overlay-hide {
  display: flex;
  pointer-events: none;
  opacity: 0;
}

/* Resize handles */
.resize-handle {
  width: 4px;
  cursor: col-resize;
  background: transparent;
  flex-shrink: 0;
  z-index: 50;
  transition: background 0.15s;
  &:hover {
    background: var(--el-color-primary-light-5);
  }
}
</style>
