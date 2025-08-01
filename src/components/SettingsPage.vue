<template>
    <div class="page-container">
        <div class="page-header">
            <button class="back-button" @click="$emit('close')">
                <span class="back-icon"></span>
            </button>
            <span class="title">设置</span>
        </div>

        <div class="settings-content">
            <LLMManager />
            <div class="settings-section">
                <h3>通知设置</h3>
                <div class="setting-item">
                    <span>接收新消息通知</span>
                    <label class="switch">
                        <input type="checkbox" v-model="settings.notifications">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="setting-item">
                    <span>消息提示音</span>
                    <label class="switch">
                        <input type="checkbox" v-model="settings.messageSound">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>

            <div class="settings-section">
                <h3>显示设置</h3>
                <div class="setting-item">
                    <span>深色模式</span>
                    <label class="switch">
                        <input type="checkbox" v-model="settings.darkMode">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="setting-item">
                    <span>字体大小</span>
                    <select v-model="settings.fontSize">
                        <option v-for="option in fontSizeOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                        </option>
                    </select>
                </div>
            </div>

            <div class="settings-section">
                <h3>语言设置</h3>
                <div class="setting-item">
                    <span>界面语言</span>
                    <select v-model="settings.language">
                        <option value="zh">中文</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>

            <div class="settings-section">
                <button class="clear-queue-button" @click="clearMessageQueue">清空消息队列</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import LLMManager from './LLMManager.vue'
import '../styles/common.css'

const settings = ref({
    notifications: true,
    darkMode: false,
    fontSize: 'medium',
    messageSound: true,
    language: 'zh'
})

const fontSizeOptions = [
    { label: '小', value: 'small' },
    { label: '中', value: 'medium' },
    { label: '大', value: 'large' }
]

const emit = defineEmits(['close', 'clearQueue'])

// 清空消息队列的方法
const clearMessageQueue = () => {
    // 触发父组件的清空消息队列事件
    emit('clearQueue')
}
</script>


<style scoped>
.settings-page {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: white;
    z-index: 100;
}

.settings-header {
    padding: 16px;
    background-color: #07c160;
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    position: relative;
    z-index: 1;
    height: 56px;
    box-sizing: border-box;
}

@supports (padding-top: constant(safe-area-inset-top)) or (padding-top: env(safe-area-inset-top)) {
    .settings-header {
        padding-top: constant(safe-area-inset-top);
        padding-top: env(safe-area-inset-top);
        height: calc(56px + constant(safe-area-inset-top));
        height: calc(56px + env(safe-area-inset-top));
    }
}

.back-button {
    background: none;
    border: none;
    padding: 8px;
    margin-right: 8px;
    cursor: pointer;
}

.back-icon {
    display: block;
    width: 12px;
    height: 12px;
    border-left: 2px solid white;
    border-bottom: 2px solid white;
    transform: rotate(45deg);
}

.title {
    font-size: 18px;
    font-weight: 500;
    line-height: 56px;
}

.settings-content {
    height: calc(100% - 56px);
    display: flex;
    flex-direction: column;
    background-color: #f5f5f5;
    padding: 16px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}

@supports (padding-top: constant(safe-area-inset-top)) or (padding-top: env(safe-area-inset-top)) {
    .settings-content {
        height: calc(100% - 56px - constant(safe-area-inset-top));
        height: calc(100% - 56px - env(safe-area-inset-top));
    }
}

.settings-section {
    background-color: white;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    flex-shrink: 0;
}

.settings-section h3 {
    margin: 0 0 16px 0;
    font-size: 16px;
    color: #333;
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;
}

.setting-item:last-child {
    border-bottom: none;
}

/* 开关样式 */
.switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 24px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
}

input:checked+.slider {
    background-color: #07c160;
}

input:checked+.slider:before {
    transform: translateX(20px);
}

/* 下拉框样式 */
select {
    padding: 6px 24px 6px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
    font-size: 14px;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 16px;
}

.clear-queue-button {
    background-color: #ff4d4f;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
}

.clear-queue-button:hover {
    background-color: #d43f3f;
}
</style>