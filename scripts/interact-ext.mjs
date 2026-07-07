import { chromium } from 'playwright'
const out = '/tmp/claude-0/-home-user-FFT/562581ab-127c-5691-91de-daff2cfb7086/scratchpad'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1360, height: 940 } })
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error' && !m.text().includes('ERR_CONNECTION') && !m.text().includes('ERR_CERT'))
    errors.push(m.text())
})
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' })

// 1) statické sekcie
for (const id of ['benchmark', 'windowing', 'outro']) {
  await page.evaluate((i) => document.getElementById(i)?.scrollIntoView(), id)
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${out}/ext-${id}.png` })
  console.log('shot', id)
}

// 2) benchmark beh
await page.evaluate(() => document.getElementById('benchmark')?.scrollIntoView())
await page.getByRole('button', { name: /spusti benchmark/ }).click()
await page.waitForTimeout(12000) // DFT 4096 + FFT všetko
await page.screenshot({ path: `${out}/ext-benchmark-run.png` })
console.log('benchmark done')

// 3) mic sim mód
await page.evaluate(() => document.getElementById('mic')?.scrollIntoView())
await page.waitForTimeout(400)
await page.getByRole('button', { name: /simulovaný signál/ }).click()
await page.waitForTimeout(2500)
await page.screenshot({ path: `${out}/ext-mic-sim.png` })
const peak = await page.locator('#mic .font-mono.text-lg').first().textContent()
console.log('sim peak readout:', peak?.trim())

// 4) butterfly hover
await page.evaluate(() => document.getElementById('butterfly')?.scrollIntoView())
await page.waitForTimeout(400)
const nodes = page.locator('#butterfly svg circle')
await nodes.nth(28).hover() // uzol vo výstupnom stĺpci
await page.waitForTimeout(300)
await page.screenshot({ path: `${out}/ext-butterfly-hover.png` })
console.log('butterfly hover done')

// 5) mobil
const mob = await browser.newPage({ viewport: { width: 390, height: 800 } })
await mob.goto('http://localhost:4200/', { waitUntil: 'networkidle' })
await mob.waitForTimeout(800)
await mob.screenshot({ path: `${out}/ext-mobile.png` })
console.log('mobile done')

console.log('ERRORS:', errors.length)
errors.forEach((e) => console.log('  ', e))
await browser.close()
