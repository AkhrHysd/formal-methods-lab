# Formal Methods Lab

TypeScript の実務経験があるエンジニアのための、Lean 4 / TLA+ を中心とした形式手法の学習環境。
約90回、1回20〜30分、半分以上を実践演習に充てる。
学習者自身がコード・証明・仕様を書き、講師が理解度テストとレビューで評価する。

初期構築には環境、カリキュラム概要、検証用サンプルだけを含む。
実際の授業教材は講師の指示に基づいて順次追加する。完成解答集は置かない。
GitHub リポジトリは初期状態で **Private** とする。

## 固定したツール

2026-11-25 に公式配布情報を確認。夜間ビルドやリリース候補は使用しない。

| ツール | バージョン | 公式情報 |
| --- | --- | --- |
| Node.js | 26.13.1 LTS | [公式配布](https://nodejs.org/dist/v26.13.1/) |
| pnpm | 12.23.0 | [リリース](https://github.com/pnpm/pnpm/releases/tag/v12.23.0) |
| TypeScript | 7.0.2 | [リリース](https://github.com/microsoft/TypeScript/releases/tag/v7.0.2) |
| Vitest | 5.1.1 | [リリース](https://github.com/vitest-dev/vitest/releases/tag/v5.1.1) |
| Node 型定義 | 26.6.10 | [配布メタデータ](https://registry.npmjs.org/@types/node/26.6.10) |
| Elan | 4.4.0 | [リリース](https://github.com/leanprover/elan/releases/tag/v4.4.0) |
| Lean / Lake | 4.36.0 | [リリース](https://github.com/leanprover/lean4/releases/tag/v4.36.0) |
| Java | Temurin 21.0.13.1+2 | [リリース](https://github.com/adoptium/temurin21-binaries/releases/tag/jdk-21.0.13.1%2B2) |
| TLA+ Tools | 1.7.4 | [リリース](https://github.com/tlaplus/tlaplus/releases/tag/v1.7.4) |

`toolchains.json` はプラットフォーム別の配布 URL と SHA-256 を固定する。
Node / Java / Elan / pnpm / TLA+ の取得時に照合する。Lean は Elan が
`lean/lean-toolchain` の完全指定バージョンを取得する。Lake は Lean に同梱。
TypeScript と Vitest は `typescript/package.json` と `pnpm-lock.yaml` で固定する。
Mathlib と fast-check は必要になった時点で導入する。

## セットアップ：Dev Container（推奨）

前提は Git、Docker Desktop または Docker Engine、VS Code と Dev Containers 拡張。
Windows は WSL2 + Docker Desktop を使用する。初回は公式配布サイトへのネットワーク接続と数GBの空き領域が必要。

1. このリポジトリを clone し、VS Code でルートディレクトリを開く。
2. **Dev Containers: Reopen in Container** を実行する。
3. イメージ構築時に固定ツールを `/opt/formal-tools` に導入する。
4. `postCreateCommand` が依存関係を frozen lockfile で導入し、全サンプルを検証する。
5. 統合ターミナルで `node scripts/verify.mjs` を実行できれば準備完了。

Lean 4、TLA+、Vitest の VS Code 拡張を推奨・自動導入する。拡張の更新はエディタ管理であり、
機械検証の根拠は固定されたコマンドラインツールとする。Lean のファイルは `lean/` の下で編集する。
Lean の Infoview でゴールを確認し、CI と同じコマンドで最終検証する。

ベースイメージは Debian bookworm-slim の manifest digest を固定。
OS の補助パッケージは apt で取得するので、イメージ全体のビット単位の再現性は保証しない。
検証に使う言語・ツール・依存関係のバージョンを再現する構成。
コンテナ内は root で動作する。Linux ホストで生成ファイルの所有権を調整したい場合は利用環境に合わせて設定する。

## セットアップ：ローカル

対応は macOS / Linux（glibc）の arm64・x64。Windows ネイティブではなく WSL2 または Dev Container を使う。
前提は Python 3.9以上、Git、tar/gzip、curl と OS の証明書ストア。
Linux は Lean 用に `libgmp10`、`libatomic1`、C ツールチェーンを用意する。
Python 標準ライブラリのみを使い、Python パッケージの追加導入は不要。

```sh
git clone <この Private リポジトリの URL>
cd formal-methods-lab
python3 scripts/setup.py
source scripts/env.sh
node scripts/verify.mjs
```

Node / pnpm / Java / Elan / Lean / TLA+ をリポジトリ内の `.tools/` に取得する。
既存のシステム版ツールやシェルの起動ファイルは変更しない。
**新しいターミナルごとに、ルートで `source scripts/env.sh` を実行する。**
VS Code をローカルで利用する場合も、その環境を引き継いで起動し、推奨拡張を導入する。

通常の `python3 scripts/setup.py` は再実行可能。取得済みアーカイブのチェックサムを再確認する。
中断した展開先や異なるバージョンのツールを上書きせず停止する。
必要なら新しいディレクトリ名でやり直し、以前のファイルは保持する。

```sh
export FORMAL_TOOLS="$PWD/.tools/retry-1"
python3 scripts/setup.py
source scripts/env.sh
```

`--tools-only` はツール導入のみを行う。通常の利用では指定せず、ロックファイルに基づく
TypeScript の依存関係インストールも実行する。
pnpm 12 はネイティブ配布を使用するため、OS/CPU 別の公式 npm アーカイブを直接固定している。

## 実行コマンド

すべてリポジトリルートから実行する。

| コマンド | 検証する内容 |
| --- | --- |
| `node scripts/verify.mjs` | 全サンプルと全 completed 演習 |
| `node scripts/verify.mjs typescript` | strict 型検査と Vitest |
| `node scripts/verify.mjs typecheck` | TypeScript の型検査 |
| `node scripts/verify.mjs lean` | Lake ビルド、警告の検査、公理依存の監査 |
| `node scripts/verify.mjs tla` | 正常モデルと期待した不変条件違反 |
| `node scripts/verify.mjs metadata` | 登録・状態・バージョンの整合性 |
| `node scripts/verify.mjs all --lesson 001-proposition` | 登録後、指定した未完成演習も含めて検証 |
| `node --test scripts/checks.test.mjs` | 状態・履歴・検証結果判定の回帰テスト |
| `node scripts/selftest.mjs` | 実ツールによる隔離・不正証明・実行エラー検出テスト |

TypeScript ディレクトリ内では `pnpm typecheck` / `pnpm test` も同じ検証コマンドを呼ぶ。
Lean の通常の `lake build` はサンプルだけを対象とする。**完了判定には必ず検証スクリプトを使う。**
直接の `lake build` は `sorry` を含む証明でも成功し得る。

## 演習・完了の扱い

- `progress.md` が `pending` / `in-progress` / `completed` を管理する唯一の表。
- `checks.json` は授業 ID と検証対象を対応付ける。環境確認用 `samples` は常時必須。
- 通常 CI は completed のみを選び、未完成の型エラー・証明・仕様は実行しない。
- ファイル名や状態の不正、未登録・重複は未完成でも検出する。登録したファイルは存在する必要がある。
- 完了済みコードが未完成ファイルを import した場合、その依存先のエラーも失敗になる。
- Lean は必要な定理の存在と、公理の推移的依存関係を検査する。`sorryAx` と独自公理は禁止。
  標準の `propext` / `Classical.choice` / `Quot.sound` は許可する。
- Vitest の skip / todo / 空のテストファイルも完了条件を満たさない。
- TLC の成功、期待する違反、実行エラーを区別する。詳細は [tla/README.md](tla/README.md)。

教材追加・達成条件・レビューの手順は [lessons/README.md](lessons/README.md) を参照する。
CI の成功は理解の証明ではない。理解度テスト、講師レビュー、学習者の承認を受けて人が履歴を更新する。
検証コマンドが進捗を自動変更することはない。

## GitHub Actions

`.github/workflows/verify.yml` は push / pull_request / 手動起動で実行する。
Actions 自体を commit SHA に固定し、読み取り専用権限で checkout する。
毎回、実際の Dev Container 用 Dockerfile から構築し、その中で依存関係導入、単体テスト、
全言語の検証、検証基盤の実ツール回帰テストを実行する。

pull request は base SHA、push は before SHA の `checks.json` / `progress.md` と比較し、
完了済み演習の降格・登録削除・必須検証の削除を拒否する。初回 push と手動起動は比較元がないため
現在の completed のみを必須検証する。比較元が指定されているのに読めない場合は失敗する。
ローカルでも `VERIFY_BASE=<完全な40桁コミットSHA> node scripts/verify.mjs` で同じ比較が可能。

検証ログは `.cache/` に毎回別名で保存し、CI の証跡を7日間 artifact として保存する。
講師と学習者が使う GitHub の権限に応じ、Verify を必須チェックにして main への直接変更を制限することを推奨。
ワークフロー自体の改変や管理者の操作までを、このリポジトリのスクリプトで防止するものではない。

## ディレクトリ

```text
formal-methods-lab/
├── README.md / AGENTS.md / curriculum.md / progress.md
├── checks.json / toolchains.json
├── lessons/README.md
├── typescript/
│   ├── package.json / pnpm-lock.yaml / pnpm-workspace.yaml
│   ├── tsconfig.json / vitest.config.ts
│   ├── samples/
│   └── exercises/
├── lean/
│   ├── lean-toolchain / lakefile.toml / lake-manifest.json
│   ├── Samples/Basic.lean
│   └── Exercises/
├── tla/
│   ├── README.md
│   ├── samples/Counter/ / samples/BrokenCounter/
│   └── specs/
├── notes/glossary.md
├── scripts/
├── .devcontainer/ / .vscode/
├── .github/workflows/verify.yml
└── .gitignore / .dockerignore
```

## 初期構築の確認

具体的な実行環境・コマンド・結果・未検証範囲は [notes/setup-verification.md](notes/setup-verification.md) に記録する。
教材の追加は [カリキュラム概要](curriculum.md) と [AGENTS.md](AGENTS.md) に従う。
