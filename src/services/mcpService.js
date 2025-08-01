import axios from 'axios';

/**
 * Model Context Protocol (MCP) 服务
 * 提供获取外部信息的接口
 */
class MCPService {
    constructor() {
        this.tools = new Map();
        this.initializeDefaultTools();
    }

    /**
     * 初始化默认工具
     */
    initializeDefaultTools() {
        // 网络搜索工具
        this.registerTool('web_search', {
            name: 'web_search',
            description: '搜索网络信息',
            parameters: {
                query: { type: 'string', description: '搜索关键词' },
                max_results: { type: 'number', description: '最大结果数', default: 5 }
            },
            handler: this.webSearch.bind(this)
        });

        // 天气查询工具
        this.registerTool('weather', {
            name: 'weather',
            description: '获取天气信息',
            parameters: {
                location: { type: 'string', description: '城市名称' }
            },
            handler: this.getWeather.bind(this)
        });

        // 股票价格查询工具
        this.registerTool('stock_price', {
            name: 'stock_price',
            description: '获取股票价格信息',
            parameters: {
                symbol: { type: 'string', description: '股票代码' }
            },
            handler: this.getStockPrice.bind(this)
        });

        // 新闻获取工具
        this.registerTool('news', {
            name: 'news',
            description: '获取最新新闻',
            parameters: {
                category: { type: 'string', description: '新闻分类', default: 'general' },
                max_results: { type: 'number', description: '最大结果数', default: 5 }
            },
            handler: this.getNews.bind(this)
        });

        // 汇率查询工具
        this.registerTool('exchange_rate', {
            name: 'exchange_rate',
            description: '获取汇率信息',
            parameters: {
                from: { type: 'string', description: '源货币代码' },
                to: { type: 'string', description: '目标货币代码' }
            },
            handler: this.getExchangeRate.bind(this)
        });

        // 维基百科搜索工具
        this.registerTool('wikipedia', {
            name: 'wikipedia',
            description: '搜索维基百科',
            parameters: {
                query: { type: 'string', description: '搜索关键词' },
                language: { type: 'string', description: '语言代码', default: 'zh' }
            },
            handler: this.searchWikipedia.bind(this)
        });
    }

    /**
     * 注册工具
     */
    registerTool(name, toolDefinition) {
        this.tools.set(name, toolDefinition);
        console.log(`MCP工具已注册: ${name}`);
    }

    /**
     * 获取所有可用工具
     */
    getAvailableTools() {
        return Array.from(this.tools.values()).map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
        }));
    }

    /**
     * 执行工具
     */
    async executeTool(toolName, parameters) {
        const tool = this.tools.get(toolName);
        if (!tool) {
            throw new Error(`工具 "${toolName}" 不存在`);
        }

        try {
            console.log(`执行MCP工具: ${toolName}`, parameters);
            const result = await tool.handler(parameters);
            return {
                success: true,
                tool: toolName,
                data: result
            };
        } catch (error) {
            console.error(`工具 "${toolName}" 执行失败:`, error);
            return {
                success: false,
                tool: toolName,
                error: error.message
            };
        }
    }

    /**
     * 网络搜索实现
     */
    async webSearch(params) {
        const { query, max_results = 5 } = params;

        try {
            // 使用免费的搜索API，这里使用DuckDuckGo的即时搜索API
            const response = await axios.get('https://api.duckduckgo.com/', {
                params: {
                    q: query,
                    format: 'json',
                    no_html: 1,
                    skip_disambig: 1
                },
                timeout: 10000
            });

            const results = [];

            // 处理抽象信息
            if (response.data.Abstract) {
                results.push({
                    title: response.data.Heading || 'DuckDuckGo摘要',
                    content: response.data.Abstract,
                    url: response.data.AbstractURL
                });
            }

            // 处理相关主题
            if (response.data.RelatedTopics && response.data.RelatedTopics.length > 0) {
                response.data.RelatedTopics.slice(0, max_results - results.length).forEach(topic => {
                    if (topic.Text) {
                        results.push({
                            title: topic.Text.split(' - ')[0] || 'DuckDuckGo结果',
                            content: topic.Text,
                            url: topic.FirstURL
                        });
                    }
                });
            }

            return {
                query,
                results: results.slice(0, max_results),
                source: 'DuckDuckGo'
            };
        } catch (error) {
            console.error('网络搜索失败:', error);
            return {
                query,
                results: [],
                error: '搜索服务暂时不可用，请稍后重试'
            };
        }
    }

    /**
     * 天气查询实现
     */
    async getWeather(params) {
        const { location } = params;

        try {
            // 使用免费的天气API，这里使用OpenWeatherMap的免费接口
            // 注意：需要在环境变量中设置API密钥
            const apiKey = process.env.WEATHER_API_KEY || 'demo_key';

            if (apiKey === 'demo_key') {
                // 返回模拟数据
                return {
                    location,
                    temperature: '22°C',
                    description: '晴天',
                    humidity: '65%',
                    source: '模拟数据'
                };
            }

            const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
                params: {
                    q: location,
                    appid: apiKey,
                    units: 'metric',
                    lang: 'zh'
                },
                timeout: 10000
            });

            const data = response.data;
            return {
                location: data.name,
                temperature: `${Math.round(data.main.temp)}°C`,
                description: data.weather[0].description,
                humidity: `${data.main.humidity}%`,
                source: 'OpenWeatherMap'
            };
        } catch (error) {
            console.error('天气查询失败:', error);
            return {
                location,
                temperature: '暂无数据',
                description: '天气信息获取失败',
                error: '天气服务暂时不可用'
            };
        }
    }

    /**
     * 股票价格查询实现
     */
    async getStockPrice(params) {
        const { symbol } = params;

        try {
            // 使用免费的股票API，这里使用Alpha Vantage或Yahoo Finance的免费接口
            // 由于跨域限制，这里返回模拟数据
            const simulatedData = {
                'AAPL': { price: '$175.25', change: '+$2.15 (+1.24%)', volume: '52.3M' },
                'GOOGL': { price: '$2,891.20', change: '-$15.30 (-0.53%)', volume: '1.2M' },
                'TSLA': { price: '$248.50', change: '+$8.75 (+3.65%)', volume: '45.2M' },
                'MSFT': { price: '$378.85', change: '+$1.20 (+0.32%)', volume: '25.1M' }
            };

            const upperSymbol = symbol.toUpperCase();
            const stockData = simulatedData[upperSymbol];

            if (stockData) {
                return {
                    symbol: upperSymbol,
                    price: stockData.price,
                    change: stockData.change,
                    volume: stockData.volume,
                    source: '模拟数据',
                    timestamp: new Date().toISOString()
                };
            } else {
                return {
                    symbol: upperSymbol,
                    price: '暂无数据',
                    error: `股票代码 ${upperSymbol} 未找到`
                };
            }
        } catch (error) {
            console.error('股票查询失败:', error);
            return {
                symbol,
                price: '暂无数据',
                error: '股票服务暂时不可用'
            };
        }
    }

    /**
     * 新闻获取实现
     */
    async getNews(params) {
        const { category = 'general', max_results = 5 } = params;

        try {
            // 返回模拟新闻数据
            const simulatedNews = [
                {
                    title: 'AI技术在医疗领域的最新突破',
                    summary: '研究人员开发出新的AI诊断系统，准确率达到95%以上...',
                    publishedAt: '2024-01-15T10:30:00Z',
                    source: '科技日报'
                },
                {
                    title: '全球经济复苏展现积极信号',
                    summary: '各国经济数据显示，全球经济正在逐步从疫情影响中恢复...',
                    publishedAt: '2024-01-15T09:15:00Z',
                    source: '经济观察报'
                },
                {
                    title: '新能源汽车销量创历史新高',
                    summary: '2023年新能源汽车全球销量突破1000万辆大关...',
                    publishedAt: '2024-01-15T08:45:00Z',
                    source: '汽车之家'
                }
            ];

            return {
                category,
                articles: simulatedNews.slice(0, max_results),
                source: '模拟新闻数据',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('新闻获取失败:', error);
            return {
                category,
                articles: [],
                error: '新闻服务暂时不可用'
            };
        }
    }

    /**
     * 汇率查询实现
     */
    async getExchangeRate(params) {
        const { from, to } = params;

        try {
            // 模拟汇率数据
            const rates = {
                'USD-CNY': 7.23,
                'EUR-CNY': 7.85,
                'JPY-CNY': 0.049,
                'GBP-CNY': 9.12,
                'CNY-USD': 0.138,
                'CNY-EUR': 0.127
            };

            const key = `${from.toUpperCase()}-${to.toUpperCase()}`;
            const rate = rates[key];

            if (rate) {
                return {
                    from: from.toUpperCase(),
                    to: to.toUpperCase(),
                    rate: rate,
                    timestamp: new Date().toISOString(),
                    source: '模拟汇率数据'
                };
            } else {
                return {
                    from: from.toUpperCase(),
                    to: to.toUpperCase(),
                    rate: null,
                    error: `汇率 ${from}/${to} 暂不支持`
                };
            }
        } catch (error) {
            console.error('汇率查询失败:', error);
            return {
                from,
                to,
                rate: null,
                error: '汇率服务暂时不可用'
            };
        }
    }

    /**
     * 维基百科搜索实现
     */
    async searchWikipedia(params) {
        const { query, language = 'zh' } = params;

        try {
            const response = await axios.get(`https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, {
                timeout: 10000
            });

            const data = response.data;
            return {
                title: data.title,
                summary: data.extract,
                url: data.content_urls?.desktop?.page,
                thumbnail: data.thumbnail?.source,
                source: 'Wikipedia',
                language
            };
        } catch (error) {
            console.error('维基百科搜索失败:', error);
            return {
                query,
                title: null,
                summary: '未找到相关信息',
                error: '维基百科搜索失败'
            };
        }
    }

    /**
     * 智能工具选择
     * 根据用户消息内容自动选择合适的工具
     */
    async autoSelectAndExecute(message) {
        const lowerMessage = message.toLowerCase();

        // 天气相关
        if (lowerMessage.includes('天气') || lowerMessage.includes('气温') || lowerMessage.includes('下雨')) {
            const locationMatch = lowerMessage.match(/(.+?)(?:的)?(?:天气|气温)/);
            if (locationMatch) {
                return await this.executeTool('weather', { location: locationMatch[1].trim() });
            }
        }

        // 股票相关
        if (lowerMessage.includes('股价') || lowerMessage.includes('股票') || lowerMessage.includes('股份')) {
            const symbolMatch = lowerMessage.match(/([A-Z]{1,5}|苹果|谷歌|特斯拉|微软)/i);
            if (symbolMatch) {
                let symbol = symbolMatch[1];
                // 中文名称映射
                const nameMap = { '苹果': 'AAPL', '谷歌': 'GOOGL', '特斯拉': 'TSLA', '微软': 'MSFT' };
                symbol = nameMap[symbol] || symbol;
                return await this.executeTool('stock_price', { symbol });
            }
        }

        // 汇率相关
        if (lowerMessage.includes('汇率') || lowerMessage.includes('兑换')) {
            const rateMatch = lowerMessage.match(/([A-Z]{3})\s*(?:对|兑|到)\s*([A-Z]{3})/i);
            if (rateMatch) {
                return await this.executeTool('exchange_rate', { from: rateMatch[1], to: rateMatch[2] });
            }
        }

        // 新闻相关
        if (lowerMessage.includes('新闻') || lowerMessage.includes('资讯')) {
            return await this.executeTool('news', { category: 'general' });
        }

        // 搜索相关
        if (lowerMessage.includes('搜索') || lowerMessage.includes('查找') || lowerMessage.includes('什么是')) {
            const searchQuery = lowerMessage.replace(/(搜索|查找|什么是)/g, '').trim();
            if (searchQuery) {
                // 优先使用维基百科进行知识搜索
                const wikiResult = await this.executeTool('wikipedia', { query: searchQuery });
                if (wikiResult.success && wikiResult.data.title) {
                    return wikiResult;
                }
                // 否则使用网络搜索
                return await this.executeTool('web_search', { query: searchQuery });
            }
        }

        return null; // 没有匹配的工具
    }
}

// 创建单例实例
export const mcpService = new MCPService();
export default MCPService; 