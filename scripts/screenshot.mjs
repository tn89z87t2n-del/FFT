import { chromium } from 'playwright'

const sections = process.argv.slice(2)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

const outDir = '/tmp/claude-0/-home-user-FFT/562581ab-127c-5691-91de-daff2cfb7086/scratchpad'
const ids = sections.length ? sections : ['intro']
for (const id of ids) {
  await page.evaluate((i) => document.getElementById(i)?.scrollIntoView(), id)
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${outDir}/shot-${id}.png` })
  console.log('shot', id)
}

console.log('\nCONSOLE ERRORS:', errors.length)
errors.forEach((e) => console.log('  ', e))
await browser.close()
