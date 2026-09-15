# Third-party notices

The root `LICENSE` applies to the original code and documentation of Kotoba Check. The following components remain under their respective licenses and are not relicensed by the project license.

## Lindera 6.0.0 and Lindera WASM 6.0.0

- Source: https://github.com/lindera/lindera/tree/v6.0.0
- npm package: https://www.npmjs.com/package/lindera-wasm/v/6.0.0
- License: MIT
- Lindera license: `public/lindera-LICENSE.txt`
- Lindera WASM license: `public/lindera-wasm-LICENSE.txt`
- Licenses of crates linked into the WASM binary: `public/lindera-wasm-THIRD-PARTY-LICENSES.html`

The Rust dependency report was generated with cargo-about 0.9.2 from the locked Lindera 6.0.0 dependency graph for `wasm32-unknown-unknown`, with default features disabled. It includes normal, build, and transitive dependencies and omits development-only dependencies. All resolved terms are permissive: MIT, Apache-2.0, BSD-3-Clause, or Unicode-3.0.

## Lindera IPADIC 6.0.0 / mecab-ipadic-2.7.0-20070801

- Binary distribution: `lindera-ipadic-6.0.0.zip` from the Lindera v6.0.0 GitHub Release
- Dictionary source: https://github.com/lindera/mecab-ipadic
- Original distribution: `mecab-ipadic-2.7.0-20070801.tar.gz`
- Complete original terms: `public/lindera-ipadic/COPYING`
- Notice shipped in the Lindera archive: `public/lindera-ipadic/NOTICE.txt`

The original IPADIC terms expressly permit use, reproduction, modification, and distribution, provided every original or modified copy includes the NAIST copyright notice and the following paragraphs, including the ICOT `NO WARRANTY` provisions. The `NOTICE.txt` in Lindera's v6.0.0 dictionary archive omits the opening copyright and permission paragraphs, so this project additionally ships the complete `COPYING` file from the original IPADIC distribution. Both files are kept next to the dictionary assets and are linked from the site.

The original `dict.words` is byte-for-byte reconstructable by concatenating `dict.words.part-aa`, `dict.words.part-ab`, and `dict.words.part-ac` in that order. It is split only to comply with the hosting file-size limit; no dictionary records are changed.

## textlint-rule-preset-ai-words-ja 1.2.1

- Source: https://github.com/p1ass/textlint-rule-preset-ai-words-ja
- Version: 1.2.1
- Reviewed revision: `2f47c2a08eb8268271aca8ba94e444a471deb7b8`
- License: MIT
- Bundled license: `public/textlint-rule-preset-ai-words-ja-LICENSE.txt`

The expression data and matching behavior in `src/rules/` are adapted from the upstream dictionary and rules. The app does not depend on textlint, kuromojin, or morpheme-match-textlint at runtime.

Kotoba Check gratefully acknowledges p1ass for creating and publishing `textlint-rule-preset-ai-words-ja`, which made this expression dictionary and its matching behavior available for adaptation.

## Vite 8.3.0

- Source: https://github.com/vitejs/vite
- License and bundled dependency notices: `public/vite-LICENSE.md`

Vite is a development dependency, but its module-preload polyfill is present in the generated browser bundle. Its distributed license and bundled-dependency notices are therefore included in the deployed assets.
