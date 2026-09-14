/**
 * Lindera reports UTF-8 byte offsets. DOM selection APIs and String#slice use
 * UTF-16 code-unit offsets, so every token boundary is converted here.
 */
export const createByteToUtf16Map = (text: string): Map<number, number> => {
  const map = new Map<number, number>([[0, 0]])
  const encoder = new TextEncoder()
  let byteOffset = 0
  let utf16Offset = 0

  for (const character of text) {
    byteOffset += encoder.encode(character).byteLength
    utf16Offset += character.length
    map.set(byteOffset, utf16Offset)
  }

  return map
}

export const byteRangeToUtf16 = (
  map: ReadonlyMap<number, number>,
  byteStart: number,
  byteEnd: number,
): [number, number] => {
  const start = map.get(byteStart)
  const end = map.get(byteEnd)
  if (start === undefined || end === undefined) {
    throw new Error(`Linderaから文字境界ではない位置が返されました: ${byteStart}-${byteEnd}`)
  }
  return [start, end]
}

