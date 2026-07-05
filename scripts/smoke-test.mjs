import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = 'http://localhost:5173'
const errors = []
let failures = 0

fs.mkdirSync('/app/screenshots', { recursive: true })

const browser = await chromium.launch({ args: ['--no-sandbox'] })
const page = await browser.newPage()
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`)
})
page.on('pageerror', (err) => {
  errors.push(`[pageerror] ${err.message}`)
})

function fail(label, detail) {
  failures += 1
  console.log(`FAIL ${label}: ${detail}`)
}
function ok(label) {
  console.log(`OK ${label}`)
}

async function shot(name) {
  await page.screenshot({ path: `/app/screenshots/${name}.png`, fullPage: true })
}

// 1. Dashboard
await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' })
await page.waitForSelector('text=Dashboard', { timeout: 10000 })
await shot('01-dashboard')
ok('Dashboard renders')

// 2. Domains list
await page.goto(`${BASE}/#/domains`, { waitUntil: 'networkidle' })
await page.waitForSelector('text=Secure identity and access', { timeout: 10000 })
const domainCards = await page.locator('.card-link').count()
if (domainCards !== 4) fail('Domains list', `expected 4 domain cards, got ${domainCards}`)
else ok('Domains list shows 4 domains')
await shot('02-domains')

// 3. Domain detail
await page.goto(`${BASE}/#/domains/d1`, { waitUntil: 'networkidle' })
await page.waitForSelector('text=Manage security controls for identity and access', { timeout: 10000 })
ok('Domain detail (d1) renders objectives')
await shot('03-domain-detail')

// 4. Objective detail
await page.goto(`${BASE}/#/objectives/o1-1`, { waitUntil: 'networkidle' })
await page.waitForSelector('text=Réviser en quiz', { timeout: 10000 })
const keyPointsCount = await page.locator('text=Points clés').count()
if (keyPointsCount === 0) fail('Objective detail', 'missing key points section')
else ok('Objective detail (o1-1) renders lesson content')
const diagramCount = await page.locator('.diagram').count()
if (diagramCount < 1) fail('Objective detail', 'no diagrams rendered')
else ok(`Objective detail renders ${diagramCount} diagram(s)`)
const boldCount = await page.locator('.keypoints strong, .callout strong').count()
if (boldCount < 1) fail('Objective detail', 'no bold emphasis rendered')
else ok(`Objective detail renders bold emphasis (${boldCount} instances)`)
await shot('04-objective-detail')

// 4b. dark theme
await page.click('.theme-toggle')
await page.waitForTimeout(200)
const themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
if (themeAttr !== 'dark') fail('Theme toggle', `expected dark, got ${themeAttr}`)
else ok('Theme toggle switches to dark')
await shot('04b-objective-dark')
await page.click('.theme-toggle')
await page.waitForTimeout(200)

// 5. Targeted quiz flow
await page.click('text=Réviser en quiz')
await page.waitForSelector('.choice', { timeout: 10000 })
for (let i = 0; i < 3; i++) {
  await page.waitForSelector('.choice', { timeout: 10000 })
  await page.locator('.choice').first().click()
  const validateBtn = page.locator('button:has-text("Valider")')
  if (await validateBtn.count() > 0) {
    await validateBtn.click()
    await page.waitForSelector('text=Explication', { timeout: 10000 })
  }
  const nextBtn = page.locator('button:has-text("Question suivante"), button:has-text("Voir le résultat")')
  if (await nextBtn.count() > 0) {
    await nextBtn.click()
  }
}
await shot('05-quiz-in-progress')
ok('Quiz flow: answered 3 questions with validate/next working')

// 6. Mock exam flow
await page.goto(`${BASE}/#/exam`, { waitUntil: 'networkidle' })
await page.waitForSelector('text=Commencer l\'examen', { timeout: 10000 })
await page.click('text=Commencer l\'examen')
await page.waitForSelector('.timer', { timeout: 10000 })
ok('Exam session started, timer visible')
await page.locator('.choice').first().click()
await shot('06-exam-session')
await page.click('button:has-text("Terminer l\'examen")')
await page.waitForSelector("text=Résultat de l'examen blanc", { timeout: 15000 })
await page.waitForSelector('text=Détail par domaine', { timeout: 15000 })
ok('Exam submitted, results page shows scaled score')
await shot('07-exam-result')

// 7. Labs page + checkbox persistence
await page.goto(`${BASE}/#/labs`, { waitUntil: 'networkidle' })
await page.waitForSelector('input[type=checkbox]', { timeout: 10000 })
const firstCheckbox = page.locator('input[type=checkbox]').first()
const beforeChecked = await firstCheckbox.isChecked()
await firstCheckbox.click()
await page.waitForTimeout(300)
const afterChecked = await firstCheckbox.isChecked()
if (afterChecked === beforeChecked) fail('Labs checkbox', 'checkbox state did not toggle')
else ok('Labs checkbox toggles')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('input[type=checkbox]', { timeout: 10000 })
const afterReload = await page.locator('input[type=checkbox]').first().isChecked()
if (afterReload !== afterChecked) fail('Labs persistence', 'checkbox state did not survive reload (IndexedDB)')
else ok('Labs checkbox persisted across reload via IndexedDB')
await shot('08-labs')

// 8. Dashboard should now show a recent exam + reflect progress
await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' })
await page.waitForSelector('text=Examens blancs récents', { timeout: 10000 })
const examRows = await page.locator('table.scores tbody tr').count()
if (examRows < 1) fail('Dashboard exam history', 'no exam rows found after completing an exam')
else ok('Dashboard reflects completed exam in history')
await shot('09-dashboard-after')

console.log('CONSOLE_ERRORS_COUNT', errors.length)
errors.forEach((e) => console.log(e))
console.log('FAILURES', failures)

await browser.close()
process.exit(failures === 0 && errors.length === 0 ? 0 : 1)
