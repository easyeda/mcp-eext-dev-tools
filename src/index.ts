import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { importPlugin } from "./tools/import-plugin.js";
import { devPlugin, getConsoleLogs } from "./tools/dev-plugin.js";

const server = new McpServer({
  name: "mcp-eext-dev-tools",
  version: "1.0.0",
});

server.tool(
  "import_plugin",
  "将本地插件文件导入到嘉立创EDA。自动打开浏览器访问立创EDA，如果未登录会弹出扫码登录页面等待用户扫码，登录后自动执行：高级→扩展管理器→上传插件文件→导入。登录状态会缓存，下次无需重复登录。",
  {
    pluginPath: z.string().describe("插件文件的绝对路径"),
  },
  async (args) => ({ content: [await importPlugin(args)] })
);

server.tool(
  "dev_plugin",
  "导入插件到嘉立创EDA并开启浏览器控制台监听。导入后自动捕获所有console输出（log/warn/error/info）和页面错误。用于插件开发调试，导入后可通过 get_console_logs 获取控制台输出。",
  {
    pluginPath: z.string().describe("插件文件的绝对路径"),
  },
  async (args) => ({ content: [await devPlugin(args)] })
);

server.tool(
  "get_console_logs",
  "获取嘉立创EDA浏览器控制台日志。需先通过 dev_plugin 导入插件并开启监听。支持按类型/关键词过滤，可指定返回条数，可选择获取后清空。",
  {
    filter: z.string().optional().describe("过滤关键词，匹配日志类型或内容（如 error、warn、某个函数名）"),
    count: z.number().optional().describe("返回最近N条日志，默认50条"),
    clear: z.boolean().optional().describe("获取后是否清空日志缓存，默认false"),
  },
  async (args) => ({ content: [await getConsoleLogs(args)] })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("mcp-eext-dev-tools MCP Server started");
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
