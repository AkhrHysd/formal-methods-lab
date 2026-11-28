# 第001回 命題（Proposition）と真理値（Truth Value）

25分（復習3分、概念説明5分、実践14分、理解度確認3分）。

## 1. 学習目標（Learning Objectives）

自然言語の文から真偽を問える命題を見分ける。ポイント利用条件を TypeScript で表し、境界条件（boundary condition）をテストする。Lean で式の型の確認と評価を使い分ける。

## 2. 前提知識（Prerequisites）

TypeScript の関数と比較演算子。リポジトリのセットアップを済ませておく。

## 3. 概念の解説（Concepts）

「この箱にはカードが3枚入っている」の真偽は、対象の箱と観察時点を定めれば問える。条件が変われば、同じ文でも真理値は変わり得る。

## 4. 数学的な定義（Formal Definitions）

命題（proposition）は真か偽かを問える文で、その真偽を真理値（truth value）と呼ぶ。Lean では命題を `Prop` で表し、`Bool` は `true` と `false` を持つデータ型である。

## 5. TypeScript との対応

`canUsePoints(balance, usage)` は、具体的な入力に対してポイントの利用可否を `boolean` で返す。保有数と利用数が等しい入力は、等号を含めるかどうかを確認する境界になる。

## 6. 実践演習（Exercises）

[演習](exercise.md)に沿って、文の分類、ポイント判定の実装とテスト、Lean の観察を行う。

## 7. 達成条件（Acceptance Criteria）

境界を含むテストが通り、Lean の観察結果を型と評価値に分けて説明できる。講師レビューを受け、学習者が結果を確認する。

## 8. 理解度テスト（Comprehension Test）

1. 「在庫は十分だ」の真偽を判定するために、どの情報を追加するか。
2. 利用数と保有数が等しいケースをテストに入れる理由は何か。
3. Lean の `#check` と `#eval` から得られる情報はどう違うか。

## 9. 参考文献（References）

- [Theorem Proving in Lean 4 §3.1 Propositions as Types](https://lean-lang.org/theorem_proving_in_lean4/Propositions-and-Proofs/#propositions-as-types)
- [Lean Language Reference §21.11.2 Booleans and Propositions](https://lean-lang.org/doc/reference/latest/Basic-Types/Booleans/#booleans-and-propositions)
