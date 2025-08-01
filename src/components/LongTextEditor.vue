<template>
    <div class="editor-overlay" @click.self="$emit('close')">
        <div class="editor-container">
            <div class="editor-header">
                <span class="title">编辑长文本</span>
                <button class="submit-button" @click="handleSubmit">发送</button>
            </div>
            <textarea ref="textareaRef" v-model="text" class="text-area" placeholder="请输入文本内容..."></textarea>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps({
    initialText: {
        type: String,
        default: ''
    }
})

const emit = defineEmits(['submit', 'close'])
const text = ref(props.initialText)
const textareaRef = ref(null)

const handleSubmit = async () => {
    if (!text.value.trim()) return;
    emit('submit', text.value);
    text.value = '';
    emit('close');
}

onMounted(async () => {
    await nextTick()
    textareaRef.value?.focus()
})
</script>



<style scoped>
.editor-overlay {
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

.editor-container {
    width: 90%;
    max-width: 600px;
    background-color: white;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    max-height: 95vh;
    height: auto;
}

.editor-header {
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

.submit-button {
    padding: 6px 16px;
    background-color: #07c160;
    color: white;
    border: none;
    border-radius: 16px;
    font-size: 14px;
}

.submit-button:active {
    background-color: #06ae56;
}

.text-area {
    flex: 1;
    min-height: 300px;
    max-height: 70vh;
    padding: 16px;
    border: none;
    resize: vertical;
    font-size: 16px;
    line-height: 1.5;
    outline: none;
    overflow-y: auto;
}
</style>