# 教材追加の規約

初期構築では授業を作成しない。講師の指示後、`NNN-english-slug/README.md` と
`exercise.md` を追加する。例は `001-proposition`。専門用語は日本語と英語を併記する。

授業 README に必要な項目:

1. 学習目標（Learning Objectives）
2. 前提知識（Prerequisites）
3. 概念の解説（Concepts）
4. 数学的な定義（Formal Definitions）
5. TypeScript との対応
6. 実践演習（Exercises）
7. 達成条件（Acceptance Criteria）
8. 理解度テスト（Comprehension Test）
9. 参考文献（References）：一次資料へのリンクと必要な節

`exercise.md` には課題、前提条件、編集対象ファイル、実行コマンド、達成条件を記載する。
必要な場合だけ段階的ヒントを添える。解答や完成済み証明は含めない。
時間配分を明示し、20〜30分の半分以上を実践に割り当てる。読むだけの授業は作らない。

実行ファイルは `../../typescript/exercises/001-proposition/…`、
`../../lean/Exercises/L001Proposition.lean`、`../../tla/specs/057-counter/…` などへ
相対リンクする。授業ディレクトリにコードを複製しない。

## 登録・完了の手順

1. 各言語の演習ディレクトリに未完成のスキャフォールドと必要な検証を追加する。
2. `checks.json` の `exercises` に `id` と言語別検証を追加する。形式は `samples` と同じ。
   TS は `files`（型検査する実ファイル）と `tests`（その部分集合）。
   Lean は `modules` と必要な定理の完全修飾名 `declarations`。
   TLA+ は `module`、`config`、`expected`。対応する言語だけ指定する。
3. `progress.md` に同じ ID で `pending` 行を追加する。後で `in-progress` に変更する。
4. `node scripts/verify.mjs all --lesson 001-proposition` で未完成演習も明示的に検証する。
   このコマンドは状態を変更しない。他の完了済み演習も検証する。
5. 学習者が演習を解き、理解度テスト・講師レビューを受ける。
6. 検証成功と学習者の承認を確認して、人が `completed`、日付、評価、承認根拠を記録する。

`completed` の降格、登録削除、必須ファイル・定理・期待結果の削除や変更は履歴ガードが拒否する。
復習は状態を戻さず記録欄へ追記する。誤った検証条件の修正は講師によるレビューを伴う
検証機構の保守として扱い、単に練習を通すための変更と混同しない。
CI スクリプト自体を変更できる人に対するセキュリティ境界ではないので、GitHub のブランチ保護とレビューも併用する。

未完成ファイルから完了済みコードへ import しない。必要な依存関係はコンパイラがたどるため、
完了済みコードが壊れた未完成ファイルに依存すれば CI は失敗する。
Lean の無名 `example` だけでは完了条件を指定できない。定理には名前を付ける。
独自公理は初期カリキュラムで禁止し、Lean 標準の `propext`、`Classical.choice`、`Quot.sound` のみ許可する。
