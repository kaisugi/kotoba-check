/// <reference lib="webworker" />

import initLindera, {
  TokenizerBuilder,
  loadDictionaryFromBytes,
  type Tokenizer,
} from 'lindera-wasm'
import { detectFindings } from '../rules/detect'
import { fetchDictionaryBytes } from './dictionaryLoader'
import { normalizeLinderaTokens, type LinderaToken } from './linderaAdapter'
import type { WorkerRequest, WorkerResponse } from './types'

const scope = self as unknown as DedicatedWorkerGlobalScope
let tokenizer: Tokenizer | undefined
let initializePromise: Promise<{ loadMs: number; initializeMs: number }> | undefined

const post = (response: WorkerResponse): void => scope.postMessage(response)

const initialize = async (dictionaryBaseUrl: string) => {
  const wasmStart = performance.now()
  await initLindera()
  const wasmMs = performance.now() - wasmStart

  const loadStart = performance.now()
  const bytes = await fetchDictionaryBytes(dictionaryBaseUrl)
  const loadMs = performance.now() - loadStart

  const dictionaryStart = performance.now()
  const dictionary = loadDictionaryFromBytes(
    bytes.metadata, bytes.dictTrie, bytes.dictValsIdx, bytes.dictVals,
    bytes.dictWordsIdx, bytes.dictWords, bytes.matrixMtx, bytes.charDef, bytes.unk,
  )
  const builder = new TokenizerBuilder()
  builder.setDictionaryInstance(dictionary)
  builder.setMode('normal')
  builder.setKeepWhitespace(false)
  tokenizer = builder.build()

  return {
    loadMs,
    initializeMs: wasmMs + performance.now() - dictionaryStart,
  }
}

scope.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const request = event.data
  if (request.type === 'initialize') {
    initializePromise ??= initialize(request.dictionaryBaseUrl)
    void initializePromise
      .then((metrics) => post({ type: 'ready', ...metrics }))
      .catch((error: unknown) => {
        post({
          type: 'error',
          message: error instanceof Error ? error.message : '辞書の初期化に失敗しました。',
        })
      })
    return
  }

  void (async () => {
    try {
      if (initializePromise === undefined) throw new Error('辞書が初期化されていません。')
      await initializePromise
      if (tokenizer === undefined) throw new Error('形態素解析器を利用できません。')

      const startedAt = performance.now()
      const tokens = normalizeLinderaTokens(
        request.text,
        tokenizer.tokenize(request.text) as LinderaToken[],
      )
      post({
        type: 'result',
        requestId: request.requestId,
        findings: detectFindings(tokens),
        metrics: {
          analyzeMs: performance.now() - startedAt,
          tokenCount: tokens.length,
        },
      })
    } catch (error: unknown) {
      post({
        type: 'error',
        requestId: request.requestId,
        message: error instanceof Error ? error.message : '解析に失敗しました。',
      })
    }
  })()
})
