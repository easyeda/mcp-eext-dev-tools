# mcp-eext-dev-tools

用于 嘉立创EDA & EasyEDA 专业版扩展开发与调试的 MCP 服务。使用此MCP可以实现通过 AI Agent 自动完成插件导入、浏览器控制台日志采集等操作，由AI自动开发、构建、调试插件。

## 功能

| 工具 | 说明 |
|------|------|
| `import_plugin` | 将本地插件文件导入到嘉立创EDA专业版 |
| `dev_plugin` | 导入插件并开启控制台日志监听 |
| `get_console_logs` | 获取浏览器控制台输出（支持过滤、分页、清空） |

## 工作原理

1. 自动启动 Chrome（开启远程调试端口 9222），或连接已运行的实例
2. 自动在浏览器中打开嘉立创EDA专业版调试模式，未登录时自动弹出扫码登录页面
3. 登录状态缓存在 `.browser-data/` 目录，后续无需重复登录
4. 通过 Playwright 操作浏览器完成插件上传流程
5. `dev_plugin` 导入后自动注册页面 `console` 和 `pageerror` 事件监听，捕获所有 log / warn / error / info 输出，最多缓存 500 条
6. 通过 `get_console_logs` 随时拉取缓存日志，支持按类型或关键词过滤、限制返回条数、获取后清空缓存
7. AI Agent可按获取到的日志情况分析插件运行状态，以便对插件源码调整

## 环境要求

- Node.js 20.17.0+
- Google Chrome（建议安装路径：`C:\Program Files\Google\Chrome\Application\chrome.exe`）

## 安装

```bash
npm install
npm run build
```

## 配置 MCP

生成 MCP 配置文件：

```bash
npm run mcp-config
```

将生成的MCP配置文件```mcp-config.json```按照你所使用的AI Agent提供的文档导入

## 使用示例

在 AI 对话中：

```
请帮我在嘉立创EDA导入插件
请帮我在嘉立创EDA导入并调试插件
请帮我看下日志，为什么插件不起作用
```

