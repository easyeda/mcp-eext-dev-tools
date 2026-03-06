import { chromium, Browser, Page } from "playwright";
import * as path from "path";
import { execSync, spawn } from "child_process";

const LCEDA_URL = "https://pro.lceda.cn/editor?cll=debug";
const USER_DATA_DIR = path.join(__dirname, "..", ".browser-data");
const REMOTE_DEBUG_PORT = 9222;

let browser: Browser | null = null;
let page: Page | null = null;

function isDebugPortListening(): boolean {
  try {
    execSync(`netstat -ano | findstr :${REMOTE_DEBUG_PORT}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function launchChrome() {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const child = spawn(chromePath, [
    `--remote-debugging-port=${REMOTE_DEBUG_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    "--no-first-run",
    "--no-default-browser-check",
  ], { detached: true, stdio: "ignore" });
  child.unref();
}

export async function getPage(): Promise<Page> {
  if (browser && page) {
    try {
      await page.title();
      return page;
    } catch {
      browser = null;
      page = null;
    }
  }

  if (!isDebugPortListening()) {
    launchChrome();
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      if (isDebugPortListening()) break;
    }
    // 端口就绪后再等一秒，确保浏览器内部初始化完成
    await new Promise((r) => setTimeout(r, 1000));
  }

  browser = await chromium.connectOverCDP(`http://127.0.0.1:${REMOTE_DEBUG_PORT}`);
  const contexts = browser.contexts();
  const ctx = contexts[0] || (await browser.newContext());
  const pages = ctx.pages();
  if (pages.length > 0) {
    page = pages[0];
  } else {
    page = await ctx.newPage();
  }
  return page;
}

async function isLoggedIn(p: Page): Promise<boolean> {
  const count = await p.locator("#login-btn").count();
  if (count === 0) return true; // 元素不存在，已登录
  // 元素存在时再检查可见性
  const isVisible = await p.locator("#login-btn").isVisible().catch(() => false);
  return !isVisible;
}

export async function ensureLoggedIn(p: Page): Promise<boolean> {
  await p.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  if (await isLoggedIn(p)) return true;

  // 未登录，用 JS 点击绕过可见性限制
  await p.locator("#login-btn").evaluate((el: HTMLElement) => el.click());

  return false;
}

export async function navigateToEditor(p: Page): Promise<void> {
  if (!p.url().includes("pro.lceda.cn")) {
    for (let i = 0; i < 3; i++) {
      try {
        await p.goto(LCEDA_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
        // 等待页面稳定
        await p.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
        return;
      } catch (err) {
        if (i === 2) throw err;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
}

