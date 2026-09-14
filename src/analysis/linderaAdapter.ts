import type { Morpheme } from './types'
import { byteRangeToUtf16, createByteToUtf16Map } from './offsets'

export type LinderaToken = {
  surface: string
  byteStart: number
  byteEnd: number
  details: string[]
}

export const normalizeLinderaTokens = (
  text: string,
  rawTokens: readonly LinderaToken[],
): Morpheme[] => {
  const offsetMap = createByteToUtf16Map(text)
  return rawTokens.map((token) => {
    const [start, end] = byteRangeToUtf16(offsetMap, token.byteStart, token.byteEnd)
    if (text.slice(start, end) !== token.surface) {
      throw new Error('形態素の位置情報と原文が一致しませんでした。')
    }
    return {
      surface: token.surface,
      pos: token.details[0] ?? '*',
      posDetail: token.details[1] ?? '*',
      lemma: token.details[6] === undefined || token.details[6] === '*'
        ? token.surface
        : token.details[6],
      start,
      end,
    }
  })
}

