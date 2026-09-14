import type { Finding, Morpheme } from '../analysis/types'
import { aiExpressionRules, tokenMatches } from './aiExpressions'

const findingId = (ruleId: string, start: number, end: number): string =>
  `${ruleId}:${start}:${end}`

export const detectAiExpressions = (tokens: readonly Morpheme[]): Finding[] => {
  const findings: Finding[] = []

  for (const rule of aiExpressionRules) {
    for (let index = 0; index <= tokens.length - rule.tokens.length; index += 1) {
      const matches = rule.tokens.every((condition, conditionIndex) =>
        tokenMatches(condition, tokens[index + conditionIndex]),
      )
      if (!matches) continue

      const first = tokens[index]
      const last = tokens[index + rule.tokens.length - 1]
      findings.push({
        id: findingId(rule.id, first.start, last.end),
        ruleId: 'no-ai-words',
        label: rule.label,
        message: rule.message,
        start: first.start,
        end: last.end,
      })
    }
  }

  return findings.sort((left, right) => left.start - right.start || left.end - right.end)
}

/** Port of the upstream opt-in `no-short-topic-comma` rule. */
export const detectShortTopicComma = (
  text: string,
  tokens: readonly Morpheme[],
  maxLength = 5,
): Finding[] => {
  const findings: Finding[] = []

  for (let index = 1; index < tokens.length; index += 1) {
    const comma = tokens[index]
    const topic = tokens[index - 1]
    if (
      comma.surface !== '、' ||
      comma.pos !== '記号' ||
      topic.surface !== 'は' ||
      topic.pos !== '助詞' ||
      topic.posDetail !== '係助詞'
    ) {
      continue
    }

    const prefix = text.slice(0, comma.start)
    const lastBoundary = Math.max(
      prefix.lastIndexOf('。'),
      prefix.lastIndexOf('！'),
      prefix.lastIndexOf('？'),
      prefix.lastIndexOf('!'),
      prefix.lastIndexOf('?'),
      prefix.lastIndexOf('\n'),
    )
    const sentenceStart = lastBoundary + 1
    const length = Array.from(text.slice(sentenceStart, comma.start)).length
    if (length <= maxLength) {
      findings.push({
        id: findingId('short-topic-comma', comma.start, comma.end),
        ruleId: 'no-short-topic-comma',
        label: '短い主題のあとの読点',
        message: `主題を${length}文字示しただけで読点を打っています。読点を外すか、文を組み替えられないか検討してください。`,
        start: comma.start,
        end: comma.end,
      })
    }
  }

  return findings
}

export const detectFindings = (tokens: readonly Morpheme[]): Finding[] =>
  detectAiExpressions(tokens)

