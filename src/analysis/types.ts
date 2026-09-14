export type Morpheme = {
  surface: string
  lemma: string
  pos: string
  posDetail: string
  start: number
  end: number
}

export type Finding = {
  id: string
  ruleId: string
  label: string
  message: string
  start: number
  end: number
}

export type AnalysisMetrics = {
  analyzeMs: number
  tokenCount: number
}

export type WorkerRequest =
  | { type: 'initialize'; dictionaryBaseUrl: string }
  | { type: 'analyze'; requestId: number; text: string }

export type WorkerResponse =
  | { type: 'ready'; loadMs: number; initializeMs: number }
  | {
      type: 'result'
      requestId: number
      findings: Finding[]
      metrics: AnalysisMetrics
    }
  | { type: 'error'; requestId?: number; message: string }

