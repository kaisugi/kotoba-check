# ライセンス監査

監査日: 2026-09-14

> この文書は一次資料と配布物に基づく技術的なライセンス監査であり、弁護士による法的助言ではありません。

## 結論

IPADICのバイナリ辞書を静的サイトから直接配信することは、原ライセンスが明示的に認める「use, reproduction, and distribution」に含まれると判断できます。改変版の配布も認められています。ソース公開義務、同一ライセンスでの派生物公開義務、非商用限定はありません。

ただし、すべての原版・改変版の複製物へ、NAISTの著作権表示と後続の免責条項を含めることが条件です。Lindera 6.0.0の辞書zipに同梱された`NOTICE.txt`は原版`COPYING`の冒頭7行を欠いているため、それだけでは条件を満たすと断言できません。本リポジトリでは原版の完全な`COPYING`を辞書と同じ公開ディレクトリへ追加して補完しました。

この条件を守る限り、アプリ独自部分をMIT Licenseにすることと矛盾しません。IPADIC自体はMITへ再許諾せず、独立した第三者データとして原条件を維持します。

## 確認した一次資料

- MeCab公式サイト: https://taku910.github.io/mecab/
- MeCab公式SourceForge配布: `mecab-ipadic-2.7.0-20070801.tar.gz`
- Lindera公式IPADICソース: https://github.com/lindera/mecab-ipadic
- Lindera v6.0.0 Release: https://github.com/lindera/lindera/releases/tag/v6.0.0
- Lindera v6.0.0ソースとライセンス: https://github.com/lindera/lindera/tree/v6.0.0
- `lindera-wasm@6.0.0` npm配布物
- 移植元 `textlint-rule-preset-ai-words-ja@1.2.0`

MeCab本体のGPL/LGPL/BSDという選択肢と、IPADIC辞書の条件は別物です。公式の開発資料も辞書のライセンスは個々の辞書に従うと説明しています。このアプリはMeCab本体を配布していません。

## IPADIC配布条件への対応

| 条件・確認事項 | 対応 |
| --- | --- |
| 使用・複製・配布の許可 | 原版`COPYING`で明示的に許可 |
| 改変版の配布 | 明示的に許可 |
| NAIST著作権表示 | `public/lindera-ipadic/COPYING`に収録 |
| NAIST免責条項 | 同ファイルに収録 |
| ICOT `NO WARRANTY` | `COPYING`とLinderaの`NOTICE.txt`に収録 |
| 配布物への添付 | 辞書と同じ`/lindera-ipadic/`で配信し、サイトのライセンスリンクから案内 |
| 辞書の変更 | レコードは無変更。ホスティング制限のため`dict.words`をバイト列のまま3分割 |
| 分割の同一性 | 連結後SHA-256が元ファイルと一致 |

原版`COPYING`のSHA-256は`fca02d9adb601d101eccdf3131119abfff2d9c825ef5c759d7a89ebbaa972099`です。末尾の原ファイル固有バイトも含め、Lindera公式IPADICソースとSourceForge原配布物のファイルが一致することを確認しました。

監査に使用したLindera公式Release zipのSHA-256は`8433dbbb80d7588a565fb9247c1ac7aed3ca50c7463329e495f8bd905aece356`、zip内の`dict.words`は`fc1d924e12af84a352feccce35b772383322760ee2b3da4be0e173ad82953938`です。公開する3ファイルを順番に連結した値が後者と一致することを確認しました。

## WASM依存関係

公式npmパッケージはLindera WASMのMITライセンスを含みます。一方、WASMにはRustクレートが静的リンクされるため、Lindera v6.0.0の`Cargo.lock`と`lindera-wasm/Cargo.toml`を`cargo-about 0.9.2`で追加監査しました。

監査条件は`wasm32-unknown-unknown`、default features無効、development dependencies除外、normal/build/transitive dependencies対象です。103クレートについて選択されたライセンスはMIT、Apache-2.0、BSD-3-Clause、Unicode-3.0で、コピーレフトライセンスは検出されませんでした。著作権表示を含む全文は`public/lindera-wasm-THIRD-PARTY-LICENSES.html`として配信します。

## プロジェクトライセンス

アプリ独自コードと文書にはMIT Licenseを採用しました。理由は次のとおりです。

- 移植元ルールとLinderaのMITと互換性がある。
- 静的サイトとして利用・改変・再配布しやすい。
- IPADICは別条件の集成物として明確に切り分けられる。

ルート`LICENSE`と配信用`public/LICENSE.txt`を配置し、`package.json`にも`"license": "MIT"`を設定しています。MITは第三者素材を再許諾しないため、`THIRD_PARTY_NOTICES.md`と配信用ライセンスファイルを併存させます。

## 公開前チェック

1. `dist/lindera-ipadic/COPYING`と`NOTICE.txt`の両方が存在すること。
2. `/THIRD_PARTY_NOTICES.txt`から全ライセンスファイルへアクセスできること。
3. IPADIC更新時は新しい配布物のCOPYINGを再確認し、既存文面を流用しないこと。
4. Lindera更新時はCargo依存グラフとWASM第三者ライセンス一覧を再生成すること。
5. 表現辞書更新時は移植元のバージョン、commit、ライセンス変更を確認すること。
