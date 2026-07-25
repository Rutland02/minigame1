# 三色融澄·数字赋能

微信小游戏项目 - 珠海金湾区海澄村文化教育游戏

## 项目简介

本项目是一款以珠海金湾区海澄村为背景的微信小游戏，通过寓教于乐的方式，让玩家了解和体验海澄村的非遗文化、自然景观和红色文化。

## 功能模块

### 页面
- **登录页** - 用户登录入口
- **首页** - 游戏主界面，导航至各功能模块
- **成就页** - 展示玩家获得的成就
- **答题页** - 文化知识问答

### 小游戏
- **消消乐** - 三消类益智游戏（模块化架构：constants/animation/renderer/game）
- **拼图游戏** - 图像拼图益智游戏

### 题库系统
- **非遗题库** - 三灶鹤舞、竹编工艺、制糖技艺等非物质文化遗产知识
- **自然题库** - 自然景观相关知识
- **红色题库** - 红色文化历史知识

## 技术栈

- 微信小游戏 Canvas 2D
- JavaScript ES6+
- 无第三方游戏引擎

## 项目结构

```
code/
├── content/           # 游戏内容数据
│   ├── heritage/      # 非遗题库
│   ├── nature/        # 自然题库
│   └── red/           # 红色题库
├── images/            # 图片资源
├── js/
│   ├── common/        # 公共模块（app.js、basePage.js）
│   ├── games/         # 游戏模块
│   │   ├── match3/    # 消消乐（模块化架构）
│   │   │   ├── constants.js   # 游戏常量配置
│   │   │   ├── animation.js   # 动画系统（对象池+缓动函数）
│   │   │   ├── renderer.js    # Canvas 渲染器
│   │   │   └── game.js        # 核心游戏逻辑
│   │   └── puzzle/    # 拼图游戏
│   ├── pages/         # 页面模块
│   │   ├── 登录页/
│   │   ├── 首页/
│   │   ├── 成就页/
│   │   └── 答题页/
│   ├── utils/         # 工具类（canvasUtils、scoreManager、errorCapture 等）
│   └── libs/          # 第三方库
├── game.js            # 游戏入口
└── game.json          # 游戏配置
scripts/               # 测试与开发脚本
├── test-runner.js     # 常规测试外部脚本（端口 19830）
├── test-achievements.js # 成就测试外部脚本（端口 19831）
├── error-capture.js   # 独立运行时错误捕获脚本
└── write-signal.js    # 信号文件写入工具
```

## 测试

### 运行测试

```bash
npm test          # 运行全部 113 项测试 + 运行时错误捕获
npm run test:ach  # 运行成就系统独立测试（端口 19831）
npm run errors    # 只捕获运行时错误，不运行测试（10 秒采集）
```

**前提**：微信开发者工具已打开且项目已加载。

### 测试流程

`npm test` 自动完成：
1. 写入信号文件 `.test-runner-signal`
2. 启动本地 HTTP 服务器（端口 19830）
3. 触发游戏热重载
4. 游戏内测试模块运行 113 项测试
5. 测试结果通过 `wx.request()` POST 到服务器
6. 同时收集运行时错误（`console.error`、`wx.onError` 等）
7. 保存 `test-report.json` 和 `error-report.json`

### 运行时错误捕获

测试通过不代表没有运行时错误。错误捕获模块 (`code/js/utils/errorCapture.js`) 会拦截：

| 来源 | 说明 |
|------|------|
| `console.error` | 代码中的错误日志 |
| `console.warn` | 警告信息 |
| `wx.onError` | 未捕获的运行时异常 |
| `wx.onPageNotFound` | 页面不存在错误 |

错误报告保存在 `error-report.json`，包含错误类型、消息、堆栈和时间戳。

### 测试报告

| 文件 | 内容 |
|------|------|
| `test-report.json` | 测试结果（总数、通过数、失败详情） |
| `error-report.json` | 运行时错误（按类型分组） |
| `test-report-achievements.json` | 成就测试结果 |

## 开发指南

### 环境要求
- 微信开发者工具
- 微信小游戏 AppID

### 运行项目
1. 下载微信开发者工具
2. 导入项目，选择 `code` 目录
3. 填入 AppID 或使用测试号
4. 点击编译预览

## 资源管理

游戏资源分为三类，对应三种文化主题：
- 🟠 非遗文化（橙色）
- 🟢 自然景观（绿色）
- 🔴 红色文化（红色）

## 许可证

MIT License
