<template>
    <div class="role-selector">
        <div class="role-selector-header">
            <h4>选择AI角色</h4>
            <div class="search-box">
                <input v-model="searchKeyword" type="text" placeholder="搜索角色..." class="search-input">
            </div>
        </div>

        <!-- 智能推荐角色 -->
        <div v-if="recommendedRole && !searchKeyword" class="recommended-section">
            <div class="recommendation-header">
                <h5>智能推荐角色</h5>
                <div class="confidence-indicator">
                    <span class="confidence-text">
                        置信度: {{ Math.round(matchResult.bestMatch.confidence * 100) }}%
                    </span>
                    <div class="confidence-bar">
                        <div class="confidence-fill" :style="{ width: (matchResult.bestMatch.confidence * 100) + '%' }">
                        </div>
                    </div>
                </div>
            </div>

            <div class="role-card recommended" :class="{ 'selected': selectedRole?.id === recommendedRole.id }"
                @click="selectRole(recommendedRole)">
                <div class="role-icon">{{ recommendedRole.icon }}</div>
                <div class="role-info">
                    <div class="role-name">{{ recommendedRole.name }}</div>
                    <div class="role-description">{{ recommendedRole.description }}</div>
                    <div class="role-capabilities">
                        <span v-for="cap in recommendedRole.capabilities" :key="cap" class="capability-tag">
                            {{ cap }}
                        </span>
                    </div>
                </div>
                <div class="recommended-badge">智能推荐</div>
            </div>

            <!-- 推荐解释 -->
            <div class="recommendation-explanation">
                <details>
                    <summary>为什么推荐这个角色？</summary>
                    <div class="explanation-content">
                        <div class="explanation-text">{{ recommendationExplanation }}</div>
                        <div v-if="matchResult.allMatches.length > 1" class="alternative-matches">
                            <h6>其他可能的选择：</h6>
                            <div class="alternative-list">
                                <div v-for="match in matchResult.allMatches.slice(1)" :key="match.role.id"
                                    class="alternative-item" @click="selectRole(match.role)">
                                    <span class="alt-icon">{{ match.role.icon }}</span>
                                    <span class="alt-name">{{ match.role.name }}</span>
                                    <span class="alt-confidence">{{ Math.round(match.confidence * 100) }}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </details>
            </div>
        </div>

        <!-- 分类选择 -->
        <div v-if="!searchKeyword" class="category-tabs">
            <button v-for="category in categories" :key="category.key" class="category-tab"
                :class="{ 'active': selectedCategory === category.key }" @click="selectedCategory = category.key">
                {{ category.name }}
            </button>
        </div>

        <!-- 角色列表 -->
        <div class="roles-grid">
            <div v-for="role in filteredRoles" :key="role.id" class="role-card"
                :class="{ 'selected': selectedRole?.id === role.id }" @click="selectRole(role)">
                <div class="role-icon" :style="{ color: role.color }">{{ role.icon }}</div>
                <div class="role-info">
                    <div class="role-name">{{ role.name }}</div>
                    <div class="role-description">{{ role.description }}</div>
                    <div class="role-capabilities">
                        <span v-for="cap in role.capabilities" :key="cap" class="capability-tag">
                            {{ cap }}
                        </span>
                    </div>
                </div>
                <div v-if="role.isCustom" class="custom-badge">自定义</div>
            </div>
        </div>

        <!-- 自定义角色按钮 -->
        <div class="custom-role-section">
            <button class="create-custom-role-btn" @click="showCustomRoleForm = true">
                <span class="icon">+</span>
                创建自定义角色
            </button>
        </div>

        <!-- 自定义角色表单 -->
        <div v-if="showCustomRoleForm" class="custom-role-form">
            <h5>创建自定义角色</h5>
            <div class="form-group">
                <label>角色名称</label>
                <input v-model="customRole.name" type="text" placeholder="输入角色名称">
            </div>
            <div class="form-group">
                <label>角色描述</label>
                <textarea v-model="customRole.description" placeholder="描述这个角色的特点和用途"></textarea>
            </div>
            <div class="form-group">
                <label>系统提示词</label>
                <textarea v-model="customRole.systemPrompt" placeholder="定义角色的行为和回答风格" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label>能力标签（用逗号分隔）</label>
                <input v-model="customRole.capabilitiesText" type="text" placeholder="例如：写作,分析,创意">
            </div>
            <div class="form-group">
                <label>角色图标</label>
                <input v-model="customRole.icon" type="text" placeholder="输入一个表情符号">
            </div>
            <div class="form-buttons">
                <button class="cancel-btn" @click="cancelCustomRole">取消</button>
                <button class="confirm-btn" @click="createCustomRole">创建</button>
            </div>
        </div>

        <!-- 操作按钮 -->
        <div class="selector-actions">
            <button class="cancel-btn" @click="$emit('cancel')">取消</button>
            <button class="confirm-btn" @click="confirmSelection" :disabled="!selectedRole">
                确定选择
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { roleTemplateService } from '../services/roleTemplateService.js'
import { roleMatchingService } from '../services/roleMatchingService.js'

const props = defineProps({
    currentRole: Object, // 当前选中的角色
    llmConfig: Object    // LLM配置，用于推荐角色
})

const emit = defineEmits(['select', 'cancel'])

// 响应式数据
const selectedRole = ref(props.currentRole || null)
const searchKeyword = ref('')
const selectedCategory = ref('all')
const showCustomRoleForm = ref(false)

// 智能匹配结果
const matchResult = computed(() => {
    if (props.llmConfig) {
        return roleMatchingService.matchRole(props.llmConfig)
    }
    return { bestMatch: null, allMatches: [], hasMatch: false }
})

// 推荐角色
const recommendedRole = computed(() => {
    return matchResult.value.bestMatch?.role || null
})

// 推荐解释
const recommendationExplanation = computed(() => {
    if (props.llmConfig) {
        return roleMatchingService.getRecommendationExplanation(matchResult.value)
    }
    return ''
})

// 自定义角色表单数据
const customRole = ref({
    name: '',
    description: '',
    systemPrompt: '',
    capabilitiesText: '',
    icon: '🎭'
})

// 分类数据
const categories = ref([
    { key: 'all', name: '全部' },
    { key: 'general', name: '通用' },
    { key: 'creative', name: '创意' },
    { key: 'technical', name: '技术' },
    { key: 'analysis', name: '分析' },
    { key: 'business', name: '商业' },
    { key: 'education', name: '教育' },
    { key: 'health', name: '健康' },
    { key: 'language', name: '语言' },
    { key: 'research', name: '研究' },
    { key: 'lifestyle', name: '生活' },
    { key: 'custom', name: '自定义' }
])

// 过滤后的角色列表
const filteredRoles = computed(() => {
    let roles = roleTemplateService.getAllRoles()

    // 搜索过滤
    if (searchKeyword.value) {
        roles = roleTemplateService.searchRoles(searchKeyword.value)
    } else if (selectedCategory.value !== 'all') {
        // 分类过滤
        roles = roleTemplateService.getRolesByCategory(selectedCategory.value)
    }

    return roles
})

// 选择角色
const selectRole = (role) => {
    selectedRole.value = role
}

// 确认选择
const confirmSelection = () => {
    if (selectedRole.value) {
        emit('select', selectedRole.value)
    }
}

// 创建自定义角色
const createCustomRole = () => {
    if (!customRole.value.name || !customRole.value.systemPrompt) {
        alert('请填写角色名称和系统提示词')
        return
    }

    const capabilities = customRole.value.capabilitiesText
        .split(',')
        .map(cap => cap.trim())
        .filter(cap => cap)

    const newRole = roleTemplateService.createCustomRole({
        ...customRole.value,
        capabilities
    })

    // 自动选择新创建的角色
    selectedRole.value = newRole
    showCustomRoleForm.value = false

    // 重置表单
    customRole.value = {
        name: '',
        description: '',
        systemPrompt: '',
        capabilitiesText: '',
        icon: '🎭'
    }

    // 切换到自定义分类
    selectedCategory.value = 'custom'
}

// 取消自定义角色创建
const cancelCustomRole = () => {
    showCustomRoleForm.value = false
    customRole.value = {
        name: '',
        description: '',
        systemPrompt: '',
        capabilitiesText: '',
        icon: '🎭'
    }
}

onMounted(() => {
    // 如果有推荐角色且当前没有选中角色，自动选择推荐角色
    if (recommendedRole.value && !selectedRole.value) {
        selectedRole.value = recommendedRole.value
    }
})
</script>

<style scoped>
.role-selector {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.role-selector-header {
    margin-bottom: 20px;
}

.role-selector-header h4 {
    margin: 0 0 15px 0;
    color: #303133;
    font-size: 18px;
}

.search-input {
    width: 100%;
    padding: 10px 15px;
    border: 1px solid #dcdfe6;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.3s;
}

.search-input:focus {
    outline: none;
    border-color: #409eff;
}

.recommended-section {
    margin-bottom: 25px;
}

.recommended-section h5 {
    margin: 0 0 10px 0;
    color: #606266;
    font-size: 14px;
    font-weight: 500;
}

/* 智能推荐样式 */
.recommendation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.recommendation-header h5 {
    margin: 0;
    color: #606266;
    font-size: 14px;
    font-weight: 500;
}

.confidence-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
}

.confidence-text {
    font-size: 12px;
    color: #909399;
}

.confidence-bar {
    width: 60px;
    height: 4px;
    background: #f0f2f5;
    border-radius: 2px;
    overflow: hidden;
}

.confidence-fill {
    height: 100%;
    background: linear-gradient(90deg, #f56c6c 0%, #e6a23c 50%, #67c23a 100%);
    transition: width 0.3s;
}

.recommendation-explanation {
    margin-top: 15px;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    overflow: hidden;
}

.recommendation-explanation details {
    cursor: pointer;
}

.recommendation-explanation summary {
    padding: 10px 12px;
    background: #f8f9fa;
    color: #606266;
    font-size: 13px;
    font-weight: 500;
    border: none;
    outline: none;
    user-select: none;
}

.recommendation-explanation summary:hover {
    background: #e9ecef;
}

.explanation-content {
    padding: 12px;
    background: #fff;
}

.explanation-text {
    font-size: 12px;
    color: #606266;
    line-height: 1.5;
    white-space: pre-line;
    margin-bottom: 15px;
}

.alternative-matches h6 {
    margin: 0 0 8px 0;
    font-size: 12px;
    color: #909399;
    font-weight: 500;
}

.alternative-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.alternative-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
}

.alternative-item:hover {
    border-color: #409eff;
    background: #f0f9ff;
}

.alt-icon {
    font-size: 14px;
}

.alt-name {
    flex: 1;
    font-size: 12px;
    color: #303133;
}

.alt-confidence {
    font-size: 11px;
    color: #909399;
    padding: 2px 6px;
    background: #f0f2f5;
    border-radius: 8px;
}

.category-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #ebeef5;
}

.category-tab {
    padding: 6px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 16px;
    background: #fff;
    color: #606266;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s;
}

.category-tab:hover {
    border-color: #409eff;
    color: #409eff;
}

.category-tab.active {
    background: #409eff;
    border-color: #409eff;
    color: #fff;
}

.roles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.role-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 15px;
    border: 2px solid #ebeef5;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
}

.role-card:hover {
    border-color: #409eff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.role-card.selected {
    border-color: #409eff;
    background: #f0f9ff;
}

.role-card.recommended {
    border-color: #e6a23c;
    background: #fdf6ec;
}

.role-card.recommended.selected {
    border-color: #409eff;
    background: #f0f9ff;
}

.role-icon {
    font-size: 24px;
    flex-shrink: 0;
}

.role-info {
    flex: 1;
}

.role-name {
    font-weight: 600;
    color: #303133;
    margin-bottom: 5px;
}

.role-description {
    font-size: 13px;
    color: #606266;
    margin-bottom: 8px;
    line-height: 1.4;
}

.role-capabilities {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.capability-tag {
    padding: 2px 6px;
    background: #f0f2f5;
    color: #606266;
    font-size: 11px;
    border-radius: 10px;
}

.recommended-badge,
.custom-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 500;
}

.recommended-badge {
    background: #e6a23c;
    color: #fff;
}

.custom-badge {
    background: #909399;
    color: #fff;
}

.custom-role-section {
    margin-bottom: 20px;
    text-align: center;
}

.create-custom-role-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 10px 20px;
    border: 2px dashed #dcdfe6;
    border-radius: 8px;
    background: transparent;
    color: #606266;
    cursor: pointer;
    transition: all 0.3s;
}

.create-custom-role-btn:hover {
    border-color: #409eff;
    color: #409eff;
}

.custom-role-form {
    padding: 20px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    background: #fafafa;
    margin-bottom: 20px;
}

.custom-role-form h5 {
    margin: 0 0 15px 0;
    color: #303133;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    color: #606266;
    font-size: 13px;
    font-weight: 500;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    font-size: 13px;
    box-sizing: border-box;
}

.form-group textarea {
    resize: vertical;
    min-height: 60px;
}

.form-buttons,
.selector-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.cancel-btn,
.confirm-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.3s;
}

.cancel-btn {
    background: #f5f7fa;
    color: #606266;
}

.cancel-btn:hover {
    background: #e4e7ed;
}

.confirm-btn {
    background: #409eff;
    color: #fff;
}

.confirm-btn:hover {
    background: #337ecc;
}

.confirm-btn:disabled {
    background: #c0c4cc;
    cursor: not-allowed;
}
</style>