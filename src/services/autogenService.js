import { v4 as uuidv4 } from 'uuid';
import { promptService } from './promptService.js';

/**
 * AutoGen 多智能体协作服务
 */
class AutoGenService {
    constructor() {
        this.activeConversations = new Map();
        this.agentTemplates = this.getDefaultAgentTemplates();
        this.workflowTemplates = this.getWorkflowTemplates();

        // 初始化智能体记忆系统
        this.agentMemorySystem = new AgentMemorySystem();

        // 初始化智能体协作引擎
        this.collaborationEngine = new AgentCollaborationEngine(this);

        // 初始化任务进度跟踪器
        this.progressTracker = new TaskProgressTracker(this);
    }

    /**
     * 获取智能体记忆系统实例
     */
    getMemorySystem() {
        return this.agentMemorySystem;
    }

    /**
     * 获取智能体协作引擎实例
     */
    getCollaborationEngine() {
        return this.collaborationEngine;
    }

    /**
     * 获取任务进度跟踪器实例
     */
    getProgressTracker() {
        return this.progressTracker;
    }

    /**
     * 获取提示词服务实例
     */
    getPromptService() {
        return promptService;
    }

    /**
     * 获取增强版智能体模板
     * @param {string} agentType 智能体类型
     * @param {Object} enhancements 增强选项
     * @returns {Object} 增强版智能体模板
     */
    getEnhancedAgentTemplate(agentType, enhancements = {}) {
        const enhancedPrompt = promptService.getEnhancedPrompt(agentType, enhancements);
        if (!enhancedPrompt) {
            return null;
        }

        return {
            name: enhancedPrompt.name,
            role: "assistant",
            systemPrompt: enhancedPrompt.systemPrompt,
            avatar: enhancedPrompt.avatar,
            capabilities: enhancedPrompt.capabilities,
            quality: enhancedPrompt.quality,
            enhancements: enhancedPrompt.enhancements || []
        };
    }

    /**
     * 获取可用的增强版智能体模板
     */
    getAvailableEnhancedTemplates() {
        const enhancedTemplates = {};
        const availablePrompts = promptService.getAllPrompts();

        availablePrompts.forEach(prompt => {
            if (prompt.quality === 'premium') {
                enhancedTemplates[prompt.id] = {
                    name: prompt.name,
                    role: "assistant",
                    systemPrompt: prompt.systemPrompt,
                    avatar: prompt.avatar,
                    capabilities: prompt.capabilities,
                    quality: "premium",
                    source: "enhanced"
                };
            }
        });

        return enhancedTemplates;
    }

    /**
     * 获取默认智能体模板
     */
    getDefaultAgentTemplates() {
        // 获取增强版模板
        const enhancedTemplates = this.getAvailableEnhancedTemplates();

        return {
            // 增强版智能体模板（优先级最高）
            ...enhancedTemplates,
            // 原有角色
            analyst: {
                name: "数据分析师",
                role: "assistant",
                systemPrompt: "你是一名专业的数据分析师，拥有10年以上的数据分析经验。你擅长数据挖掘、统计分析、预测建模和数据可视化。你能够从复杂的数据中提取有价值的商业洞察，并用清晰易懂的方式呈现给决策者。在分析过程中，你会考虑数据质量、统计显著性和业务相关性。",
                avatar: "📊",
                capabilities: ["data_analysis", "visualization", "statistics", "predictive_modeling", "business_intelligence"]
            },
            researcher: {
                name: "研究员",
                role: "assistant",
                systemPrompt: "你是一名资深研究专家，具备强大的信息收集和分析能力。你擅长文献调研、市场调研、竞品分析和趋势预测。你能够快速定位相关资源，评估信息可靠性，并提供基于证据的深度分析报告。",
                avatar: "🔍",
                capabilities: ["research", "information_gathering", "analysis", "literature_review", "market_research"]
            },
            coder: {
                name: "程序员",
                role: "assistant",
                systemPrompt: "你是一名资深软件工程师，拥有15年以上的开发经验。你精通多种编程语言和框架，擅长系统架构设计、代码优化和问题诊断。你遵循最佳实践，注重代码质量、性能和可维护性。你能够将复杂的业务需求转化为高效的技术解决方案。",
                avatar: "💻",
                capabilities: ["coding", "debugging", "system_design", "architecture", "performance_optimization"]
            },
            coordinator: {
                name: "协调员",
                role: "assistant",
                systemPrompt: "你是一名经验丰富的项目协调员，擅长团队管理、任务分配和进度跟踪。你具备出色的沟通技巧和组织能力，能够平衡不同团队成员的观点，确保项目目标的实现。你会主动识别风险、协调资源并促进团队协作。",
                avatar: "🎯",
                capabilities: ["project_management", "coordination", "integration", "team_management", "risk_assessment"]
            },

            // 新增专业角色
            legal_advisor: {
                name: "法律顾问",
                role: "assistant",
                systemPrompt: "你是一名专业的法律顾问，拥有丰富的法律实务经验。你擅长合规审查、风险评估、合同分析和法律咨询。你能够识别潜在的法律风险，提供合规建议，并确保业务活动符合相关法律法规。你会用通俗易懂的语言解释复杂的法律概念。",
                avatar: "⚖️",
                capabilities: ["legal_review", "compliance", "risk_assessment", "contract_analysis", "regulatory_guidance"]
            },
            financial_analyst: {
                name: "财务分析师",
                role: "assistant",
                systemPrompt: "你是一名专业的财务分析师，具备深厚的财务和投资分析能力。你擅长财务建模、成本效益分析、投资评估和风险管理。你能够提供准确的财务预测，评估投资机会，并为业务决策提供数据支持。",
                avatar: "💰",
                capabilities: ["financial_modeling", "investment_analysis", "cost_benefit_analysis", "budgeting", "risk_management"]
            },
            creative_designer: {
                name: "创意设计师",
                role: "assistant",
                systemPrompt: "你是一名富有创意的设计师，具备敏锐的审美眼光和创新思维。你擅长UI/UX设计、品牌策划、视觉传达和用户体验优化。你能够将抽象的概念转化为具体的视觉方案，并考虑用户需求和业务目标的平衡。",
                avatar: "🎨",
                capabilities: ["ui_ux_design", "brand_design", "visual_communication", "user_experience", "creative_strategy"]
            },
            psychologist: {
                name: "心理咨询师",
                role: "assistant",
                systemPrompt: "你是一名专业的心理咨询师，具备深入的人类行为和心理学知识。你擅长用户行为分析、情感分析、决策心理学和团队动力学。你能够从心理学角度分析问题，提供人性化的解决方案，并帮助理解用户需求和行为模式。",
                avatar: "🧠",
                capabilities: ["behavioral_analysis", "emotional_intelligence", "decision_psychology", "user_psychology", "team_dynamics"]
            },
            product_manager: {
                name: "产品经理",
                role: "assistant",
                systemPrompt: "你是一名经验丰富的产品经理，具备敏锐的市场洞察力和产品思维。你擅长需求分析、产品规划、用户体验设计和市场策略制定。你能够平衡用户需求、技术可行性和商业价值，推动产品的成功发展。",
                avatar: "📋",
                capabilities: ["product_strategy", "requirement_analysis", "market_research", "user_experience", "roadmap_planning"]
            },
            marketing_expert: {
                name: "市场营销专家",
                role: "assistant",
                systemPrompt: "你是一名资深的市场营销专家，拥有丰富的品牌建设和市场推广经验。你擅长市场分析、营销策略、内容营销和客户关系管理。你能够制定有效的营销方案，提升品牌知名度和市场占有率。",
                avatar: "📈",
                capabilities: ["marketing_strategy", "brand_management", "content_marketing", "customer_acquisition", "market_analysis"]
            },
            technical_architect: {
                name: "技术架构师",
                role: "assistant",
                systemPrompt: "你是一名资深的技术架构师，具备深厚的技术功底和系统设计经验。你擅长系统架构设计、技术选型、性能优化和可扩展性规划。你能够设计高可用、高性能的技术解决方案，并考虑长期的技术演进路径。",
                avatar: "🏗️",
                capabilities: ["system_architecture", "technology_selection", "scalability_design", "performance_optimization", "technical_strategy"]
            },
            qa_engineer: {
                name: "质量保证工程师",
                role: "assistant",
                systemPrompt: "你是一名专业的质量保证工程师，具备严谨的测试思维和质量意识。你擅长测试策略制定、缺陷分析、质量评估和流程改进。你能够从多个角度审视产品质量，识别潜在风险，并提供有效的质量保障方案。",
                avatar: "🔍",
                capabilities: ["quality_assurance", "test_strategy", "defect_analysis", "process_improvement", "risk_identification"]
            },
            business_consultant: {
                name: "商业顾问",
                role: "assistant",
                systemPrompt: "你是一名经验丰富的商业顾问，具备全面的商业思维和战略眼光。你擅长商业模式分析、战略规划、运营优化和变革管理。你能够从宏观角度分析业务问题，提供系统性的解决方案和改进建议。",
                avatar: "💼",
                capabilities: ["business_strategy", "operations_optimization", "change_management", "business_model_analysis", "strategic_planning"]
            },
            user_proxy: {
                name: "用户代理",
                role: "user_proxy",
                systemPrompt: "你代表用户参与讨论，能够从用户角度提供反馈和建议。你具备良好的沟通能力，能够准确理解和传达用户需求，在必要时协助获取外部信息或工具支持。你会确保用户的声音在团队讨论中得到充分体现。",
                avatar: "👤",
                capabilities: ["user_interaction", "requirement_clarification", "feedback_collection", "user_advocacy"]
            }
        };
    }

    /**
     * 获取工作流模板
     */
    getWorkflowTemplates() {
        return {
            product_development: {
                id: 'product_development',
                name: '产品开发流程',
                description: '完整的产品开发工作流，从需求分析到上线发布',
                icon: '🚀',
                workflowType: 'sequential',
                agents: [
                    { type: 'product_manager', required: true },
                    { type: 'creative_designer', required: true },
                    { type: 'technical_architect', required: true },
                    { type: 'coder', required: true },
                    { type: 'qa_engineer', required: true }
                ],
                workflow: [
                    { phase: 'requirements', agent: 'product_manager', description: '需求分析与产品规划' },
                    { phase: 'design', agent: 'creative_designer', description: 'UI/UX设计与原型制作' },
                    { phase: 'architecture', agent: 'technical_architect', description: '技术架构设计' },
                    { phase: 'development', agent: 'coder', description: '功能开发与实现' },
                    { phase: 'testing', agent: 'qa_engineer', description: '质量测试与验收' }
                ],
                tags: ['产品', '开发', '团队协作'],
                estimatedTime: '2-4 周'
            },

            research_project: {
                id: 'research_project',
                name: '学术研究项目',
                description: '系统化的研究项目执行流程，从文献调研到论文撰写',
                icon: '🔬',
                workflowType: 'sequential',
                agents: [
                    { type: 'researcher', required: true },
                    { type: 'analyst', required: true },
                    { type: 'coordinator', required: true }
                ],
                workflow: [
                    { phase: 'literature_review', agent: 'researcher', description: '文献调研与背景分析' },
                    { phase: 'methodology', agent: 'researcher', description: '研究方法设计' },
                    { phase: 'data_collection', agent: 'researcher', description: '数据收集与整理' },
                    { phase: 'analysis', agent: 'analyst', description: '数据分析与结果解读' },
                    { phase: 'reporting', agent: 'coordinator', description: '研究报告撰写' }
                ],
                tags: ['研究', '学术', '分析'],
                estimatedTime: '4-8 周'
            },

            business_analysis: {
                id: 'business_analysis',
                name: '商业分析项目',
                description: '全面的商业分析流程，从市场研究到战略建议',
                icon: '📊',
                workflowType: 'group_chat',
                agents: [
                    { type: 'business_consultant', required: true },
                    { type: 'marketing_expert', required: true },
                    { type: 'financial_analyst', required: true },
                    { type: 'analyst', required: true }
                ],
                workflow: [
                    { phase: 'market_analysis', agent: 'marketing_expert', description: '市场环境分析' },
                    { phase: 'financial_analysis', agent: 'financial_analyst', description: '财务状况分析' },
                    { phase: 'data_analysis', agent: 'analyst', description: '业务数据分析' },
                    { phase: 'strategy', agent: 'business_consultant', description: '战略建议制定' }
                ],
                tags: ['商业', '分析', '战略'],
                estimatedTime: '2-3 周'
            },

            software_development: {
                id: 'software_development',
                name: '软件开发项目',
                description: '敏捷软件开发流程，从需求到部署',
                icon: '💻',
                workflowType: 'round_robin',
                agents: [
                    { type: 'product_manager', required: true },
                    { type: 'technical_architect', required: true },
                    { type: 'coder', required: true },
                    { type: 'qa_engineer', required: true },
                    { type: 'coordinator', required: true }
                ],
                workflow: [
                    { phase: 'planning', agent: 'product_manager', description: '需求分析与功能规划' },
                    { phase: 'design', agent: 'technical_architect', description: '系统设计与架构' },
                    { phase: 'sprint', agent: 'coder', description: '迭代开发' },
                    { phase: 'testing', agent: 'qa_engineer', description: '测试与质量保证' },
                    { phase: 'review', agent: 'coordinator', description: '代码审查与部署' }
                ],
                tags: ['软件', '开发', '敏捷'],
                estimatedTime: '3-6 周'
            },

            marketing_campaign: {
                id: 'marketing_campaign',
                name: '营销活动策划',
                description: '完整的营销活动策划与执行流程',
                icon: '📈',
                workflowType: 'group_chat',
                agents: [
                    { type: 'marketing_expert', required: true },
                    { type: 'creative_designer', required: true },
                    { type: 'analyst', required: true },
                    { type: 'coordinator', required: true }
                ],
                workflow: [
                    { phase: 'strategy', agent: 'marketing_expert', description: '营销策略制定' },
                    { phase: 'creative', agent: 'creative_designer', description: '创意设计与内容制作' },
                    { phase: 'analysis', agent: 'analyst', description: '效果预测与数据分析' },
                    { phase: 'execution', agent: 'coordinator', description: '活动执行与监控' }
                ],
                tags: ['营销', '推广', '创意'],
                estimatedTime: '2-4 周'
            },

            legal_compliance: {
                id: 'legal_compliance',
                name: '法律合规审查',
                description: '全面的法律合规审查与风险评估流程',
                icon: '⚖️',
                workflowType: 'sequential',
                agents: [
                    { type: 'legal_advisor', required: true },
                    { type: 'business_consultant', required: true },
                    { type: 'coordinator', required: true }
                ],
                workflow: [
                    { phase: 'legal_review', agent: 'legal_advisor', description: '法律条款审查' },
                    { phase: 'risk_assessment', agent: 'legal_advisor', description: '风险评估与分析' },
                    { phase: 'business_impact', agent: 'business_consultant', description: '业务影响评估' },
                    { phase: 'recommendations', agent: 'coordinator', description: '合规建议整理' }
                ],
                tags: ['法律', '合规', '风险'],
                estimatedTime: '1-2 周'
            },

            content_creation: {
                id: 'content_creation',
                name: '内容创作流程',
                description: '从策划到发布的完整内容创作工作流',
                icon: '✍️',
                workflowType: 'sequential',
                agents: [
                    { type: 'marketing_expert', required: true },
                    { type: 'creative_designer', required: true },
                    { type: 'researcher', required: true },
                    { type: 'coordinator', required: true }
                ],
                workflow: [
                    { phase: 'planning', agent: 'marketing_expert', description: '内容策略与规划' },
                    { phase: 'research', agent: 'researcher', description: '素材收集与调研' },
                    { phase: 'creation', agent: 'creative_designer', description: '内容创作与设计' },
                    { phase: 'review', agent: 'coordinator', description: '内容审核与发布' }
                ],
                tags: ['内容', '创作', '营销'],
                estimatedTime: '1-3 周'
            },

            user_experience: {
                id: 'user_experience',
                name: '用户体验优化',
                description: '用户体验研究与优化改进流程',
                icon: '👥',
                workflowType: 'group_chat',
                agents: [
                    { type: 'psychologist', required: true },
                    { type: 'creative_designer', required: true },
                    { type: 'analyst', required: true },
                    { type: 'product_manager', required: true }
                ],
                workflow: [
                    { phase: 'user_research', agent: 'psychologist', description: '用户行为研究' },
                    { phase: 'data_analysis', agent: 'analyst', description: '用户数据分析' },
                    { phase: 'design_optimization', agent: 'creative_designer', description: '界面优化设计' },
                    { phase: 'product_integration', agent: 'product_manager', description: '产品功能整合' }
                ],
                tags: ['用户体验', '设计', '优化'],
                estimatedTime: '2-4 周'
            }
        };
    }

    /**
     * 获取工作流模板列表
     */
    getWorkflowTemplatesList() {
        return Object.values(this.workflowTemplates);
    }

    /**
     * 根据模板创建智能体团队
     */
    async createTeamFromTemplate(templateId, teamName, llmConfig) {
        const template = this.workflowTemplates[templateId];
        if (!template) {
            throw new Error('工作流模板不存在');
        }

        const teamConfig = {
            name: teamName || template.name,
            workflowType: template.workflowType,
            agents: template.agents.map(agentConfig => ({
                type: agentConfig.type,
                llmConfig: llmConfig
            })),
            metadata: {
                templateId: templateId,
                workflow: template.workflow,
                estimatedTime: template.estimatedTime,
                tags: template.tags
            }
        };

        return await this.createAgentTeam(teamConfig);
    }

    /**
     * 创建智能体团队
     */
    async createAgentTeam(teamConfig) {
        const conversationId = uuidv4();
        const agents = [];

        // 根据配置创建智能体
        for (const agentConfig of teamConfig.agents) {
            const template = this.agentTemplates[agentConfig.type] || agentConfig;
            const agent = {
                id: uuidv4(),
                name: template.name,
                role: template.role,
                systemPrompt: agentConfig.customPrompt || template.systemPrompt,
                avatar: template.avatar,
                capabilities: template.capabilities || [],
                llmConfig: agentConfig.llmConfig,
                status: 'idle' // idle, thinking, speaking, waiting
            };
            agents.push(agent);
        }

        const conversation = {
            id: conversationId,
            teamName: teamConfig.name,
            agents,
            messages: [],
            currentSpeaker: null,
            workflowType: teamConfig.workflowType || 'round_robin', // round_robin, group_chat, sequential
            maxTurns: teamConfig.maxTurns || 10,
            turnCount: 0,
            status: 'active' // active, paused, completed
        };

        this.activeConversations.set(conversationId, conversation);
        return conversation;
    }

    /**
     * 发送消息并启动多智能体对话 (支持流式推送)
     */
    async sendMessage(conversationId, message, senderId = 'user', onStreamUpdate = null) {
        const conversation = this.activeConversations.get(conversationId);
        if (!conversation) {
            throw new Error('会话不存在');
        }

        // 添加用户消息
        const userMessage = {
            id: uuidv4(),
            content: message,
            sender: senderId,
            senderName: senderId === 'user' ? '我' : senderId,
            timestamp: Date.now(),
            isSelf: senderId === 'user',
            avatar: senderId === 'user' ? '👤' : '🤖'
        };

        conversation.messages.push(userMessage);

        // 检查是否需要任务分解
        const taskDecomposition = await this.analyzeTaskComplexity(message, conversation);
        if (taskDecomposition.needsDecomposition) {
            return await this.handleTaskDecomposition(conversation, message, taskDecomposition, onStreamUpdate);
        }

        // 根据工作流类型处理消息
        switch (conversation.workflowType) {
            case 'round_robin':
                return await this.handleRoundRobinStream(conversation, message, onStreamUpdate);
            case 'group_chat':
                return await this.handleGroupChatStream(conversation, message, onStreamUpdate);
            case 'sequential':
                return await this.handleSequentialStream(conversation, message, onStreamUpdate);
            default:
                return await this.handleRoundRobinStream(conversation, message, onStreamUpdate);
        }
    }

    /**
     * 分析任务复杂度，判断是否需要分解
     */
    async analyzeTaskComplexity(message, conversation) {
        const complexityIndicators = {
            multipleSteps: ['步骤', '然后', '接下来', '第一', '第二', '最后'],
            multipleDomains: ['设计', '开发', '测试', '分析', '研究', '营销'],
            complexKeywords: ['完整的', '全面的', '详细的', '系统的', '端到端', '整体'],
            projectKeywords: ['项目', '方案', '计划', '策略', '系统', '平台']
        };

        let complexityScore = 0;
        const lowerMessage = message.toLowerCase();

        // 检查多步骤指标
        complexityIndicators.multipleSteps.forEach(indicator => {
            if (lowerMessage.includes(indicator)) complexityScore += 10;
        });

        // 检查多领域指标
        let domainCount = 0;
        complexityIndicators.multipleDomains.forEach(domain => {
            if (lowerMessage.includes(domain)) domainCount++;
        });
        complexityScore += domainCount * 15;

        // 检查复杂度关键词
        complexityIndicators.complexKeywords.forEach(keyword => {
            if (lowerMessage.includes(keyword)) complexityScore += 20;
        });

        // 检查项目关键词
        complexityIndicators.projectKeywords.forEach(keyword => {
            if (lowerMessage.includes(keyword)) complexityScore += 15;
        });

        // 消息长度也是复杂度的一个指标
        if (message.length > 200) complexityScore += 10;
        if (message.length > 500) complexityScore += 20;

        return {
            needsDecomposition: complexityScore >= 50, // 阈值可调
            score: complexityScore,
            suggestedApproach: this.suggestDecompositionApproach(message, conversation)
        };
    }

    /**
     * 建议分解方式
     */
    suggestDecompositionApproach(message, conversation) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('产品') && lowerMessage.includes('开发')) {
            return 'product_development';
        } else if (lowerMessage.includes('研究') || lowerMessage.includes('分析')) {
            return 'research_analysis';
        } else if (lowerMessage.includes('设计') && lowerMessage.includes('开发')) {
            return 'design_development';
        } else if (lowerMessage.includes('营销') || lowerMessage.includes('推广')) {
            return 'marketing_campaign';
        } else {
            return 'general_project';
        }
    }

    /**
     * 处理任务分解
     */
    async handleTaskDecomposition(conversation, originalMessage, taskDecomposition, onStreamUpdate) {
        // 找到协调员智能体
        const coordinator = conversation.agents.find(agent =>
            agent.capabilities.includes('coordination') || agent.capabilities.includes('project_management')
        );

        if (!coordinator) {
            // 如果没有协调员，按正常流程处理
            return await this.handleGroupChatStream(conversation, originalMessage, onStreamUpdate);
        }

        // 协调员开始任务分解
        coordinator.status = 'thinking';

        if (onStreamUpdate) {
            onStreamUpdate({
                type: 'task_decomposition_start',
                agent: coordinator,
                originalTask: originalMessage,
                approach: taskDecomposition.suggestedApproach,
                conversation
            });
        }

        // 生成任务分解方案
        const decompositionPlan = await this.generateTaskDecomposition(coordinator, conversation, originalMessage, taskDecomposition.suggestedApproach);

        // 创建协调员的分解消息
        const decompositionMessage = {
            id: uuidv4(),
            content: decompositionPlan.content,
            sender: coordinator.id,
            senderName: coordinator.name,
            timestamp: Date.now(),
            isSelf: false,
            avatar: coordinator.avatar,
            metadata: {
                type: 'task_decomposition',
                subtasks: decompositionPlan.subtasks,
                assignedAgents: decompositionPlan.assignedAgents
            }
        };

        conversation.messages.push(decompositionMessage);
        coordinator.status = 'idle';

        if (onStreamUpdate) {
            onStreamUpdate({
                type: 'task_decomposition_complete',
                agent: coordinator,
                message: decompositionMessage,
                plan: decompositionPlan,
                conversation
            });
        }

        // 按照分解方案执行子任务
        return await this.executeDecomposedTasks(conversation, decompositionPlan, onStreamUpdate);
    }

    /**
     * 生成任务分解方案
     */
    async generateTaskDecomposition(coordinator, conversation, originalMessage, approach) {
        const decompositionPrompts = {
            product_development: `作为项目协调员，请将以下产品开发任务分解为具体的子任务：
            
任务：${originalMessage}

请按以下格式输出分解方案：
1. 任务分解说明
2. 具体子任务列表（每个子任务包括：任务描述、建议负责角色、预估时间）
3. 执行顺序建议

团队成员：${conversation.agents.map(a => `${a.name}(${a.capabilities.join(', ')})`).join(', ')}`,

            research_analysis: `作为研究协调员，请将以下研究分析任务分解为系统化的研究步骤：
            
任务：${originalMessage}

请提供：
1. 研究方法建议
2. 具体研究步骤
3. 每步骤的负责角色和产出要求
4. 数据收集和分析计划

可用专家：${conversation.agents.map(a => `${a.name}(${a.capabilities.join(', ')})`).join(', ')}`,

            design_development: `作为设计开发协调员，请制定以下设计开发任务的执行计划：
            
任务：${originalMessage}

请包括：
1. 设计阶段规划
2. 开发阶段规划
3. 测试与优化计划
4. 团队协作方式

团队能力：${conversation.agents.map(a => `${a.name}(${a.capabilities.join(', ')})`).join(', ')}`,

            marketing_campaign: `作为营销活动协调员，请策划以下营销任务的执行方案：
            
任务：${originalMessage}

请提供：
1. 营销策略框架
2. 具体执行步骤
3. 各专业角色的职责分工
4. 效果评估方法

团队专长：${conversation.agents.map(a => `${a.name}(${a.capabilities.join(', ')})`).join(', ')}`,

            general_project: `作为项目协调员，请将以下任务进行合理分解：
            
任务：${originalMessage}

请提供：
1. 任务分析和分解思路
2. 具体子任务清单
3. 执行顺序和依赖关系
4. 角色分工建议

可用资源：${conversation.agents.map(a => `${a.name}(${a.capabilities.join(', ')})`).join(', ')}`
        };

        try {
            const contextMessages = [{
                role: 'system',
                content: coordinator.systemPrompt + '\n\n' + decompositionPrompts[approach]
            }, {
                role: 'user',
                content: originalMessage
            }];

            const response = await this.callLLM(coordinator.llmConfig, contextMessages);

            // 解析分解方案并提取子任务
            const subtasks = this.parseSubtasks(response.content, conversation.agents);

            return {
                content: response.content,
                subtasks: subtasks,
                assignedAgents: this.assignAgentsToSubtasks(subtasks, conversation.agents),
                approach: approach
            };
        } catch (error) {
            console.error('生成任务分解方案失败:', error);
            return {
                content: `任务分解过程中遇到问题：${error.message}。将按照常规流程处理。`,
                subtasks: [],
                assignedAgents: [],
                approach: approach
            };
        }
    }

    /**
     * 解析子任务
     */
    parseSubtasks(content, agents) {
        // 简单的子任务解析逻辑
        const lines = content.split('\n');
        const subtasks = [];

        lines.forEach((line, index) => {
            if (line.match(/^\d+\.|^-|^•/)) {
                subtasks.push({
                    id: `subtask_${index}`,
                    description: line.replace(/^\d+\.|^-|^•/, '').trim(),
                    status: 'pending',
                    assignedAgent: null
                });
            }
        });

        return subtasks;
    }

    /**
     * 为子任务分配智能体
     */
    assignAgentsToSubtasks(subtasks, agents) {
        const assignments = [];

        subtasks.forEach(subtask => {
            // 基于子任务描述选择最合适的智能体
            const bestAgent = this.selectAgentForSubtask(subtask.description, agents);
            if (bestAgent) {
                assignments.push({
                    subtaskId: subtask.id,
                    agentId: bestAgent.id,
                    agentName: bestAgent.name
                });
                subtask.assignedAgent = bestAgent.id;
            }
        });

        return assignments;
    }

    /**
     * 为子任务选择智能体
     */
    selectAgentForSubtask(taskDescription, agents) {
        const assistantAgents = agents.filter(agent => agent.role === 'assistant');
        return this.intelligentAgentSelection(assistantAgents, taskDescription);
    }

    /**
     * 执行分解后的任务
     */
    async executeDecomposedTasks(conversation, decompositionPlan, onStreamUpdate) {
        // 这里可以实现按照分解方案执行子任务的逻辑
        // 暂时返回会话，后续可以扩展为实际执行子任务

        if (onStreamUpdate) {
            onStreamUpdate({
                type: 'decomposed_execution_start',
                plan: decompositionPlan,
                conversation
            });
        }

        // 可以在这里实现子任务的串行或并行执行
        // 目前先返回分解结果
        return conversation;
    }

    /**
     * 轮询模式处理
     */
    async handleRoundRobin(conversation, message) {
        const assistantAgents = conversation.agents.filter(agent => agent.role === 'assistant');
        if (assistantAgents.length === 0) return conversation;

        // 选择下一个智能体
        const currentIndex = conversation.turnCount % assistantAgents.length;
        const currentAgent = assistantAgents[currentIndex];

        conversation.currentSpeaker = currentAgent.id;
        conversation.turnCount++;

        // 生成回复
        const response = await this.generateAgentResponse(currentAgent, conversation, message);

        const responseMessage = {
            id: uuidv4(),
            content: response.content,
            sender: currentAgent.id,
            senderName: currentAgent.name,
            timestamp: Date.now(),
            isSelf: false,
            avatar: currentAgent.avatar,
            metadata: response.metadata
        };

        conversation.messages.push(responseMessage);
        currentAgent.status = 'idle';

        return conversation;
    }

    /**
     * 轮询模式处理 (流式版本)
     */
    async handleRoundRobinStream(conversation, message, onStreamUpdate) {
        const assistantAgents = conversation.agents.filter(agent => agent.role === 'assistant');
        if (assistantAgents.length === 0) return conversation;

        // 选择下一个智能体
        const currentIndex = conversation.turnCount % assistantAgents.length;
        const currentAgent = assistantAgents[currentIndex];

        conversation.currentSpeaker = currentAgent.id;
        conversation.turnCount++;

        // 创建空的回复消息
        const responseMessage = {
            id: uuidv4(),
            content: '',
            sender: currentAgent.id,
            senderName: currentAgent.name,
            timestamp: Date.now(),
            isSelf: false,
            avatar: currentAgent.avatar,
            metadata: { streaming: true }
        };

        conversation.messages.push(responseMessage);
        currentAgent.status = 'thinking';

        // 通知开始流式更新
        if (onStreamUpdate) {
            onStreamUpdate({
                type: 'agent_start',
                agent: currentAgent,
                message: responseMessage,
                conversation
            });
        }

        // 生成流式回复
        await this.generateAgentResponseStream(currentAgent, conversation, message, (chunk) => {
            // 更新消息内容
            responseMessage.content += chunk;

            // 通知内容更新
            if (onStreamUpdate) {
                onStreamUpdate({
                    type: 'content_update',
                    content: chunk,
                    fullContent: responseMessage.content,
                    message: responseMessage,
                    conversation
                });
            }
        });

        currentAgent.status = 'idle';
        responseMessage.metadata.streaming = false;

        // 通知流式结束
        if (onStreamUpdate) {
            onStreamUpdate({
                type: 'agent_complete',
                agent: currentAgent,
                message: responseMessage,
                conversation
            });
        }

        return conversation;
    }

    /**
     * 群聊模式处理
     */
    async handleGroupChat(conversation, message) {
        // 基于消息内容和智能体能力选择最适合的智能体
        const selectedAgent = await this.selectBestAgent(conversation.agents, message);
        if (!selectedAgent) return conversation;

        conversation.currentSpeaker = selectedAgent.id;
        selectedAgent.status = 'thinking';

        const response = await this.generateAgentResponse(selectedAgent, conversation, message);

        const responseMessage = {
            id: uuidv4(),
            content: response.content,
            sender: selectedAgent.id,
            senderName: selectedAgent.name,
            timestamp: Date.now(),
            isSelf: false,
            avatar: selectedAgent.avatar,
            metadata: response.metadata
        };

        conversation.messages.push(responseMessage);
        selectedAgent.status = 'idle';

        return conversation;
    }

    /**
     * 群聊模式处理 (流式版本)
     */
    async handleGroupChatStream(conversation, message, onStreamUpdate) {
        // 基于消息内容和智能体能力选择最适合的智能体
        const selectedAgent = await this.selectBestAgent(conversation.agents, message);
        if (!selectedAgent) return conversation;

        conversation.currentSpeaker = selectedAgent.id;
        selectedAgent.status = 'thinking';

        // 创建空的回复消息
        const responseMessage = {
            id: uuidv4(),
            content: '',
            sender: selectedAgent.id,
            senderName: selectedAgent.name,
            timestamp: Date.now(),
            isSelf: false,
            avatar: selectedAgent.avatar,
            metadata: { streaming: true, selectedByAI: true }
        };

        conversation.messages.push(responseMessage);

        // 通知智能体选择和开始
        if (onStreamUpdate) {
            onStreamUpdate({
                type: 'agent_selected',
                agent: selectedAgent,
                reason: '根据消息内容智能选择',
                conversation
            });

            onStreamUpdate({
                type: 'agent_start',
                agent: selectedAgent,
                message: responseMessage,
                conversation
            });
        }

        // 生成流式回复
        await this.generateAgentResponseStream(selectedAgent, conversation, message, (chunk) => {
            responseMessage.content += chunk;

            if (onStreamUpdate) {
                onStreamUpdate({
                    type: 'content_update',
                    content: chunk,
                    fullContent: responseMessage.content,
                    message: responseMessage,
                    conversation
                });
            }
        });

        selectedAgent.status = 'idle';
        responseMessage.metadata.streaming = false;

        if (onStreamUpdate) {
            onStreamUpdate({
                type: 'agent_complete',
                agent: selectedAgent,
                message: responseMessage,
                conversation
            });
        }

        return conversation;
    }

    /**
     * 顺序模式处理
     */
    async handleSequential(conversation, message) {
        // 按预定义顺序让智能体依次处理
        const assistantAgents = conversation.agents.filter(agent => agent.role === 'assistant');

        for (const agent of assistantAgents) {
            conversation.currentSpeaker = agent.id;
            agent.status = 'thinking';

            const response = await this.generateAgentResponse(agent, conversation, message);

            const responseMessage = {
                id: uuidv4(),
                content: response.content,
                sender: agent.id,
                senderName: agent.name,
                timestamp: Date.now(),
                isSelf: false,
                avatar: agent.avatar,
                metadata: response.metadata
            };

            conversation.messages.push(responseMessage);
            agent.status = 'idle';

            // 短暂延迟，让界面可以显示进度
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        return conversation;
    }

    /**
     * 顺序模式处理 (流式版本)
     */
    async handleSequentialStream(conversation, message, onStreamUpdate) {
        // 按预定义顺序让智能体依次处理
        const assistantAgents = conversation.agents.filter(agent => agent.role === 'assistant');

        for (let i = 0; i < assistantAgents.length; i++) {
            const agent = assistantAgents[i];
            conversation.currentSpeaker = agent.id;
            agent.status = 'thinking';

            // 创建空的回复消息
            const responseMessage = {
                id: uuidv4(),
                content: '',
                sender: agent.id,
                senderName: agent.name,
                timestamp: Date.now(),
                isSelf: false,
                avatar: agent.avatar,
                metadata: { streaming: true, sequenceIndex: i, totalAgents: assistantAgents.length }
            };

            conversation.messages.push(responseMessage);

            // 通知顺序处理开始
            if (onStreamUpdate) {
                onStreamUpdate({
                    type: 'sequence_start',
                    agent: agent,
                    index: i,
                    total: assistantAgents.length,
                    message: responseMessage,
                    conversation
                });
            }

            // 生成流式回复
            await this.generateAgentResponseStream(agent, conversation, message, (chunk) => {
                responseMessage.content += chunk;

                if (onStreamUpdate) {
                    onStreamUpdate({
                        type: 'content_update',
                        content: chunk,
                        fullContent: responseMessage.content,
                        message: responseMessage,
                        conversation
                    });
                }
            });

            agent.status = 'idle';
            responseMessage.metadata.streaming = false;

            if (onStreamUpdate) {
                onStreamUpdate({
                    type: 'sequence_complete',
                    agent: agent,
                    index: i,
                    total: assistantAgents.length,
                    message: responseMessage,
                    conversation
                });
            }

            // 智能体间短暂延迟
            if (i < assistantAgents.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        return conversation;
    }

    /**
     * 根据消息内容选择最佳智能体
     */
    async selectBestAgent(agents, message) {
        const assistantAgents = agents.filter(agent => agent.role === 'assistant');
        if (assistantAgents.length === 0) return null;

        // 使用改进的智能体选择算法
        const selectedAgent = await this.intelligentAgentSelection(assistantAgents, message);
        return selectedAgent || assistantAgents[0];
    }

    /**
     * 智能体选择算法 - 基于语义分析和能力匹配
     */
    async intelligentAgentSelection(agents, message) {
        const lowerMessage = message.toLowerCase();
        const scoreMap = new Map();

        // 为每个智能体计算匹配分数
        agents.forEach(agent => {
            let score = 0;

            // 基于关键词的能力匹配
            score += this.calculateKeywordScore(lowerMessage, agent);

            // 基于能力领域的专业匹配
            score += this.calculateCapabilityScore(lowerMessage, agent);

            // 考虑历史表现（如果有的话）
            score += this.calculateHistoryScore(agent);

            scoreMap.set(agent.id, { agent, score });
        });

        // 返回得分最高的智能体
        const sortedAgents = Array.from(scoreMap.values()).sort((a, b) => b.score - a.score);
        return sortedAgents[0]?.agent;
    }

    /**
     * 计算关键词匹配分数
     */
    calculateKeywordScore(message, agent) {
        let score = 0;
        const keywords = {
            'data_analysis': ['数据', '分析', '图表', '统计', '报表', '可视化', '预测', '模型'],
            'research': ['搜索', '查找', '研究', '信息', '调研', '文献', '市场', '趋势'],
            'coding': ['代码', '编程', '脚本', '函数', '算法', '架构', '系统', '开发', '技术'],
            'legal_review': ['法律', '合规', '风险', '合同', '条款', '法规', '政策'],
            'financial_modeling': ['财务', '预算', '成本', '投资', '收益', '现金流', '估值'],
            'ui_ux_design': ['设计', '界面', '用户体验', '交互', '原型', '视觉', '品牌'],
            'behavioral_analysis': ['心理', '行为', '用户', '情感', '决策', '动机'],
            'product_strategy': ['产品', '需求', '功能', '用户', '市场', '竞品', '路径'],
            'marketing_strategy': ['营销', '推广', '品牌', '客户', '渠道', '转化', '获客'],
            'project_management': ['项目', '管理', '计划', '协调', '进度', '团队', '资源'],
            'business_strategy': ['战略', '商业', '运营', '流程', '优化', '变革']
        };

        agent.capabilities.forEach(capability => {
            if (keywords[capability]) {
                keywords[capability].forEach(keyword => {
                    if (message.includes(keyword)) {
                        score += 10; // 每个匹配的关键词加10分
                    }
                });
            }
        });

        return score;
    }

    /**
     * 计算能力匹配分数
     */
    calculateCapabilityScore(message, agent) {
        let score = 0;

        // 基于消息类型判断所需能力
        if (this.isAnalysisRequest(message)) {
            if (agent.capabilities.includes('data_analysis') || agent.capabilities.includes('business_intelligence')) {
                score += 20;
            }
        }

        if (this.isTechnicalRequest(message)) {
            if (agent.capabilities.includes('coding') || agent.capabilities.includes('system_architecture')) {
                score += 20;
            }
        }

        if (this.isCreativeRequest(message)) {
            if (agent.capabilities.includes('ui_ux_design') || agent.capabilities.includes('creative_strategy')) {
                score += 20;
            }
        }

        if (this.isBusinessRequest(message)) {
            if (agent.capabilities.includes('business_strategy') || agent.capabilities.includes('operations_optimization')) {
                score += 20;
            }
        }

        return score;
    }

    /**
     * 计算历史表现分数
     */
    calculateHistoryScore(agent) {
        // 这里可以根据智能体的历史表现进行评分
        // 暂时返回固定值，后续可以实现更复杂的逻辑
        return agent.capabilities.length * 2; // 能力越多，基础分越高
    }

    /**
     * 判断是否为分析类请求
     */
    isAnalysisRequest(message) {
        const analysisKeywords = ['分析', '数据', '统计', '报告', '趋势', '对比'];
        return analysisKeywords.some(keyword => message.includes(keyword));
    }

    /**
     * 判断是否为技术类请求
     */
    isTechnicalRequest(message) {
        const techKeywords = ['代码', '编程', '开发', '系统', '架构', '技术', '算法'];
        return techKeywords.some(keyword => message.includes(keyword));
    }

    /**
     * 判断是否为创意类请求
     */
    isCreativeRequest(message) {
        const creativeKeywords = ['设计', '创意', '界面', '视觉', '品牌', '用户体验'];
        return creativeKeywords.some(keyword => message.includes(keyword));
    }

    /**
     * 判断是否为商业类请求
     */
    isBusinessRequest(message) {
        const businessKeywords = ['商业', '战略', '运营', '管理', '流程', '优化'];
        return businessKeywords.some(keyword => message.includes(keyword));
    }

    /**
     * 生成智能体回复
     */
    async generateAgentResponse(agent, conversation, originalMessage) {
        try {
            // 获取智能体记忆系统
            const memorySystem = this.agentMemorySystem;
            const knowledgeBase = memorySystem.getOrCreateKnowledgeBase(agent.id);

            // 从知识库搜索相关知识
            const relatedKnowledge = knowledgeBase.searchKnowledge(originalMessage);

            // 构建上下文消息，包括知识库信息
            const contextMessages = this.buildContextMessages(agent, conversation);

            // 如果有相关知识，添加到上下文
            if (relatedKnowledge.length > 0) {
                contextMessages.push({
                    role: 'system',
                    content: `相关知识库信息：${JSON.stringify(relatedKnowledge)}`
                });
            }

            // 调用LLM生成回复
            const response = await this.callLLM(agent.llmConfig, contextMessages);

            // 记录对话历史
            memorySystem.recordConversation(agent.id, conversation);

            // 记录经验
            memorySystem.recordExperience(agent.id, 'response_generation', {
                messageLength: originalMessage.length,
                responseLength: response.content.length,
                model: agent.llmConfig.model
            });

            // 尝试学习用户偏好（这里需要一个用户ID，暂时使用固定值）
            memorySystem.learnUserPreferences(agent.id, 'default_user', {
                'message_style': this.detectMessageStyle(originalMessage),
                'topic_preference': this.detectTopicPreference(originalMessage)
            });

            // 将新知识添加到知识库
            knowledgeBase.addKnowledge('conversation', {
                originalMessage: originalMessage,
                response: response.content
            });

            return {
                content: response.content,
                metadata: {
                    model: agent.llmConfig.model,
                    tokens: response.usage?.total_tokens || 0,
                    cost: this.calculateCost(response.usage, agent.llmConfig.model)
                }
            };
        } catch (error) {
            console.error('生成智能体回复失败:', error);
            return {
                content: `[${agent.name}] 抱歉，我在处理您的请求时遇到了问题。错误信息：${error.message}`,
                metadata: { error: true }
            };
        }
    }

    /**
     * 生成智能体回复 (流式版本)
     */
    async generateAgentResponseStream(agent, conversation, originalMessage, onChunk) {
        try {
            // 获取智能体记忆系统
            const memorySystem = this.agentMemorySystem;
            const knowledgeBase = memorySystem.getOrCreateKnowledgeBase(agent.id);

            // 从知识库搜索相关知识
            const relatedKnowledge = knowledgeBase.searchKnowledge(originalMessage);

            // 构建上下文消息，包括知识库信息
            const contextMessages = this.buildContextMessages(agent, conversation);

            // 如果有相关知识，添加到上下文
            if (relatedKnowledge.length > 0) {
                contextMessages.push({
                    role: 'system',
                    content: `相关知识库信息：${JSON.stringify(relatedKnowledge)}`
                });
            }

            // 记录对话历史
            memorySystem.recordConversation(agent.id, conversation);

            // 调用LLM生成流式回复
            let fullResponse = '';
            await this.callLLMStream(agent.llmConfig, contextMessages, (chunk) => {
                fullResponse += chunk;
                onChunk(chunk);
            });

            // 记录经验
            memorySystem.recordExperience(agent.id, 'response_generation', {
                messageLength: originalMessage.length,
                responseLength: fullResponse.length,
                model: agent.llmConfig.model
            });

            // 尝试学习用户偏好（这里需要一个用户ID，暂时使用固定值）
            memorySystem.learnUserPreferences(agent.id, 'default_user', {
                'message_style': this.detectMessageStyle(originalMessage),
                'topic_preference': this.detectTopicPreference(originalMessage)
            });

            // 将新知识添加到知识库
            knowledgeBase.addKnowledge('conversation', {
                originalMessage: originalMessage,
                response: fullResponse
            });

        } catch (error) {
            console.error('生成智能体流式回复失败:', error);
            onChunk(`[${agent.name}] 抱歉，我在处理您的请求时遇到了问题。错误信息：${error.message}`);
        }
    }

    /**
     * 检测消息风格
     */
    detectMessageStyle(message) {
        const styles = {
            'formal': ['请', '希望', '建议', '方案'],
            'casual': ['啊', '呢', '吧', '哦'],
            'technical': ['算法', '架构', '系统', '技术'],
            'creative': ['想象', '创意', '设计', '灵感']
        };

        for (const [style, keywords] of Object.entries(styles)) {
            if (keywords.some(keyword => message.includes(keyword))) {
                return style;
            }
        }

        return 'neutral';
    }

    /**
     * 检测话题偏好
     */
    detectTopicPreference(message) {
        const topics = {
            'technology': ['技术', '编程', '算法', '系统'],
            'business': ['商业', '策略', '市场', '投资'],
            'creative': ['设计', '创意', '艺术', '灵感'],
            'science': ['研究', '数据', '分析', '实验'],
            'personal': ['生活', '感受', '经历', '想法']
        };

        for (const [topic, keywords] of Object.entries(topics)) {
            if (keywords.some(keyword => message.includes(keyword))) {
                return topic;
            }
        }

        return 'general';
    }

    /**
     * 构建上下文消息
     */
    buildContextMessages(agent, conversation) {
        const systemMessage = {
            role: 'system',
            content: `${agent.systemPrompt}\n\n当前团队成员：${conversation.agents.map(a => `${a.name}(${a.capabilities.join(', ')})`).join(', ')}`
        };

        const historyMessages = conversation.messages
            .slice(-10) // 只取最近10条消息避免上下文过长
            .map(msg => ({
                role: msg.isSelf ? 'user' : 'assistant',
                content: `${msg.senderName}: ${msg.content}`
            }));

        return [systemMessage, ...historyMessages];
    }

    /**
     * 调用LLM API
     */
    async callLLM(llmConfig, messages) {
        const response = await fetch(llmConfig.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${llmConfig.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: llmConfig.model,
                messages: messages,
                stream: false // 非流式版本
            })
        });

        if (!response.ok) {
            throw new Error(`LLM API 调用失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            usage: data.usage
        };
    }

    /**
     * 调用LLM API (流式版本)
     */
    async callLLMStream(llmConfig, messages, onChunk) {
        const response = await fetch(llmConfig.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${llmConfig.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: llmConfig.model,
                messages: messages,
                stream: true // 启用流式
            })
        });

        if (!response.ok) {
            throw new Error(`LLM API 调用失败: ${response.status} ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

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
                            onChunk(content);
                        }
                    } catch (e) {
                        console.error('解析流式响应失败:', e);
                    }
                }
            }
        }
    }

    /**
     * 计算API调用成本
     */
    calculateCost(usage, model) {
        if (!usage) return 0;

        // 简单的成本计算，实际应该根据模型定价
        const costPerToken = 0.00001; // 假设每token 0.00001美元
        return (usage.total_tokens || 0) * costPerToken;
    }

    /**
     * 获取会话信息
     */
    getConversation(conversationId) {
        return this.activeConversations.get(conversationId);
    }

    /**
     * 删除会话
     */
    deleteConversation(conversationId) {
        return this.activeConversations.delete(conversationId);
    }

    /**
     * 获取所有活跃会话
     */
    getActiveConversations() {
        return Array.from(this.activeConversations.values());
    }
}

/**
 * 智能体记忆系统
 * 管理每个智能体的知识库、对话历史和学习能力
 */
class AgentMemorySystem {
    constructor() {
        // 知识库存储
        this.knowledgeBase = new Map();

        // 对话历史存储
        this.conversationHistories = new Map();

        // 用户偏好存储
        this.userPreferences = new Map();

        // 经验积累记录
        this.experienceLog = new Map();
    }

    /**
     * 为智能体创建或获取知识库
     * @param {string} agentId 智能体唯一标识
     * @returns {AgentKnowledgeBase} 智能体知识库
     */
    getOrCreateKnowledgeBase(agentId) {
        if (!this.knowledgeBase.has(agentId)) {
            this.knowledgeBase.set(agentId, new AgentKnowledgeBase(agentId));
        }
        return this.knowledgeBase.get(agentId);
    }

    /**
     * 记录对话历史
     * @param {string} agentId 智能体ID
     * @param {Object} conversation 对话记录
     */
    recordConversation(agentId, conversation) {
        if (!this.conversationHistories.has(agentId)) {
            this.conversationHistories.set(agentId, []);
        }
        this.conversationHistories.get(agentId).push({
            timestamp: Date.now(),
            conversation: conversation
        });

        // 限制历史记录数量，防止内存过大
        const MAX_HISTORY_LENGTH = 100;
        const histories = this.conversationHistories.get(agentId);
        if (histories.length > MAX_HISTORY_LENGTH) {
            histories.shift(); // 移除最早的记录
        }
    }

    /**
     * 学习用户偏好
     * @param {string} agentId 智能体ID
     * @param {string} userId 用户ID
     * @param {Object} preferences 用户偏好数据
     */
    learnUserPreferences(agentId, userId, preferences) {
        if (!this.userPreferences.has(agentId)) {
            this.userPreferences.set(agentId, new Map());
        }
        const agentPreferences = this.userPreferences.get(agentId);

        for (const [key, value] of Object.entries(preferences)) {
            if (!agentPreferences.has(key)) {
                agentPreferences.set(key, []);
            }
            const preferenceList = agentPreferences.get(key);
            preferenceList.push(value);

            // 保留最近的5个偏好记录
            if (preferenceList.length > 5) {
                preferenceList.shift();
            }
        }
    }

    /**
     * 获取用户偏好
     * @param {string} agentId 智能体ID
     * @param {string} userId 用户ID
     * @param {string} preferenceKey 偏好键
     * @returns {Array} 用户偏好列表
     */
    getUserPreferences(agentId, userId, preferenceKey) {
        const agentPreferences = this.userPreferences.get(agentId);
        return agentPreferences ? agentPreferences.get(preferenceKey) || [] : [];
    }

    /**
     * 记录智能体经验
     * @param {string} agentId 智能体ID
     * @param {string} experienceType 经验类型
     * @param {Object} experienceData 经验数据
     */
    recordExperience(agentId, experienceType, experienceData) {
        if (!this.experienceLog.has(agentId)) {
            this.experienceLog.set(agentId, new Map());
        }
        const agentExperience = this.experienceLog.get(agentId);

        if (!agentExperience.has(experienceType)) {
            agentExperience.set(experienceType, []);
        }

        const experiences = agentExperience.get(experienceType);
        experiences.push({
            timestamp: Date.now(),
            data: experienceData
        });

        // 限制经验记录数量
        const MAX_EXPERIENCE_LENGTH = 50;
        if (experiences.length > MAX_EXPERIENCE_LENGTH) {
            experiences.shift();
        }
    }

    /**
     * 获取智能体经验
     * @param {string} agentId 智能体ID
     * @param {string} experienceType 经验类型
     * @returns {Array} 经验记录列表
     */
    getExperiences(agentId, experienceType) {
        const agentExperience = this.experienceLog.get(agentId);
        return agentExperience ? agentExperience.get(experienceType) || [] : [];
    }

    /**
     * 分析智能体性能
     * @param {string} agentId 智能体ID
     * @returns {Object} 性能分析报告
     */
    analyzeAgentPerformance(agentId) {
        const conversations = this.conversationHistories.get(agentId) || [];
        const experiences = this.experienceLog.get(agentId) || new Map();

        return {
            totalConversations: conversations.length,
            experienceTypes: Array.from(experiences.keys()),
            lastConversationTimestamp: conversations.length > 0
                ? conversations[conversations.length - 1].timestamp
                : null
        };
    }
}

/**
 * 智能体知识库
 * 管理特定智能体的专业知识
 */
class AgentKnowledgeBase {
    constructor(agentId) {
        this.agentId = agentId;
        this.knowledgeEntries = new Map();
    }

    /**
     * 添加知识条目
     * @param {string} category 知识类别
     * @param {Object} knowledge 知识内容
     */
    addKnowledge(category, knowledge) {
        if (!this.knowledgeEntries.has(category)) {
            this.knowledgeEntries.set(category, []);
        }

        const entries = this.knowledgeEntries.get(category);
        entries.push({
            timestamp: Date.now(),
            data: knowledge
        });

        // 限制每个类别的知识条目数量
        const MAX_ENTRIES_PER_CATEGORY = 20;
        if (entries.length > MAX_ENTRIES_PER_CATEGORY) {
            entries.shift();
        }
    }

    /**
     * 获取特定类别的知识
     * @param {string} category 知识类别
     * @returns {Array} 知识条目列表
     */
    getKnowledge(category) {
        return this.knowledgeEntries.get(category) || [];
    }

    /**
     * 搜索知识
     * @param {string} query 搜索关键词
     * @returns {Array} 匹配的知识条目
     */
    searchKnowledge(query) {
        const results = [];
        for (const [category, entries] of this.knowledgeEntries) {
            const matchedEntries = entries.filter(entry =>
                JSON.stringify(entry.data).includes(query)
            );
            results.push(...matchedEntries);
        }
        return results;
    }
}

/**
 * 智能体协作引擎
 * 管理智能体间的协作、讨论和共识达成
 */
class AgentCollaborationEngine {
    constructor(autogenService) {
        this.autogenService = autogenService;
        this.activeDiscussions = new Map();
        this.consensusHistory = new Map();
    }

    /**
     * 启动智能体协作讨论
     * @param {Object} conversation 会话对象
     * @param {string} topic 讨论主题
     * @param {Array} participatingAgents 参与讨论的智能体
     * @param {Function} onUpdate 更新回调
     */
    async startCollaboration(conversation, topic, participatingAgents, onUpdate) {
        const discussionId = `discussion_${Date.now()}`;

        const discussion = {
            id: discussionId,
            topic: topic,
            participants: participatingAgents,
            phases: ['initial_positions', 'debate', 'consensus_building', 'finalization'],
            currentPhase: 'initial_positions',
            positions: new Map(),
            arguments: [],
            consensus: null,
            startTime: Date.now()
        };

        this.activeDiscussions.set(discussionId, discussion);

        try {
            // 第一阶段：收集初始观点
            await this.collectInitialPositions(discussion, conversation, onUpdate);

            // 第二阶段：展开辩论
            await this.conductDebate(discussion, conversation, onUpdate);

            // 第三阶段：建立共识
            await this.buildConsensus(discussion, conversation, onUpdate);

            // 第四阶段：最终化结果
            await this.finalizeResults(discussion, conversation, onUpdate);

            return discussion.consensus;
        } catch (error) {
            console.error('智能体协作失败:', error);
            if (onUpdate) {
                onUpdate({
                    type: 'collaboration_error',
                    error: error.message,
                    discussion
                });
            }
        } finally {
            this.activeDiscussions.delete(discussionId);
        }
    }

    /**
     * 收集初始观点
     */
    async collectInitialPositions(discussion, conversation, onUpdate) {
        discussion.currentPhase = 'initial_positions';

        if (onUpdate) {
            onUpdate({
                type: 'phase_start',
                phase: 'initial_positions',
                description: '正在收集各智能体的初始观点...',
                discussion
            });
        }

        for (const agent of discussion.participants) {
            try {
                const position = await this.requestInitialPosition(agent, discussion.topic, conversation);
                discussion.positions.set(agent.id, position);

                if (onUpdate) {
                    onUpdate({
                        type: 'position_collected',
                        agent: agent,
                        position: position,
                        discussion
                    });
                }

                // 短暂延迟以模拟思考时间
                await this.delay(1000);
            } catch (error) {
                console.error(`收集${agent.name}观点失败:`, error);
            }
        }
    }

    /**
     * 展开辩论
     */
    async conductDebate(discussion, conversation, onUpdate) {
        discussion.currentPhase = 'debate';

        if (onUpdate) {
            onUpdate({
                type: 'phase_start',
                phase: 'debate',
                description: '智能体开始就不同观点进行讨论...',
                discussion
            });
        }

        // 分析观点分歧
        const conflicts = this.analyzeConflicts(discussion.positions);

        // 针对每个冲突点进行讨论
        for (const conflict of conflicts) {
            const debateRounds = await this.conductConflictDebate(conflict, discussion, conversation);
            discussion.arguments.push(...debateRounds);

            if (onUpdate) {
                onUpdate({
                    type: 'debate_round',
                    conflict: conflict,
                    arguments: debateRounds,
                    discussion
                });
            }
        }
    }

    /**
     * 建立共识
     */
    async buildConsensus(discussion, conversation, onUpdate) {
        discussion.currentPhase = 'consensus_building';

        if (onUpdate) {
            onUpdate({
                type: 'phase_start',
                phase: 'consensus_building',
                description: '智能体正在寻求共识...',
                discussion
            });
        }

        // 让协调员分析所有观点和争论，提出综合方案
        const coordinator = discussion.participants.find(agent =>
            agent.capabilities && agent.capabilities.includes('coordination')
        );

        if (coordinator) {
            const consensusProposal = await this.generateConsensusProposal(
                coordinator, discussion, conversation
            );

            // 让所有参与者评估共识方案
            const evaluations = await this.evaluateConsensus(
                discussion.participants, consensusProposal, conversation
            );

            discussion.consensus = {
                proposal: consensusProposal,
                evaluations: evaluations,
                finalVersion: await this.refineConsensus(consensusProposal, evaluations, coordinator, conversation)
            };

            if (onUpdate) {
                onUpdate({
                    type: 'consensus_reached',
                    consensus: discussion.consensus,
                    discussion
                });
            }
        }
    }

    /**
     * 最终化结果
     */
    async finalizeResults(discussion, conversation, onUpdate) {
        discussion.currentPhase = 'finalization';

        // 记录共识历史
        this.consensusHistory.set(discussion.id, {
            topic: discussion.topic,
            participants: discussion.participants.map(a => a.name),
            consensus: discussion.consensus,
            timestamp: Date.now(),
            duration: Date.now() - discussion.startTime
        });

        if (onUpdate) {
            onUpdate({
                type: 'collaboration_complete',
                finalResult: discussion.consensus.finalVersion,
                discussion
            });
        }
    }

    /**
     * 请求智能体初始观点
     */
    async requestInitialPosition(agent, topic, conversation) {
        const prompt = `作为${agent.name}，请就以下主题提出你的专业观点：

主题：${topic}

请提供：
1. 你的立场和观点
2. 支持你观点的理由
3. 可能的实施建议
4. 预期的风险或挑战

请保持你的专业角色特色，提供建设性的意见。`;

        try {
            const contextMessages = [
                {
                    role: 'system',
                    content: agent.systemPrompt + '\n\n你正在参与一个专业讨论。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ];

            const response = await this.autogenService.callLLM(agent.llmConfig, contextMessages);
            return {
                content: response.content,
                timestamp: Date.now(),
                confidence: this.extractConfidence(response.content)
            };
        } catch (error) {
            console.error(`获取${agent.name}观点失败:`, error);
            return {
                content: `作为${agent.name}，我在思考这个问题时遇到了困难。`,
                timestamp: Date.now(),
                confidence: 0.1
            };
        }
    }

    /**
     * 分析观点冲突
     */
    analyzeConflicts(positions) {
        const conflicts = [];
        const positionArray = Array.from(positions.entries());

        for (let i = 0; i < positionArray.length; i++) {
            for (let j = i + 1; j < positionArray.length; j++) {
                const [agentId1, position1] = positionArray[i];
                const [agentId2, position2] = positionArray[j];

                // 简单的冲突检测逻辑（实际中可以更复杂）
                const conflictScore = this.calculateConflictScore(position1.content, position2.content);

                if (conflictScore > 0.3) { // 阈值可调整
                    conflicts.push({
                        agents: [agentId1, agentId2],
                        positions: [position1, position2],
                        conflictScore: conflictScore,
                        conflictAreas: this.identifyConflictAreas(position1.content, position2.content)
                    });
                }
            }
        }

        return conflicts;
    }

    /**
     * 计算冲突分数
     */
    calculateConflictScore(content1, content2) {
        // 简化的冲突检测：寻找对立关键词
        const oppositeWords = [
            ['支持', '反对'],
            ['同意', '不同意'],
            ['可行', '不可行'],
            ['建议', '不建议'],
            ['优势', '劣势'],
            ['有效', '无效']
        ];

        let conflictCount = 0;
        for (const [word1, word2] of oppositeWords) {
            if ((content1.includes(word1) && content2.includes(word2)) ||
                (content1.includes(word2) && content2.includes(word1))) {
                conflictCount++;
            }
        }

        return Math.min(conflictCount / oppositeWords.length, 1.0);
    }

    /**
     * 识别冲突领域
     */
    identifyConflictAreas(content1, content2) {
        const areas = ['技术实现', '成本效益', '时间安排', '风险评估', '用户体验'];
        const conflictAreas = [];

        for (const area of areas) {
            if (content1.includes(area) && content2.includes(area)) {
                conflictAreas.push(area);
            }
        }

        return conflictAreas;
    }

    /**
     * 针对冲突进行辩论
     */
    async conductConflictDebate(conflict, discussion, conversation) {
        const debateRounds = [];
        const maxRounds = 3; // 限制辩论轮数

        for (let round = 1; round <= maxRounds; round++) {
            for (const agentId of conflict.agents) {
                const agent = discussion.participants.find(a => a.id === agentId);
                if (!agent) continue;

                const otherAgentId = conflict.agents.find(id => id !== agentId);
                const otherAgent = discussion.participants.find(a => a.id === otherAgentId);

                const argument = await this.generateArgument(agent, otherAgent, conflict, round, conversation);

                debateRounds.push({
                    round: round,
                    agent: agent,
                    argument: argument,
                    timestamp: Date.now()
                });

                await this.delay(800); // 短暂延迟
            }
        }

        return debateRounds;
    }

    /**
     * 生成辩论论据
     */
    async generateArgument(agent, otherAgent, conflict, round, conversation) {
        const prompt = `作为${agent.name}，你正在与${otherAgent.name}就以下问题进行专业讨论：

冲突点：${conflict.conflictAreas.join(', ')}

${otherAgent.name}的观点：
${conflict.positions.find(p => p === conflict.positions[1]).content}

这是第${round}轮讨论。请：
1. 针对对方观点提出你的专业意见
2. 提供具体的论据支持你的立场
3. 保持专业和建设性的态度
4. 寻找可能的妥协或改进方案

请简洁明了地表达你的观点。`;

        try {
            const contextMessages = [
                {
                    role: 'system',
                    content: agent.systemPrompt + '\n\n你正在进行专业辩论，保持客观和建设性。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ];

            const response = await this.autogenService.callLLM(agent.llmConfig, contextMessages);
            return response.content;
        } catch (error) {
            return `作为${agent.name}，我需要更多时间来完善我的论据。`;
        }
    }

    /**
     * 生成共识提案
     */
    async generateConsensusProposal(coordinator, discussion, conversation) {
        const allPositions = Array.from(discussion.positions.values()).map(p => p.content).join('\n\n');
        const allArguments = discussion.arguments.map(arg =>
            `${arg.agent.name}: ${arg.argument}`
        ).join('\n\n');

        const prompt = `作为${coordinator.name}，请基于以下所有观点和讨论，提出一个综合的共识方案：

初始观点：
${allPositions}

讨论内容：
${allArguments}

请提供：
1. 综合各方观点的平衡方案
2. 具体的实施建议
3. 风险缓解措施
4. 成功指标和评估方法

确保方案考虑到所有参与者的关切和专业建议。`;

        try {
            const contextMessages = [
                {
                    role: 'system',
                    content: coordinator.systemPrompt + '\n\n你的任务是整合所有观点，形成可执行的共识方案。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ];

            const response = await this.autogenService.callLLM(coordinator.llmConfig, contextMessages);
            return response.content;
        } catch (error) {
            return '在整合各方观点时遇到困难，需要进一步讨论。';
        }
    }

    /**
     * 评估共识方案
     */
    async evaluateConsensus(participants, consensusProposal, conversation) {
        const evaluations = [];

        for (const agent of participants) {
            if (agent.capabilities && agent.capabilities.includes('coordination')) {
                continue; // 跳过协调员
            }

            const evaluation = await this.getAgentEvaluation(agent, consensusProposal, conversation);
            evaluations.push({
                agent: agent,
                evaluation: evaluation,
                timestamp: Date.now()
            });
        }

        return evaluations;
    }

    /**
     * 获取智能体对共识的评估
     */
    async getAgentEvaluation(agent, consensusProposal, conversation) {
        const prompt = `作为${agent.name}，请评估以下共识方案：

共识方案：
${consensusProposal}

请提供：
1. 你对此方案的整体评价（1-10分）
2. 你认为的优点
3. 你担心的问题或风险
4. 改进建议

请保持客观和专业。`;

        try {
            const contextMessages = [
                {
                    role: 'system',
                    content: agent.systemPrompt + '\n\n请客观评估这个共识方案。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ];

            const response = await this.autogenService.callLLM(agent.llmConfig, contextMessages);
            return {
                content: response.content,
                score: this.extractScore(response.content)
            };
        } catch (error) {
            return {
                content: `作为${agent.name}，我需要更多时间来评估这个方案。`,
                score: 5
            };
        }
    }

    /**
     * 完善共识方案
     */
    async refineConsensus(consensusProposal, evaluations, coordinator, conversation) {
        const feedback = evaluations.map(evaluation =>
            `${evaluation.agent.name}的评估：${evaluation.evaluation.content}`
        ).join('\n\n');

        const prompt = `请基于以下反馈完善共识方案：

原方案：
${consensusProposal}

反馈意见：
${feedback}

请提供最终的完善版本，确保：
1. 解决主要关切
2. 保持方案的可执行性
3. 平衡各方利益
4. 明确实施步骤`;

        try {
            const contextMessages = [
                {
                    role: 'system',
                    content: coordinator.systemPrompt + '\n\n基于反馈完善方案，确保最终方案的质量和可行性。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ];

            const response = await this.autogenService.callLLM(coordinator.llmConfig, contextMessages);
            return response.content;
        } catch (error) {
            return consensusProposal; // 如果完善失败，返回原方案
        }
    }

    /**
     * 提取置信度
     */
    extractConfidence(content) {
        // 简单的置信度检测
        const highConfidenceWords = ['确信', '肯定', '明确', '强烈建议'];
        const lowConfidenceWords = ['可能', '或许', '建议考虑', '不确定'];

        let confidence = 0.5; // 默认中等置信度

        for (const word of highConfidenceWords) {
            if (content.includes(word)) {
                confidence += 0.1;
            }
        }

        for (const word of lowConfidenceWords) {
            if (content.includes(word)) {
                confidence -= 0.1;
            }
        }

        return Math.max(0.1, Math.min(1.0, confidence));
    }

    /**
     * 提取评分
     */
    extractScore(content) {
        const scoreMatch = content.match(/(\d+)分/);
        if (scoreMatch) {
            return parseInt(scoreMatch[1]);
        }

        // 如果没有明确分数，根据情感倾向估算
        const positiveWords = ['优秀', '很好', '满意', '赞同'];
        const negativeWords = ['差', '不好', '担心', '反对'];

        let score = 5; // 默认中性分数

        for (const word of positiveWords) {
            if (content.includes(word)) score += 1;
        }

        for (const word of negativeWords) {
            if (content.includes(word)) score -= 1;
        }

        return Math.max(1, Math.min(10, score));
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * 任务进度跟踪器
 * 管理多步骤任务的进度跟踪、断点续传和可视化显示
 */
class TaskProgressTracker {
    constructor(autogenService) {
        this.autogenService = autogenService;
        this.activeTasks = new Map();
        this.taskHistory = new Map();
        this.checkpoints = new Map();
    }

    /**
     * 创建新任务并开始跟踪
     * @param {Object} taskConfig 任务配置
     * @returns {string} 任务ID
     */
    createTask(taskConfig) {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const task = {
            id: taskId,
            name: taskConfig.name || '未命名任务',
            description: taskConfig.description || '',
            type: taskConfig.type || 'general', // general, workflow, collaboration
            phases: taskConfig.phases || [],
            currentPhase: 0,
            status: 'pending', // pending, running, paused, completed, failed
            progress: 0, // 0-100
            startTime: Date.now(),
            endTime: null,
            estimatedDuration: taskConfig.estimatedDuration || null,
            assignedAgents: taskConfig.assignedAgents || [],
            steps: [],
            checkpoints: [],
            metadata: taskConfig.metadata || {}
        };

        this.activeTasks.set(taskId, task);
        return taskId;
    }

    /**
     * 开始执行任务
     * @param {string} taskId 任务ID
     * @param {Function} onUpdate 进度更新回调
     */
    async startTask(taskId, onUpdate = null) {
        const task = this.activeTasks.get(taskId);
        if (!task) {
            throw new Error('任务不存在');
        }

        task.status = 'running';
        task.startTime = Date.now();

        if (onUpdate) {
            onUpdate({
                type: 'task_started',
                task: task,
                timestamp: Date.now()
            });
        }

        try {
            // 根据任务类型执行不同的处理逻辑
            switch (task.type) {
                case 'workflow':
                    await this.executeWorkflowTask(task, onUpdate);
                    break;
                case 'collaboration':
                    await this.executeCollaborationTask(task, onUpdate);
                    break;
                default:
                    await this.executeGeneralTask(task, onUpdate);
            }

            task.status = 'completed';
            task.endTime = Date.now();
            task.progress = 100;

            if (onUpdate) {
                onUpdate({
                    type: 'task_completed',
                    task: task,
                    timestamp: Date.now()
                });
            }

        } catch (error) {
            task.status = 'failed';
            task.endTime = Date.now();

            if (onUpdate) {
                onUpdate({
                    type: 'task_failed',
                    task: task,
                    error: error.message,
                    timestamp: Date.now()
                });
            }

            throw error;
        }
    }

    /**
     * 执行工作流任务
     */
    async executeWorkflowTask(task, onUpdate) {
        for (let i = 0; i < task.phases.length; i++) {
            const phase = task.phases[i];
            task.currentPhase = i;

            await this.executePhase(task, phase, i, onUpdate);

            // 更新进度
            task.progress = Math.round(((i + 1) / task.phases.length) * 100);

            if (onUpdate) {
                onUpdate({
                    type: 'phase_completed',
                    task: task,
                    phase: phase,
                    phaseIndex: i,
                    progress: task.progress,
                    timestamp: Date.now()
                });
            }

            // 创建检查点
            this.createCheckpoint(task.id, i, 'phase_completed');
        }
    }

    /**
     * 执行协作任务
     */
    async executeCollaborationTask(task, onUpdate) {
        // 使用协作引擎执行任务
        const collaborationEngine = this.autogenService.getCollaborationEngine();

        if (task.metadata.topic && task.assignedAgents.length > 0) {
            const result = await collaborationEngine.startCollaboration(
                task.metadata.conversation,
                task.metadata.topic,
                task.assignedAgents,
                (update) => {
                    // 将协作更新转换为进度更新
                    if (onUpdate) {
                        onUpdate({
                            type: 'collaboration_update',
                            task: task,
                            collaborationUpdate: update,
                            timestamp: Date.now()
                        });
                    }

                    // 更新任务进度
                    this.updateTaskProgressFromCollaboration(task, update);
                }
            );

            task.metadata.collaborationResult = result;
        }
    }

    /**
     * 执行通用任务
     */
    async executeGeneralTask(task, onUpdate) {
        const totalSteps = task.steps.length || task.phases.length || 1;

        for (let i = 0; i < totalSteps; i++) {
            const step = task.steps[i] || task.phases[i] || { name: `步骤 ${i + 1}` };

            if (onUpdate) {
                onUpdate({
                    type: 'step_started',
                    task: task,
                    step: step,
                    stepIndex: i,
                    timestamp: Date.now()
                });
            }

            // 模拟步骤执行
            await this.simulateStep(step, task);

            // 更新进度
            task.progress = Math.round(((i + 1) / totalSteps) * 100);

            if (onUpdate) {
                onUpdate({
                    type: 'step_completed',
                    task: task,
                    step: step,
                    stepIndex: i,
                    progress: task.progress,
                    timestamp: Date.now()
                });
            }

            // 创建检查点
            this.createCheckpoint(task.id, i, 'step_completed');
        }
    }

    /**
     * 执行阶段
     */
    async executePhase(task, phase, phaseIndex, onUpdate) {
        if (onUpdate) {
            onUpdate({
                type: 'phase_started',
                task: task,
                phase: phase,
                phaseIndex: phaseIndex,
                timestamp: Date.now()
            });
        }

        // 根据阶段类型执行相应逻辑
        if (phase.agent && task.assignedAgents) {
            const agent = task.assignedAgents.find(a => a.type === phase.agent);
            if (agent && task.metadata.conversation) {
                // 让特定智能体处理这个阶段
                await this.autogenService.generateAgentResponse(
                    agent,
                    task.metadata.conversation,
                    phase.description || `执行阶段：${phase.phase}`
                );
            }
        }

        // 模拟阶段执行时间
        await this.delay(1000);
    }

    /**
     * 暂停任务
     * @param {string} taskId 任务ID
     */
    pauseTask(taskId) {
        const task = this.activeTasks.get(taskId);
        if (task && task.status === 'running') {
            task.status = 'paused';

            // 创建暂停检查点
            this.createCheckpoint(taskId, task.currentPhase, 'paused');

            return true;
        }
        return false;
    }

    /**
     * 恢复任务
     * @param {string} taskId 任务ID
     * @param {Function} onUpdate 进度更新回调
     */
    async resumeTask(taskId, onUpdate = null) {
        const task = this.activeTasks.get(taskId);
        if (task && task.status === 'paused') {
            task.status = 'running';

            if (onUpdate) {
                onUpdate({
                    type: 'task_resumed',
                    task: task,
                    timestamp: Date.now()
                });
            }

            // 从暂停点继续执行
            return await this.continueFromCheckpoint(taskId, onUpdate);
        }
        return false;
    }

    /**
     * 创建检查点
     * @param {string} taskId 任务ID
     * @param {number} position 位置
     * @param {string} type 检查点类型
     */
    createCheckpoint(taskId, position, type) {
        const task = this.activeTasks.get(taskId);
        if (!task) return;

        const checkpoint = {
            id: `checkpoint_${Date.now()}`,
            taskId: taskId,
            position: position,
            type: type,
            timestamp: Date.now(),
            taskState: JSON.parse(JSON.stringify(task)) // 深拷贝任务状态
        };

        if (!this.checkpoints.has(taskId)) {
            this.checkpoints.set(taskId, []);
        }

        const taskCheckpoints = this.checkpoints.get(taskId);
        taskCheckpoints.push(checkpoint);

        // 限制检查点数量
        const MAX_CHECKPOINTS = 20;
        if (taskCheckpoints.length > MAX_CHECKPOINTS) {
            taskCheckpoints.shift();
        }
    }

    /**
     * 从检查点继续执行
     * @param {string} taskId 任务ID
     * @param {Function} onUpdate 进度更新回调
     */
    async continueFromCheckpoint(taskId, onUpdate) {
        const task = this.activeTasks.get(taskId);
        const taskCheckpoints = this.checkpoints.get(taskId);

        if (!task || !taskCheckpoints || taskCheckpoints.length === 0) {
            return false;
        }

        // 获取最新的检查点
        const lastCheckpoint = taskCheckpoints[taskCheckpoints.length - 1];

        // 从检查点恢复任务状态
        const checkpointTask = lastCheckpoint.taskState;
        Object.assign(task, checkpointTask);
        task.status = 'running';

        // 继续执行剩余步骤
        if (task.type === 'workflow') {
            await this.continueWorkflowFromCheckpoint(task, lastCheckpoint.position, onUpdate);
        } else {
            await this.continueGeneralTaskFromCheckpoint(task, lastCheckpoint.position, onUpdate);
        }

        return true;
    }

    /**
     * 从检查点继续工作流
     */
    async continueWorkflowFromCheckpoint(task, startPosition, onUpdate) {
        for (let i = startPosition + 1; i < task.phases.length; i++) {
            const phase = task.phases[i];
            task.currentPhase = i;

            await this.executePhase(task, phase, i, onUpdate);

            task.progress = Math.round(((i + 1) / task.phases.length) * 100);

            if (onUpdate) {
                onUpdate({
                    type: 'phase_completed',
                    task: task,
                    phase: phase,
                    phaseIndex: i,
                    progress: task.progress,
                    timestamp: Date.now()
                });
            }

            this.createCheckpoint(task.id, i, 'phase_completed');
        }
    }

    /**
     * 从检查点继续通用任务
     */
    async continueGeneralTaskFromCheckpoint(task, startPosition, onUpdate) {
        const totalSteps = task.steps.length || task.phases.length || 1;

        for (let i = startPosition + 1; i < totalSteps; i++) {
            const step = task.steps[i] || task.phases[i] || { name: `步骤 ${i + 1}` };

            await this.simulateStep(step, task);

            task.progress = Math.round(((i + 1) / totalSteps) * 100);

            if (onUpdate) {
                onUpdate({
                    type: 'step_completed',
                    task: task,
                    step: step,
                    stepIndex: i,
                    progress: task.progress,
                    timestamp: Date.now()
                });
            }

            this.createCheckpoint(task.id, i, 'step_completed');
        }
    }

    /**
     * 获取任务信息
     * @param {string} taskId 任务ID
     * @returns {Object} 任务信息
     */
    getTask(taskId) {
        return this.activeTasks.get(taskId) || this.taskHistory.get(taskId);
    }

    /**
     * 获取所有活跃任务
     * @returns {Array} 活跃任务列表
     */
    getActiveTasks() {
        return Array.from(this.activeTasks.values());
    }

    /**
     * 获取任务历史
     * @returns {Array} 任务历史列表
     */
    getTaskHistory() {
        return Array.from(this.taskHistory.values());
    }

    /**
     * 更新协作任务进度
     */
    updateTaskProgressFromCollaboration(task, collaborationUpdate) {
        switch (collaborationUpdate.type) {
            case 'phase_start':
                const phaseProgress = {
                    'initial_positions': 25,
                    'debate': 50,
                    'consensus_building': 75,
                    'finalization': 100
                };
                task.progress = phaseProgress[collaborationUpdate.phase] || task.progress;
                break;
            case 'collaboration_complete':
                task.progress = 100;
                break;
        }
    }

    /**
     * 模拟步骤执行
     */
    async simulateStep(step, task) {
        // 根据步骤复杂度决定执行时间
        const complexity = step.complexity || 'medium';
        const durations = {
            'simple': 500,
            'medium': 1000,
            'complex': 2000
        };

        await this.delay(durations[complexity] || 1000);
    }

    /**
     * 完成任务
     * @param {string} taskId 任务ID
     */
    completeTask(taskId) {
        const task = this.activeTasks.get(taskId);
        if (task) {
            task.status = 'completed';
            task.endTime = Date.now();
            task.progress = 100;

            // 移动到历史记录
            this.taskHistory.set(taskId, task);
            this.activeTasks.delete(taskId);

            return true;
        }
        return false;
    }

    /**
     * 删除任务
     * @param {string} taskId 任务ID
     */
    deleteTask(taskId) {
        const deleted = this.activeTasks.delete(taskId) || this.taskHistory.delete(taskId);
        if (deleted) {
            this.checkpoints.delete(taskId);
        }
        return deleted;
    }

    /**
     * 获取任务统计信息
     * @returns {Object} 统计信息
     */
    getTaskStatistics() {
        const activeTasks = this.getActiveTasks();
        const taskHistory = this.getTaskHistory();

        return {
            total: activeTasks.length + taskHistory.length,
            active: activeTasks.length,
            completed: taskHistory.filter(t => t.status === 'completed').length,
            failed: taskHistory.filter(t => t.status === 'failed').length,
            averageCompletionTime: this.calculateAverageCompletionTime(taskHistory)
        };
    }

    /**
     * 计算平均完成时间
     */
    calculateAverageCompletionTime(tasks) {
        const completedTasks = tasks.filter(t => t.status === 'completed' && t.endTime);
        if (completedTasks.length === 0) return 0;

        const totalTime = completedTasks.reduce((sum, task) => {
            return sum + (task.endTime - task.startTime);
        }, 0);

        return Math.round(totalTime / completedTasks.length);
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 创建单例实例
export const autogenService = new AutoGenService();
export default AutoGenService; 