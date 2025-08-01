<template>
    <div class="voice-settings-overlay" @click.self="$emit('close')">
        <div class="voice-settings-modal">
            <!-- 头部 -->
            <div class="modal-header">
                <h3>🎵 语音设置</h3>
                <div class="header-info">
                    <a href="https://docs.siliconflow.cn/cn/userguide/capabilities/text-to-speech" target="_blank"
                        class="doc-link">📖 官方文档</a>
                    <button class="close-btn" @click="$emit('close')">×</button>
                </div>
            </div>

            <!-- 内容区域 -->
            <div class="modal-content">
                <!-- 语音开关 -->
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">启用语音播放</div>
                        <div class="setting-desc">自动朗读AI回复内容</div>
                    </div>
                    <label class="switch">
                        <input type="checkbox" v-model="settings.enabled" @change="saveSettings">
                        <span class="slider"></span>
                    </label>
                </div>

                <!-- 语音角色 -->
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">语音角色</div>
                        <div class="setting-desc">选择官方预置语音角色</div>
                    </div>
                    <select v-model="settings.voice" @change="saveSettings" class="setting-select">
                        <optgroup label="👨 男声角色">
                            <option value="FunAudioLLM/CosyVoice2-0.5B:alex">Alex - 沉稳男声</option>
                            <option value="FunAudioLLM/CosyVoice2-0.5B:benjamin">Benjamin - 低沉男声</option>
                            <option value="FunAudioLLM/CosyVoice2-0.5B:charles">Charles - 磁性男声</option>
                            <option value="FunAudioLLM/CosyVoice2-0.5B:david">David - 欢快男声</option>
                        </optgroup>
                        <optgroup label="👩 女声角色">
                            <option value="FunAudioLLM/CosyVoice2-0.5B:anna">Anna - 沉稳女声</option>
                            <option value="FunAudioLLM/CosyVoice2-0.5B:bella">Bella - 激情女声</option>
                            <option value="FunAudioLLM/CosyVoice2-0.5B:claire">Claire - 温柔女声</option>
                            <option value="FunAudioLLM/CosyVoice2-0.5B:diana">Diana - 欢快女声</option>
                        </optgroup>
                    </select>
                </div>

                <!-- 语音速度 -->
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">语音速度</div>
                        <div class="setting-desc">当前速度: {{ settings.speed }}x</div>
                    </div>
                    <div class="slider-container">
                        <input type="range" min="0.25" max="4.0" step="0.25" v-model="settings.speed"
                            @input="saveSettings" class="range-slider">
                        <div class="range-labels">
                            <span>0.25x</span>
                            <span>1.0x</span>
                            <span>4.0x</span>
                        </div>
                    </div>
                </div>

                <!-- 音质设置 -->
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">音质设置</div>
                        <div class="setting-desc">选择音频采样率（MP3支持32k/44k）</div>
                    </div>
                    <select v-model="settings.sample_rate" @change="saveSettings" class="setting-select">
                        <option :value="32000">标准音质 (32kHz)</option>
                        <option :value="44100">高音质 (44kHz)</option>
                    </select>
                </div>

                <!-- 音量增益 -->
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">音量增益</div>
                        <div class="setting-desc">当前增益: {{ settings.gain }}dB</div>
                    </div>
                    <div class="slider-container">
                        <input type="range" min="-10" max="10" step="1" v-model="settings.gain" @input="saveSettings"
                            class="range-slider">
                        <div class="range-labels">
                            <span>-10dB</span>
                            <span>0dB</span>
                            <span>+10dB</span>
                        </div>
                    </div>
                </div>

                <!-- 测试语音 -->
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-title">测试语音</div>
                        <div class="setting-desc">试听当前语音设置</div>
                    </div>
                    <button class="test-btn" @click="testVoice" :disabled="isTesting">
                        {{ isTesting ? '生成中...' : '🎵 试听' }}
                    </button>
                </div>
            </div>

            <!-- 底部按钮 -->
            <div class="modal-footer">
                <button class="btn btn-secondary" @click="resetSettings">
                    🔄 恢复默认
                </button>
                <button class="btn btn-primary" @click="$emit('close')">
                    ✓ 完成
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const emit = defineEmits(['close', 'update:settings'])

const props = defineProps({
    currentSettings: {
        type: Object,
        default: () => ({})
    }
})

// 默认设置（根据官方文档）
const defaultSettings = {
    enabled: true,
    endpoint: 'https://api.siliconflow.cn/v1/audio/speech',
    model: 'FunAudioLLM/CosyVoice2-0.5B',
    voice: 'FunAudioLLM/CosyVoice2-0.5B:diana', // 欢快女声
    response_format: 'mp3',
    sample_rate: 44100, // MP3默认44100
    stream: true,
    speed: 1.0, // 范围 0.25-4.0
    gain: 0 // 范围 -10到10dB
}

const settings = reactive({ ...defaultSettings })
const isTesting = ref(false)

onMounted(() => {
    const savedSettings = localStorage.getItem('voiceSettings')
    if (savedSettings) {
        Object.assign(settings, JSON.parse(savedSettings))
    } else if (props.currentSettings) {
        Object.assign(settings, props.currentSettings)
    }
})

const saveSettings = () => {
    localStorage.setItem('voiceSettings', JSON.stringify(settings))
    emit('update:settings', { ...settings })
}

const resetSettings = () => {
    if (confirm('确定要恢复默认设置吗？')) {
        Object.assign(settings, defaultSettings)
        saveSettings()
    }
}

const testVoice = async () => {
    if (isTesting.value) return

    isTesting.value = true

    try {
        const apiKey = getApiKey()
        if (!apiKey) {
            alert('请先配置API密钥')
            return
        }

        const testText = '你能用高兴的情感说吗？<|endofprompt|>今天真是太开心了，马上要放假了！I\'m so happy, Spring Festival is coming!'

        const response = await fetch(settings.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: settings.model,
                input: testText,
                voice: settings.voice,
                response_format: settings.response_format,
                sample_rate: settings.sample_rate,
                stream: settings.stream,
                speed: settings.speed,
                gain: settings.gain
            })
        })

        if (!response.ok) {
            throw new Error('语音生成失败')
        }

        const blob = await response.blob()
        const audioUrl = URL.createObjectURL(blob)

        const audio = new Audio(audioUrl)
        await audio.play()

        audio.addEventListener('ended', () => {
            URL.revokeObjectURL(audioUrl)
        })

    } catch (error) {
        console.error('语音测试失败:', error)
        alert('语音测试失败: ' + error.message)
    } finally {
        isTesting.value = false
    }
}

const getApiKey = () => {
    const llmList = JSON.parse(localStorage.getItem('llmList') || '[]')
    const defaultLLM = llmList.find(llm => llm.isDefault) || llmList[0]
    return defaultLLM?.apiKey
}
</script>

<style scoped>
.voice-settings-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
}

.voice-settings-modal {
    background: white;
    border-radius: 16px;
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 24px 16px 24px;
    border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #333;
}

.header-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.doc-link {
    font-size: 12px;
    color: #07c160;
    text-decoration: none;
    padding: 4px 8px;
    border-radius: 4px;
    background: #f0f9f0;
    transition: background-color 0.2s;
}

.doc-link:hover {
    background: #e1f5e1;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #666;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.close-btn:hover {
    background-color: #f0f0f0;
}

.modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 24px;
}

.setting-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid #f5f5f5;
    gap: 16px;
}

.setting-item:last-child {
    border-bottom: none;
}

.setting-info {
    flex: 1;
    min-width: 0;
}

.setting-title {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
}

.setting-desc {
    font-size: 14px;
    color: #666;
    line-height: 1.4;
}

/* 开关样式 */
.switch {
    position: relative;
    display: inline-block;
    width: 52px;
    height: 28px;
    flex-shrink: 0;
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
    transition: 0.3s;
    border-radius: 28px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 22px;
    width: 22px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
}

input:checked+.slider {
    background-color: #07c160;
}

input:checked+.slider:before {
    transform: translateX(24px);
}

/* 选择框样式 */
.setting-select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    background: white;
    min-width: 160px;
    flex-shrink: 0;
}

.setting-select:focus {
    outline: none;
    border-color: #07c160;
}

/* 滑块容器 */
.slider-container {
    min-width: 160px;
    flex-shrink: 0;
}

.range-slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #e0e0e0;
    outline: none;
    -webkit-appearance: none;
    margin-bottom: 8px;
}

.range-slider::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #07c160;
    cursor: pointer;
}

.range-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #07c160;
    cursor: pointer;
    border: none;
}

.range-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #666;
}

/* 测试按钮 */
.test-btn {
    padding: 8px 16px;
    background: #17a2b8;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
    flex-shrink: 0;
}

.test-btn:hover:not(:disabled) {
    background: #138496;
}

.test-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
}

/* 底部按钮 */
.modal-footer {
    display: flex;
    gap: 12px;
    padding: 16px 24px 24px 24px;
    border-top: 1px solid #f0f0f0;
}

.btn {
    flex: 1;
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-secondary {
    background: #f8f9fa;
    color: #666;
    border: 1px solid #e9ecef;
}

.btn-secondary:hover {
    background: #e9ecef;
}

.btn-primary {
    background: #07c160;
    color: white;
}

.btn-primary:hover {
    background: #06a552;
}

/* 响应式设计 */
@media (max-width: 600px) {
    .voice-settings-overlay {
        padding: 10px;
    }

    .voice-settings-modal {
        max-height: 95vh;
    }

    .modal-header,
    .modal-content,
    .modal-footer {
        padding-left: 16px;
        padding-right: 16px;
    }

    .setting-item {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
    }

    .setting-select,
    .slider-container,
    .test-btn {
        min-width: auto;
        width: 100%;
    }

    .modal-footer {
        flex-direction: column;
        gap: 8px;
    }
}
</style>