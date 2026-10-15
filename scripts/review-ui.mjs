import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

await mkdir("output/review", { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
const externalRequests = [];
context.on("request", (request) => {
  if (
    /^https?:/.test(request.url()) &&
    new URL(request.url()).hostname !== "localhost"
  )
    externalRequests.push(request.url());
});
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://localhost:3000/?view=tv");
await page.evaluate(() => {
  localStorage.removeItem("mistbound_state_v2");
});
await page.reload();
await page.getByRole("heading", { name: /Đoàn Lữ Hành Xuyên Sương|The Mistbound/i }).waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({
  path: "output/review/title-desktop.png",
  fullPage: true,
});
await page.getByRole("button", { name: /Hướng dẫn chơi|How to play/i }).click();
await page.getByRole("dialog").waitFor({ state: "visible" });
await page.keyboard.press("Escape");
if (await page.getByRole("dialog").isVisible())
  throw new Error("Guide does not close with Escape");
await page.getByRole("button", { name: /Khởi Hành Lên Đường|Begin your journey/i }).click();
await page
  .getByRole("heading", { name: /Mọi hành trình đều bắt đầu từ một đoàn lữ hành|Every journey begins with a crew/i })
  .waitFor();
await page.screenshot({
  path: "output/review/lobby-desktop.png",
  fullPage: true,
});
await page.getByRole("button", { name: /RỜI TRẠM HOA ĐĂNG|DEPART LANTERN DEPOT/i }).click();
await page
  .getByRole("heading", { name: /Mắc Kẹt Tại Bến Phà Than Khóc|Stranded at the Weeping Ferry/i })
  .waitFor();
await page.screenshot({
  path: "output/review/ferry-desktop.png",
  fullPage: true,
});
for (const width of [390, 768, 1024]) {
  const mobile = await browser.newContext({
    viewport: { width, height: 844 },
    reducedMotion: "reduce",
  });
  const p = await mobile.newPage();
  p.on("pageerror", (error) => errors.push(error.message));
  await p.goto("http://localhost:3000/?view=tv");
  await p.getByRole("heading", { name: /Đoàn Lữ Hành Xuyên Sương|The Mistbound/i }).waitFor();
  await p.evaluate(() => document.fonts.ready);
  const overflow = await p.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  if (overflow) throw new Error(`Horizontal overflow at ${width}px`);
  await p.screenshot({
    path: `output/review/title-${width}.png`,
    fullPage: true,
  });
  if (width === 390) {
    await p.getByRole("button", { name: /Khởi Hành Lên Đường|Begin your journey/i }).click();
    await p.getByRole("button", { name: /Điện thoại|Phone/i }).click();
    await p.getByText(/Tập Huấn Vị Trí:|Station Practice:/i).waitFor();
    await p.screenshot({
      path: "output/review/controller-mobile.png",
      fullPage: true,
    });
    if (
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    )
      throw new Error("Mobile controller overflows");
  }
  await mobile.close();
}
await browser.close();
if (errors.length) throw new Error(errors.join("\n"));
if (externalRequests.length)
  throw new Error(
    `Unexpected external runtime requests: ${externalRequests.join(", ")}`,
  );
console.log(
  "PASS: desktop title, lobby, ferry, guide keyboard interaction, mobile controller, 390/768/1024px title layouts; no page errors.",
);
