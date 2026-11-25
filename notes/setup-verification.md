# 初期構築の検証記録

確認日: 2026-11-25。これらは環境の確認であり、授業の完了評価ではない。

## ローカル（macOS arm64）

作成先: `/Users/akyrhysd/work/formal-methods-lab`。
`toolchains.json` に固定した Node 26.13.1 / pnpm 12.23.0 / Lean 4.36.0 /
Java 21.0.13.1+2 / TLA+ Tools 1.7.4 を使用。

実行コマンド:

```sh
python3 scripts/setup.py
source scripts/env.sh
node --test scripts/checks.test.mjs
node scripts/verify.mjs
node scripts/selftest.mjs
```

- TypeScript strict 型検査: 成功。
- Vitest 環境確認サンプル: 1件成功。
- Lean サンプル定理: Lake ビルド・警告検査・公理依存の監査に成功。
- TLC 正常系: Limit=3、4個の異なる状態を探索し TypeOK 違反なし。
- TLC 意図的違反: 終了コード12、TypeOK 違反、count=0→1→2→3→4 を照合。
- 検証基盤の実ツール回帰: 10ケース成功。未完成演習の混在、型エラー、失敗テスト、
  skip、sorry、直接 sorryAx、推移的 sorry、独自公理、定理欠落、TLC 構文エラーを確認。
- テスト用の不正な証明・仕様は `.cache/selftest-*/` の隔離コースに生成する。
  学習用ディレクトリには配置せず、進捗表も変更しない。

証跡: `.cache/selftest-ItKUAl/`。TLC はローカルポートを使うため、
この作業環境のサンドボックス外で実行した。通常のローカル端末・コンテナでは同じコマンドを使う。

## クリーンな Linux / Dev Container / GitHub Actions

GitHub Actions で実際の Dockerfile のビルドと全検証を実行し、結果を追記する。
ローカルの Docker デーモンは停止していたため、ローカル Docker での実ビルドは未確認。
VS Code の拡張画面・Infoview の手動操作は未確認。

## 検証の限界

- 環境確認用サンプルだけを登録。授業・実際の学習演習は未作成。
- CI は理解度を判定しない。カリキュラムの具体化と理解度評価は講師が行う。
- 初期 TLC 判定形式は成功と遷移後の不変条件違反。活性違反用の判定は教材導入時に追加する。
- OS 補助パッケージとエディタ拡張を含むビット単位の再現性は対象外。
- macOS x64 / Linux arm64 は配布物を固定しているが、実行環境別の実測は未実施。
