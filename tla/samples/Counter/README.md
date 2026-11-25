# 正常系ツール確認

`Counter.tla` と `Counter.cfg` は学習演習ではなく、TLC の動作確認サンプル。
Limit=3、初期値0、4状態（0..3）を全探索し、TypeOK を検査する。
追加の状態制約・公平性・活性の検査はない。

リポジトリルートで `node scripts/verify.mjs tla` を実行する。
