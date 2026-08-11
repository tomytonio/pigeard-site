// Rend une affiche HTML 1080×1920 en PNG.
// Usage : node rendu-story.mjs <fichier.html> <sortie.png>
// (import absolu : NODE_PATH n'est pas lu par les modules ES)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const [, , htmlPath, pngPath] = process.argv;
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const page = await browser.newPage({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
});
await page.goto(pathToFileURL(resolve(htmlPath)).href);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(250);
await page.screenshot({ path: resolve(pngPath) });
await browser.close();
console.log('PNG écrit :', resolve(pngPath));
