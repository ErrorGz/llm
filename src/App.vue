<template>
    <div class="app-container">
        <!-- 聊天页面 -->
        <ChatPage v-if="!showSettings" :selectedLLM="selectedLLM" :messageList="messageList" :isSending="isSending"
            :new-message="newMessage" :is-playing="isPlaying" :active-users="activeUsers" :llm-options="llmOptions"
            @openMenu="toggleSidebar" @toggle-playback="togglePlayback" @stop-playback="stopPlayback"
            @send-message="sendMessage" @update:new-message="newMessage = $event" @open-long-text="openLongTextEditor"
            @openPrompts="openPromptsManager" @openVoiceSettings="openVoiceSettings"
            @update:messageList="updateMessageList" @clearQueue="clearMessageQueue"
            @update:activeUsers="updateActiveUsers" @confirmLLMSelection="confirmLLMSelection"
            @updateUserStatus="updateUserStatus" />

        <!-- 侧边栏遮罩 -->
        <transition name="fade">
            <div v-if="isSidebarOpen" class="sidebar-overlay" @click="toggleSidebar"></div>
        </transition>

        <!-- 侧边栏 -->
        <transition name="slide">
            <div v-if="isSidebarOpen" class="sidebar">
                <div class="sidebar-header">
                    <span class="title">菜单</span>
                </div>
                <div class="sidebar-content">
                    <div class="menu-item">个人资料</div>
                    <div class="menu-item" @click="openSettings">设置</div>
                    <div class="menu-item">关于</div>
                </div>
            </div>
        </transition>

        <!-- 设置页面 -->
        <transition name="slide-left">
            <SettingsPage v-if="showSettings" @close="closeSettings" @clearQueue="clearMessageQueue" />
        </transition>

        <!-- 长文本编辑器 -->
        <transition name="fade">
            <LongTextEditor v-if="showLongTextEditor" :initial-text="newMessage" @submit="handleLongTextSubmit"
                @close="showLongTextEditor = false" />
        </transition>

        <!-- 提示词管理器 -->
        <transition name="fade">
            <PromptsManager v-if="showPromptsManager" @close="showPromptsManager = false"
                @select="handlePromptSelect" />
        </transition>

        <!-- 语音设置 -->
        <transition name="fade">
            <VoiceSettingsSimple v-if="showVoiceSettings" :current-settings="speechConfig"
                @close="showVoiceSettings = false" @update:settings="updateVoiceSettings" />
        </transition>

        <!-- LLM选择器 -->
        <div v-if="showLLMSelector" class="llm-selector-container">
            <select class="llm-selector" v-model="selectedLLMId" @change="confirmLLMSelection(selectedLLMId)"
                @blur="closeLLMSelector" ref="llmSelect">
                <option v-for="llm in llmOptions" :key="llm.id" :value="llm.id">
                    {{ llm.name }}
                </option>
            </select>
        </div>

        <!-- 模式切换 -->
        <div v-if="!showSettings" class="mode-switch">
            <button class="mode-button" :class="{ active: useAutogenMode }" @click="useAutogenMode = true">
                🤖 AutoGen模式
            </button>
            <button class="mode-button" :class="{ active: !useAutogenMode }" @click="useAutogenMode = false">
                💬 传统模式
            </button>
        </div>

        <!-- AutoGen仪表板 (AutoGen模式) -->
        <AutoGenDashboard v-if="useAutogenMode && !showSettings" @createTeam="showAgentManager = true" />

        <!-- 智能体团队管理器 (AutoGen模式) -->
        <AgentTeamManager v-if="useAutogenMode && !showSettings" @updateTeamOptions="loadAgentTeams"
            @teamCreated="handleTeamCreated" />

        <!-- LLM管理器 (传统模式) -->
        <LLMManager v-if="!useAutogenMode && !showSettings" @updateLLMOptions="loadLLMOptions" />

        <!-- 当前团队状态 (AutoGen模式) -->
        <div v-if="useAutogenMode && currentTeam && !showSettings" class="current-team-status">
            <h4>当前团队: {{ currentTeam.name }}</h4>
            <div class="team-agents">
                <div v-for="agent in currentTeam.agents" :key="agent.id" class="agent-status">
                    <span class="agent-avatar">{{ agent.avatar }}</span>
                    <span class="agent-name">{{ agent.name }}</span>
                    <span class="agent-state" :class="agent.status">{{ getAgentStatusText(agent.status) }}</span>
                </div>
            </div>
        </div>

        <!-- MCP工具状态 -->
        <div v-if="!showSettings" class="mcp-status">
            <h4>可用工具 (MCP)</h4>
            <div class="mcp-tools">
                <span v-for="tool in mcpTools" :key="tool.name" class="tool-badge">
                    {{ tool.name }}
                </span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, onUnmounted } from 'vue'
import SettingsPage from './components/SettingsPage.vue'
import LongTextEditor from './components/LongTextEditor.vue'
import PromptsManager from './components/PromptsManager.vue'
import ChatPage from './components/ChatPage.vue'
import LLMManager from './components/LLMManager.vue'
import AgentTeamManager from './components/AgentTeamManager.vue'
import AutoGenDashboard from './components/AutoGenDashboard.vue'
import VoiceSettingsSimple from './components/VoiceSettingsSimple.vue'
import { autogenService } from './services/autogenService.js'
import { mcpService } from './services/mcpService.js'
import './styles/common.css'

/**
 * @typedef {Object} Message
 * @property {number} id - 消息的唯一标识符
 * @property {string} content - 消息内容
 * @property {boolean} isSelf - 是否为用户自己发送的消息
 * @property {string} sender - 发送者名称
 * @property {string} avatar - 发送者头像 (emoji)
 * @property {('idle'|'listening'|'thinking'|'speaking')} status - 消息状态
 *   - idle: 空闲状态
 *   - listening: 正在听
 *   - thinking: 正在思考
 *   - speaking: 正在说话
 */

/** @type {import('vue').Ref<Message[]>} */
const messageList = ref([])

// 从本地存储加载消息记录
const loadMessages = () => {
    const savedMessages = localStorage.getItem('chatMessages')
    if (savedMessages) {
        messageList.value = JSON.parse(savedMessages)
        nextTick(() => {
            scrollToBottom()
        })
    }
}

// 保存消息到本地存储
const saveMessages = () => {
    localStorage.setItem('chatMessages', JSON.stringify(messageList.value))
}

const newMessage = ref('')
const isSidebarOpen = ref(false)
const showSettings = ref(false)
const isPlaying = ref(false)
const showLongTextEditor = ref(false)
const showPromptsManager = ref(false)
const showVoiceSettings = ref(false)
const selectedLLM = ref(null)
const showLLMSelector = ref(false)
const selectedLLMId = ref(null)
const llmOptions = ref([])
const llmSelect = ref(null)

// 添加消息发送状态
const isSending = ref(false)

// 将 currentLLM 定义为 ref
const currentLLM = ref(null)

// AutoGen相关状态
const currentTeam = ref(null)
const agentTeams = ref([])
const conversationId = ref(null)
const showAgentManager = ref(false)
const useAutogenMode = ref(true) // 是否使用AutoGen模式

// 语音模型配置（响应式）
const speechConfig = ref({
    enabled: true,
    endpoint: 'https://api.siliconflow.cn/v1/audio/speech',
    model: 'FunAudioLLM/CosyVoice2-0.5B',
    voice: 'FunAudioLLM/CosyVoice2-0.5B:diana',
    response_format: 'mp3',
    sample_rate: 44100,
    stream: true,
    speed: 1,
    gain: 0
})

// 为了向后兼容，保留SPEECH_CONFIG
const SPEECH_CONFIG = speechConfig.value

// 音频播放器
const audioPlayer = new Audio()
let currentPlayingMessage = null
const audioEvents = ref({
    onStart: null,
    onEnd: null,
    onError: null
})

/**
 * 语音播放系统架构：
 * 1. 文本分段管理
 *    - splitText: 将长文本分割成适合朗读的片段
 * 
 * 2. 语音队列管理
 *    - speechQueue: 待播放的文本队列
 *    - audioCache: 已生成语音的缓存
 * 
 * 3. 播放控制
 *    - isPlaying: 播放状态控制
 *    - currentPlayingIndex: 当前播放的片段索引
 *    - audioPlayer: 音频播放器实例
 */

// 文本分段和语音队列管理
const speechQueue = ref([])
let currentPlayingIndex = 0

// 语音缓存
const audioCache = new Map()

// 播放语音队列
const playVoiceQueue = async () => {
    // 如果已经在播放中，直接返回
    if (playVoiceQueue.isPlaying) {
        console.log('已有语音正在播放，等待中...')
        return
    }

    // 检查播放状态
    if (!isPlaying.value) {
        console.log('检测到停止播放标志，中断播放')
        return
    }

    if (!speechQueue.value.length) return

    try {
        // 标记正在播放
        playVoiceQueue.isPlaying = true

        // 生成并播放第一段
        const audioUrl = await generateNextSpeech()
        if (!audioUrl) {
            playVoiceQueue.isPlaying = false
            return
        }

        // 移除已生成的文本
        const currentText = speechQueue.value[0]
        speechQueue.value.shift()

        console.log('准备播放语音片段:', {
            当前片段: currentPlayingIndex + 1,
            剩余片段数: speechQueue.value.length,
            预生成下一段: speechQueue.value.length > 0,
            文本: currentText
        })

        // 开始播放当前音频
        if (audioPlayer.src) {
            URL.revokeObjectURL(audioPlayer.src)
        }

        // 再次检查播放状态
        if (!isPlaying.value) {
            console.log('播放前检测到停止标志，中断播放')
            playVoiceQueue.isPlaying = false
            return
        }

        audioPlayer.src = audioUrl
        await audioPlayer.play()
        // 等待当前音频播放完成
        await new Promise((resolve, reject) => {
            audioPlayer.onended = resolve
            audioPlayer.onerror = reject
        })

        // 如果队列还有内容，递归调用播放下一段
        if (speechQueue.value.length > 0) {
            playVoiceQueue.isPlaying = false
            await playVoiceQueue()
        } else {
            // 播放完成后，将对应 LLM 用户状态改为空闲
            updateUserStatus(currentLLM.value.id, "idle"); // 更新状态为 IDLE
        }
    } catch (error) {
        console.error('播放出错:', error)
    } finally {
        // 清除播放中标记
        playVoiceQueue.isPlaying = false
    }
}

// 静态属性，用于标记是否正在播放
playVoiceQueue.isPlaying = false

// 切换播放状态
const togglePlayback = async () => {
    isPlaying.value = !isPlaying.value
    // 保存播放状态到本地存储
    localStorage.setItem('isPlaying', JSON.stringify(isPlaying.value))

    // 更新最后一条 AI 消息的状态
    const lastIndex = messageList.value.length - 1
    if (lastIndex >= 0 && !messageList.value[lastIndex].isSelf) {
        const lastMessage = messageList.value[lastIndex]
        messageList.value.splice(lastIndex, 1, {
            ...lastMessage,
            status: isPlaying.value ? SENDER_STATUS.SPEAKING : SENDER_STATUS.IDLE
        })
        saveMessages()
    }
}

// 停止播放
const stopPlayback = () => {
    // 立即标记停止播放状态
    isPlaying.value = false

    // 标记播放队列处理为非活动状态
    playVoiceQueue.isPlaying = false

    // 停止当前正在播放的音频
    audioPlayer.pause()
    if (audioPlayer.src) {
        URL.revokeObjectURL(audioPlayer.src)
        audioPlayer.src = ''
    }

    // 清空待播放队列
    speechQueue.value = []
    currentPlayingIndex = 0

    // 保存播放状态到本地存储
    localStorage.setItem('isPlaying', JSON.stringify(false))

    // 更新最后一条 AI 消息的状态
    const lastIndex = messageList.value.length - 1
    if (lastIndex >= 0 && !messageList.value[lastIndex].isSelf) {
        const lastMessage = messageList.value[lastIndex]
        messageList.value.splice(lastIndex, 1, {
            ...lastMessage,
            status: SENDER_STATUS.IDLE
        })
        saveMessages()
    }

    // 如果有当前正在与用户对话的LLM，更新其状态为空闲
    if (currentLLM.value) {
        updateUserStatus(currentLLM.value.id, "idle")
    }

    console.log('语音播放已完全停止并清空')
}

// 修改音频播放结束事件监听器
audioPlayer.addEventListener('ended', async () => {
    // 如果已停止播放，不继续处理
    if (!isPlaying.value) {
        console.log('播放已停止')
        return
    }

    console.log('播放完成:', {
        audioUrl: audioPlayer.src
    })

    // 如果队列中还有内容，继续播放
    if (speechQueue.value.length > 0) {
        await playVoiceQueue()
    }
})

// 分割文本
const splitText = (text) => {
    // 先按标点符号分割
    const rawSegments = text.split(/[。！？.!?]/).filter(Boolean)
    let segments = []
    let temp = ''

    // 第一次处理：基本分段
    for (let segment of rawSegments) {
        segment = segment.trim()
        if (!segment) continue

        // 添加标点
        segment = segment + '。'

        segments.push(segment)
    }

    // 合并过短的文本段
    let i = 0
    const finalResult = []

    while (i < segments.length) {
        let currentSegment = segments[i]

        // 如果当前段落过短，尝试向后合并
        if (currentSegment.length < 24 && i < segments.length - 1) {
            let nextIndex = i + 1
            while (nextIndex < segments.length &&
                (currentSegment + segments[nextIndex]).length <= 50) {
                currentSegment += segments[nextIndex]
                nextIndex++
            }
            i = nextIndex
        } else {
            i++
        }

        finalResult.push(currentSegment)
    }

    return finalResult
}

// 准备语音队列
const prepareVoiceQueue = (text) => {
    const segments = splitText(text)
    currentPlayingIndex = 0
    speechQueue.value = segments
}

// 生成并播放语音
const generateNextSpeech = async () => {
    if (!speechQueue.value.length) return null

    const text = speechQueue.value[0]

    // 获取API密钥：优先使用currentLLM，如果没有则从当前团队或默认LLM获取
    let llm = null

    if (currentLLM.value?.id) {
        // 传统模式：从currentLLM获取
        const llmId = currentLLM.value.id.replace('llm_', '');
        llm = llmOptions.value.find(option => String(option.id) === String(llmId));
    } else if (useAutogenMode.value && currentTeam.value?.llmConfig) {
        // AutoGen模式：使用团队的LLM配置
        llm = currentTeam.value.llmConfig
    } else {
        // 备选方案：使用默认LLM
        llm = llmOptions.value.find(llm => llm.isDefault) || llmOptions.value[0]
    }

    if (!llm?.apiKey) {
        console.error('无法获取LLM配置或API密钥，无法生成语音')
        return null
    }

    // 检查缓存
    if (audioCache.has(text)) {
        console.log('使用缓存的语音:', {
            audioUrl: audioCache.get(text),
            文本: text
        })
        return audioCache.get(text)
    }

    try {
        const response = await fetch(speechConfig.value.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${llm.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: speechConfig.value.model,
                input: text,
                voice: speechConfig.value.voice,
                response_format: speechConfig.value.response_format,
                sample_rate: speechConfig.value.sample_rate,
                stream: speechConfig.value.stream,
                speed: speechConfig.value.speed,
                gain: speechConfig.value.gain
            })
        })

        if (!response.ok) throw new Error('语音生成失败')

        const blob = await response.blob()
        const audioUrl = URL.createObjectURL(blob)

        // 缓存生成的语音
        audioCache.set(text, audioUrl)

        console.log('语音生成成功:', {
            audioUrl: audioUrl,
            文本: text
        })
        return audioUrl
    } catch (error) {
        console.error('语音生成失败:', error)
        return null
    }
}

// 生成并播放语音
const generateAndPlaySpeech = async (text, callbacks = {}) => {
    try {
        // 保存回调函数
        audioEvents.value = {
            onStart: callbacks.onStart,
            onEnd: callbacks.onEnd,
            onError: callbacks.onError
        }

        // 获取API密钥：优先使用currentLLM，如果没有则从当前团队或默认LLM获取
        let apiKey = null

        if (currentLLM.value?.apiKey) {
            // 传统模式：使用currentLLM
            apiKey = currentLLM.value.apiKey
            console.log('使用传统模式LLM的API密钥')
        } else if (useAutogenMode.value && currentTeam.value?.llmConfig?.apiKey) {
            // AutoGen模式：使用团队的LLM配置
            apiKey = currentTeam.value.llmConfig.apiKey
            console.log('使用AutoGen团队LLM的API密钥')
        } else {
            // 备选方案：使用默认LLM
            const defaultLLM = llmOptions.value.find(llm => llm.isDefault) || llmOptions.value[0]
            if (defaultLLM?.apiKey) {
                apiKey = defaultLLM.apiKey
                console.log('使用默认LLM的API密钥')
            }
        }

        if (!apiKey) {
            console.error('无法获取API密钥，无法生成语音')
            audioEvents.value.onError?.('无法获取API密钥')
            return
        }

        const requestParams = {
            model: speechConfig.value.model,
            input: text,
            voice: speechConfig.value.voice,
            response_format: speechConfig.value.response_format,
            sample_rate: speechConfig.value.sample_rate,
            stream: speechConfig.value.stream,
            speed: speechConfig.value.speed,
            gain: speechConfig.value.gain
        }

        console.log('开始语音生成，文本长度:', text.length)

        const response = await fetch(speechConfig.value.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...requestParams,
                input: text.slice(0, 500)  // 限制文本长度，避免过长
            })
        })

        if (!response.ok) {
            const errorData = await response.text()
            console.error('API错误响应:', errorData)
            audioEvents.value.onError?.('语音生成失败')
            throw new Error('语音生成失败')
        }

        const blob = await response.blob()
        const audioUrl = URL.createObjectURL(blob)

        // 清理之前的音频URL
        if (audioPlayer.src) {
            URL.revokeObjectURL(audioPlayer.src)
        }

        audioPlayer.src = audioUrl
        audioEvents.value.onStart?.()
        await audioPlayer.play()
        console.log('语音播放开始')
    } catch (error) {
        console.error('语音生成或播放失败:', error)
        isPlaying.value = false
        audioEvents.value.onError?.(error.message)
    }
}

// 在文件开头的 setup 部分添加状态常量
const SENDER_STATUS = {
    IDLE: 'idle',         // 空闲状态
    THINKING: 'thinking',  // 正在思考
    SPEAKING: 'speaking'   // 正在说
}

// 在 script setup 中添加以下代码
const activeUsers = ref([
    {
        id: 'human',
        name: '我',
        avatar: '👤',
        status: SENDER_STATUS.IDLE // 默认状态为空闲
    }
])

// 添加用户管理方法
const addUser = (user) => {
    const existingUser = activeUsers.value.find(u => u.id === user.id)
    if (!existingUser) {
        activeUsers.value.push(user)
        // 保存到本地存储
        localStorage.setItem('activeUsers', JSON.stringify(activeUsers.value))
    }
}

const removeUser = (userId) => {
    const index = activeUsers.value.findIndex(u => u.id === userId)
    if (index !== -1) {
        activeUsers.value.splice(index, 1)
        // 保存到本地存储
        localStorage.setItem('activeUsers', JSON.stringify(activeUsers.value))
    }
}

// 定义 emit
const emit = defineEmits([
    'updateUserStatus',
    // 其他事件...
]);

const updateUserStatus = (userId, status) => {
    const user = activeUsers.value.find(u => String(u.id) === String(userId))
    if (user) {
        user.status = status
        // 保存到本地存储
        localStorage.setItem('activeUsers', JSON.stringify(activeUsers.value))
    }
}

// 根据 currentUser 找到下一个用户作为 currentLLM
const switchLLM = () => {
    if (!currentLLM.value) {
        const otherUsers = activeUsers.value.filter(user => user.id !== 'human');
        currentLLM.value = otherUsers.length > 0 ? otherUsers[Math.floor(Math.random() * otherUsers.length)] : null; // 随机选择一个非human的用户
    } else {
        const otherUsers = activeUsers.value.filter(user => user.id !== 'human');
        const currentIndex = otherUsers.findIndex(user => user.id === currentLLM.value.id);
        const nextIndex = (currentIndex + 1) % otherUsers.length; // 找到下一个用户的索引
        currentLLM.value = otherUsers.length > 0 ? otherUsers[nextIndex] : null; // 如果找不到用户，设置为 null
    }
}

// AutoGen模式发送消息 (支持流式推送)
const sendToAutogen = async (content) => {
    console.log('AutoGen模式发送消息:', content)
    console.log('当前团队:', currentTeam.value)
    console.log('会话ID:', conversationId.value)

    if (!currentTeam.value || !conversationId.value) {
        // 如果没有活跃团队，尝试创建默认团队
        console.log('创建默认团队...')
        await createDefaultTeam(true)
        if (!currentTeam.value) {
            alert('请先创建或选择一个智能体团队')
            return
        }
    }

    // 确保会话存在
    console.log('确保会话存在...')
    await ensureAutogenSession()
    console.log('会话验证完成，会话ID:', conversationId.value)

    try {
        // 先检查是否需要MCP工具
        const mcpResult = await mcpService.autoSelectAndExecute(content)
        if (mcpResult && mcpResult.success) {
            // 将MCP结果作为上下文信息添加到消息中
            const mcpInfo = formatMCPResult(mcpResult)
            content = `${content}\n\n[外部信息]:\n${mcpInfo}`
        }

        // 流式更新处理器
        const handleStreamUpdate = (event) => {
            // 将所有接收到的事件信息转为字符串显示到控制台，方便复制
            console.log('=== AutoGen事件信息 ===')
            console.log(JSON.stringify(event, null, 2))
            console.log('=====================')

            switch (event.type) {
                case 'agent_selected':
                    console.log(`智能体选择: ${event.agent.name} - ${event.reason}`)
                    break

                case 'agent_start':
                    console.log(`${event.agent.name} 开始回复...`)
                    // 智能体状态设为思考中
                    if (currentTeam.value) {
                        const agent = currentTeam.value.agents.find(a => a.id === event.agent.id)
                        if (agent) agent.status = 'thinking'
                    }
                    break

                case 'content_update':
                    // 实时更新消息内容
                    const conversation = event.conversation
                    console.log('=== 对话内容更新 ===')
                    console.log('最新消息:', conversation.messages[conversation.messages.length - 1]?.content || '无内容')
                    console.log('完整对话:', JSON.stringify(conversation.messages.map(m => ({
                        sender: m.senderName,
                        content: m.content,
                        isSelf: m.isSelf
                    })), null, 2))
                    console.log('==================')

                    messageList.value = []
                    conversation.messages.forEach(msg => {
                        messageList.value.push({
                            id: msg.id,
                            content: msg.content,
                            isSelf: msg.isSelf,
                            sender: msg.senderName,
                            avatar: msg.avatar,
                            status: msg.metadata?.streaming ? 'thinking' : 'idle',
                            metadata: msg.metadata
                        })
                    })

                    // 滚动到底部
                    nextTick(() => {
                        scrollToBottom()
                    })
                    break

                case 'agent_complete':
                    console.log(`${event.agent.name} 回复完成`)
                    console.log('=== 智能体完整回复 ===')
                    console.log('回复内容:', event.message?.content || '无内容')
                    console.log('智能体:', event.agent?.name || '未知')
                    console.log('==================')

                    // 智能体状态设为空闲
                    if (currentTeam.value) {
                        const agent = currentTeam.value.agents.find(a => a.id === event.agent.id)
                        if (agent) agent.status = 'idle'
                    }

                    // 如果开启了语音播放，播放完整的回复
                    if (isPlaying.value && speechConfig.value.enabled && event.message.content) {
                        generateAndPlaySpeech(event.message.content)
                    }
                    break

                case 'sequence_start':
                    console.log(`顺序模式: ${event.agent.name} (${event.index + 1}/${event.total})`)
                    break

                case 'sequence_complete':
                    console.log(`顺序模式: ${event.agent.name} 完成 (${event.index + 1}/${event.total})`)
                    break
            }
        }

        // 使用AutoGen服务发送消息（带流式更新）
        console.log('调用autogenService.sendMessage，参数:', {
            conversationId: conversationId.value,
            content,
            senderId: 'user'
        })

        const updatedConversation = await autogenService.sendMessage(
            conversationId.value,
            content,
            'user',
            handleStreamUpdate
        )

        console.log('autogenService.sendMessage返回结果:', updatedConversation)

        // 输出最终对话结果的字符串格式，方便复制
        console.log('=== 最终对话结果（可复制） ===')
        console.log('对话JSON:', JSON.stringify(updatedConversation.messages.map(m => ({
            sender: m.senderName,
            content: m.content,
            isSelf: m.isSelf,
            timestamp: m.timestamp
        })), null, 2))

        // 纯文本格式
        const textFormat = updatedConversation.messages.map(m =>
            `${m.senderName}: ${m.content}`
        ).join('\n\n')
        console.log('对话文本格式:\n' + textFormat)
        console.log('===========================')

        // 最终更新消息列表
        messageList.value = []
        updatedConversation.messages.forEach(msg => {
            messageList.value.push({
                id: msg.id,
                content: msg.content,
                isSelf: msg.isSelf,
                sender: msg.senderName,
                avatar: msg.avatar,
                status: SENDER_STATUS.IDLE,
                metadata: msg.metadata
            })
        })

        saveMessages()
        scrollToBottom()

    } catch (error) {
        console.error('AutoGen发送消息失败:', error)

        const errorMessage = {
            id: Date.now(),
            content: `[系统错误] ${error.message}`,
            isSelf: false,
            sender: '系统',
            avatar: '⚠️',
            status: SENDER_STATUS.IDLE
        }
        messageList.value.push(errorMessage)
        saveMessages()
        scrollToBottom()
    }
}

// 传统LLM模式发送消息（保留原有逻辑但简化）
const sendToLLM = async (content) => {
    if (!useAutogenMode.value) {
        // 传统模式的简化版本
        switchLLM();
        const llmId = currentLLM.value.id.replace('llm_', '');
        const llm = llmOptions.value.find(option => String(option.id) === String(llmId));

        if (!llm) {
            alert('请先选择一个 LLM');
            return;
        }

        // 检查MCP工具
        const mcpResult = await mcpService.autoSelectAndExecute(content)
        if (mcpResult && mcpResult.success) {
            const mcpInfo = formatMCPResult(mcpResult)
            content = `${content}\n\n[外部信息]:\n${mcpInfo}`
        }

        // 简化的LLM调用逻辑
        const messages = [
            { role: 'system', content: llm.systemPrompt },
            ...messageList.value.slice(-10).map(msg => ({
                role: msg.sender === '我' ? 'user' : 'assistant',
                content: msg.content
            })),
            { role: 'user', content: content }
        ];

        try {
            // 创建空的回复消息用于流式更新
            const replyMessage = {
                id: Date.now(),
                content: '',
                isSelf: false,
                sender: llm.name,
                avatar: '🤖',
                status: 'thinking'
            };
            messageList.value.push(replyMessage);
            scrollToBottom();

            const response = await fetch(llm.endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${llm.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: llm.model,
                    messages: messages,
                    stream: true // 启用流式
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const json = JSON.parse(data);
                            const content = json.choices[0]?.delta?.content || '';
                            if (content) {
                                fullContent += content;
                                replyMessage.content = fullContent;

                                // 实时滚动到底部
                                nextTick(() => {
                                    scrollToBottom();
                                });
                            }
                        } catch (e) {
                            console.error('解析流式响应失败:', e);
                        }
                    }
                }
            }

            // 流式完成，更新状态
            replyMessage.status = SENDER_STATUS.IDLE;
            saveMessages();

            if (isPlaying.value && speechConfig.value.enabled && fullContent) {
                await generateAndPlaySpeech(fullContent);
            }

        } catch (error) {
            console.error('LLM调用失败:', error);
            const errorMessage = {
                id: Date.now(),
                content: `[错误] ${error.message}`,
                isSelf: false,
                sender: '系统',
                avatar: '⚠️',
                status: SENDER_STATUS.IDLE
            };
            messageList.value.push(errorMessage);
            saveMessages();
        }
    } else {
        // 使用AutoGen模式
        await sendToAutogen(content);
    }
}

// 格式化MCP结果
const formatMCPResult = (mcpResult) => {
    const { tool, data } = mcpResult
    let formattedInfo = ''

    switch (tool) {
        case 'weather':
            formattedInfo = `天气信息 - ${data.location}: ${data.temperature}, ${data.description}, 湿度: ${data.humidity}`
            break
        case 'stock_price':
            formattedInfo = `股票信息 - ${data.symbol}: ${data.price}, 变化: ${data.change}, 成交量: ${data.volume}`
            break
        case 'news':
            formattedInfo = `新闻信息 - 共${data.articles.length}条新闻:\n${data.articles.map(article => `• ${article.title}`).join('\n')}`
            break
        case 'wikipedia':
            formattedInfo = `维基百科 - ${data.title}: ${data.summary}`
            break
        case 'web_search':
            formattedInfo = `搜索结果 - 共${data.results.length}条结果:\n${data.results.map(result => `• ${result.title}: ${result.content}`).join('\n')}`
            break
        case 'exchange_rate':
            formattedInfo = `汇率信息 - ${data.from}/${data.to}: ${data.rate}`
            break
        default:
            formattedInfo = JSON.stringify(data, null, 2)
    }

    return formattedInfo
}

// 创建默认团队
const createDefaultTeam = async (forceRecreate = false) => {
    console.log('创建默认团队，forceRecreate:', forceRecreate)

    const defaultLLM = llmOptions.value.find(llm => llm.isDefault) || llmOptions.value[0]
    if (!defaultLLM) {
        console.log('没有可用的LLM配置')
        return
    }

    console.log('使用的LLM配置:', { name: defaultLLM.name, hasEndpoint: !!defaultLLM.endpoint, hasApiKey: !!defaultLLM.apiKey })

    const teamConfig = {
        name: '默认智能体团队',
        workflowType: 'group_chat',
        agents: [
            { type: 'analyst', llmConfig: defaultLLM },
            { type: 'researcher', llmConfig: defaultLLM }
        ]
    }

    try {
        const conversation = await autogenService.createAgentTeam(teamConfig)
        const team = {
            id: Date.now(),
            name: teamConfig.name,
            workflowType: teamConfig.workflowType,
            agents: conversation.agents,
            conversationId: conversation.id,
            isDefault: true,
            llmConfig: defaultLLM
        }

        agentTeams.value.push(team)
        currentTeam.value = team
        conversationId.value = conversation.id

        // 保存到localStorage
        localStorage.setItem('agentTeamList', JSON.stringify(agentTeams.value))
        console.log('默认团队创建成功')
        console.log('团队智能体详情:', team.agents.map(a => ({ name: a.name, role: a.role, hasLLMConfig: !!a.llmConfig })))

    } catch (error) {
        console.error('创建默认团队失败:', error)
    }
}

// 加载智能体团队
const loadAgentTeams = () => {
    const savedTeams = localStorage.getItem('agentTeamList')
    if (savedTeams) {
        agentTeams.value = JSON.parse(savedTeams)
        const defaultTeam = agentTeams.value.find(team => team.isDefault)
        if (defaultTeam) {
            currentTeam.value = defaultTeam
            conversationId.value = defaultTeam.conversationId

            // 验证会话是否在AutoGen服务中存在
            if (defaultTeam.conversationId && !autogenService.getConversation(defaultTeam.conversationId)) {
                console.log('发现无效的会话ID，将在下次发送消息时重新创建')
                // 不立即清除，而是在发送消息时处理
            }
        }
    }
}

// 确保AutoGen会话同步
const ensureAutogenSession = async () => {
    if (!useAutogenMode.value || !currentTeam.value) {
        return
    }

    // 如果没有conversationId或会话不存在，重新创建
    if (!conversationId.value || !autogenService.getConversation(conversationId.value)) {
        console.log('重新同步AutoGen会话')
        try {
            const teamConfig = {
                name: currentTeam.value.name || '默认智能体团队',
                workflowType: currentTeam.value.workflowType || 'group_chat',
                agents: currentTeam.value.agents?.length > 0
                    ? currentTeam.value.agents.map(agent => ({
                        type: agent.type || agent.role || 'analyst',
                        llmConfig: currentTeam.value.llmConfig
                    }))
                    : [
                        { type: 'analyst', llmConfig: currentTeam.value.llmConfig },
                        { type: 'researcher', llmConfig: currentTeam.value.llmConfig }
                    ]
            }

            const conversation = await autogenService.createAgentTeam(teamConfig)
            conversationId.value = conversation.id
            currentTeam.value.conversationId = conversation.id

            // 更新localStorage
            const teamIndex = agentTeams.value.findIndex(team => team.id === currentTeam.value.id)
            if (teamIndex >= 0) {
                agentTeams.value[teamIndex] = currentTeam.value
                localStorage.setItem('agentTeamList', JSON.stringify(agentTeams.value))
            }

            console.log('AutoGen会话重新同步成功')
        } catch (error) {
            console.error('同步AutoGen会话失败:', error)
        }
    }
}

// 修改发送消息方法
const sendMessage = async () => {
    if (!newMessage.value.trim()) return
    if (isSending.value) return

    const content = newMessage.value
    messageList.value.push({
        id: Date.now(),
        content: content,
        isSelf: true,
        sender: '我',
        avatar: '👤',
        status: SENDER_STATUS.IDLE  // 用户消息默认为空闲状态
    })
    newMessage.value = ''
    saveMessages()

    // 发送到对话系统
    isSending.value = true
    try {
        await sendToLLM(content)
    } finally {
        isSending.value = false
    }
}

const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value
    // console.log('toggleSidebar', isSidebarOpen.value)
}

const openSettings = () => {

    showSettings.value = true
    isSidebarOpen.value = false
}

const closeSettings = () => {
    showSettings.value = false
}

const openLongTextEditor = () => {
    showLongTextEditor.value = true
}

// 修改长文本提交方法
const handleLongTextSubmit = async (text) => {
    if (!text.trim()) return;
    if (isSending.value) return;

    messageList.value.push({
        id: Date.now(),
        content: text,
        isSelf: true,
        sender: '我',
        avatar: '👤'
    });
    saveMessages();
    scrollToBottom();

    // 发送到 LLM
    isSending.value = true;
    try {
        await sendToLLM(text);
    } finally {
        isSending.value = false;
    }
}

const openPromptsManager = () => {
    showPromptsManager.value = true
}

const openVoiceSettings = () => {
    showVoiceSettings.value = true
}

const handlePromptSelect = (content) => {
    newMessage.value = content
}

// 更新语音设置
const updateVoiceSettings = (newSettings) => {
    speechConfig.value = { ...newSettings }
    // 更新SPEECH_CONFIG引用
    Object.assign(SPEECH_CONFIG, newSettings)
    console.log('语音设置已更新:', newSettings)
}

// 处理更新 activeUsers 的事件
const updateActiveUsers = (newActiveUsers) => {
    activeUsers.value = newActiveUsers;
    // 保存到本地存储
    localStorage.setItem('activeUsers', JSON.stringify(newActiveUsers));
}

// 确认选择 LLM 的方法
const confirmLLMSelection = (tempSelectedLLMId) => {
    if (tempSelectedLLMId) {
        const selectedLLM = llmOptions.value.find(llm => String(llm.id) === tempSelectedLLMId);
        if (selectedLLM) {
            const newAIUser = {
                id: `llm_${selectedLLM.id}`,
                name: selectedLLM.name,
                avatar: selectedLLM.role?.icon || '🤖',
                status: SENDER_STATUS.IDLE,
                role: selectedLLM.role
            };
            activeUsers.value.push(newAIUser);
            // 保存到本地存储
            localStorage.setItem('activeUsers', JSON.stringify(activeUsers.value));
        }
    }
}

// 从本地存储加载 LLM 列表
const loadLLMOptions = () => {
    const savedLLMs = localStorage.getItem('llmList');
    if (savedLLMs) {
        llmOptions.value = JSON.parse(savedLLMs);
    }
}

// 处理团队创建
const handleTeamCreated = (team) => {
    currentTeam.value = team
    conversationId.value = team.conversationId
    agentTeams.value.push(team)
}

// 获取智能体状态文本
const getAgentStatusText = (status) => {
    const statusMap = {
        idle: '空闲',
        thinking: '思考中',
        speaking: '发言中',
        waiting: '等待中'
    }
    return statusMap[status] || '未知'
}

// MCP工具计算属性
const mcpTools = computed(() => mcpService.getAvailableTools())

// 在组件挂载时加载消息和用户
onMounted(() => {
    loadMessages()
    loadLLMOptions() // 在这里加载 LLM 选项
    loadAgentTeams() // 加载智能体团队

    // 加载默认LLM
    const llmList = JSON.parse(localStorage.getItem('llmList') || '[]')
    const defaultLLM = llmList.find(llm => llm.isDefault)
    if (defaultLLM) {
        selectedLLM.value = defaultLLM
    }

    // 在组件挂载时加载播放状态
    const savedPlayingState = localStorage.getItem('isPlaying')
    if (savedPlayingState !== null) {
        isPlaying.value = JSON.parse(savedPlayingState)
    }

    // 在组件挂载时加载活跃用户
    const savedActiveUsers = localStorage.getItem('activeUsers')
    if (savedActiveUsers) {
        activeUsers.value = JSON.parse(savedActiveUsers)
    }

    // 加载语音设置
    const savedVoiceSettings = localStorage.getItem('voiceSettings')
    if (savedVoiceSettings) {
        const settings = JSON.parse(savedVoiceSettings)
        speechConfig.value = { ...speechConfig.value, ...settings }
        Object.assign(SPEECH_CONFIG, speechConfig.value)
    }

    // 初始化AutoGen会话
    nextTick(async () => {
        if (useAutogenMode.value && llmOptions.value.length > 0) {
            if (!currentTeam.value) {
                await createDefaultTeam()
            }
            // 确保会话正确同步
            await ensureAutogenSession()
        }
    })
})

// 滚动到底部的方法
const scrollToBottom = () => {
    nextTick(() => {
        const messageList = document.querySelector('.message-list')
        if (messageList) {
            messageList.scrollTop = messageList.scrollHeight
        }
    })
}

// 在组件卸载时清理
onUnmounted(() => {
    // 清理所有非本地用户
    activeUsers.value = activeUsers.value.filter(user => user.type === 'local')
})

// 更新消息列表的方法
const updateMessageList = (newList) => {
    messageList.value = newList
    // 保存到本地存储
    localStorage.setItem('chatMessages', JSON.stringify(newList))
}

// 清空消息队列的方法
const clearMessageQueue = () => {
    messageList.value = [] // 清空消息列表
    localStorage.removeItem('chatMessages') // 清空本地存储
    // localStorage.removeItem('activeUsers') // 清空活跃用户的本地存储
}
</script>


<style scoped>
.app-container {
    position: relative;
    height: calc(var(--vh, 1vh) * 100);
}

.nav-bar {
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

.menu-button {
    background: none;
    border: none;
    margin-right: 8px;
    cursor: pointer;
}

.menu-icon {
    display: block;
    width: 20px;
    height: 2px;
    background-color: white;
    position: relative;
}

.menu-icon::before,
.menu-icon::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 2px;
    background-color: white;
    left: 0;
}

.menu-icon::before {
    top: -6px;
}

.menu-icon::after {
    bottom: -6px;
}

.title {
    font-size: 18px;
    font-weight: 500;
    line-height: 56px;
}

.chat-container {
    height: calc(100% - 56px - 57px);
    display: flex;
    flex-direction: column;
    background-color: #f5f5f5;
    max-width: 100%;
    margin: 0;
    position: relative;
}

.message-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    -webkit-overflow-scrolling: touch;
    margin-top: 0;
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
    padding: 10px 12px;
    border-radius: 18px;
    background-color: white;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
    font-size: 15px;
    word-break: break-word;
    transition: all 0.3s ease;
}

.message-self .message-bubble {
    background-color: #95ec69;
}

.input-area {
    height: 57px;
    padding: 8px 12px;
    padding-bottom: max(env(safe-area-inset-bottom), 8px);
    background-color: #f5f5f5;
    border-top: 1px solid #e5e5e5;
    display: flex;
    gap: 8px;
    position: relative;
    width: 100%;
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

/* 动画相关样式 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
    transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
    transform: translateX(-100%);
}

/* 添加新的动画样式 */
.slide-left-enter-active,
.slide-left-leave-active {
    transition: transform 0.3s ease;
}

.slide-left-enter-from {
    transform: translateX(100%);
}

.slide-left-leave-to {
    transform: translateX(100%);
}

.play-button {
    background: none;
    border: none;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    position: relative;
}

.play-icon {
    width: 24px;
    height: 24px;
    /* 播放图标（三角形） */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M8 5v14l11-7z'/%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    transition: background-image 0.2s ease;
}

.play-button.is-playing .play-icon {
    /* 暂停图标（双竖线） */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M6 4h4v16H6zm8 0h4v16h-4z'/%3E%3C/svg%3E");
}

.play-button:active {
    opacity: 0.8;
}

.nav-llm-button {
    margin-left: auto;
    color: white;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    max-width: 140px;
    font-size: 14px;
    background: none;
    border: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.llm-icon {
    font-size: 16px;
}

.llm-name {
    overflow: hidden;
    text-overflow: ellipsis;
    color: white;
}

.llm-selector-container {
    position: fixed;
    top: 56px;
    right: 48px;
    z-index: 1000;
}

.llm-selector {
    position: relative;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ddd;
    background: white;
    font-size: 14px;
    width: 140px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    overflow-y: auto;
}

.stop-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 50%;
}

.stop-icon {
    font-size: 16px;
}

/* 适配 iOS 安全区域的媒体查询 */
@supports (padding-top: constant(safe-area-inset-top)) or (padding-top: env(safe-area-inset-top)) {
    .nav-bar {
        padding-top: constant(safe-area-inset-top);
        padding-top: env(safe-area-inset-top);
        height: calc(56px + constant(safe-area-inset-top));
        height: calc(56px + env(safe-area-inset-top));
    }

    .sidebar {
        padding-top: constant(safe-area-inset-top);
        padding-top: env(safe-area-inset-top);
    }
}

/* 模式切换样式 */
.mode-switch {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    padding: 16px;
    background-color: white;
    border-radius: 8px;
}

.mode-button {
    flex: 1;
    padding: 12px 16px;
    border: 2px solid #e5e5e5;
    border-radius: 8px;
    background-color: white;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
}

.mode-button.active {
    border-color: #07c160;
    background-color: #07c160;
    color: white;
}

.mode-button:hover:not(.active) {
    border-color: #07c160;
    color: #07c160;
}

/* 当前团队状态样式 */
.current-team-status {
    background-color: white;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    border-left: 4px solid #07c160;
}

.current-team-status h4 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: #333;
}

.team-agents {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 8px;
}

.agent-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background-color: #f9f9f9;
    border-radius: 6px;
    border: 1px solid #e5e5e5;
}

.agent-avatar {
    font-size: 16px;
}

.agent-name {
    font-size: 12px;
    font-weight: bold;
    color: #333;
    flex: 1;
}

.agent-state {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    color: white;
    font-weight: bold;
}

.agent-state.idle {
    background-color: #6c757d;
}

.agent-state.thinking {
    background-color: #ffc107;
    color: #000;
}

.agent-state.speaking {
    background-color: #28a745;
}

.agent-state.waiting {
    background-color: #17a2b8;
}

/* MCP工具状态样式 */
.mcp-status {
    background-color: white;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
}

.mcp-status h4 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: #333;
}

.mcp-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.tool-badge {
    font-size: 12px;
    color: #666;
    background-color: #e3f2fd;
    padding: 4px 8px;
    border-radius: 12px;
    border: 1px solid #bbdefb;
}
</style>
