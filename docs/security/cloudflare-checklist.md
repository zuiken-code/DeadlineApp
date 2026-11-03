# Cloudflare通知API セキュリティチェックリスト

通知APIの公開後に、Cloudflare側の制限がコードと同じ意図で動いているかを確認するための運用チェックリストです。本番へ負荷をかける試験は行わず、設定画面と既存ログ・メトリクスで確認します。

## デプロイ前

- `wrangler.jsonc`のRate Limiting binding `PUSH_MUTATION_RATE_LIMITER`がデプロイ内容に含まれている。
- `namespace_id`の`27001`が同じCloudflareアカウント内の別Rate Limiting bindingと重複していない。重複する場合は正の整数へ変更する。
- `SUBSCRIPTIONS` KV、`VAPID_PUBLIC_KEY`、Secretの`VAPID_PRIVATE_KEY`、`VAPID_SUBJECT`がProduction環境に設定されている。
- Production branchが`main`で、意図したコミットがデプロイ対象になっている。

## API保護

- Workers Rate Limiting bindingは、`POST`/`DELETE /api/push/subscription`を同一IPあたり1分20回に制限する。これはCloudflareロケーションごとの近似制限であり、厳密な全体上限ではない。
- 必要に応じてCloudflareのWAF Rate limiting rulesにも、同じパスとメソッドを対象にしたルールを追加する。通常のアプリ操作を妨げない値から始める。
- `GET /api/push/config`は公開情報だけを返すため、通知設定の変更ルートとは別に扱う。
- アプリはJSON本文を実バイト数で16KiBまでに制限する。Cloudflareプラン側の受信上限はこれより大きいため、WAFの本文制限だけに依存しない。

## KV・Cron監視

- KVのキー数、書き込み回数、読み取り回数が急増していない。
- Cronログに`Scheduled notification run reached its safety limit`が出ていない。
- 1回のCronは最大5,000キーを走査し、最大1,000件の送信処理を行う。上限ログが出た場合は、単純に上限を上げず、Cloudflare Queuesなどへ処理を分割する。
- Workersプランの1 invocationあたりのsubrequest上限は別に適用される。利用中プランの上限に購読数が近づく前に、Queuesへの分割またはプラン変更を検討する。
- 通知失敗の`404`/`410`が継続的に増えていない。期限切れ購読は自動削除される。
- CPU時間、エラー率、KV利用量、リクエスト数、課金アラートを定期的に確認する。

## デプロイ後の確認

1. 公開アプリの設定画面で通知をオンにし、テスト通知が1件届くことを確認する。
2. 通知時刻を変更し、次の15分単位のCronで1件だけ届くことを確認する。
3. Workers Logsで`429`、`413`、Rate Limiterの`503`、Cron上限警告が発生していないことを確認する。
4. `/api/push/config`が`available: true`を返し、不足しているSecret名が表示されていないことを確認する。

## 関連するCloudflare仕様

- [Workers Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [Workersの上限](https://developers.cloudflare.com/workers/platform/limits/)
- [Workers KVのキー一覧とページネーション](https://developers.cloudflare.com/kv/api/list-keys/)
