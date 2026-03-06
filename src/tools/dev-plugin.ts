import * as fs from "fs";
import * as path from "path";
import { Page } from "playwright";
import { getPage, navigateToEditor, ensureLoggedIn } from "../browser.js";

interface ConsoleEntry {
  timestamp: string;
  type: string;
  text: string;
}

const consoleLogs: ConsoleEntry[] = [];
const MAX_LOGS = 500;
let listening = false;

function startConsoleListener(p: Page) {
  if (listening) return;
  listening = true;

  p.on("console", (msg) => {
    consoleLogs.push({
      timestamp: new Date().toISOString(),
      type: msg.type(),
      text: msg.text(),
    });
    // 保留最近 MAX_LOGS 条
    if (consoleLogs.length > MAX_LOGS) {
      consoleLogs.splice(0, consoleLogs.length - MAX_LOGS);
    }
  });

  p.on("pageerror", (err) => {
    consoleLogs.push({
      timestamp: new Date().toISOString(),
      type: "error",
      text: err.message,
    });
  });
}

/** 导入插件并开始监听控制台 */
export async function devPlugin(args: { pluginPath: string }) {
  if (!fs.existsSync(args.pluginPath)) {
    return { type: "text" as const, text: `文件不存在: ${args.pluginPath}` };
  }

  const p = await getPage();

  try {
    await navigateToEditor(p);

    if (!(await ensureLoggedIn(p))) {
      return {
        type: "text" as const,
        text: "嘉立创EDA未登录，请先在浏览器中完成登录后再继续操作。",
      };
    }

    // 清空之前的日志，开始监听
    consoleLogs.length = 0;
    startConsoleListener(p);

    // 高级 → 扩展管理器
    await p.locator('span[data-test="Advanced"]').click();
    await p.getByText("扩展管理器(E)...").click();

    const modal = p.locator("[class*='lc_modal_dialog']").first();
    await modal.waitFor({ state: "visible", timeout: 10000 });

    const [fileChooser] = await Promise.all([
      p.waitForEvent("filechooser", { timeout: 10000 }),
      modal.locator("button", { hasText: "导入" }).click(),
    ]);
    await fileChooser.setFiles(args.pluginPath);
    await p.waitForTimeout(2000);

    const closeBtn = modal.locator("[class*='close']").first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    } else {
      await p.keyboard.press("Escape");
    }
    await p.waitForTimeout(300);

    return {
      type: "text" as const,
      text: `插件导入成功: ${path.basename(args.pluginPath)}。请先在嘉立创EDA中手动测试插件功能，如果遇到问题再调用 get_console_logs 获取调试日志。`,
    };
  } catch (error: any) {
    return { type: "text" as const, text: `导入失败: ${error.message}` };
  }
}

/** 获取控制台日志 */
export async function getConsoleLogs(args: { clear?: boolean; filter?: string; count?: number }) {
  const count = args.count || 50;
  let logs = consoleLogs.slice(-count);

  if (args.filter) {
    const f = args.filter.toLowerCase();
    logs = logs.filter(
      (l) => l.type.includes(f) || l.text.toLowerCase().includes(f)
    );
  }

  const result = formatLogs(logs);

  if (args.clear) {
    consoleLogs.length = 0;
  }

  return {
    type: "text" as const,
    text: logs.length === 0
      ? "暂无控制台日志。确保已通过 dev_plugin 导入插件并开启监听。"
      : `控制台日志(${logs.length}条):\n${result}`,
  };
}

function formatLogs(logs: ConsoleEntry[]): string {
  if (logs.length === 0) return "(空)";
  return logs
    .map((l) => `[${l.timestamp}] [${l.type}] ${l.text}`)
    .join("\n");
}
