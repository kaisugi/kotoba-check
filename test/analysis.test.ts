import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import initLindera, {
  TokenizerBuilder,
  loadDictionaryFromBytes,
  type Tokenizer,
} from 'lindera-wasm'
import { concatenateBytes, fetchDictionaryBytes } from '../src/analysis/dictionaryLoader'
import { normalizeLinderaTokens, type LinderaToken } from '../src/analysis/linderaAdapter'
import { byteRangeToUtf16, createByteToUtf16Map } from '../src/analysis/offsets'
import type { Morpheme } from '../src/analysis/types'
import { detectAiExpressions, detectShortTopicComma } from '../src/rules/detect'

let tokenizer: Tokenizer

const bytes = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(resolve('public/lindera-ipadic', name)))

const tokenize = (text: string): Morpheme[] =>
  normalizeLinderaTokens(text, tokenizer.tokenize(text) as LinderaToken[])

const labelsIn = (text: string): string[] =>
  detectAiExpressions(tokenize(text)).map((finding) => finding.label)

beforeAll(async () => {
  await initLindera({
    module_or_path: new Uint8Array(
      readFileSync(resolve('node_modules/lindera-wasm/lindera_wasm_bg.wasm')),
    ),
  })
  const dictionary = loadDictionaryFromBytes(
    bytes('metadata.json'),
    bytes('dict.trie'),
    bytes('dict.valsidx'),
    bytes('dict.vals'),
    bytes('dict.wordsidx'),
    concatenateBytes([
      bytes('dict.words.part-aa'),
      bytes('dict.words.part-ab'),
      bytes('dict.words.part-ac'),
    ]),
    bytes('matrix.mtx'),
    bytes('char_def.bin'),
    bytes('unk.bin'),
  )
  const builder = new TokenizerBuilder()
  builder.setDictionaryInstance(dictionary)
  builder.setMode('normal')
  builder.setKeepWhitespace(false)
  tokenizer = builder.build()
}, 30_000)

describe('UTF-8 byte offset conversion', () => {
  it('converts Japanese, emoji and newline boundaries to UTF-16', () => {
    const text = '😀日本\n語'
    const map = createByteToUtf16Map(text)
    expect(byteRangeToUtf16(map, 4, 10)).toEqual([2, 4])
    expect(byteRangeToUtf16(map, 11, 14)).toEqual([5, 6])
  })

  it('keeps actual Lindera ranges aligned with the original text', () => {
    const text = '😀見出し\nこの設定が効きます。'
    const tokens = tokenize(text)
    for (const token of tokens) {
      expect(text.slice(token.start, token.end)).toBe(token.surface)
    }
    const effective = tokens.find((token) => token.lemma === '効く')!
    expect(effective.surface).toBe('効き')
    expect(effective.start).toBe(text.indexOf('効き'))
  })
})

describe('AI expression rules ported from upstream 1.2.0', () => {
  const invalidCases: readonly [string, string][] = [
    ['この設定が効きます。', '効く'],
    ['インデックスが効かない。', '効く'],
    ['同名の記事を書いた時点で壊れます。', '壊れる'],
    ['バッチ処理が走ります。', '走る'],
    ['色がビルド時に焼き込まれます。', '焼く（焼き込む）'],
    ['エラーが黙って握りつぶされます。', '黙って'],
    ['sans-serif が中国語のフォントに落ちます。', '〜に落ちる'],
    ['問いの前提を崩します。', '崩す'],
    ['このトークンの値を動かさないでください。', '値を動かす'],
    ['キャッシュから引いた値を使います。', '〜から引く'],
    ['MDX の経路が 2 つあります。', '経路'],
    ['リンク先の死活に依存しています。', '死活'],
    ['検証の漏れがあります。', '漏れ'],
    ['実装の不備ではなく設計上の帰結です。', '帰結'],
    ['原初の売り文句は無価値です。', '原初'],
    ['動的な組み立てが最大の穴です。', '穴'],
    ['無差別に削除します。', '無差別'],
    ['この事実を正本とします。', '正本'],
    ['似た役割の部品を探します。', '部品'],
    ['生の値の検査を CI で回します。', '検査'],
    ['この事実を正典とします。', '正典'],
    ['各実装に配線します。', '配線する'],
    ['画像を 2 組持つとリポジトリが太ります。', '太る'],
    ['モバイルでの横あふれを見張ります。', '見張る'],
    ['色の原料をここに置きます。', '原料'],
    ['実測では 120 ms でした。', '実測'],
    ['この前提を疑います。', '疑う'],
    ['ログと実装を照合します。', '照合'],
    ['仕様を見落としていました。', '見落とす'],
    ['ログと実装を突き合わせます。', '突き合わせる'],
    ['原因の断定は避けます。', '断定'],
    ['学習の入口として最適です。', '入口'],
    ['設計の土台になります。', '土台'],
    ['測定のための道具を選びます。', '道具'],
    ['問題の核心はここです。', '核心'],
    ['全体の構図を整理します。', '構図'],
    ['責務の線引きが曖昧です。', '線引き'],
    ['設定ミスという事故が起きました。', '事故'],
    ['責務が混ざります。', '混ざる'],
    ['ここに落とし穴があります。', '落とし穴'],
    ['前提が破綻します。', '破綻'],
    ['警告が素通りされます。', '素通り'],
    ['原因を切り分けます。', '切り分ける'],
    ['バグを潰します。', '潰す'],
    ['実装の詳細に踏み込みます。', '踏み込む'],
    ['層の境界を溶かします。', '溶かす'],
    ['既定ではこの値が使われます。', '既定では'],
    ['定番の構成です。', '定番'],
    ['定石どおりに実装します。', '定石'],
    ['設定を変えた瞬間に気づきました。', '〜した瞬間'],
    ['警告が静かに無視されます。', '静かに'],
  ]

  it.each(invalidCases)('detects %s', (text, expectedLabel) => {
    expect(labelsIn(text)).toContain(expectedLabel)
  })

  const validCases = [
    '有効活用していきたいです。',
    '効率よく進めます。',
    '水が漏れるので直します。',
    '次の実験の配線を準備します。',
    '光配線方式の物件に住んでいます。',
    '結果として妥当な線に落ち着きました。',
    '自走できるエンジニアを目指します。',
    'サーバーが落ちました。',
    '見出しの下に罫線を引きます。',
    '発表資料から引用しました。',
    'ローカルで DB サーバを動かします。',
    '動画の素材を差し替えます。',
    '暗黙的にアクセスできます。',
    '出力の品質が落ちました。',
    '検査官が来ました。',
    '既定値を変更します。',
    'その瞬間に気づきました。',
    '静かに話します。',
  ]

  it.each(validCases)('does not flag the upstream valid case: %s', (text) => {
    expect(labelsIn(text)).toEqual([])
  })

  it('keeps overlapping expressions as separate findings', () => {
    expect(labelsIn('この機能は静かに壊れます。')).toEqual(['静かに', '壊れる'])
  })

  it('returns ranges after an emoji in UTF-16 units', () => {
    const text = '😀\nこの設定が効きます。'
    const [finding] = detectAiExpressions(tokenize(text))
    expect(text.slice(finding.start, finding.end)).toBe('効き')
    expect(finding.start).toBe(text.indexOf('効き'))
  })
})

describe('opt-in short topic comma rule', () => {
  it('detects a short topic and resets at a newline', () => {
    const text = '前提を確認する\n結論は、まだ出ていません。'
    const findings = detectShortTopicComma(text, tokenize(text))
    expect(findings).toHaveLength(1)
    expect(text.slice(findings[0].start, findings[0].end)).toBe('、')
    expect(findings[0].message).toContain('3文字')
  })

  it('does not detect a long topic by default', () => {
    const text = 'ブラウザ上のJavaScriptがリクエストを行う場合は、設定します。'
    expect(detectShortTopicComma(text, tokenize(text))).toEqual([])
  })
})

describe('dictionary loading failure', () => {
  it('reports the missing local dictionary file', async () => {
    const failingFetch = async (): Promise<Response> =>
      new Response('', { status: 404 })
    await expect(
      fetchDictionaryBytes('https://example.test/lindera-ipadic/', failingFetch),
    ).rejects.toThrow(/辞書ファイル.+取得できませんでした（404）/)
  })
})

