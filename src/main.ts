import './style.css'
import type { Finding, WorkerResponse } from './analysis/types'

type UiState = 'loading' | 'idle' | 'analyzing' | 'ready' | 'error'

const app = document.querySelector<HTMLDivElement>('#app')
if (app === null) throw new Error('#app が見つかりません。')

app.innerHTML = `
  <main>
    <section class="intro" aria-labelledby="page-title">
      <div class="title-row">
        <h1 id="page-title">ことば点検</h1>
        <a class="github-link" href="https://github.com/kaisugi/kotoba-check" target="_blank" rel="noreferrer" aria-label="GitHubでソースコードを見る" title="GitHubでソースコードを見る">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.57 9.57 0 0 1 12 7.38c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.21c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>
        </a>
      </div>
      <p>登録した表現辞書と形態素解析で、AIが書いた日本語に出やすい単語や言い回しを探し、該当箇所と理由を表示します。AI判定、採点、自動修正は行いません。</p>
      <p class="privacy-note"><strong>入力した文章はブラウザ内だけで処理され、外部へ送信・保存されません。</strong></p>
    </section>

    <section class="editor-card" aria-labelledby="editor-title">
      <div class="section-heading">
        <h2 id="editor-title">文章を入力</h2>
      </div>
      <label class="sr-only" for="source-text">点検する文章</label>
      <textarea id="source-text" rows="12" spellcheck="true" placeholder="ここに点検したい文章を入力してください。&#10;&#10;例：この機能は既定では静かに無視されます。"></textarea>
      <div class="editor-toolbar">
        <div class="counts" aria-live="polite">
          <span><strong id="character-count">0</strong> 文字</span>
          <span class="count-divider" aria-hidden="true"></span>
          <span><strong id="finding-count">0</strong> 件の指摘</span>
        </div>
        <div class="actions">
          <button id="clear-button" class="button button-quiet" type="button" disabled>クリア</button>
          <button id="copy-button" class="button button-quiet" type="button" disabled><span>コピー</span></button>
          <button id="check-button" class="button button-primary" type="button" disabled><span>文章を点検</span></button>
        </div>
      </div>
    </section>

    <section class="results" aria-labelledby="results-title">
      <div class="section-heading result-heading">
        <h2 id="results-title">点検結果</h2>
        <p id="status" class="status status-loading" role="status" aria-live="polite">
          <span class="status-icon spinner" aria-hidden="true"></span>
          <span class="status-copy"><strong>辞書を読み込んでいます</strong><small>初回のみ少し時間がかかります</small></span>
        </p>
      </div>

      <div class="result-grid">
        <article class="result-panel" aria-labelledby="preview-title">
          <div class="panel-title-row">
            <h3 id="preview-title">文章プレビュー</h3>
            <span class="legend"><i aria-hidden="true"></i> 見直したい表現</span>
          </div>
          <div id="preview" class="preview empty-preview">文章を入力すると、ここに結果が表示されます。</div>
        </article>

        <aside class="issues-panel" aria-labelledby="issues-title">
          <div class="panel-title-row">
            <h3 id="issues-title">指摘と理由</h3>
            <span id="issue-total" class="issue-total">0</span>
          </div>
          <div id="issues" class="issues-list">
            <div class="empty-issues"><p>点検すると、見直したい表現とその理由がここに並びます。</p></div>
          </div>
        </aside>
      </div>
    </section>
  </main>

  <footer>
    <div class="footer-meta">
      <p>© 2026 ことば点検</p>
      <p class="acknowledgement">表現辞書は、<a href="https://github.com/p1ass/textlint-rule-preset-ai-words-ja" target="_blank" rel="noreferrer">p1ass氏の公開プロジェクト</a>をもとにしています。ありがとうございます。</p>
    </div>
    <p class="footer-links">
      <a href="/licenses.html">ライセンス・謝辞</a>
      <a href="https://github.com/p1ass/textlint-rule-preset-ai-words-ja" target="_blank" rel="noreferrer">表現辞書について</a>
    </p>
  </footer>
`

const textarea = document.querySelector<HTMLTextAreaElement>('#source-text')!
const characterCount = document.querySelector<HTMLElement>('#character-count')!
const findingCount = document.querySelector<HTMLElement>('#finding-count')!
const issueTotal = document.querySelector<HTMLElement>('#issue-total')!
const preview = document.querySelector<HTMLElement>('#preview')!
const issues = document.querySelector<HTMLElement>('#issues')!
const status = document.querySelector<HTMLElement>('#status')!
const checkButton = document.querySelector<HTMLButtonElement>('#check-button')!
const clearButton = document.querySelector<HTMLButtonElement>('#clear-button')!
const copyButton = document.querySelector<HTMLButtonElement>('#copy-button')!

let worker: Worker | undefined
let workerReady = false
let requestId = 0
let debounceTimer: number | undefined
let isComposing = false
let lastFindings: Finding[] = []
let uiState: UiState = 'loading'

const setStatus = (state: UiState, title: string, detail: string): void => {
  uiState = state
  status.className = `status status-${state}`
  status.replaceChildren()

  const icon = document.createElement('span')
  icon.className = `status-icon ${state === 'loading' || state === 'analyzing' ? 'spinner' : `${state}-icon`}`
  icon.setAttribute('aria-hidden', 'true')
  if (state === 'error') icon.textContent = '!'
  if (state === 'ready') icon.textContent = '✓'
  if (state === 'idle') icon.textContent = '文'

  const copy = document.createElement('span')
  copy.className = 'status-copy'
  const strong = document.createElement('strong')
  strong.textContent = title
  const small = document.createElement('small')
  small.textContent = detail
  copy.append(strong, small)
  status.append(icon, copy)

  if (state === 'error') {
    const retry = document.createElement('button')
    retry.type = 'button'
    retry.className = 'retry-button'
    retry.textContent = '再読み込み'
    retry.addEventListener('click', startWorker)
    status.append(retry)
  }
}

const selectRange = (start: number, end: number): void => {
  textarea.focus()
  textarea.setSelectionRange(start, end)
  const lineHeight = Number.parseFloat(getComputedStyle(textarea).lineHeight) || 28
  const linesBefore = textarea.value.slice(0, start).split('\n').length - 1
  textarea.scrollTop = Math.max(0, linesBefore * lineHeight - textarea.clientHeight / 3)
}

type DisplayRange = { start: number; end: number; findings: Finding[] }

const displayRanges = (findings: readonly Finding[]): DisplayRange[] => {
  const ranges: DisplayRange[] = []
  for (const finding of findings) {
    const previous = ranges.at(-1)
    if (previous !== undefined && finding.start < previous.end) {
      previous.end = Math.max(previous.end, finding.end)
      previous.findings.push(finding)
    } else {
      ranges.push({ start: finding.start, end: finding.end, findings: [finding] })
    }
  }
  return ranges
}

const renderPreview = (text: string, findings: readonly Finding[]): void => {
  preview.replaceChildren()
  preview.classList.toggle('empty-preview', text.length === 0)
  if (text.length === 0) {
    preview.textContent = '文章を入力すると、ここに結果が表示されます。'
    return
  }

  let offset = 0
  for (const range of displayRanges(findings)) {
    preview.append(document.createTextNode(text.slice(offset, range.start)))
    const highlight = document.createElement('button')
    highlight.type = 'button'
    highlight.className = 'highlight'
    highlight.textContent = text.slice(range.start, range.end)
    highlight.title = range.findings.map((finding) => finding.label).join('／')
    highlight.setAttribute('aria-label', `${highlight.textContent}：${highlight.title}`)
    highlight.addEventListener('click', () => selectRange(range.start, range.end))
    preview.append(highlight)
    offset = range.end
  }
  preview.append(document.createTextNode(text.slice(offset)))
}

const renderIssues = (findings: readonly Finding[]): void => {
  issues.replaceChildren()
  issueTotal.textContent = String(findings.length)
  if (findings.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'empty-issues clear-result'
    const message = document.createElement('p')
    message.textContent = uiState === 'ready'
      ? '見直したい表現は見つかりませんでした。'
      : '点検すると、見直したい表現とその理由がここに並びます。'
    empty.append(message)
    issues.append(empty)
    return
  }

  findings.forEach((finding, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'issue-card'
    const number = document.createElement('span')
    number.className = 'issue-number'
    number.textContent = String(index + 1).padStart(2, '0')
    const content = document.createElement('span')
    content.className = 'issue-content'
    const label = document.createElement('strong')
    label.textContent = `「${finding.label}」`
    const reason = document.createElement('span')
    reason.textContent = finding.message
    const action = document.createElement('small')
    action.textContent = '入力欄で確認 →'
    content.append(label, reason, action)
    button.append(number, content)
    button.addEventListener('click', () => selectRange(finding.start, finding.end))
    issues.append(button)
  })
}

const updateCountsAndActions = (): void => {
  const hasText = textarea.value.length > 0
  characterCount.textContent = String(Array.from(textarea.value).length)
  findingCount.textContent = String(lastFindings.length)
  clearButton.disabled = !hasText
  copyButton.disabled = !hasText
  checkButton.disabled = !hasText || !workerReady || uiState === 'analyzing'
}

const showIdle = (): void => {
  lastFindings = []
  setStatus('idle', '文章を入力してください', '入力後、自動で点検します')
  renderPreview('', [])
  renderIssues([])
  updateCountsAndActions()
}

const analyze = (): void => {
  window.clearTimeout(debounceTimer)
  const text = textarea.value
  requestId += 1
  const currentRequest = requestId
  if (text.length === 0) {
    if (workerReady) showIdle()
    return
  }
  if (!workerReady) {
    setStatus('loading', '辞書を読み込んでいます', '読み込み後に自動で点検します')
    updateCountsAndActions()
    return
  }

  setStatus('analyzing', '文章を点検しています', '古い解析結果は自動で破棄されます')
  updateCountsAndActions()
  worker?.postMessage({ type: 'analyze', requestId: currentRequest, text })
}

const scheduleAnalysis = (): void => {
  window.clearTimeout(debounceTimer)
  if (isComposing) return
  debounceTimer = window.setTimeout(analyze, 300)
}

function startWorker(): void {
  if (worker !== undefined) worker.terminate()
  workerReady = false
  requestId += 1
  setStatus('loading', '辞書を読み込んでいます', '初回のみ少し時間がかかります')
  updateCountsAndActions()
  worker = new Worker(new URL('./analysis/lindera.worker.ts', import.meta.url), { type: 'module' })
  worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
    const response = event.data
    if (response.type === 'ready') {
      workerReady = true
      document.documentElement.dataset.dictionaryLoadMs = response.loadMs.toFixed(1)
      document.documentElement.dataset.initializeMs = response.initializeMs.toFixed(1)
      if (textarea.value.length === 0) showIdle()
      else analyze()
      return
    }
    if (response.type === 'error') {
      if (response.requestId !== undefined && response.requestId !== requestId) return
      workerReady = response.requestId !== undefined
      setStatus(
        'error',
        response.requestId === undefined ? '辞書を読み込めませんでした' : '文章を解析できませんでした',
        response.message,
      )
      updateCountsAndActions()
      return
    }
    if (response.requestId !== requestId) return

    lastFindings = response.findings
    document.documentElement.dataset.analyzeMs = response.metrics.analyzeMs.toFixed(1)
    document.documentElement.dataset.tokenCount = String(response.metrics.tokenCount)
    document.documentElement.dataset.resultId = String(response.requestId)
    setStatus(
      'ready',
      response.findings.length === 0 ? '指摘はありません' : `${response.findings.length}件の表現を見つけました`,
      response.findings.length === 0
        ? 'この辞書に該当する表現はありませんでした'
        : '選ぶと入力欄の該当箇所を確認できます',
    )
    renderPreview(textarea.value, lastFindings)
    renderIssues(lastFindings)
    updateCountsAndActions()
  })
  worker.addEventListener('error', () => {
    workerReady = false
    setStatus('error', '辞書を読み込めませんでした', 'ネットワーク接続を確認して、もう一度お試しください')
    updateCountsAndActions()
  })
  worker.postMessage({
    type: 'initialize',
    dictionaryBaseUrl: new URL('lindera-ipadic/', document.baseURI).href,
  })
}

textarea.addEventListener('input', () => {
  requestId += 1
  lastFindings = []
  if (textarea.value.length === 0 && workerReady) {
    showIdle()
    return
  }
  if (workerReady) {
    setStatus('idle', '入力が変更されました', 'まもなく自動で点検します')
  }
  renderPreview(textarea.value, [])
  renderIssues([])
  updateCountsAndActions()
  scheduleAnalysis()
})
textarea.addEventListener('compositionstart', () => {
  isComposing = true
  window.clearTimeout(debounceTimer)
})
textarea.addEventListener('compositionend', () => {
  isComposing = false
  scheduleAnalysis()
})
checkButton.addEventListener('click', analyze)
clearButton.addEventListener('click', () => {
  textarea.value = ''
  requestId += 1
  if (workerReady) showIdle()
  else {
    setStatus('loading', '辞書を読み込んでいます', '初回のみ少し時間がかかります')
    renderPreview('', [])
    renderIssues([])
    updateCountsAndActions()
  }
  textarea.focus()
})
copyButton.addEventListener('click', () => {
  void navigator.clipboard.writeText(textarea.value).then(() => {
    const label = copyButton.querySelector('span')!
    label.textContent = 'コピーしました'
    window.setTimeout(() => { label.textContent = 'コピー' }, 1600)
  })
})

startWorker()
