# 第001回の演習

保有ポイント数 `balance` と利用ポイント数 `usage` は非負の安全な整数とする。保有ポイントで利用ポイントの全額をまかなえる場合は利用できる。

1. **命題と真理値（3分）**。「残高は10ポイントだ」「残高を確認してください」を分類し、真偽の判定に必要な情報をメモする。
2. **TypeScript（7分）**。[実装](../../typescript/exercises/001-proposition/proposition.ts)の `canUsePoints` を書く。[テスト](../../typescript/exercises/001-proposition/proposition.test.ts)では、各入力の期待値を先に決め、未実装の例外を assertion に置き換える。
3. **Lean（4分）**。`lean/` 配下の手元の確認用ファイルで `#check (2 = 3)` と `#check (2 == 3)` を試す。後者を `#eval` し、表示された型と評価値を記録する。等号の形を保ったまま `decide (2 = 3)` にも `#check` と `#eval` を試す。

リポジトリルートで実行する。

```sh
source scripts/env.sh
node scripts/verify.mjs all --lesson 001-proposition
```

達成条件は、各ケースの期待値を検査するテストが通り、命題と真理値の違いを説明できること。Lean の観察は講師レビューで確認する。
