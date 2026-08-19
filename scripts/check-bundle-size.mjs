import { readdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const assetsDirectory = fileURLToPath(new URL('../dist/assets/', import.meta.url))
const assets = await readdir(assetsDirectory)

const budgets = [
  { label: '공통 진입 번들', pattern: /^index-.*\.js$/, maximumKiB: 450 },
  { label: 't 계산기 번들', pattern: /^TCalculatorPage-.*\.js$/, maximumKiB: 550 },
  { label: '공학용 계산기 번들', pattern: /^ScientificCalculatorPage-.*\.js$/, maximumKiB: 900 },
]

let failed = false

for (const budget of budgets) {
  const filename = assets.find((asset) => budget.pattern.test(asset))
  if (!filename) {
    console.error(`[bundle] ${budget.label} 파일을 찾지 못했습니다.`)
    failed = true
    continue
  }

  const { size } = await stat(`${assetsDirectory}/${filename}`)
  const sizeKiB = size / 1024
  const status = sizeKiB <= budget.maximumKiB ? 'OK' : 'OVER'
  console.log(`[bundle] ${status} ${budget.label}: ${sizeKiB.toFixed(1)} KiB / ${budget.maximumKiB} KiB`)
  if (status === 'OVER') failed = true
}

if (failed) {
  console.error('[bundle] 번들 예산을 초과했거나 필수 청크가 누락되었습니다.')
  process.exitCode = 1
}
