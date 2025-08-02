<template>
    <div class="autogen-dashboard">
        <div class="dashboard-header">
            <h3>🤖 AutoGen 协作仪表板</h3>
            <div class="dashboard-controls">
                <button class="refresh-btn" @click="refreshData">🔄 刷新</button>
                <button class="settings-btn" @click="showSettings = !showSettings">⚙️ 配置</button>
            </div>
        </div>

        <!-- 实时状态展示 -->
        <div class="status-grid">
            <!-- 当前团队状态 -->
            <div class="status-card team-status">
                <h4>📋 当前团队</h4>
                <div v-if="props.currentTeam" class="team-info">
                    <div class="team-header">
                        <span class="team-name">{{ props.currentTeam.name }}</span>
                        <span class="team-type">{{ getWorkflowDisplayName(props.currentTeam.workflowType) }}</span>
                    </div>
                    <div class="team-agents">
                        <div v-for="agent in props.currentTeam.agents" :key="agent.id" class="agent-status">
                            <span class="agent-avatar">{{ agent.avatar }}</span>
                            <span class="agent-name">{{ agent.name }}</span>
                            <span class="agent-state" :class="agent.status">
                                <span class="status-dot" :class="agent.status"></span>
                                {{ getAgentStatusText(agent.status) }}
                            </span>
                        </div>
                    </div>
                </div>
                <div v-else class="no-team">
                    <p>暂无活跃团队</p>
                    <button class="create-team-btn" @click="$emit('createTeam')">创建团队</button>
                </div>
            </div>

            <!-- 协作进度 -->
            <div class="status-card collaboration-progress">
                <h4>🚀 协作进度</h4>
                <div v-if="props.collaborationStatus" class="progress-info">
                    <div class="collaboration-mode">
                        <span class="mode-badge" :class="props.collaborationStatus.mode">
                            {{ props.collaborationStatus.mode === 'multi' ? '🎪 多智能体协作' : '🤖 单智能体模式' }}
                        </span>
                    </div>
                    <div v-if="props.collaborationStatus.mode === 'multi'" class="multi-agent-status">
                        <div class="round-info">
                            <span class="round-badge">第 {{ props.collaborationStatus.currentRound }} / {{
                                props.collaborationStatus.totalRounds }} 轮</span>
                            <span class="speaker-info">当前发言: {{ props.collaborationStatus.currentSpeaker }}</span>
                        </div>
                        <div class="collaboration-progress-bar">
                            <div class="progress-fill" :style="{ width: props.collaborationStatus.progress + '%' }">
                            </div>
                            <span class="progress-text">{{ props.collaborationStatus.progress }}%</span>
                        </div>
                        <div class="participating-agents">
                            <div class="agents-list">
                                <div v-for="agent in props.collaborationStatus.participants" :key="agent.id"
                                    class="agent-participant"
                                    :class="{ active: agent.id === props.collaborationStatus.currentSpeakerId }">
                                    <span class="agent-avatar">{{ agent.avatar }}</span>
                                    <span class="agent-name">{{ agent.name }}</span>
                                    <span class="speaking-status"
                                        v-if="agent.id === props.collaborationStatus.currentSpeakerId">💬</span>
                                    <span class="completed-status" v-else-if="agent.hasSpoken">✓</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="single-agent-status">
                        <div class="current-agent">
                            <span class="agent-name">{{ props.collaborationStatus.currentAgent?.name || '等待选择' }}</span>
                            <span class="agent-status">{{ props.collaborationStatus.status || '准备中' }}</span>
                        </div>
                    </div>
                </div>
                <div v-else class="no-task">
                    <p>暂无协作活动</p>
                </div>
            </div>

            <!-- 智能体表现 -->
            <div class="status-card agent-performance">
                <h4>📊 智能体表现</h4>
                <div class="performance-list">
                    <div v-for="performance in agentPerformances" :key="performance.agentId" class="performance-item">
                        <div class="agent-info">
                            <span class="agent-avatar">{{ performance.avatar }}</span>
                            <span class="agent-name">{{ performance.name }}</span>
                        </div>
                        <div class="performance-metrics">
                            <div class="metric">
                                <span class="metric-label">响应次数</span>
                                <span class="metric-value">{{ performance.responseCount }}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">平均质量</span>
                                <span class="metric-value quality" :class="getQualityClass(performance.avgQuality)">
                                    {{ performance.avgQuality }}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 系统统计 -->
            <div class="status-card system-stats">
                <h4>📈 系统统计</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-value">{{ systemStats.totalTeams }}</span>
                        <span class="stat-label">团队总数</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">{{ systemStats.totalMessages }}</span>
                        <span class="stat-label">消息总数</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">{{ systemStats.todayTasks }}</span>
                        <span class="stat-label">今日任务</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">{{ systemStats.avgResponseTime }}ms</span>
                        <span class="stat-label">平均响应</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 最近活动 -->
        <div class="recent-activities">
            <h4>📝 最近活动</h4>
            <div class="activity-list">
                <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
                    <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
                    <div class="activity-content">
                        <span class="activity-icon">{{ activity.icon }}</span>
                        <span class="activity-text">{{ activity.text }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 增强功能配置 -->
        <transition name="slide-down">
            <div v-if="showSettings" class="enhancement-settings">
                <h4>⚡ 增强功能配置</h4>
                <div class="settings-grid">
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" v-model="enhancementSettings.multidimensionalThinking">
                            多维度思维框架
                        </label>
                        <p class="setting-desc">启用逻辑、创新、系统、用户、业务五维度思考</p>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" v-model="enhancementSettings.structuredResponse">
                            结构化响应模式
                        </label>
                        <p class="setting-desc">使用SCQA框架：情况-复杂性-问题-答案</p>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" v-model="enhancementSettings.qualityAssurance">
                            质量保证机制
                        </label>
                        <p class="setting-desc">自我反思、错误纠正、持续改进</p>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" v-model="enhancementSettings.collaborationOptimization">
                            协作优化技术
                        </label>
                        <p class="setting-desc">基于Manus协作理念的团队协作优化</p>
                    </div>
                </div>
                <div class="settings-actions">
                    <button class="apply-btn" @click="applyEnhancements">应用配置</button>
                    <button class="reset-btn" @click="resetEnhancements">重置默认</button>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { autogenService } from '../services/autogenService.js'

const emit = defineEmits(['createTeam'])

// 接收props
const props = defineProps({
    collaborationStatus: {
        type: Object,
        default: null
    },
    currentTeam: {
        type: Object,
        default: null
    }
})

// 响应式数据
const activeTask = ref(null)
const agentPerformances = ref([])
const systemStats = ref({
    totalTeams: 0,
    totalMessages: 0,
    todayTasks: 0,
    avgResponseTime: 0
})
const recentActivities = ref([])
const showSettings = ref(false)

// 增强功能配置
const enhancementSettings = ref({
    multidimensionalThinking: true,
    structuredResponse: true,
    qualityAssurance: true,
    collaborationOptimization: false
})

// 定时器
let refreshInterval = null

// 刷新数据
const refreshData = async () => {
    try {
        // 获取当前团队状态
        await updateCurrentTeam()

        // 获取活跃任务
        await updateActiveTask()

        // 获取智能体表现
        await updateAgentPerformances()

        // 获取系统统计
        await updateSystemStats()

        // 获取最近活动
        await updateRecentActivities()

    } catch (error) {
        console.error('刷新仪表板数据失败:', error)
    }
}

// 更新当前团队（现在从props获取，无需本地更新）
const updateCurrentTeam = async () => {
    // 当前团队信息从父组件传入，无需本地获取
    console.log('当前团队信息:', props.currentTeam)
}

// 更新活跃任务
const updateActiveTask = async () => {
    const progressTracker = autogenService.getProgressTracker()
    const activeTasks = progressTracker.getActiveTasks()

    if (activeTasks.length > 0) {
        activeTask.value = activeTasks[0] // 显示第一个活跃任务
    } else {
        activeTask.value = null
    }
}

// 更新智能体表现
const updateAgentPerformances = async () => {
    if (!props.currentTeam) {
        agentPerformances.value = []
        return
    }

    // 模拟智能体表现数据（实际项目中应该从服务获取）
    agentPerformances.value = props.currentTeam.agents.map(agent => ({
        agentId: agent.id,
        name: agent.name,
        avatar: agent.avatar,
        responseCount: Math.floor(Math.random() * 50) + 10,
        avgQuality: Math.floor(Math.random() * 30) + 70 // 70-100%
    }))
}

// 更新系统统计
const updateSystemStats = async () => {
    const savedTeams = localStorage.getItem('agentTeamList')
    const savedMessages = localStorage.getItem('chatMessages')

    const teams = savedTeams ? JSON.parse(savedTeams) : []
    const messages = savedMessages ? JSON.parse(savedMessages) : []

    // 计算今日任务（简化示例）
    const today = new Date().toDateString()
    const todayMessages = messages.filter(msg =>
        new Date(msg.id).toDateString() === today
    )

    systemStats.value = {
        totalTeams: teams.length,
        totalMessages: messages.length,
        todayTasks: Math.floor(todayMessages.length / 10), // 简化计算
        avgResponseTime: Math.floor(Math.random() * 1000) + 500 // 模拟数据
    }
}

// 更新最近活动
const updateRecentActivities = async () => {
    // 模拟最近活动数据
    const activities = [
        {
            id: 1,
            timestamp: Date.now() - 5 * 60 * 1000,
            icon: '🤖',
            text: '数据分析师完成了市场趋势分析'
        },
        {
            id: 2,
            timestamp: Date.now() - 15 * 60 * 1000,
            icon: '💻',
            text: '技术架构师提出了系统优化建议'
        },
        {
            id: 3,
            timestamp: Date.now() - 30 * 60 * 1000,
            icon: '🎨',
            text: '创意设计师完成了UI设计方案'
        },
        {
            id: 4,
            timestamp: Date.now() - 45 * 60 * 1000,
            icon: '📋',
            text: '产品经理创建了新的项目团队'
        }
    ]

    recentActivities.value = activities
}

// 工具方法
const getWorkflowDisplayName = (workflowType) => {
    const nameMap = {
        'group_chat': '群聊模式',
        'round_robin': '轮询模式',
        'sequential': '顺序模式'
    }
    return nameMap[workflowType] || workflowType
}

const getAgentStatusText = (status) => {
    const statusMap = {
        'idle': '空闲',
        'thinking': '思考中',
        'speaking': '回复中',
        'listening': '倾听中'
    }
    return statusMap[status] || '未知'
}

const getQualityClass = (quality) => {
    if (quality >= 90) return 'excellent'
    if (quality >= 80) return 'good'
    if (quality >= 70) return 'fair'
    return 'poor'
}

const formatTime = (timestamp) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`

    const days = Math.floor(hours / 24)
    return `${days}天前`
}

// 增强功能配置
const applyEnhancements = () => {
    // 保存配置到localStorage
    localStorage.setItem('autogenEnhancements', JSON.stringify(enhancementSettings.value))

    // 这里可以添加实际应用增强功能的逻辑
    console.log('应用增强功能配置:', enhancementSettings.value)

    showSettings.value = false
}

const resetEnhancements = () => {
    enhancementSettings.value = {
        multidimensionalThinking: true,
        structuredResponse: true,
        qualityAssurance: true,
        collaborationOptimization: false
    }
}

// 生命周期
onMounted(() => {
    // 加载保存的增强配置
    const savedEnhancements = localStorage.getItem('autogenEnhancements')
    if (savedEnhancements) {
        enhancementSettings.value = { ...enhancementSettings.value, ...JSON.parse(savedEnhancements) }
    }

    // 初始数据加载
    refreshData()

    // 设置定时刷新（每30秒）
    refreshInterval = setInterval(refreshData, 30000)
})

onUnmounted(() => {
    if (refreshInterval) {
        clearInterval(refreshInterval)
    }
})
</script>

<style scoped>
.autogen-dashboard {
    background-color: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #f0f0f0;
}

.dashboard-header h3 {
    margin: 0;
    font-size: 18px;
    color: #333;
    font-weight: 600;
}

.dashboard-controls {
    display: flex;
    gap: 8px;
}

.refresh-btn,
.settings-btn {
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background-color: white;
    color: #666;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.refresh-btn:hover,
.settings-btn:hover {
    background-color: #f8f9fa;
    border-color: #007bff;
    color: #007bff;
}

.status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
}

.status-card {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #dee2e6;
}

.status-card h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #495057;
    font-weight: 600;
}

.team-info .team-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.team-name {
    font-weight: 600;
    color: #333;
}

.team-type {
    background: #007bff;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px;
}

.team-agents {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.agent-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 6px;
}

.agent-name {
    flex: 1;
    font-size: 12px;
}

.agent-state {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 8px;
    font-weight: bold;
}

.agent-state.idle {
    background: #28a745;
    color: white;
}

.agent-state.thinking {
    background: #ffc107;
    color: #212529;
}

.agent-state.speaking {
    background: #17a2b8;
    color: white;
}

.agent-state.listening {
    background: #6f42c1;
    color: white;
}

.status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 4px;
}

.status-dot.idle {
    background: #fff;
    animation: none;
}

.status-dot.thinking {
    background: #212529;
    animation: pulse 1.5s infinite;
}

.status-dot.speaking {
    background: #fff;
    animation: bounce 1s infinite;
}

.status-dot.listening {
    background: #fff;
    animation: pulse 2s infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.3;
    }
}

@keyframes bounce {

    0%,
    20%,
    50%,
    80%,
    100% {
        transform: translateY(0);
    }

    40% {
        transform: translateY(-3px);
    }

    60% {
        transform: translateY(-2px);
    }
}

.no-team,
.no-task {
    text-align: center;
    color: #6c757d;
}

.create-team-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 8px;
}

.progress-bar {
    position: relative;
    height: 20px;
    background: #e9ecef;
    border-radius: 10px;
    overflow: hidden;
    margin: 8px 0;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #28a745, #20c997);
    transition: width 0.3s ease;
}

.progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 10px;
    font-weight: bold;
    color: white;
}

.performance-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.performance-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 6px;
}

.agent-info {
    display: flex;
    align-items: center;
    gap: 6px;
}

.performance-metrics {
    display: flex;
    gap: 12px;
}

.metric {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 10px;
}

.metric-value {
    font-weight: bold;
    font-size: 12px;
}

.metric-value.quality.excellent {
    color: #28a745;
}

.metric-value.quality.good {
    color: #17a2b8;
}

.metric-value.quality.fair {
    color: #ffc107;
}

.metric-value.quality.poor {
    color: #dc3545;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.stat-item {
    text-align: center;
    padding: 8px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 6px;
}

.stat-value {
    display: block;
    font-size: 16px;
    font-weight: bold;
    color: #007bff;
}

.stat-label {
    font-size: 10px;
    color: #6c757d;
}

.recent-activities {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 2px solid #f0f0f0;
}

.recent-activities h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #495057;
    font-weight: 600;
}

.activity-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.activity-item {
    display: flex;
    gap: 12px;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 6px;
    border-left: 3px solid #007bff;
}

.activity-time {
    font-size: 10px;
    color: #6c757d;
    min-width: 60px;
    padding-top: 2px;
}

.activity-content {
    display: flex;
    align-items: center;
    gap: 6px;
}

.activity-text {
    font-size: 12px;
    color: #495057;
}

.enhancement-settings {
    margin-top: 20px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #dee2e6;
}

.enhancement-settings h4 {
    margin: 0 0 16px 0;
    font-size: 14px;
    color: #495057;
    font-weight: 600;
}

.settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
}

.setting-item label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 500;
    color: #333;
}

.setting-desc {
    font-size: 10px;
    color: #6c757d;
    margin: 4px 0 0 20px;
}

.settings-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.apply-btn,
.reset-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
}

.apply-btn {
    background: #28a745;
    color: white;
}

.reset-btn {
    background: #6c757d;
    color: white;
}

.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
    transform: translateY(-10px);
    opacity: 0;
}

/* 协作状态样式 */
.collaboration-mode {
    margin-bottom: 16px;
}

.mode-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    color: white;
}

.mode-badge.multi {
    background: linear-gradient(45deg, #007bff, #28a745);
}

.mode-badge.single {
    background: #6c757d;
}

.multi-agent-status {
    margin-top: 12px;
}

.round-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.round-badge {
    background: #17a2b8;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
}

.speaker-info {
    font-size: 14px;
    color: #495057;
    font-weight: 500;
}

.collaboration-progress-bar {
    position: relative;
    background: #e9ecef;
    border-radius: 10px;
    height: 20px;
    margin-bottom: 16px;
    overflow: hidden;
}

.collaboration-progress-bar .progress-fill {
    background: linear-gradient(45deg, #007bff, #28a745);
    height: 100%;
    transition: width 0.3s ease;
}

.collaboration-progress-bar .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 12px;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.participating-agents {
    margin-top: 12px;
}

.agents-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.agent-participant {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    font-size: 13px;
    transition: all 0.2s;
}

.agent-participant.active {
    background: #e3f2fd;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.agent-participant .agent-avatar {
    font-size: 16px;
}

.agent-participant .agent-name {
    font-weight: 500;
    color: #495057;
}

.speaking-status {
    color: #28a745;
    font-weight: 600;
    animation: pulse 1.5s infinite;
}

.completed-status {
    color: #28a745;
    font-weight: 600;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

.single-agent-status .current-agent {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
}

.single-agent-status .agent-name {
    font-weight: 600;
    color: #495057;
}

.single-agent-status .agent-status {
    padding: 4px 8px;
    background: #6c757d;
    color: white;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}
</style>