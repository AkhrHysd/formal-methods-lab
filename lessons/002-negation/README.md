# 第002回 否定（Negation）

26分（復習3分、概念説明5分、実践15分、理解度確認3分）。

## 1. 学習目標（Learning Objectives）

自然言語の命題の否定を書き、境界で元の命題と照合する。ポイント利用拒否を TypeScript で二通りに表す。Lean でブール値の否定と命題の否定を区別し、等式の否定を証明する。

## 2. 前提知識（Prerequisites）

[第001回](../001-proposition/README.md)の命題、真理値、境界条件、`Prop` と `Bool`。TypeScript の比較演算子と Vitest の基本操作。

## 3. 概念の解説（Concepts）

否定は、同じ対象と条件のもとで元の命題の真偽を反転させる。比較を否定するときは、値がしきい値と等しいケースをどちらが含むか確認する。

## 4. 数学的な定義（Formal Definitions）

命題 `P` の否定を `¬P` と書く。Lean では `¬P` は `P → False` と定義される。否定の証明では、`P` の証明を仮定し、その仮定から矛盾（contradiction）を導く。

## 5. TypeScript との対応

`boolean` の否定には `!` を使う。比較の結果を `!` で反転する書き方と、比較演算子だけで同じ条件を表す書き方を、同じ入力で照合する。

## 6. 実践演習（Exercises）

[演習](exercise.md)に沿って、自然言語の否定（3分）、TypeScript の実装とテスト（7分）、Lean の観察と証明（5分）を行う。

## 7. 達成条件（Acceptance Criteria）

3つの否定を根拠とともに説明でき、2つの TypeScript 関数が全5ケースでそれぞれの期待値を満たす。Lean の2つの定理を証明し、個別検証を通す。型と評価値の観察結果を示し、講師レビューと学習者の承認を受ける。

## 8. 理解度テスト（Comprehension Test）

1. 「注文数は上限以下である」を否定し、注文数が上限と等しいときの扱いを説明せよ。
2. 2つの実装が5ケースで一致しても、何がまだ確かめられていないか。
3. Lean で `¬P` を証明するとき、何を仮定し、何を示すか。ブール値の否定の評価とどう違うか。

## 9. 参考文献（References）

- [Theorem Proving in Lean 4 §3.3.3 Negation and Falsity](https://lean-lang.org/theorem_proving_in_lean4/Propositions-and-Proofs/#negation-and-falsity)
- [Lean Language Reference §21.11.2 Booleans and Propositions](https://lean-lang.org/doc/reference/latest/Basic-Types/Booleans/#booleans-and-propositions)
