import { chromium } from 'playwright'

const ids = process.argv.slice(2)
const out = '/tmp/claude-0/-home-user-FFT/562581ab-127c-5691-91de-daff2cfb7086/scratchpad'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1360, height: 940 } })
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error' && !m.text().includes('ERR_CERT')) errors.push(m.text())
})
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
for (const id of ids) {
  await page.evaluate((i) => document.getElementById(i)?.scrollIntoView(), id)
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${out}/ext-${id}.png` })
  console.log('shot', id)
}
console.log('ERRORS:', errors.length)
errors.forEach((e) => console.log('  ', e))
await browser.close()
