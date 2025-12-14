import path from 'node:path'
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'

const repoRoot = path.resolve(new URL('../../..', import.meta.url).pathname)
const uiMediaDir = path.join(repoRoot, 'packages/ui/src/media')
const docsLogoDir = path.join(repoRoot, 'apps/docs/logo')

mkdirSync(docsLogoDir, {recursive: true})

const logoSvg = readFileSync(path.join(uiMediaDir, 'logo.svg'), 'utf8')

// Dark logo: use the UI logo as-is (white text).
writeFileSync(path.join(docsLogoDir, 'dark.svg'), logoSvg)

// Light logo: make the "white" fills dark so it remains visible on light backgrounds.
const lightLogoSvg = logoSvg.replaceAll('fill="white"', 'fill="#09090B"')
writeFileSync(path.join(docsLogoDir, 'light.svg'), lightLogoSvg)


