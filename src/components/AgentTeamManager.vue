<template>
    <div class="agent-team-manager">
        <div class="section-header">
            <h3>智能体团队管理</h3>
            <div class="header-buttons">
                <button class="clear-button" @click="clearAllTeams">清空列表</button>
                <button class="reset-button" @click="resetToDefault">重置默认配置</button>
            </div>
        </div>

        <!-- 工作流模板选择 -->
        <transition name="slide-down">
            <div v-if="showTemplateSelector" class="template-selector">
                <h4>选择工作流模板</h4>
                <div class="template-grid">
                    <div 
                        v-for="template in workflowTemplates" 
                        :key="template.id"
                        class="template-card"
                        @click="selectTemplate(template)"
                    >
                        <div class="template-header">
                            <span class="template-icon">{{ template.icon }}</span>
                            <h5>{{ template.name }}</h5>
                        </div>
                        <p class="template-description">{{ template.description }}</p>
                        <div class="template-info">
                            <span class="template-time">⏱ {{ template.estimatedTime }}</span>
                            <div class="template-tags">
                                <span v-for="tag in template.tags" :key="tag" class="tag">{{ tag }}</span>
                            </div>
                        </div>
                        <div class="template-agents">
                            <span v-for="agent in template.agents" :key="agent.type" class="agent-mini">
                                {{ getAgentAvatar(agent.type) }}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="template-actions">
                    <button class="cancel-btn" @click="showTemplateSelector = false">取消</button>
                    <button class="custom-btn" @click="showCustomForm">自定义团队</button>
                </div>
            </div>
        </transition>

        <!-- 添加新团队表单 -->
        <transition name="slide-down">
            <div v-if="showAddForm" class="add-team-form">
                <h4>{{ selectedTemplate ? `基于模板：${selectedTemplate.name}` : '创建智能体团队' }}</h4>
                
                <input v-model="newTeam.name" placeholder="团队名称" type="text">
                
                <select v-model="newTeam.workflowType" class="workflow-selector">
                    <option value="group_chat">群聊模式 - 智能选择最适合的智能体</option>
                    <option value="round_robin">轮询模式 - 智能体依次发言</option>
                    <option value="sequential">顺序模式 - 智能体按序处理</option>
                </select>
                
                <!-- 模板工作流预览 -->
                <div v-if="selectedTemplate" class="template-workflow">
                    <h5>工作流程</h5>
                    <div class="workflow-steps">
                        <div v-for="(step, index) in selectedTemplate.workflow" :key="index" class="workflow-step">
                            <span class="step-number">{{ index + 1 }}</span>
                            <span class="step-info">
                                <strong>{{ step.description }}</strong>
                                <span class="step-agent">{{ getAgentName(step.agent) }}</span>
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- 智能体选择 -->
                <div class="agent-selection">
                    <div class="selection-header">
                        <h5>选择智能体</h5>
                        <div class="quality-filter">
                            <label>
                                <input type="checkbox" v-model="showPremiumOnly">
                                仅显示增强版智能体 ⭐
                            </label>
                        </div>
                    </div>
                    
                    <!-- 增强版智能体（优先显示） -->
                    <div v-if="enhancedAgents.length > 0" class="enhanced-agents-section">
                        <h6 class="section-title">🚀 增强版智能体 (基于v0/Cursor/Manus)</h6>
                        <div class="agent-grid enhanced">
                            <label v-for="(template, key) in enhancedAgents" :key="key" class="agent-card-checkbox enhanced">
                                <input 
                                    type="checkbox" 
                                    :value="key" 
                                    v-model="newTeam.selectedAgents"
                                >
                                <div class="agent-card" :class="{ selected: newTeam.selectedAgents.includes(key) }">
                                    <div class="agent-header">
                                        <span class="agent-avatar">{{ template.avatar }}</span>
                                        <span class="agent-name">{{ template.name }}</span>
                                        <span class="quality-badge premium">⭐ 增强版</span>
                                    </div>
                                    <div class="agent-source">
                                        <span class="source-tag">{{ getSourceTag(template.source || template.id) }}</span>
                                    </div>
                                    <div class="agent-capabilities">
                                        <span v-for="capability in template.capabilities.slice(0, 4)" :key="capability" class="capability-tag enhanced">
                                            {{ formatCapability(capability) }}
                                        </span>
                                        <span v-if="template.capabilities.length > 4" class="capability-more">+{{ template.capabilities.length - 4 }}</span>
                                    </div>
                                    <p class="agent-description">{{ getAgentDescription(template) }}</p>
                                    <div class="enhancement-tags" v-if="template.enhancements">
                                        <span v-for="enhancement in template.enhancements" :key="enhancement" class="enhancement-tag">
                                            {{ getEnhancementName(enhancement) }}
                                        </span>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- 标准智能体 -->
                    <div v-if="!showPremiumOnly && standardAgents.length > 0" class="standard-agents-section">
                        <h6 class="section-title">🤖 标准智能体</h6>
                        <div class="agent-grid">
                            <label v-for="(template, key) in standardAgents" :key="key" class="agent-card-checkbox">
                                <input 
                                    type="checkbox" 
                                    :value="key" 
                                    v-model="newTeam.selectedAgents"
                                >
                                <div class="agent-card" :class="{ selected: newTeam.selectedAgents.includes(key) }">
                                    <div class="agent-header">
                                        <span class="agent-avatar">{{ template.avatar }}</span>
                                        <span class="agent-name">{{ template.name }}</span>
                                    </div>
                                    <div class="agent-capabilities">
                                        <span v-for="capability in template.capabilities" :key="capability" class="capability-tag">
                                            {{ formatCapability(capability) }}
                                        </span>
                                    </div>
                                    <p class="agent-description">{{ getAgentDescription(template) }}</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- LLM配置选择 -->
                <div class="llm-selection">
                    <h5>选择LLM配置</h5>
                    <select v-model="newTeam.selectedLLMId" class="llm-selector">
                        <option value="">选择LLM配置</option>
                        <option v-for="llm in llmOptions" :key="llm.id" :value="llm.id">
                            {{ llm.name }}
                        </option>
                    </select>
                </div>

                <div class="form-buttons">
                    <button class="cancel-btn" @click="cancelForm">取消</button>
                    <button class="confirm-btn" @click="createTeam">创建团队</button>
                </div>
            </div>
        </transition>

        <!-- 团队列表 -->
        <div v-if="teamList.length > 0" class="team-list">
            <div v-for="team in teamList" :key="team.id" class="team-item">
                <div class="team-header" @click="toggleExpand(team.id)">
                    <div class="team-info">
                        <span class="team-name">{{ team.name }}</span>
                        <span class="team-workflow">{{ getWorkflowDisplayName(team.workflowType) }}</span>
                        <span class="team-agent-count">{{ team.agents.length }}个智能体</span>
                    </div>
                    <div class="team-actions">
                        <button 
                            class="default-btn" 
                            :class="{ active: team.isDefault }"
                            @click.stop="setDefault(team)"
                        >
                            {{ team.isDefault ? '默认' : '设为默认' }}
                        </button>
                        <button class="edit-btn" @click.stop="startEdit(team)">编辑</button>
                        <button class="delete-btn" @click.stop="confirmDelete(team)">删除</button>
                        <span class="expand-icon" :class="{ expanded: expandedItems.has(team.id) }">▼</span>
                    </div>
                </div>

                <!-- 团队详情 -->
                <div v-if="expandedItems.has(team.id)" class="team-details">
                    <div class="agents-info">
                        <h6>团队成员:</h6>
                        <div class="agent-cards">
                            <div v-for="agent in team.agents" :key="agent.id" class="agent-card">
                                <span class="agent-avatar">{{ agent.avatar }}</span>
                                <div class="agent-details">
                                    <span class="agent-name">{{ agent.name }}</span>
                                    <span class="agent-capabilities">{{ agent.capabilities.join(', ') }}</span>
                                </div>
                                <span class="agent-status" :class="agent.status">{{ getStatusText(agent.status) }}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="workflow-info">
                        <h6>工作流程:</h6>
                        <p>{{ getWorkflowDescription(team.workflowType) }}</p>
                    </div>

                    <div class="mcp-tools">
                        <h6>可用工具:</h6>
                        <div class="tool-list">
                            <span v-for="tool in availableTools" :key="tool.name" class="tool-tag">
                                {{ tool.name }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="empty-state">
            暂无智能体团队，点击下方按钮创建
        </div>

        <button class="add-button" @click="showTemplateSelector = !showTemplateSelector">
            {{ showTemplateSelector ? '取消' : '创建智能体团队' }}
        </button>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { autogenService } from '../services/autogenService.js'
import { mcpService } from '../services/mcpService.js'
import { promptService } from '../services/promptService.js'

const emit = defineEmits(['updateTeamOptions', 'teamCreated'])

const teamList = ref([])
const llmOptions = ref([])
const showAddForm = ref(false)
const showTemplateSelector = ref(false)
const selectedTemplate = ref(null)
const expandedItems = ref(new Set())

const newTeam = ref({
    name: '',
    workflowType: 'group_chat',
    selectedAgents: [],
    selectedLLMId: ''
})

// 增强版智能体相关状态
const showPremiumOnly = ref(false)

// 智能体模板
const agentTemplates = computed(() => autogenService.getDefaultAgentTemplates())

// 增强版智能体（来自提示词库）
const enhancedAgents = computed(() => {
    const allTemplates = agentTemplates.value
    const enhanced = {}
    
    Object.entries(allTemplates).forEach(([key, template]) => {
        if (template.quality === 'premium' || template.source === 'enhanced') {
            enhanced[key] = template
        }
    })
    
    return enhanced
})

// 标准智能体
const standardAgents = computed(() => {
    const allTemplates = agentTemplates.value
    const standard = {}
    
    Object.entries(allTemplates).forEach(([key, template]) => {
        if (template.quality !== 'premium' && template.source !== 'enhanced') {
            standard[key] = template
        }
    })
    
    return standard
})

// 工作流模板
const workflowTemplates = computed(() => autogenService.getWorkflowTemplatesList())

// 可用工具
const availableTools = computed(() => mcpService.getAvailableTools())

// 从localStorage加载团队列表
const loadTeams = () => {
    const savedTeams = localStorage.getItem('agentTeamList')
    if (savedTeams) {
        teamList.value = JSON.parse(savedTeams)
    }
}

// 从localStorage加载LLM选项
const loadLLMOptions = () => {
    const savedLLMs = localStorage.getItem('llmList')
    if (savedLLMs) {
        llmOptions.value = JSON.parse(savedLLMs)
    }
}

// 保存团队列表到localStorage
const saveTeams = () => {
    localStorage.setItem('agentTeamList', JSON.stringify(teamList.value))
}

// 选择模板
const selectTemplate = (template) => {
    selectedTemplate.value = template
    newTeam.value.name = template.name
    newTeam.value.workflowType = template.workflowType
    newTeam.value.selectedAgents = template.agents.map(agent => agent.type)
    showTemplateSelector.value = false
    showAddForm.value = true
}

// 显示自定义表单
const showCustomForm = () => {
    selectedTemplate.value = null
    resetForm()
    showTemplateSelector.value = false
    showAddForm.value = true
}

// 取消表单
const cancelForm = () => {
    showAddForm.value = false
    showTemplateSelector.value = false
    selectedTemplate.value = null
    resetForm()
}

// 重置表单
const resetForm = () => {
    newTeam.value = {
        name: '',
        workflowType: 'group_chat',
        selectedAgents: [],
        selectedLLMId: ''
    }
}

// 获取智能体头像
const getAgentAvatar = (agentType) => {
    const template = agentTemplates.value[agentType]
    return template ? template.avatar : '🤖'
}

// 获取智能体名称
const getAgentName = (agentType) => {
    const template = agentTemplates.value[agentType]
    return template ? template.name : agentType
}

// 获取智能体描述
const getAgentDescription = (template) => {
    // 从系统提示词中提取简短描述
    const prompt = template.systemPrompt
    const firstSentence = prompt.split('。')[0] + '。'
    return firstSentence.length > 50 ? firstSentence.substring(0, 50) + '...' : firstSentence
}

// 格式化能力标签
const formatCapability = (capability) => {
    const capabilityMap = {
        'data_analysis': '数据分析',
        'visualization': '可视化',
        'statistics': '统计学',
        'predictive_modeling': '预测建模',
        'business_intelligence': '商业智能',
        'research': '研究',
        'information_gathering': '信息收集',
        'analysis': '分析',
        'literature_review': '文献调研',
        'market_research': '市场研究',
        'coding': '编程',
        'debugging': '调试',
        'system_design': '系统设计',
        'architecture': '架构',
        'performance_optimization': '性能优化',
        'project_management': '项目管理',
        'coordination': '协调',
        'integration': '整合',
        'team_management': '团队管理',
        'risk_assessment': '风险评估',
        'legal_review': '法律审查',
        'compliance': '合规',
        'contract_analysis': '合同分析',
        'regulatory_guidance': '法规指导',
        'financial_modeling': '财务建模',
        'investment_analysis': '投资分析',
        'cost_benefit_analysis': '成本效益分析',
        'budgeting': '预算管理',
        'risk_management': '风险管理',
        'ui_ux_design': 'UI/UX设计',
        'brand_design': '品牌设计',
        'visual_communication': '视觉传达',
        'user_experience': '用户体验',
        'creative_strategy': '创意策略',
        'behavioral_analysis': '行为分析',
        'emotional_intelligence': '情商分析',
        'decision_psychology': '决策心理学',
        'user_psychology': '用户心理学',
        'team_dynamics': '团队动力学',
        'product_strategy': '产品策略',
        'requirement_analysis': '需求分析',
        'roadmap_planning': '路线图规划',
        'marketing_strategy': '营销策略',
        'brand_management': '品牌管理',
        'content_marketing': '内容营销',
        'customer_acquisition': '客户获取',
        'market_analysis': '市场分析',
        'system_architecture': '系统架构',
        'technology_selection': '技术选型',
        'scalability_design': '可扩展性设计',
        'technical_strategy': '技术策略',
        'quality_assurance': '质量保证',
        'test_strategy': '测试策略',
        'defect_analysis': '缺陷分析',
        'process_improvement': '流程改进',
        'risk_identification': '风险识别',
        'business_strategy': '商业策略',
        'operations_optimization': '运营优化',
        'change_management': '变革管理',
        'business_model_analysis': '商业模式分析',
        'strategic_planning': '战略规划',
        'user_interaction': '用户交互',
        'requirement_clarification': '需求澄清',
        'feedback_collection': '反馈收集',
        'user_advocacy': '用户倡导'
    }
    return capabilityMap[capability] || capability
}

// 获取来源标签
const getSourceTag = (source) => {
    const sourceMap = {
        'creative_designer_v0': 'v0设计',
        'technical_architect_cursor': 'Cursor',
        'product_manager_manus': 'Manus',
        'data_analyst_enhanced': '多维思维',
        'qa_engineer_systematic': '系统化'
    }
    
    return sourceMap[source] || '增强版'
}

// 获取增强功能名称
const getEnhancementName = (enhancement) => {
    const enhancementMap = {
        'multidimensional_thinking': '多维思维',
        'structured_response': '结构化响应',
        'quality_assurance': '质量保证',
        'collaboration_optimization': '协作优化'
    }
    
    return enhancementMap[enhancement] || enhancement
}

// 创建团队
const createTeam = async () => {
    if (!newTeam.value.name || newTeam.value.selectedAgents.length === 0 || !newTeam.value.selectedLLMId) {
        ElMessage({
            message: '请填写团队名称、选择智能体和LLM配置',
            type: 'warning'
        })
        return
    }

    // 获取选择的LLM配置
    const selectedLLM = llmOptions.value.find(llm => llm.id === parseInt(newTeam.value.selectedLLMId))
    if (!selectedLLM) {
        ElMessage({
            message: '请选择有效的LLM配置',
            type: 'warning'
        })
        return
    }

    // 构建团队配置
    const teamConfig = {
        name: newTeam.value.name,
        workflowType: newTeam.value.workflowType,
        agents: newTeam.value.selectedAgents.map(agentType => ({
            type: agentType,
            llmConfig: {
                endpoint: selectedLLM.endpoint,
                apiKey: selectedLLM.apiKey,
                model: selectedLLM.model
            }
        }))
    }

    try {
        // 使用AutoGen服务创建团队
        const conversation = await autogenService.createAgentTeam(teamConfig)
        
        const isFirst = teamList.value.length === 0
        const team = {
            id: Date.now(),
            name: teamConfig.name,
            workflowType: teamConfig.workflowType,
            agents: conversation.agents,
            conversationId: conversation.id,
            isDefault: isFirst,
            llmConfig: selectedLLM
        }

        teamList.value.push(team)
        
        // 重置表单
        newTeam.value = {
            name: '',
            workflowType: 'group_chat',
            selectedAgents: [],
            selectedLLMId: ''
        }
        
        showAddForm.value = false
        saveTeams()
        emit('updateTeamOptions')
        emit('teamCreated', team)
        
        ElMessage({
            message: '智能体团队创建成功',
            type: 'success'
        })
    } catch (error) {
        console.error('创建团队失败:', error)
        ElMessage({
            message: '创建团队失败，请检查配置',
            type: 'error'
        })
    }
}

// 确认删除
const confirmDelete = (team) => {
    if (confirm(`确定要删除团队 ${team.name} 吗？`)) {
        deleteTeam(team.id)
    }
}

// 删除团队
const deleteTeam = (id) => {
    const team = teamList.value.find(t => t.id === id)
    if (team) {
        // 删除AutoGen会话
        autogenService.deleteConversation(team.conversationId)
    }
    
    teamList.value = teamList.value.filter(team => team.id !== id)
    saveTeams()
    emit('updateTeamOptions')
}

// 设置默认团队
const setDefault = (selectedTeam) => {
    teamList.value.forEach(team => {
        team.isDefault = team.id === selectedTeam.id
    })
    saveTeams()
    emit('updateTeamOptions')
}

// 开始编辑
const startEdit = (team) => {
    // TODO: 实现编辑功能
    ElMessage({
        message: '编辑功能即将推出',
        type: 'info'
    })
}

// 清空所有团队
const clearAllTeams = () => {
    if (confirm('确定要清空所有智能体团队吗？此操作不可恢复。')) {
        // 删除所有AutoGen会话
        teamList.value.forEach(team => {
            autogenService.deleteConversation(team.conversationId)
        })
        
        teamList.value = []
        saveTeams()
        emit('updateTeamOptions')
        ElMessage({
            message: '已清空所有智能体团队',
            type: 'success'
        })
    }
}

// 重置默认配置
const resetToDefault = () => {
    if (confirm('确定要重置为默认配置吗？这将清除所有现有团队。')) {
        clearAllTeams()
        // 可以在这里添加默认团队配置
    }
}

// 切换展开状态
const toggleExpand = (id) => {
    if (expandedItems.value.has(id)) {
        expandedItems.value.delete(id)
    } else {
        expandedItems.value.add(id)
    }
}

// 获取工作流显示名称
const getWorkflowDisplayName = (workflowType) => {
    const names = {
        group_chat: '群聊模式',
        round_robin: '轮询模式',
        sequential: '顺序模式'
    }
    return names[workflowType] || workflowType
}

// 获取工作流描述
const getWorkflowDescription = (workflowType) => {
    const descriptions = {
        group_chat: '系统会根据消息内容自动选择最适合的智能体来回复',
        round_robin: '智能体按照设定顺序依次发言，每次轮换',
        sequential: '所有智能体按照预定义顺序依次处理同一个任务'
    }
    return descriptions[workflowType] || '未知工作流'
}

// 获取状态文本
const getStatusText = (status) => {
    const statusMap = {
        idle: '空闲',
        thinking: '思考中',
        speaking: '发言中',
        waiting: '等待中'
    }
    return statusMap[status] || '未知'
}

onMounted(() => {
    loadTeams()
    loadLLMOptions()
})
</script>

<style scoped>
.agent-team-manager {
    background-color: white;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.section-header h3 {
    margin: 0;
    font-size: 16px;
    color: #333;
}

.header-buttons {
    display: flex;
    gap: 8px;
}

.clear-button, .reset-button {
    padding: 4px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
    color: #666;
    font-size: 12px;
    cursor: pointer;
}

.clear-button:hover, .reset-button:hover {
    background-color: #f5f5f5;
}

.add-team-form {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
}

.add-team-form h4 {
    margin: 0 0 16px 0;
    font-size: 16px;
    color: #333;
}

.add-team-form input, .workflow-selector, .llm-selector {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e5e5e5;
    border-radius: 4px;
    margin-bottom: 12px;
    font-size: 14px;
}

.agent-selection {
    margin-bottom: 16px;
}

.selection-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.quality-filter label {
    font-size: 14px;
    color: #666;
    display: flex;
    align-items: center;
    gap: 6px;
}

.section-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin: 16px 0 12px 0;
    padding-left: 8px;
    border-left: 4px solid #007bff;
}

.enhanced-agents-section {
    margin-bottom: 20px;
}

.enhanced-agents-section .section-title {
    border-left-color: #28a745;
    color: #28a745;
}

.agent-grid.enhanced {
    border: 2px solid #28a745;
    border-radius: 8px;
    padding: 12px;
    background: linear-gradient(135deg, #f8fff9 0%, #f0fff1 100%);
}

.agent-card-checkbox.enhanced .agent-card {
    border: 2px solid #28a745;
    background: linear-gradient(135deg, #ffffff 0%, #f8fff9 100%);
    position: relative;
}

.agent-card-checkbox.enhanced .agent-card::before {
    content: "⭐";
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 16px;
    animation: sparkle 2s infinite;
}

@keyframes sparkle {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.1); }
}

.quality-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    font-weight: bold;
}

.quality-badge.premium {
    background: linear-gradient(45deg, #28a745, #20c997);
    color: white;
}

.agent-source {
    margin: 4px 0;
}

.source-tag {
    background: linear-gradient(45deg, #007bff, #0056b3);
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: bold;
}

.capability-tag.enhanced {
    background: linear-gradient(45deg, #28a745, #20c997);
    color: white;
    border: none;
}

.capability-more {
    background: #6c757d;
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: bold;
}

.enhancement-tags {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.enhancement-tag {
    background: linear-gradient(45deg, #17a2b8, #138496);
    color: white;
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 9px;
    font-weight: bold;
}

.agent-selection h5, .llm-selection h5 {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: #333;
}

.agent-checkboxes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 8px;
}

.agent-checkbox {
    display: flex;
    align-items: center;
    padding: 8px;
    border: 1px solid #e5e5e5;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.agent-checkbox:hover {
    background-color: #f0f0f0;
}

.agent-checkbox input[type="checkbox"] {
    margin-right: 8px;
}

.agent-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
}

.agent-avatar {
    font-size: 20px;
}

.agent-name {
    font-weight: bold;
    color: #333;
}

.agent-capabilities {
    font-size: 12px;
    color: #666;
}

.form-buttons {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.cancel-btn, .confirm-btn {
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 14px;
    border: none;
    cursor: pointer;
}

.cancel-btn {
    background-color: #f5f5f5;
    color: #666;
}

.confirm-btn {
    background-color: #07c160;
    color: white;
}

.team-list {
    margin-bottom: 16px;
}

.team-item {
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    margin-bottom: 8px;
    overflow: hidden;
}

.team-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background-color: #f8f9fa;
    cursor: pointer;
    transition: background-color 0.2s;
}

.team-header:hover {
    background-color: #e9ecef;
}

.team-info {
    display: flex;
    align-items: center;
    gap: 16px;
}

.team-name {
    font-weight: bold;
    color: #333;
}

.team-workflow {
    font-size: 12px;
    color: #666;
    background-color: #e3f2fd;
    padding: 2px 8px;
    border-radius: 12px;
}

.team-agent-count {
    font-size: 12px;
    color: #666;
}

.team-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.default-btn, .edit-btn, .delete-btn {
    padding: 4px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
    font-size: 12px;
    cursor: pointer;
}

.default-btn.active {
    background-color: #4caf50;
    color: white;
    border-color: #4caf50;
}

.edit-btn:hover {
    background-color: #e3f2fd;
}

.delete-btn:hover {
    background-color: #ffebee;
    color: #f44336;
}

.expand-icon {
    transition: transform 0.2s;
    font-size: 12px;
    color: #666;
}

.expand-icon.expanded {
    transform: rotate(180deg);
}

.team-details {
    padding: 16px;
    background-color: white;
    border-top: 1px solid #e5e5e5;
}

.team-details h6 {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: #333;
}

.agent-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
    margin-bottom: 16px;
}

.agent-card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border: 1px solid #e5e5e5;
    border-radius: 4px;
    background-color: #f9f9f9;
}

.agent-details {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.agent-status {
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 10px;
    color: white;
}

.agent-status.idle {
    background-color: #6c757d;
}

.agent-status.thinking {
    background-color: #ffc107;
}

.agent-status.speaking {
    background-color: #28a745;
}

.agent-status.waiting {
    background-color: #17a2b8;
}

.workflow-info, .mcp-tools {
    margin-bottom: 16px;
}

.workflow-info p {
    margin: 0;
    font-size: 14px;
    color: #666;
}

.tool-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.tool-tag {
    font-size: 12px;
    color: #666;
    background-color: #e9ecef;
    padding: 2px 8px;
    border-radius: 12px;
}

.empty-state {
    text-align: center;
    padding: 32px;
    color: #666;
}

.add-button {
    width: 100%;
    padding: 12px;
    border: 2px dashed #07c160;
    border-radius: 8px;
    background-color: transparent;
    color: #07c160;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.add-button:hover {
    background-color: #f0fdf4;
}

.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
    transform: translateY(-20px);
    opacity: 0;
}

/* 模板选择器样式 */
.template-selector {
    background-color: white;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
}

.template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
}

.template-card {
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;
    background-color: #fafafa;
}

.template-card:hover {
    border-color: #07c160;
    box-shadow: 0 2px 8px rgba(7, 193, 96, 0.1);
    transform: translateY(-2px);
}

.template-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.template-icon {
    font-size: 24px;
}

.template-header h5 {
    margin: 0;
    font-size: 16px;
    color: #333;
    font-weight: 600;
}

.template-description {
    color: #666;
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: 12px;
}

.template-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.template-time {
    font-size: 12px;
    color: #666;
}

.template-tags {
    display: flex;
    gap: 4px;
}

.tag {
    background-color: #e3f2fd;
    color: #1976d2;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 8px;
}

.template-agents {
    display: flex;
    gap: 4px;
}

.agent-mini {
    font-size: 16px;
}

.template-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.custom-btn {
    padding: 8px 20px;
    border: 1px solid #07c160;
    border-radius: 6px;
    background-color: transparent;
    color: #07c160;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.custom-btn:hover {
    background-color: #07c160;
    color: white;
}

/* 工作流预览样式 */
.template-workflow {
    margin-bottom: 20px;
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 8px;
}

.template-workflow h5 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #333;
}

.workflow-steps {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.workflow-step {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    background-color: white;
    border-radius: 6px;
}

.step-number {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #07c160;
    color: white;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}

.step-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.step-agent {
    font-size: 12px;
    color: #666;
}

/* 新的智能体网格样式 */
.agent-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
}

.agent-card-checkbox {
    cursor: pointer;
}

.agent-card-checkbox input[type="checkbox"] {
    display: none;
}

.agent-card {
    border: 2px solid #e5e5e5;
    border-radius: 8px;
    padding: 16px;
    background-color: #fafafa;
    transition: all 0.2s;
    position: relative;
}

.agent-card:hover {
    border-color: #07c160;
    background-color: #f0fdf4;
}

.agent-card.selected {
    border-color: #07c160;
    background-color: #f0fdf4;
    box-shadow: 0 2px 8px rgba(7, 193, 96, 0.1);
}

.agent-card.selected::after {
    content: '✓';
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: #07c160;
    color: white;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}

.agent-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.agent-capabilities {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
}

.capability-tag {
    background-color: #e3f2fd;
    color: #1976d2;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 8px;
}

.agent-description {
    font-size: 12px;
    color: #666;
    line-height: 1.3;
    margin: 0;
}
</style> 