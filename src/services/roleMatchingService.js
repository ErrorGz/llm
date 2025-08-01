/**
 * 角色匹配服务
 * 提供智能的角色与系统提示词匹配功能
 */

import { roleTemplateService } from './roleTemplateService.js'

class RoleMatchingService {
    constructor() {
        // 关键词权重映射
        this.keywordWeights = {
            // 编程相关
            'code': { roles: ['code_expert'], weight: 0.9 },
            'programming': { roles: ['code_expert'], weight: 0.9 },
            'developer': { roles: ['code_expert'], weight: 0.8 },
            'coding': { roles: ['code_expert'], weight: 0.9 },
            '编程': { roles: ['code_expert'], weight: 0.9 },
            '代码': { roles: ['code_expert'], weight: 0.9 },
            '开发': { roles: ['code_expert'], weight: 0.8 },
            'debug': { roles: ['code_expert'], weight: 0.7 },
            'api': { roles: ['code_expert'], weight: 0.6 },
            'javascript': { roles: ['code_expert'], weight: 0.8 },
            'python': { roles: ['code_expert'], weight: 0.8 },
            'java': { roles: ['code_expert'], weight: 0.8 },
            'react': { roles: ['code_expert'], weight: 0.7 },
            'vue': { roles: ['code_expert'], weight: 0.7 },

            // 创意写作相关
            'creative': { roles: ['creative_writer'], weight: 0.9 },
            'writing': { roles: ['creative_writer'], weight: 0.9 },
            'writer': { roles: ['creative_writer'], weight: 0.8 },
            'story': { roles: ['creative_writer'], weight: 0.8 },
            'content': { roles: ['creative_writer'], weight: 0.7 },
            '创意': { roles: ['creative_writer'], weight: 0.9 },
            '写作': { roles: ['creative_writer'], weight: 0.9 },
            '文案': { roles: ['creative_writer'], weight: 0.8 },
            '故事': { roles: ['creative_writer'], weight: 0.8 },
            '创作': { roles: ['creative_writer'], weight: 0.8 },

            // 数据分析相关
            'data': { roles: ['data_analyst'], weight: 0.8 },
            'analysis': { roles: ['data_analyst'], weight: 0.9 },
            'analyst': { roles: ['data_analyst'], weight: 0.8 },
            'statistics': { roles: ['data_analyst'], weight: 0.8 },
            'chart': { roles: ['data_analyst'], weight: 0.7 },
            '数据': { roles: ['data_analyst'], weight: 0.8 },
            '分析': { roles: ['data_analyst'], weight: 0.9 },
            '统计': { roles: ['data_analyst'], weight: 0.8 },
            '图表': { roles: ['data_analyst'], weight: 0.7 },

            // 商业咨询相关
            'business': { roles: ['business_consultant'], weight: 0.9 },
            'consultant': { roles: ['business_consultant'], weight: 0.8 },
            'strategy': { roles: ['business_consultant'], weight: 0.8 },
            'management': { roles: ['business_consultant'], weight: 0.7 },
            'market': { roles: ['business_consultant'], weight: 0.7 },
            '商业': { roles: ['business_consultant'], weight: 0.9 },
            '商务': { roles: ['business_consultant'], weight: 0.8 },
            '管理': { roles: ['business_consultant'], weight: 0.7 },
            '策略': { roles: ['business_consultant'], weight: 0.8 },
            '市场': { roles: ['business_consultant'], weight: 0.7 },

            // 教学相关
            'teacher': { roles: ['teacher'], weight: 0.9 },
            'teaching': { roles: ['teacher'], weight: 0.9 },
            'education': { roles: ['teacher'], weight: 0.8 },
            'learn': { roles: ['teacher'], weight: 0.7 },
            'tutorial': { roles: ['teacher'], weight: 0.8 },
            '教学': { roles: ['teacher'], weight: 0.9 },
            '教育': { roles: ['teacher'], weight: 0.8 },
            '导师': { roles: ['teacher'], weight: 0.8 },
            '学习': { roles: ['teacher'], weight: 0.7 },
            '教程': { roles: ['teacher'], weight: 0.8 },

            // 心理咨询相关
            'psychology': { roles: ['psychologist'], weight: 0.9 },
            'psychologist': { roles: ['psychologist'], weight: 0.9 },
            'mental': { roles: ['psychologist'], weight: 0.8 },
            'emotion': { roles: ['psychologist'], weight: 0.7 },
            'counseling': { roles: ['psychologist'], weight: 0.8 },
            '心理': { roles: ['psychologist'], weight: 0.9 },
            '情感': { roles: ['psychologist'], weight: 0.7 },
            '咨询': { roles: ['psychologist'], weight: 0.6 },

            // 翻译相关
            'translate': { roles: ['translator'], weight: 0.9 },
            'translation': { roles: ['translator'], weight: 0.9 },
            'language': { roles: ['translator'], weight: 0.7 },
            'multilingual': { roles: ['translator'], weight: 0.8 },
            '翻译': { roles: ['translator'], weight: 0.9 },
            '语言': { roles: ['translator'], weight: 0.7 },
            '多语言': { roles: ['translator'], weight: 0.8 },

            // 研究相关
            'research': { roles: ['researcher'], weight: 0.9 },
            'researcher': { roles: ['researcher'], weight: 0.8 },
            'academic': { roles: ['researcher'], weight: 0.8 },
            'study': { roles: ['researcher'], weight: 0.7 },
            'investigation': { roles: ['researcher'], weight: 0.8 },
            '研究': { roles: ['researcher'], weight: 0.9 },
            '学术': { roles: ['researcher'], weight: 0.8 },
            '调研': { roles: ['researcher'], weight: 0.8 },

            // 生活教练相关
            'life': { roles: ['life_coach'], weight: 0.6 },
            'coach': { roles: ['life_coach'], weight: 0.7 },
            'lifestyle': { roles: ['life_coach'], weight: 0.8 },
            'personal': { roles: ['life_coach'], weight: 0.6 },
            'growth': { roles: ['life_coach'], weight: 0.7 },
            '生活': { roles: ['life_coach'], weight: 0.6 },
            '教练': { roles: ['life_coach'], weight: 0.7 },
            '成长': { roles: ['life_coach'], weight: 0.7 },
            '个人': { roles: ['life_coach'], weight: 0.6 }
        }

        // 系统提示词模式匹配
        this.promptPatterns = [
            {
                pattern: /你是.*程序员|你是.*开发者|你是.*编程|编写.*代码|开发.*应用/i,
                roles: ['code_expert'],
                confidence: 0.9
            },
            {
                pattern: /你是.*写手|你是.*作家|创意.*写作|文案.*创作|故事.*创作/i,
                roles: ['creative_writer'],
                confidence: 0.9
            },
            {
                pattern: /你是.*分析师|数据.*分析|统计.*分析|图表.*制作/i,
                roles: ['data_analyst'],
                confidence: 0.9
            },
            {
                pattern: /你是.*顾问|商业.*咨询|管理.*建议|策略.*规划/i,
                roles: ['business_consultant'],
                confidence: 0.9
            },
            {
                pattern: /你是.*老师|你是.*导师|教学.*指导|学习.*辅导/i,
                roles: ['teacher'],
                confidence: 0.9
            },
            {
                pattern: /你是.*心理|情感.*支持|心理.*健康|心理.*咨询/i,
                roles: ['psychologist'],
                confidence: 0.9
            },
            {
                pattern: /你是.*翻译|语言.*转换|多语言.*支持/i,
                roles: ['translator'],
                confidence: 0.9
            },
            {
                pattern: /你是.*研究员|学术.*研究|科研.*工作|调研.*分析/i,
                roles: ['researcher'],
                confidence: 0.9
            },
            {
                pattern: /生活.*指导|个人.*成长|生活.*规划|习惯.*养成/i,
                roles: ['life_coach'],
                confidence: 0.8
            }
        ]
    }

    /**
     * 基于LLM配置智能匹配角色
     * @param {Object} llmConfig - LLM配置对象
     * @returns {Object} 匹配结果
     */
    matchRole(llmConfig) {
        const results = []

        // 1. 基于名称匹配
        const nameMatches = this.matchByName(llmConfig.name || '')
        results.push(...nameMatches)

        // 2. 基于系统提示词匹配
        const promptMatches = this.matchBySystemPrompt(llmConfig.systemPrompt || '')
        results.push(...promptMatches)

        // 3. 基于模型名称匹配
        const modelMatches = this.matchByModel(llmConfig.model || '')
        results.push(...modelMatches)

        // 4. 合并和排序结果
        const aggregatedResults = this.aggregateResults(results)

        // 5. 返回最佳匹配
        const bestMatch = aggregatedResults[0]
        const allMatches = aggregatedResults.slice(0, 3) // 返回前3个匹配

        return {
            bestMatch: bestMatch ? {
                role: roleTemplateService.getRoleById(bestMatch.roleId),
                confidence: bestMatch.confidence,
                reasons: bestMatch.reasons
            } : null,
            allMatches: allMatches.map(match => ({
                role: roleTemplateService.getRoleById(match.roleId),
                confidence: match.confidence,
                reasons: match.reasons
            })),
            hasMatch: bestMatch && bestMatch.confidence > 0.3
        }
    }

    /**
     * 基于名称匹配角色
     */
    matchByName(name) {
        const results = []
        const lowerName = name.toLowerCase()

        for (const [keyword, config] of Object.entries(this.keywordWeights)) {
            if (lowerName.includes(keyword)) {
                config.roles.forEach(roleId => {
                    results.push({
                        roleId,
                        confidence: config.weight * 0.8, // 名称匹配权重稍低
                        reasons: [`名称包含关键词"${keyword}"`]
                    })
                })
            }
        }

        return results
    }

    /**
     * 基于系统提示词匹配角色
     */
    matchBySystemPrompt(systemPrompt) {
        const results = []
        const lowerPrompt = systemPrompt.toLowerCase()

        // 1. 模式匹配
        this.promptPatterns.forEach(pattern => {
            if (pattern.pattern.test(systemPrompt)) {
                pattern.roles.forEach(roleId => {
                    results.push({
                        roleId,
                        confidence: pattern.confidence,
                        reasons: ['系统提示词模式匹配']
                    })
                })
            }
        })

        // 2. 关键词匹配
        for (const [keyword, config] of Object.entries(this.keywordWeights)) {
            if (lowerPrompt.includes(keyword)) {
                config.roles.forEach(roleId => {
                    results.push({
                        roleId,
                        confidence: config.weight,
                        reasons: [`系统提示词包含关键词"${keyword}"`]
                    })
                })
            }
        }

        return results
    }

    /**
     * 基于模型名称匹配角色
     */
    matchByModel(model) {
        const results = []
        const lowerModel = model.toLowerCase()

        // 特定模型的角色倾向
        const modelRoleMapping = {
            'gpt-4': ['general_assistant'],
            'claude': ['general_assistant'],
            'codellama': ['code_expert'],
            'code': ['code_expert'],
            'chat': ['general_assistant'],
            'instruct': ['teacher']
        }

        for (const [modelKeyword, roles] of Object.entries(modelRoleMapping)) {
            if (lowerModel.includes(modelKeyword)) {
                roles.forEach(roleId => {
                    results.push({
                        roleId,
                        confidence: 0.4, // 模型匹配权重较低
                        reasons: [`模型名称"${model}"暗示特定用途`]
                    })
                })
            }
        }

        return results
    }

    /**
     * 聚合匹配结果
     */
    aggregateResults(results) {
        const roleScores = new Map()

        results.forEach(result => {
            const existing = roleScores.get(result.roleId)
            if (existing) {
                // 合并置信度（取最高值，并加权平均）
                const newConfidence = Math.max(existing.confidence, result.confidence)
                const avgConfidence = (existing.confidence + result.confidence) / 2
                existing.confidence = newConfidence * 0.7 + avgConfidence * 0.3
                existing.reasons.push(...result.reasons)
            } else {
                roleScores.set(result.roleId, {
                    roleId: result.roleId,
                    confidence: result.confidence,
                    reasons: [...result.reasons]
                })
            }
        })

        // 按置信度排序
        return Array.from(roleScores.values())
            .sort((a, b) => b.confidence - a.confidence)
    }

    /**
     * 获取角色推荐解释
     */
    getRecommendationExplanation(matchResult) {
        if (!matchResult.bestMatch) {
            return '未找到明确的角色匹配，建议选择"通用助手"角色。'
        }

        const { role, confidence, reasons } = matchResult.bestMatch
        const confidenceText = confidence > 0.8 ? '高度' : confidence > 0.6 ? '较高' : '一般'

        let explanation = `推荐"${role.name}"角色（${confidenceText}置信度：${Math.round(confidence * 100)}%）。\n\n`
        explanation += `推荐理由：\n${reasons.map(reason => `• ${reason}`).join('\n')}\n\n`
        explanation += `角色描述：${role.description}\n\n`
        explanation += `主要能力：${role.capabilities.join('、')}`

        return explanation
    }
}

export const roleMatchingService = new RoleMatchingService()