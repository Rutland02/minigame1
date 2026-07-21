# 项目规则

## 自动化测试

本项目有全自动测试框架，修改代码后必须运行测试验证无回归。

### 运行测试

```bash
npm test
```

**前提**：微信开发者工具已打开且项目已加载。

### 测试流程（全自动，无需手动操作）

1. 测试脚本启动本地 HTTP 服务器（端口 19830）
2. 自动触发游戏重新编译（修改 game.js 时间戳）
3. 游戏加载后测试模块自动运行
4. 测试结果通过 `wx.request()` 发送到服务器
5. 服务器接收结果，输出报告并保存到 `test-report.json`

### 测试覆盖范围（22 项）

- **页面导航**（6 项）：login、home、achievement、quiz、match3、puzzle
- **数据层**（3 项）：DataBus 存在性、无死字段、DataManager 已删除
- **答题页**（6 项）：题目加载、初始状态、选择/提交、翻页、提示、按钮不重叠
- **match3 游戏**（4 项）：棋盘初始化、棋子有效性、无初始匹配、颜色种类
- **拼图游戏**（1 项）：初始化验证
- **成就系统**（1 项）：数据结构一致性
- **错误监控**（1 项）：全页面遍历无崩溃

### 添加新测试

在 `code/js/testRunner.js` 的 `runAllTests()` 函数中添加：

```js
await runner.run('test_name', async () => {
  const page = app.currentPage;
  runner.assert(条件, '失败信息');
  return '通过信息';
});
```

### 关键文件

| 文件 | 用途 |
|------|------|
| `code/js/testRunner.js` | 游戏内测试模块，直接访问 GameGlobal |
| `scripts/test-runner.js` | 外部测试脚本，启动 HTTP 服务器接收结果 |
| `test-report.json` | 测试报告（自动生成） |

---

## 修复工作流

本项目有一份代码质量审查报告和配套的修复日志，修复问题时必须遵守以下流程：

1. **修复前**：在 [代码质量审查报告.md](代码质量审查报告.md) 中找到对应条目（如 P0-1），确认问题描述和涉及文件。
2. **修复后**（每次修复完成后必须执行，不可省略）：
   - 在 [代码质量审查报告.md](代码质量审查报告.md) 中将对应条目标记为 `✅ 已修复`（勾选 checkbox 并更新状态图标）；若决定不修，标记为 `⏭️ 已跳过` 并附原因。
   - 在 [修复日志.md](修复日志.md) 顶部追加一条修复记录，格式见该文件内的模板，必须包含：日期、条目编号、问题描述、修改内容、涉及文件、验证方式。
   - 若完成的是某个阶段的全部条目，同步更新报告底部"重构阶段计划与预算"表格中的阶段状态。
3. **提交规范**：git commit message 中不要添加任何 AI 署名（如 `Co-Authored-By: Claude`）。

## 项目结构说明

- `code/` — 微信小游戏源码（Canvas 渲染，非 WXML 页面结构）
- `code/js/common/app.js` — 应用入口与页面路由
- `code/js/databus.js` — 全局数据总线
- `code/js/utils/scoreManager.js` — 成绩与成就管理
- `code/js/pages/` — 各页面（登录/首页/成就/答题）
- `code/js/games/` — 游戏（match3 消消乐、puzzle 拼图）
- `code/content/` — 题库与成就定义 JSON
