import { access, readdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const rootDirectory = resolve(import.meta.dirname, '..')
const documentationFiles = ['README.md', 'CONTRIBUTING.md', 'SECURITY.md', 'AGENTS.md']

try {
  const docs = await readdir(resolve(rootDirectory, 'docs'))
  documentationFiles.push(...docs.filter((file) => file.endsWith('.md')).map((file) => `docs/${file}`))
} catch {
  // The missing docs directory is reported below through broken README links.
}

const brokenLinks = []

for (const relativeFile of documentationFiles) {
  const absoluteFile = resolve(rootDirectory, relativeFile)
  let content

  try {
    content = await readFile(absoluteFile, 'utf8')
  } catch {
    brokenLinks.push(`${relativeFile} 파일을 읽을 수 없습니다.`)
    continue
  }

  const markdownLinkPattern = /\[[^\]]+\]\((?!https?:|mailto:|#)([^)#]+\.md)(?:#[^)]+)?\)/g
  for (const match of content.matchAll(markdownLinkPattern)) {
    const target = resolve(dirname(absoluteFile), decodeURIComponent(match[1]))
    try {
      await access(target)
    } catch {
      brokenLinks.push(`${relativeFile} → ${match[1]}`)
    }
  }
}

if (brokenLinks.length > 0) {
  console.error('[docs] 깨진 로컬 문서 링크가 있습니다:')
  brokenLinks.forEach((link) => console.error(`- ${link}`))
  process.exitCode = 1
} else {
  console.log(`[docs] ${documentationFiles.length}개 문서의 로컬 링크가 유효합니다.`)
}
