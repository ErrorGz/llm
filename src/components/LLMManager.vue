<template>
    <div class="llm-manager">
        <div class="section-header">
            <h3>LLM 管理</h3>
            <div class="header-buttons">
                <button class="clear-button" @click="clearAllLLMs">清空列表</button>
                <button class="reset-button" @click="resetToDefault">重置默认配置</button>

            </div>
        </div>

        <!-- 添加新LLM表单 -->
        <transition name="slide-down">
            <div v-if="showAddForm" class="add-llm-form">
                <input v-model="newLLM.name" placeholder="名称" type="text">
                <input v-model="newLLM.endpoint" placeholder="API地址" type="text">
                <input v-model="newLLM.apiKey" placeholder="API密钥" type="password">
                <input v-model="newLLM.model" placeholder="模型名称" type="text">
                <textarea v-model="newLLM.systemPrompt" placeholder="系统提示词" rows="4"></textarea>
                <div class="form-buttons">
                    <button class="cancel-btn" @click="showAddForm = false">取消</button>
                    <button class="confirm-btn" @click="addLLM">确认添加</button>
                </div>
            </div>
        </transition>

        <!-- LLM列表 -->
        <div v-if="llmList.length > 0" class="llm-list">
            <div v-for="llm in llmList" :key="llm.id" class="llm-item">
                <div class="llm-info">
                    <div class="llm-header">
                        <div class="llm-title">
                            <button class="toggle-btn" @click="toggleExpand(llm.id)">
                                <span class="toggle-icon" :class="{ 'is-expanded': expandedItems.has(llm.id) }">
                                    {{ expandedItems.has(llm.id) ? '📂' : '📁' }}
                                </span>
                            </button>
                            <div class="llm-name" v-if="editingLLM?.id !== llm.id">{{ llm.name }}</div>
                            <input v-else v-model="editingLLM.name" class="inline-edit" type="text" placeholder="名称">
                        </div>
                        <div class="header-actions">
                            <label class="default-checkbox">
                                <input type="checkbox" :checked="llm.isDefault" @change="setDefault(llm)">
                                <span class="checkbox-label">默认</span>
                            </label>
                            <button class="edit-btn" @click="startEdit(llm)">
                                <span class="edit-icon">{{ editingLLM?.id === llm.id ? '✓' : '✏️' }}</span>
                            </button>
                            <button class="delete-btn" @click="confirmDelete(llm)">
                                <span class="delete-icon">🗑️</span>
                            </button>
                        </div>
                    </div>
                    <div v-if="expandedItems.has(llm.id)" class="llm-details">
                        <div v-if="editingLLM?.id !== llm.id" class="info-grid">
                            <div class="info-field">
                                <label>地址:</label>
                                <div class="info-value">{{ llm.endpoint }}</div>
                            </div>
                            <div class="info-field">
                                <label>模型:</label>
                                <div class="info-value">{{ llm.model }}</div>
                            </div>
                            <div class="info-field">
                                <label>提示词:</label>
                                <div class="info-value">{{ llm.systemPrompt }}</div>
                            </div>
                        </div>
                        <div v-else class="edit-fields">
                            <div class="edit-field">
                                <label>地址:</label>
                                <input v-model="editingLLM.endpoint" class="inline-edit" type="text"
                                    placeholder="API地址">
                            </div>
                            <div class="edit-field">
                                <label>密钥:</label>
                                <input v-model="editingLLM.apiKey" class="inline-edit" type="password"
                                    placeholder="API密钥">
                            </div>
                            <div class="edit-field">
                                <label>模型:</label>
                                <input v-model="editingLLM.model" class="inline-edit" type="text" placeholder="模型名称">
                            </div>
                            <div class="edit-field">
                                <label>提示词:</label>
                                <textarea v-model="editingLLM.systemPrompt" class="inline-edit" placeholder="系统提示词"
                                    rows="3"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="empty-state">
            暂无 LLM，点击上方按钮添加
        </div>

        <!-- 编辑LLM表单 -->
        <transition name="slide-down">
            <div v-if="showEditForm" class="add-llm-form">
                <h4>编辑 LLM</h4>
                <input v-model="editingLLM.name" placeholder="名称" type="text">
                <input v-model="editingLLM.endpoint" placeholder="API地址" type="text">
                <input v-model="editingLLM.apiKey" placeholder="API密钥" type="password">
                <input v-model="editingLLM.model" placeholder="模型名称" type="text">
                <textarea v-model="editingLLM.systemPrompt" placeholder="系统提示词" rows="4"></textarea>
                <div class="form-buttons">
                    <button class="cancel-btn" @click="cancelEdit">取消</button>
                    <button class="confirm-btn" @click="saveEdit">保存修改</button>
                </div>
            </div>
        </transition>
        <button class="add-button" @click="showAddForm = !showAddForm">
            {{ showAddForm ? '取消' : '添加 LLM' }}
        </button>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['updateLLMOptions'])

const llmList = ref([])
const showAddForm = ref(false)
const expandedItems = ref(new Set())

const newLLM = ref({
    name: '',
    endpoint: '',
    apiKey: '',
    model: '',
    systemPrompt: ''
})

const showEditForm = ref(false)
const editingLLM = ref(null)

// 默认LLM配置
const defaultLLMConfig = JSON.parse(import.meta.env.VITE_DEFAULT_LLM_CONFIG || '[]')

// 重置为默认配置
const resetToDefault = () => {
    if (confirm('确定要重置为默认配置吗？这将清除所有现有配置。')) {
        llmList.value = JSON.parse(JSON.stringify(defaultLLMConfig))
        saveLLMs()
        emit('updateLLMOptions')
    }
}

// 从localStorage加载LLM列表
const loadLLMs = () => {
    const savedLLMs = localStorage.getItem('llmList')
    if (savedLLMs) {
        llmList.value = JSON.parse(savedLLMs)
    }
}

// 保存LLM列表到localStorage
const saveLLMs = () => {
    localStorage.setItem('llmList', JSON.stringify(llmList.value))
}

// 添加新的LLM
const addLLM = () => {
    if (!newLLM.value.name || !newLLM.value.endpoint || !newLLM.value.apiKey || !newLLM.value.model) {
        alert('请填写所有字段')
        return
    }

    const isFirst = llmList.value.length === 0
    llmList.value.push({
        id: Date.now(),
        isDefault: isFirst,
        ...newLLM.value
    })

    // 重置表单
    newLLM.value = {
        name: '',
        endpoint: '',
        apiKey: '',
        model: '',
        systemPrompt: ''
    }
    showAddForm.value = false
    saveLLMs()
    emit('updateLLMOptions')
}

// 确认删除
const confirmDelete = (llm) => {
    if (confirm(`确定要删除 ${llm.name} 吗？`)) {
        deleteLLM(llm.id)
    }
}

// 删除LLM
const deleteLLM = (id) => {
    llmList.value = llmList.value.filter(llm => llm.id !== id)
    saveLLMs()
    emit('updateLLMOptions')
}

// 开始编辑
const startEdit = (llm) => {
    if (editingLLM.value?.id === llm.id) {
        // 如果点击的是正在编辑的项，则保存
        saveEdit()
    } else {
        // 开始编辑新的项
        editingLLM.value = { ...llm }
        // 确保展开当前项
        expandedItems.value.add(llm.id)
    }
}

// 保存编辑
const saveEdit = () => {
    if (!editingLLM.value.name || !editingLLM.value.endpoint ||
        !editingLLM.value.apiKey || !editingLLM.value.model) {
        ElMessage({
            message: '请填写所有必填字段',
            type: 'warning'
        })
        return
    }

    const index = llmList.value.findIndex(llm => llm.id === editingLLM.value.id)
    if (index !== -1) {
        llmList.value[index] = { ...editingLLM.value }
        saveLLMs()
        editingLLM.value = null
        emit('updateLLMOptions')
        ElMessage({
            message: '保存成功',
            type: 'success'
        })
    }
}

// 取消编辑
const cancelEdit = () => {
    editingLLM.value = null
}

// 设置默认LLM
const setDefault = (selectedLlm) => {
    // 取消其他LLM的默认状态
    llmList.value.forEach(llm => {
        llm.isDefault = llm.id === selectedLlm.id
    })
    saveLLMs()
    emit('updateLLMOptions')
}

// 清空所有LLM
const clearAllLLMs = () => {
    if (confirm('确定要清空所有LLM配置吗？此操作不可恢复。')) {
        llmList.value = []
        saveLLMs()
        emit('updateLLMOptions')
        ElMessage({
            message: '已清空所有LLM配置',
            type: 'success',
            duration: 2000
        })
    }
}

// 切换展开状态的方法
const toggleExpand = (id) => {
    if (expandedItems.value.has(id)) {
        expandedItems.value.delete(id)
    } else {
        expandedItems.value.add(id)
    }
}

onMounted(() => {
    loadLLMs()
})
</script>

<style scoped>
.llm-manager {
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

.clear-button {
    background: #f56c6c;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
}

.clear-button:hover {
    background: #e64242;
}

.reset-button {
    background: #ff9800;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
}

.reset-button:hover {
    background: #f57c00;
}

.add-button {
    background: #07c160;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 14px;
}

.llm-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    overflow: hidden;
}

.llm-item {
    display: flex;
    align-items: flex-start;
    padding: 12px;
    background: #f9f9f9;
    border-radius: 8px;
    gap: 12px;
    width: 100%;
    box-sizing: border-box;
}

.llm-info {
    flex: 1;
    min-width: 0;
}

.llm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
}

.llm-title {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.llm-name {
    font-weight: 500;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
}

.llm-details {
    margin-top: 12px;
}

.info-grid,
.edit-fields {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 6px;
}

.info-field,
.edit-field {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.info-field label,
.edit-field label {
    min-width: 60px;
    color: #666;
    padding-top: 6px;
    font-size: 14px;
}

.info-value {
    flex: 1;
    padding: 6px 0;
    color: #333;
    font-size: 14px;
    line-height: 1.4;
    word-break: break-all;
}

.edit-field .inline-edit {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    background: white;
}

.edit-field textarea.inline-edit {
    resize: vertical;
    min-height: 60px;
}

.default-checkbox {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #666;
    font-size: 13px;
}

.checkbox-label {
    user-select: none;
}

.default-checkbox input[type="checkbox"] {
    width: 14px;
    height: 14px;
    margin: 0;
}

.toggle-btn,
.edit-btn,
.delete-btn {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.toggle-btn:hover,
.edit-btn:hover,
.delete-btn:hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
}

.empty-state {
    text-align: center;
    color: #999;
    padding: 24px 0;
    font-size: 14px;
}

.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease-out;
}

.slide-down-enter-from {
    opacity: 0;
    transform: translateY(-20px);
}

.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}

button:active {
    opacity: 0.8;
}

.add-llm-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: #f5f5f5;
    border-radius: 8px;
    margin-bottom: 16px;
}

.form-buttons {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 8px;
}

.cancel-btn {
    background: #f5f5f5;
    border: 1px solid #ddd;
    padding: 8px 16px;
    border-radius: 4px;
    color: #666;
}

.confirm-btn {
    background: #07c160;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
}

.edit-icon,
.delete-icon,
.toggle-icon {
    font-size: 16px;
}
</style>