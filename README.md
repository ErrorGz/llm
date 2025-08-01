# LLM 多智能体聊天应用

一个基于 Vue 3 的现代化智能对话应用，支持多种 LLM 模型和多智能体协作功能。

## 项目概述

这是一个功能丰富的 LLM (大语言模型) 聊天应用，不仅支持与单个 AI 助手对话，还提供了创新的多智能体协作功能。用户可以创建不同专业背景的 AI 智能体团队，让它们协作解决复杂问题。

## 核心功能

### 🤖 多智能体协作 (AutoGen)
- **智能体类型**：数据分析师、研究员、程序员、协调员等专业角色
- **协作模式**：
  - 轮询模式 (Round Robin)：智能体按顺序发言
  - 群聊模式 (Group Chat)：智能选择最适合的智能体响应
  - 顺序模式 (Sequential)：按预定顺序执行任务
- **实时协作**：智能体之间可以互相讨论、补充和完善答案

### 💬 智能对话系统
- **流式推送**：实时显示 AI 回复，提升对话体验
- **多 LLM 支持**：支持配置和切换不同的语言模型
- **对话管理**：消息历史记录、会话管理
- **长文本编辑**：支持编写和提交长篇内容

### 🔧 Model Context Protocol (MCP)
- **外部工具集成**：
  - 网络搜索功能
  - 天气查询
  - 股票价格查询
  - 新闻获取
- **可扩展架构**：支持添加自定义工具和服务

### 🎯 提示词管理
- **预设提示词**：内置常用的对话提示模板
- **自定义提示**：用户可以创建和管理个人提示词库
- **快速应用**：一键应用提示词到当前对话

### 📱 跨平台支持
- **Web 应用**：基于现代浏览器运行
- **移动端**：通过 Capacitor 支持 Android 平台
- **响应式设计**：适配不同屏幕尺寸

## 技术栈

- **前端框架**：Vue 3 + Vite
- **UI 组件库**：Element Plus
- **移动端**：Capacitor
- **HTTP 客户端**：Axios
- **构建工具**：Vite
- **开发语言**：JavaScript (ES6+)

## 项目结构

```
├── src/
│   ├── components/          # Vue 组件
│   │   ├── ChatPage.vue     # 主聊天界面
│   │   ├── AgentTeamManager.vue  # 智能体团队管理
│   │   ├── LLMManager.vue   # LLM 模型管理
│   │   ├── SettingsPage.vue # 设置页面
│   │   └── ...
│   ├── services/            # 业务服务
│   │   ├── autogenService.js     # AutoGen 多智能体服务
│   │   └── mcpService.js         # MCP 工具服务
│   ├── workers/             # Web Workers
│   ├── assets/              # 静态资源
│   └── styles/              # 样式文件
├── android/                 # Android 项目文件
├── public/                  # 公共资源
└── dist/                    # 构建输出
```

## 快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 配置环境变量
复制 `.env.example` 为 `.env` 并配置相关 API 密钥：
```bash
cp .env.example .env
```

### 开发模式运行
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build:prod
```

### Android 开发
```bash
# 同步到 Android 项目
npm run sync

# 打开 Android Studio
npm run android
```

## 使用说明

1. **配置 LLM**：在设置页面添加你的 LLM API 配置
2. **创建智能体团队**：根据需要创建不同专业的 AI 智能体
3. **开始对话**：选择单一 LLM 或多智能体协作模式
4. **使用工具**：通过 MCP 协议调用外部工具获取实时信息
5. **管理提示词**：创建和使用提示词模板提升对话效果

## 特色亮点

- **创新的多智能体协作**：让不同专业的 AI 智能体协同工作
- **实时流式对话**：流畅的对话体验，告别等待
- **强大的扩展性**：通过 MCP 协议轻松集成外部工具
- **跨平台部署**：一套代码，Web 和移动端双平台支持
- **用户友好**：直观的界面设计，简单易用

这个项目展示了现代 LLM 应用的前沿实践，将多智能体协作、工具集成和用户体验完美结合，为用户提供了一个功能强大且易于使用的 AI 对话平台。
