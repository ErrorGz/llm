<template>
    <div class="page-container">
        <div class="page-header">
            <button class="menu-button" @click="$emit('openMenu')">
                <span class="menu-icon"></span>
            </button>
            <span class="title">聊天</span>
            <div class="header-controls">
                <button class="voice-settings-button" @click="$emit('openVoiceSettings')" title="语音设置">
                    <span class="voice-settings-icon">🎵</span>
                </button>
                <button class="play-button" @click="isPlaying ? stopPlayback() : togglePlayback()"
                    :title="isPlaying ? '停止播放' : '播放'" :class="{ 'is-playing': isPlaying }">
                    <span v-if="isPlaying" class="stop-icon">■</span>
                    <span v-else class="play-icon"></span>
                </button>
            </div>
        </div>

        <div class="chat-content">
            <div class="users-status-bar">
                <div class="users-status-scroll">
                    <div class="user-status" id="add-user-status">
                        <div class="user-avatar-wrapper">
                            <span class="user-avatar" @click="showLLMSelector = true">
                                <span class="add-icon">+</span>
                            </span>
                        </div>
                        <span class="user-name">添加</span>
                    </div>
                    <div class="user-status" v-for="user in activeUsers" :key="user.id">
                        <div class="user-avatar-wrapper" @touchstart="startPress(user.id)" @touchend="endPress"
                            @mousedown="startPress(user.id)" @mouseup="endPress" @mouseleave="endPress">
                            <span class="user-avatar">{{ user.avatar }}</span>
                            <span class="user-status-indicator" :class="user.status"></span>
                            <span v-if="showDeleteBadge[user.id]" class="delete-badge"
                                @click="deleteUser(user.id)">➖</span>
                        </div>
                        <div class="user-info">
                            <span class="user-name" :title="user.name">{{ formatName(user.name) }}</span>
                            <div v-if="user.role" class="user-role" :title="user.role.description">
                                <span class="role-icon">{{ user.role.icon }}</span>
                                <span class="role-name">{{ user.role.name }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- LLM 选择器弹出层 -->
                    <div v-if="showLLMSelector" class="llm-selector-overlay" @click.self="showLLMSelector = false">
                        <div class="llm-selector-modal">
                            <h3>选择 AI 助手</h3>
                            <div class="llm-options-list">
                                <div v-for="llm in props.llmOptions" :key="llm.id" class="llm-option-item"
                                    :class="{ 'selected': tempSelectedLLMId === String(llm.id) }"
                                    @click="tempSelectedLLMId = String(llm.id)">
                                    <div class="llm-option-header">
                                        <div class="llm-name">{{ llm.name }}</div>
                                        <div v-if="llm.role" class="llm-role-badge"
                                            :style="{ backgroundColor: llm.role.color }">
                                            {{ llm.role.icon }} {{ llm.role.name }}
                                        </div>
                                        <div v-else class="no-role-badge">未设置角色</div>
                                    </div>
                                    <div v-if="llm.role" class="llm-role-description">
                                        {{ llm.role.description }}
                                    </div>
                                    <div class="llm-model-info">模型: {{ llm.model }}</div>
                                </div>
                            </div>
                            <div class="llm-selector-buttons">
                                <button class="cancel-button" @click="showLLMSelector = false">取消</button>
                                <button class="confirm-button" @click="confirmLLMSelection">确定</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div ref="messageListRef" class="message-list">
                <div v-for="(msg, index) in messageList" :key="msg.id" class="message-item"
                    :class="{ 'message-self': msg.isSelf }">
                    <!-- 只在新发送者或首条消息时显示发送者信息 -->
                    <div v-if="index === 0 || messageList[index - 1].sender !== msg.sender" class="sender-info"
                        :class="{ 'sender-info-self': msg.isSelf }">
                        <span class="sender-avatar">{{ msg.avatar }}</span>
                        <span class="sender-name">{{ msg.sender }}</span>
                        <span v-if="msg.status && msg.status !== 'idle'" class="message-status" :class="msg.status">
                            <span class="status-dot" :class="msg.status"></span>
                            {{ getStatusText(msg.status) }}
                        </span>
                    </div>
                    <div class="message-bubble"
                        :style="{ transform: `translateX(${msg.showDelete ? `-${deleteButtonWidth}px` : '0'})` }"
                        @touchstart="startSwipe($event, index)" @touchend="endSwipe(index)">
                        <span>{{ msg.content }}</span>
                        <button v-if="msg.showDelete" class="delete-button" @click="deleteMessage(index)">删除</button>
                    </div>
                </div>

                <!-- 可选：添加新消息提示 -->
                <div v-if="!shouldAutoScroll" class="new-message-hint"
                    @click="shouldAutoScroll = true; scrollToBottom()">
                    <span class="hint-icon">↓</span>
                    <span class="hint-text">新消息</span>
                </div>
            </div>
        </div>

        <div class="input-area">
            <div class="input-wrapper">
                <input :value="newMessage" @input="emit('update:newMessage', $event.target.value)" type="text"
                    placeholder="请输入消息..." @click="emit('openLongText')" readonly>
                <button class="prompts-button" @click="emit('openPrompts')">
                    <span class="prompts-icon"></span>
                </button>
            </div>
            <button class="send-button" @click="emit('sendMessage')" :disabled="isSending">
                {{ isSending ? '发送中...' : '发送' }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import '../styles/common.css'

// 定义属性
const props = defineProps({
    selectedLLM: Object,
    messageList: Array,
    isSending: Boolean,
    newMessage: String,
    isPlaying: Boolean,
    activeUsers: Array, // 确保 activeUsers 是一个数组
    llmOptions: Array // 接收 llmOptions 作为属性
})

// 定义事件
const emit = defineEmits([
    'openMenu',
    'togglePlayback',
    'stop-playback',
    'sendMessage',
    'update:newMessage',
    'openLongText',
    'openPrompts',
    'update:messageList',
    'clearQueue',
    'update:activeUsers',
    'confirmLLMSelection',
    'updateUserStatus'
])

// 状态定义
const SENDER_STATUS = {
    IDLE: 'idle',         // 空闲状态
    THINKING: 'thinking', // 正在思考
    SPEAKING: 'speaking', // 正在说话
    ERROR: 'error'        // 错误状态
}

const tempSelectedLLMId = ref('') // 选择的 LLM ID
const showLLMSelector = ref(false) // LLM 选择器的状态

// 选择 LLM 的方法
const handleLocalLLMSelect = (event) => {
    tempSelectedLLMId.value = event.target.value
}

// 确认选择方法
const confirmLLMSelection = () => {
    if (tempSelectedLLMId.value) {
        emit('confirmLLMSelection', tempSelectedLLMId.value); // 触发事件，将选择的 LLM ID 传递给 App.vue
        showLLMSelector.value = false; // 关闭选择器
    }
}



// 添加名称格式化方法
const formatName = (name) => {
    if (!name) return ''
    if (name.length <= 8) return name // 如果名称较短则完整显示

    // 提取前三个字符和后三个字符
    const start = name.slice(0, 3)
    const end = name.slice(-3)
    return `${start}...${end}`
}

// 添加自动滚动控制
const messageListRef = ref(null)  // 消息列表的引用
const shouldAutoScroll = ref(true)  // 是否自动滚动的状态
let isUserScrolling = false  // 用户是否正在滚动的标记

// 监听滚动事件
const handleScroll = () => {
    if (!messageListRef.value || isUserScrolling) return

    const element = messageListRef.value
    const { scrollTop, scrollHeight, clientHeight } = element
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10

    // 只有用户主动滚动时才改变自动滚动状态
    shouldAutoScroll.value = isAtBottom
}

// 滚动到底部的方法
const scrollToBottom = () => {
    if (!shouldAutoScroll.value) {
        // 如果不是自动滚动状态，显示新消息提示
        // TODO: 可以在这里添加新消息提示
        return
    }

    if (messageListRef.value) {
        isUserScrolling = true  // 标记为程序滚动
        messageListRef.value.scrollTop = messageListRef.value.scrollHeight
        // 给一个短暂的延时，避免触发滚动事件处理
        setTimeout(() => {
            isUserScrolling = false
        }, 100)
    }
}

// 监听滚动事件
onMounted(() => {
    messageListRef.value?.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
    messageListRef.value?.removeEventListener('scroll', handleScroll)
})

// 监听消息列表变化
watch(() => props.messageList, () => {
    nextTick(() => {
        scrollToBottom()
    })
}, { deep: true })

// 删除按钮的宽度
const deleteButtonWidth = 80; // 根据实际按钮宽度设置

// 删除消息
const deleteMessage = (index) => {
    const newMessageList = props.messageList.filter((_, i) => i !== index)
    emit('update:messageList', newMessageList.map(msg => {
        // 移除 showDelete 属性
        const { showDelete, ...rest } = msg
        return rest
    }))
}

// 处理滑动手势
const startSwipe = (event, index) => {
    const touchStartX = event.touches[0].clientX
    const messageBubble = event.currentTarget

    const handleTouchMove = (moveEvent) => {
        const touchMoveX = moveEvent.touches[0].clientX
        const deltaX = touchStartX - touchMoveX

        // 如果滑动超过删除按钮的宽度，显示删除按钮
        if (deltaX > deleteButtonWidth) {
            const newMessageList = [...props.messageList]
            newMessageList[index].showDelete = true
            emit('update:messageList', newMessageList)
        } else {
            const newMessageList = [...props.messageList]
            newMessageList[index].showDelete = false
            emit('update:messageList', newMessageList)
        }
    }

    const handleTouchEnd = () => {
        messageBubble.removeEventListener('touchmove', handleTouchMove)
        messageBubble.removeEventListener('touchend', handleTouchEnd)
    }

    messageBubble.addEventListener('touchmove', handleTouchMove)
    messageBubble.addEventListener('touchend', handleTouchEnd)
}

const endSwipe = (index) => {
    // 处理滑动手势结束后的逻辑
}

// 切换播放状态
const togglePlayback = async () => {
    emit('togglePlayback')
}

// 监听更新用户状态的事件
const updateUserStatusHandler = (userId, status) => {
    const user = props.activeUsers.find(u => String(u.id) === String(userId)) // 确保比较时都是字符串
    if (user) {
        user.status = status
        if (status === SENDER_STATUS.ERROR) {
            // 处理错误状态的逻辑
        }
    }
}

// 监听事件
watch(() => props.activeUsers, (newActiveUsers) => {
    newActiveUsers.forEach(user => {
        updateUserStatusHandler(user.id, user.status)
    })
}, { deep: true })

// 停止播放
const stopPlayback = () => {
    emit('stop-playback')
}

// 获取状态文本
const getStatusText = (status) => {
    const statusMap = {
        'thinking': '思考中...',
        'speaking': '回复中...',
        'listening': '听取中...',
        'idle': '空闲'
    }
    return statusMap[status] || status
}

// 长按计时器
const pressTimer = ref(null)
const showDeleteBadge = ref({})

// 开始长按
const startPress = (userId) => {
    if (userId === 'human' || userId === 'add-user-status') return
    pressTimer.value = setTimeout(() => {
        showDeleteBadge.value[userId] = true
    }, 500) // 500ms 长按触发
}

// 结束长按
const endPress = () => {
    clearTimeout(pressTimer.value)
}

// 删除用户
const deleteUser = (userId) => {
    if (userId === 'human' || userId === 'add-user-status') return
    const updatedUsers = props.activeUsers.filter(user => user.id !== userId)
    emit('update:activeUsers', updatedUsers)
    showDeleteBadge.value[userId] = false
}
</script>

<style scoped>
.page-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.chat-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #f5f5f5;
    overflow: hidden;
    position: relative;
    height: calc(100% - 56px - 57px);
}

.users-status-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    background-color: #f8f9fa;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
}

.users-status-scroll {
    display: flex;
    gap: 12px;
    padding: 0 12px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    -webkit-overflow-scrolling: touch;
}

.users-status-scroll::-webkit-scrollbar {
    display: none;
}

.user-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    width: 70px;
    position: relative;
}

.user-avatar-wrapper {
    position: relative;
    width: 48px;
    height: 48px;
}

.user-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
}

.user-status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
}

.user-status-indicator.idle {
    background-color: #c7c7c7;
    /* 绿色，表示空闲 */
}

.user-status-indicator.thinking {
    background-color: #ffee00;
    /* 橙色，表示思考中 */
}

.user-status-indicator.speaking {
    background-color: #72ff20;
    /* 蓝色，表示正在说话 */
}

.user-status-indicator.error {
    background-color: #a10000;
    /* 红色，表示错误状态 */
}

.user-name {
    font-size: 12px;
    color: #666;
    text-align: center;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.message-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    padding-top: 80px;
    -webkit-overflow-scrolling: touch;
}

.message-item {
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    position: relative;
}

.message-self {
    align-items: flex-end;
}

.sender-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
    padding: 0 12px;
}

.sender-info-self {
    flex-direction: row-reverse;
}

.sender-avatar {
    font-size: 20px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.sender-name {
    font-size: 13px;
    color: #666;
}

.message-bubble {
    max-width: 70%;
    min-width: 100px;
    padding: 10px 12px;
    border-radius: 18px;
    background-color: white;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
    font-size: 15px;
    word-break: break-word;
    transition: transform 0.3s ease;
    position: relative;
}

.message-self .message-bubble {
    background-color: #95ec69;
}

.input-area {
    padding: 8px 12px;
    padding-bottom: max(env(safe-area-inset-bottom), 8px);
    background-color: #f5f5f5;
    border-top: 1px solid #e5e5e5;
    display: flex;
    gap: 8px;
    box-sizing: border-box;
}

.input-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    background: white;
    border: 1px solid #e5e5e5;
    border-radius: 20px;
    padding-right: 8px;
    min-width: 0;
}

input {
    flex: 1;
    padding: 8px 12px;
    border: none;
    outline: none;
    font-size: 15px;
    background: transparent;
    -webkit-appearance: none;
    width: 0;
    min-width: 0;
}

.prompts-button {
    background: none;
    border: none;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
}

.prompts-icon {
    width: 20px;
    height: 20px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'%3E%3C/path%3E%3Cline x1='9' y1='10' x2='15' y2='10'%3E%3C/line%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
}

.send-button {
    padding: 8px 16px;
    background-color: #07c160;
    color: white;
    border: none;
    border-radius: 20px;
    font-size: 15px;
    white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
    opacity: 1;
    transition: opacity 0.2s;
}

.send-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.new-message-hint {
    position: absolute;
    bottom: 70px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    z-index: 10;
    animation: fadeIn 0.3s ease;
}

.hint-icon {
    font-size: 16px;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translate(-50%, 10px);
    }

    to {
        opacity: 1;
        transform: translate(-50%, 0);
    }
}

/* 添加 LLM 选择器弹出层样式 */
.llm-selector-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.llm-selector-modal {
    background: white;
    border-radius: 12px;
    padding: 20px;
    width: 90%;
    max-width: 320px;
}

.llm-selector-modal h3 {
    margin: 0 0 16px 0;
    font-size: 18px;
    color: #333;
    text-align: center;
}

.llm-selector {
    width: 100%;
    padding: 8px 32px 8px 12px;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    background-color: white;
    font-size: 16px;
    color: #333;
    margin-bottom: 20px;
}

.llm-selector-buttons {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.cancel-button,
.confirm-button {
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 14px;
    border: none;
}

.cancel-button {
    background-color: #f5f5f5;
    color: #666;
}

.confirm-button {
    background-color: #07c160;
    color: white;
}

.add-user-button {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: #e0e0e0;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    font-size: 24px;
    transition: background-color 0.2s;
}

.add-user-button:active {
    background-color: #d0d0d0;
}

.delete-button {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background-color: red;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 5px 10px;
    cursor: pointer;
}

.play-button.is-playing .play-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M6 4h4v16H6zm8 0h4v16h-4z'/%3E%3C/svg%3E");
}

.stop-button {
    background: #ff4c4c;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    margin-left: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    font-size: 12px;
}

.stop-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 12px;
}

.play-button:active {
    opacity: 0.8;
}

.header-controls {
    display: flex;
    gap: 8px;
    align-items: center;
}

.voice-settings-button {
    background: none;
    border: none;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    cursor: pointer;
    border-radius: 50%;
    transition: background-color 0.2s;
}

.voice-settings-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.voice-settings-icon {
    font-size: 18px;
}

.delete-badge {
    position: absolute;
    top: 0px;
    right: -5px;
    width: 20px;
    height: 20px;
    background-color: #ff4444;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 16px;
    animation: shake 0.5s infinite;
    z-index: 2;
    cursor: pointer;
}

@keyframes shake {

    0%,
    100% {
        transform: rotate(0deg);
    }

    25% {
        transform: rotate(-15deg);
    }

    75% {
        transform: rotate(15deg);
    }
}

/* 消息状态样式 */
.message-status {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 8px;
    margin-left: 8px;
    display: inline-flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.1);
}

.message-status.thinking {
    background: rgba(255, 193, 7, 0.2);
    color: #856404;
}

.message-status.speaking {
    background: rgba(23, 162, 184, 0.2);
    color: #0c5460;
}

.message-status.listening {
    background: rgba(111, 66, 193, 0.2);
    color: #4a237a;
}

.status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 4px;
}

.status-dot.thinking {
    background: #ffc107;
    animation: message-status-pulse 1.5s infinite;
}

.status-dot.speaking {
    background: #17a2b8;
    animation: message-status-bounce 1s infinite;
}

.status-dot.listening {
    background: #6f42c1;
    animation: message-status-pulse 2s infinite;
}

@keyframes message-status-pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.3;
    }
}

@keyframes message-status-bounce {

    0%,
    20%,
    50%,
    80%,
    100% {
        transform: translateY(0);
    }

    40% {
        transform: translateY(-2px);
    }

    60% {
        transform: translateY(-1px);
    }
}

/* 用户信息样式 */
.user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 0;
}

.user-role {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-top: 2px;
    padding: 1px 4px;
    background: rgba(64, 158, 255, 0.1);
    border-radius: 8px;
    font-size: 10px;
    color: #409eff;
    max-width: 100%;
}

.user-role .role-icon {
    font-size: 10px;
}

.user-role .role-name {
    font-size: 9px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 40px;
}

/* LLM选择器样式增强 */
.llm-options-list {
    max-height: 300px;
    overflow-y: auto;
    margin: 15px 0;
}

.llm-option-item {
    padding: 12px;
    border: 2px solid #ebeef5;
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.3s;
}

.llm-option-item:hover {
    border-color: #409eff;
    background: #f8f9fa;
}

.llm-option-item.selected {
    border-color: #409eff;
    background: #e6f7ff;
}

.llm-option-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 5px;
}

.llm-name {
    font-weight: 600;
    color: #303133;
    flex: 1;
}

.llm-role-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    border-radius: 10px;
    color: #fff;
    font-size: 11px;
    font-weight: 500;
}

.no-role-badge {
    color: #909399;
    font-size: 11px;
    font-style: italic;
}

.llm-role-description {
    font-size: 12px;
    color: #606266;
    margin-bottom: 5px;
    line-height: 1.3;
}

.llm-model-info {
    font-size: 11px;
    color: #909399;
}
</style>