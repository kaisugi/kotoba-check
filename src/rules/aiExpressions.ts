import type { Morpheme } from '../analysis/types'

export type TokenCondition = {
  surface?: string | readonly string[]
  lemma?: string | readonly string[]
  pos?: string
  posDetail?: string
}

export type ExpressionRule = {
  id: string
  label: string
  message: string
  tokens: readonly TokenCondition[]
}

const verb = (lemma: string | readonly string[]): TokenCondition => ({
  lemma,
  pos: '動詞',
  posDetail: '自立',
})

const noun = (lemma: string): TokenCondition => ({ lemma, pos: '名詞' })
const particle = (surface: string): TokenCondition => ({
  surface,
  pos: '助詞',
  posDetail: '格助詞',
})

const expression = (
  id: string,
  label: string,
  tokens: readonly TokenCondition[],
  detail?: string,
): ExpressionRule => ({
  id,
  label,
  tokens,
  message:
    detail ??
    `「${label}」はAIが書いた文章で多用される表現です。文脈に合う、より具体的な表現に言い換えられないか検討してください。`,
})

const ni = particle('に')
const de = particle('で')
const ta: TokenCondition = { surface: 'た', pos: '助動詞' }
const niAdverbial: TokenCondition = {
  surface: 'に',
  pos: '助詞',
  posDetail: '副詞化',
}

/**
 * Ported from textlint-rule-preset-ai-words-ja 1.2.1 (MIT).
 * The rules intentionally describe expressions, not an authorship score.
 */
export const aiExpressionRules: readonly ExpressionRule[] = [
  expression('effective', '効く', [verb('効く')]),
  expression('break', '壊れる', [verb('壊れる')]),
  expression('run', '走る', [
    {
      surface: ['走る', '走っ', '走り', '走ら', '走れ', '走ろ'],
      pos: '動詞',
      posDetail: '自立',
    },
  ]),
  expression('bake', '焼く（焼き込む）', [verb('焼く')]),
  expression('silently', '黙って', [verb('黙る')]),
  expression('fall-to', '〜に落ちる', [ni, verb('落ちる')]),
  expression('collapse', '崩す', [verb('崩す')]),
  expression('move-value', '値を動かす', [
    { surface: '値', pos: '名詞' },
    { surface: 'を', pos: '助詞' },
    verb('動かす'),
  ]),
  expression(
    'pull-from',
    '〜から引く',
    [{ surface: 'から', pos: '助詞', posDetail: '格助詞' }, verb('引く')],
    '「〜から引く」を値を読む意味で使うと、「下線を引く」のような本来の意味と混ざります。より具体的に書けないか検討してください。',
  ),
  expression('route', '経路', [noun('経路')]),
  expression('health', '死活', [noun('死活')]),
  expression('omission', '漏れ', [noun('漏れ')]),
  expression('consequence', '帰結', [noun('帰結')]),
  expression('primordial', '原初', [noun('原初')]),
  expression('hole', '穴', [noun('穴')]),
  expression('indiscriminate', '無差別', [
    { surface: '無', pos: '接頭詞' },
    noun('差別'),
  ]),
  expression('original-copy', '正本', [noun('正本')]),
  expression('part', '部品', [noun('部品')]),
  expression('inspection', '検査', [noun('検査')]),
  expression('canon', '正典', [
    { surface: '正', pos: '接頭詞' },
    { surface: '典', pos: '名詞' },
  ]),
  expression('wire', '配線する', [
    ni,
    noun('配線'),
    verb('する'),
  ]),
  expression('grow', '太る', [verb('太る')]),
  expression('watch', '見張る', [verb('見張る')]),
  expression('material', '原料', [{ surface: '原料', pos: '名詞' }]),
  expression('measurement', '実測', [noun('実測')]),
  expression('doubt', '疑う', [verb('疑う')]),
  expression('collation', '照合', [noun('照合')]),
  expression('overlook', '見落とす', [verb('見落とす')]),
  expression('compare', '突き合わせる', [verb('突き合わせる')]),
  expression('assert', '断定', [noun('断定')]),
  expression('entrance', '入口', [noun('入口')]),
  expression('foundation', '土台', [noun('土台')]),
  expression('tool', '道具', [noun('道具')]),
  expression('core', '核心', [noun('核心')]),
  expression('composition', '構図', [noun('構図')]),
  expression('boundary', '線引き', [noun('線引き')]),
  expression('accident', '事故', [noun('事故')]),
  expression('mix', '混ざる', [verb('混ざる')]),
  expression('pitfall', '落とし穴', [noun('落とし穴')]),
  expression('failure', '破綻', [noun('破綻')]),
  expression('pass-through', '素通り', [noun('素通り')]),
  expression('isolate', '切り分ける', [verb('切り分ける')]),
  expression('crush', '潰す', [verb('潰す')]),
  expression('step-into', '踏み込む', [verb('踏み込む')]),
  expression('melt', '溶かす', [verb('溶かす')]),
  expression('by-default', '既定では', [noun('既定'), de]),
  expression('standard', '定番', [noun('定番')]),
  expression('established', '定石', [noun('定石')]),
  expression('the-moment', '〜した瞬間', [ta, noun('瞬間')]),
  expression('quietly-intransitive', '静かに', [
    { surface: '静か', pos: '名詞' },
    niAdverbial,
    verb(['壊れる', '落ちる', '止まる', '消える', '捨てる', '失う', '漏れる']),
  ]),
  expression('quietly-passive', '静かに', [
    { surface: '静か', pos: '名詞' },
    niAdverbial,
    { pos: '名詞', posDetail: 'サ変接続' },
    verb('する'),
    { lemma: ['れる', 'られる'], pos: '動詞', posDetail: '接尾' },
  ]),
  expression('silence', '無言', [noun('無言')]),
  expression('gate-kanji', '門', [noun('門')]),
  expression('gate', 'ゲート', [noun('ゲート')]),
]

const includes = (expected: string | readonly string[], actual: string): boolean =>
  typeof expected === 'string' ? expected === actual : expected.includes(actual)

export const tokenMatches = (condition: TokenCondition, token: Morpheme): boolean =>
  (condition.surface === undefined || includes(condition.surface, token.surface)) &&
  (condition.lemma === undefined || includes(condition.lemma, token.lemma)) &&
  (condition.pos === undefined || condition.pos === token.pos) &&
  (condition.posDetail === undefined || condition.posDetail === token.posDetail)
