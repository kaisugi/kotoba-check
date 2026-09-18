# ことば点検

AIが書いた日本語に出やすい単語や言い回しを見つけ、利用者自身の推敲を助ける静的Webアプリです。AIが書いた確率や根拠のない総合スコアは表示しません。

本文と形態素解析はブラウザ内で完結します。外部API、ログ、アクセス解析、URL、永続ストレージには本文を送りません。

「点検する表現を選ぶ」から、文脈に合う表現の指摘を個別にオン・オフできます。表現名で検索でき、一括切り替えも可能です。オン・オフ設定だけをブラウザに保存します。

## 開発

```sh
npm install
npm run dev
```

## 検証

```sh
npm test
npm run build
npm run test:e2e
```

- `npm test`: 実IPADICを使う検出・位置情報・失敗系テスト
- `npm run build`: TypeScript型検査と本番ビルド
- `npm run test:e2e`: ChromiumでWorker、UI連携、原文のHTML非解釈、モバイル横幅を検証

## 構成

- Vite + TypeScript + HTML/CSS
- `lindera-wasm@6.0.0` + IPADIC 6.0.0
- WASM初期化と解析をWeb Worker内で実行し、初期化済みTokenizerを再利用
- LinderaのUTF-8バイト位置をDOM用のUTF-16位置へ変換
- 表現辞書と検出器を形態素解析から分離

IPADICの `dict.words` はCloudflare Pagesの1ファイル25 MiB制限を超えるため、内容を変えず3ファイルへ分割しています。Workerで取得後に結合します。

設計と検証の詳細は[実装計画](docs/implementation-plan.md)と[技術検証](docs/technical-validation.md)を参照してください。

## デプロイ

Cloudflare Pagesの設定は次のとおりです。

- Build command: `npm run build`
- Build output directory: `dist`
- 公開前にプレビューデプロイでWorkerと全辞書ファイルの取得を確認

## 出典とライセンス

このプロジェクト独自のコードと文書は[MIT License](LICENSE)です。第三者コンポーネントはMITへ再許諾せず、それぞれの条件を維持します。

表現ルールは `textlint-rule-preset-ai-words-ja@1.2.1` を移植しています。Lindera、WASM内部のRust依存、表現ルール、IPADIC、Viteのライセンスと告知は[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)および `public/` 配下に同梱しています。特にIPADICは、Lindera配布版の不完全な告知を原版の完全な`COPYING`で補っています。調査結果と更新時の注意事項は[ライセンス監査](docs/license-audit.md)を参照してください。

表現辞書と検出方法を公開されたp1ass氏に感謝します。
