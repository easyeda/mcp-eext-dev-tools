import * as fs from "fs";
import * as path from "path";
import { getPage, navigateToEditor, ensureLoggedIn } from "../browser.js";

export async function importPlugin(args: { pluginPath: string }) {
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

    // 高级 → 扩展管理器
    await p.locator('span[data-test="Advanced"]').click();
    await p.getByText("扩展管理器(E)...").click();

    const modal = p.locator("[class*='lc_modal_dialog']").first();
    await modal.waitFor({ state: "visible", timeout: 10000 });

    // 拦截文件选择对话框，直接注入文件
    const [fileChooser] = await Promise.all([
      p.waitForEvent("filechooser", { timeout: 10000 }),
      modal.locator("button", { hasText: "导入" }).click(),
    ]);
    await fileChooser.setFiles(args.pluginPath);
    await p.waitForTimeout(2000);

    // 关闭扩展管理器弹窗
    const closeBtn = modal.locator("[class*='close']").first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    } else {
      await p.keyboard.press("Escape");
    }
    await p.waitForTimeout(300);

    return {
      type: "text" as const,
      text: `插件导入成功: ${path.basename(args.pluginPath)}`,
    };
  } catch (error: any) {
    return { type: "text" as const, text: `导入失败: ${error.message}` };
  }
}
