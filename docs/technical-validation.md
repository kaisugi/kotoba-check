# Lindera技術検証

検証日: 2026-09-14

## 採用構成

- `lindera-wasm@6.0.0`（npm配布版、MIT）
- `lindera-ipadic-6.0.0`（Lindera公式Release配布版）
- Vite 8.3.0 / TypeScript 6.0.2

現行Lindera WASMは辞書を内包せず、`loadDictionaryFromBytes` へ9種の辞書バイト列を渡すAPIです。型定義と公式サンプルを確認し、このAPIをWorker内で利用しています。OPFSは本文を保存しませんが、初期版は実装を単純に保つため辞書もHTTPキャッシュに任せ、サイト内アセットから直接読みます。

## 位置情報

Lindera 6.0.0のTokenは `byteStart` / `byteEnd` をUTF-8バイト位置で返します。アプリは原文をコードポイントごとに走査してUTF-8境界からJavaScriptのUTF-16コード単位位置への表を作り、`surface` と `text.slice(start, end)` が一致することも検査します。

日本語、改行、4バイトUTF-8かつ2コード単位UTF-16の絵文字、動詞の活用形で自動テスト済みです。正規化した本文は作らず、ハイライト位置は常に原文を基準にします。

## 配布サイズ

本番ビルド `dist` の主な未圧縮ファイルです。

| ファイル | サイズ |
| --- | ---: |
| `dict.words.part-aa` | 16,000,000 B |
| `dict.words.part-ab` | 16,000,000 B |
| `dict.trie` | 4,587,532 B |
| `dict.vals` | 3,921,250 B |
| `matrix.mtx` | 3,463,718 B |
| Lindera WASM | 1,736,542 B |
| `dict.words.part-ac` | 674,733 B |
| `dist` 全体 | 約52 MiB |

元の `dict.words` は32,674,733 Bで、[Cloudflare Pagesの1ファイル25 MiB制限](https://developers.cloudflare.com/pages/platform/limits/#files)を超えます。16,000,000 B単位の3ファイルへ分割し、Worker内で順番どおり結合することで、最大ファイルを16,000,000 Bに抑えています。辞書の内容は変更していません。

## ブラウザ実測

Chromium、localhost、ヘッドレス実行での単回測定です。ネットワーク越しの利用時間を保証する値ではありません。

| 項目 | Vite開発サーバー | 本番ビルドのpreview |
| --- | ---: | ---: |
| ナビゲーション開始から利用可能 | 381.2 ms | 939.9 ms |
| 辞書ファイル取得 | 145.0 ms | 393.4 ms |
| WASM初期化＋辞書構築 | 45.1 ms | 42.2 ms |
| 1,000文字（667形態素） | 11.7 ms | 11.7 ms |
| 10,000文字（6,667形態素） | 74.6 ms | 69.5 ms |

Workerを作り直さない限りWASM、辞書、Tokenizerは使い回されます。UIは300 msのデバウンスを含むため、体感上の完了は表の解析時間より約300 ms長くなります。

## 判定

Lindera 6.0.0は位置精度、活用形、開発・本番ビルド、ブラウザWorker動作の要件を満たします。現時点で形態素解析器を変更する根拠はありません。

課題は初回に約47.5 MBのIPADIC本体を転送する点です。今回の構成は自己配信とPages制限を満たしますが、モバイル回線向けには軽量辞書との比較が次の性能改善候補です。
