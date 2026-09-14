export type DictionaryBytes = {
  metadata: Uint8Array
  dictTrie: Uint8Array
  dictValsIdx: Uint8Array
  dictVals: Uint8Array
  dictWordsIdx: Uint8Array
  dictWords: Uint8Array
  matrixMtx: Uint8Array
  charDef: Uint8Array
  unk: Uint8Array
}

export type Fetcher = (input: RequestInfo | URL) => Promise<Response>

const fetchBytes = async (
  baseUrl: string,
  fileName: string,
  fetcher: Fetcher,
): Promise<Uint8Array> => {
  const response = await fetcher(new URL(fileName, baseUrl))
  if (!response.ok) {
    throw new Error(`辞書ファイル ${fileName} を取得できませんでした（${response.status}）`)
  }
  return new Uint8Array(await response.arrayBuffer())
}

export const concatenateBytes = (parts: readonly Uint8Array[]): Uint8Array => {
  const joined = new Uint8Array(parts.reduce((total, part) => total + part.byteLength, 0))
  let offset = 0
  for (const part of parts) {
    joined.set(part, offset)
    offset += part.byteLength
  }
  return joined
}

export const fetchDictionaryBytes = async (
  baseUrl: string,
  fetcher: Fetcher = fetch,
): Promise<DictionaryBytes> => {
  const [
    metadata, dictTrie, dictValsIdx, dictVals, dictWordsIdx,
    wordsA, wordsB, wordsC, matrixMtx, charDef, unk,
  ] = await Promise.all([
    fetchBytes(baseUrl, 'metadata.json', fetcher),
    fetchBytes(baseUrl, 'dict.trie', fetcher),
    fetchBytes(baseUrl, 'dict.valsidx', fetcher),
    fetchBytes(baseUrl, 'dict.vals', fetcher),
    fetchBytes(baseUrl, 'dict.wordsidx', fetcher),
    fetchBytes(baseUrl, 'dict.words.part-aa', fetcher),
    fetchBytes(baseUrl, 'dict.words.part-ab', fetcher),
    fetchBytes(baseUrl, 'dict.words.part-ac', fetcher),
    fetchBytes(baseUrl, 'matrix.mtx', fetcher),
    fetchBytes(baseUrl, 'char_def.bin', fetcher),
    fetchBytes(baseUrl, 'unk.bin', fetcher),
  ])

  return {
    metadata, dictTrie, dictValsIdx, dictVals, dictWordsIdx,
    dictWords: concatenateBytes([wordsA, wordsB, wordsC]),
    matrixMtx, charDef, unk,
  }
}

