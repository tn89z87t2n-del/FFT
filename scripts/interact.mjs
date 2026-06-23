import { chromium } from 'playwright'
const browser = await chromium.launch()
const out = '/tmp/claude-0/-home-user-FFT/562581ab-127c-5691-91de-daff2cfb7086/scratchpad'

// 1) Mobile view
const mob = await browser.newPage({ viewport: { width: 390, height: 800 } })
await mob.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
await mob.waitForTimeout(800)
await mob.screenshot({ path: `${out}/shot-mobile.png` })

// 2) Winding machine: set winding freq to 3 (match signal) -> COM should jump
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
await page.evaluate(() => document.getElementById('winding')?.scrollIntoView())
await page.waitForTimeout(600)
// first slider in winding section is winding frequency
const slider = page.locator('#winding input[type=range]').first()
await slider.evaluate((el) => {
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  set.call(el, '3')
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
})
await page.waitForTimeout(600)
await page.screenshot({ path: `${out}/shot-winding-match.png` })
const comText = await page.locator('#winding .text-accent.text-lg, #winding .font-mono.text-lg').first().textContent().catch(() => '?')
console.log('COM at winding=3:', comText)

console.log('PAGE ERRORS:', errors.length, errors)
await browser.close()
