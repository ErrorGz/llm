<script setup>
import { ref } from 'vue'

const emit = defineEmits(['close', 'select'])

const prompts = ref([
    { id: 1, title: '打招呼', content: '你好，很高兴认识你！' },
    { id: 2, title: '感谢', content: '非常感谢你的帮助！' },
    { id: 3, title: '道别', content: '再见，祝你有愉快的一天！' }
])

const newPrompt = ref({ title: '', content: '' })
const isEditing = ref(false)

const addPrompt = () => {
    if (newPrompt.value.title && newPrompt.value.content) {
        prompts.value.push({
            id: Date.now(),
            title: newPrompt.value.title,
            content: newPrompt.value.content
        })
        newPrompt.value = { title: '', content: '' }
        isEditing.value = false
    }
}

const deletePrompt = (id) => {
    prompts.value = prompts.value.filter(p => p.id !== id)
}

const selectPrompt = (content) => {
    emit('select', content)
    emit('close')
}
</script>

<template>
    <div class="prompts-overlay" @click.self="$emit('close')">
        <div class="prompts-container">
            <div class="prompts-header">
                <span class="title">提示词管理</span>
                <button class="close-button" @click="$emit('close')">×</button>
            </div>

            <div class="prompts-content">
                <div v-if="!isEditing" class="prompts-list">
                    <div v-for="prompt in prompts" :key="prompt.id" class="prompt-item">
                        <div class="prompt-info" @click="selectPrompt(prompt.content)">
                            <div class="prompt-title">{{ prompt.title }}</div>
                            <div class="prompt-preview">{{ prompt.content }}</div>
                        </div>
                        <button class="delete-button" @click.stop="deletePrompt(prompt.id)">删除</button>
                    </div>
                </div>

                <div v-else class="prompt-editor">
                    <input v-model="newPrompt.title" type="text" placeholder="提示词标题" class="prompt-input">
                    <textarea v-model="newPrompt.content" placeholder="提示词内容" class="prompt-textarea"></textarea>
                </div>
            </div>

            <div class="prompts-footer">
                <template v-if="isEditing">
                    <button class="cancel-button" @click="isEditing = false">取消</button>
                    <button class="submit-button" @click="addPrompt">保存</button>
                </template>
                <button v-else class="add-button" @click="isEditing = true">
                    新建提示词
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.prompts-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
}

.prompts-container {
    width: 90%;
    max-width: 600px;
    background-color: white;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    max-height: 80vh;
}

.prompts-header {
    padding: 16px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.title {
    font-size: 18px;
    font-weight: 500;
}

.close-button {
    background: none;
    border: none;
    font-size: 24px;
    color: #999;
    padding: 0 8px;
}

.prompts-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
}

.prompt-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #eee;
    gap: 12px;
}

.prompt-info {
    flex: 1;
    cursor: pointer;
}

.prompt-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 4px;
}

.prompt-preview {
    font-size: 14px;
    color: #666;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.delete-button {
    padding: 6px 12px;
    background-color: #ff4d4f;
    color: white;
    border: none;
    border-radius: 16px;
    font-size: 14px;
}

.prompts-footer {
    padding: 12px 16px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.prompt-editor {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.prompt-input {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
}

.prompt-textarea {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    height: 120px;
    resize: none;
    font-size: 16px;
    line-height: 1.5;
}

.add-button,
.submit-button {
    padding: 8px 20px;
    background-color: #07c160;
    color: white;
    border: none;
    border-radius: 20px;
}

.cancel-button {
    padding: 8px 20px;
    border: 1px solid #ddd;
    background-color: white;
    border-radius: 20px;
    color: #666;
}
</style>