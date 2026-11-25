# TLA+ / TLC

TLA+ Tools **1.7.4** の公式 `tla2tools.jar` を `scripts/setup.py` が取得する。
[公式リリース](https://github.com/tlaplus/tlaplus/releases/tag/v1.7.4)の SHA-1 と照合した配布物の
SHA-256 を `toolchains.json` に固定している。実行時にも SHA-256 を検査する。
Java は Temurin **21.0.13.1+2**。VS Code の拡張機能が独自取得した別バージョンの TLC は CI の根拠にしない。

```sh
source scripts/env.sh
node scripts/verify.mjs tla
```

固定の seed=1、workers=1、最大ヒープ512 MiB、1モデル180秒の実行制限で探索する。
タイムアウト・構文エラー・Java の起動エラーは検証失敗。
ログと TLC メタデータは `.cache/verify-*/` に毎回別名で保存する。

| 環境確認サンプル | 定数 | 状態・制約 | 期待結果 |
| --- | --- | --- | --- |
| [Counter](samples/Counter/Counter.tla) | Limit=3 | count=0..3 の4状態、追加の状態制約なし | 全探索成功、TypeOK を保持 |
| [BrokenCounter](samples/BrokenCounter/BrokenCounter.tla) | Limit=3 | count=0..4 の5状態、追加の状態制約なし | TypeOK 違反、0→1→2→3→4 |

サンプルは初期状態 count=0 からの安全性のみを検査する。公平性・活性・無限サイズのカウンタ・
TypeScript 実装との対応は検証しない。終端では0に戻るのでデッドロック無視オプションは使わない。
これらはツール動作確認用の完成サンプルで、学習課題の解答ではない。

演習は `specs/057-counter/Counter.tla`, `Counter.cfg`, `README.md` のように配置する。
README に対象範囲、定数、初期状態、探索範囲、状態・アクション制約、公平性、検査する性質、
検査しない性質を明示する。制約でバグの状態を探索対象から落とさないようレビューする。

現在の期待結果形式は `success` と `invariant-violation`（遷移後の不変条件違反）の2種類。
後者は `checks.json` に不変条件名と反例の各状態の変数代入を順序どおり指定する。
専用終了コード12、TLC メッセージ2110、反例の状態数と各値を一致させる。
活性違反など別種類の課題を導入する際は、その専用結果の検査を追加してから教材を登録する。

参考: [TLA+ 公式サイト](https://lamport.azurewebsites.net/tla/tla.html)、
[TLC の実行オプション](https://github.com/tlaplus/tlaplus/blob/v1.7.4/tlatools/org.lamport.tlatools/src/tlc2/TLC.java)。
