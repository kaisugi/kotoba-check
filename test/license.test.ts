import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (path: string) => readFileSync(join(root, path), 'utf8')
const readBytes = (path: string) => readFileSync(join(root, path))
const sha256 = (value: NodeJS.ArrayBufferView) => createHash('sha256').update(value).digest('hex')

describe('配布ライセンス', () => {
  it('プロジェクト本体のMITライセンスを公開物にも含める', () => {
    const repositoryLicense = read('LICENSE')

    expect(repositoryLicense).toContain('MIT License')
    expect(repositoryLicense).toContain('Copyright (c) 2026 Kaito Sugimoto')
    expect(read('public/LICENSE.txt')).toBe(repositoryLicense)
  })

  it('IPADIC原版の著作権・許諾・免責条項を完全な形で含める', () => {
    const copying = read('public/lindera-ipadic/COPYING')

    expect(copying).toContain('Copyright 2000, 2001, 2002, 2003 Nara Institute')
    expect(copying).toContain('Use, reproduction, and distribution of this software is permitted.')
    expect(copying).toContain('must include both the above copyright notice')
    expect(copying).toContain('NO WARRANTY')
    expect(sha256(readBytes('public/lindera-ipadic/COPYING'))).toBe(
      'fca02d9adb601d101eccdf3131119abfff2d9c825ef5c759d7a89ebbaa972099',
    )
  })

  it('分割したIPADIC単語辞書を原配布物と同じバイト列に復元できる', () => {
    const words = Buffer.concat([
      readBytes('public/lindera-ipadic/dict.words.part-aa'),
      readBytes('public/lindera-ipadic/dict.words.part-ab'),
      readBytes('public/lindera-ipadic/dict.words.part-ac'),
    ])

    expect(words.byteLength).toBe(32_674_733)
    expect(sha256(words)).toBe('fc1d924e12af84a352feccce35b772383322760ee2b3da4be0e173ad82953938')
  })

  it('公開用一覧からすべての主要ライセンスへ案内する', () => {
    const notices = read('public/THIRD_PARTY_NOTICES.txt')

    expect(notices).toContain('/LICENSE.txt')
    expect(notices).toContain('/lindera-LICENSE.txt')
    expect(notices).toContain('/lindera-wasm-LICENSE.txt')
    expect(notices).toContain('/lindera-wasm-THIRD-PARTY-LICENSES.html')
    expect(notices).toContain('/lindera-ipadic/COPYING')
    expect(notices).toContain('/lindera-ipadic/NOTICE.txt')
    expect(notices).toContain('/textlint-rule-preset-ai-words-ja-LICENSE.txt')
    expect(notices).toContain('/vite-LICENSE.md')
  })

  it('UTF-8を明示したHTMLのライセンス・謝辞ページを公開する', () => {
    const page = read('public/licenses.html')

    expect(page).toContain('<meta charset="utf-8">')
    expect(page).toContain('p1ass氏')
    expect(page).toContain('/lindera-ipadic/COPYING')
  })

  it('WASMにリンクされた依存関係の主要ライセンス全文を含める', () => {
    const report = read('public/lindera-wasm-THIRD-PARTY-LICENSES.html')

    expect(report).toContain('Apache License 2.0')
    expect(report).toContain('BSD 3-Clause')
    expect(report).toContain('MIT License')
    expect(report).toContain('Unicode License v3')
  })
})
