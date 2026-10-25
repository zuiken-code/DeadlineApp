# 期限くん

期限から逆算して、目標とやることの進捗を管理するモバイル向けPWAです。メインカラーは`#26A79A`。画面設計はAppleの[Human Interface Guidelines](https://developer.apple.com/jp/design/human-interface-guidelines/)を参考にしています。

**公開中:** [https://deadlineapp.zuiken.workers.dev/](https://deadlineapp.zuiken.workers.dev/)

## できること

- 目標名と期限を設定し、残り日数・期間中の休日数・目標全体の達成度を表示
- TODOの追加、完了チェック、編集、削除（スマホは右スワイプ、PCは削除ボタン）
- TODOごとにページ番号または問題番号などの数値範囲を設定し、現在の番号から達成率を自動計算
- ホーム画面に追加してオフライン利用。オンライン時には日本の祝日データを取得
- 設定した時刻に期限リマインダーをWeb Pushで通知
- 初回チュートリアルと、設定から開ける使い方ガイド

データは基本的に利用端末の`localStorage`へ保存します。端末間同期とバックアップはまだありません。ブラウザのサイトデータを削除すると、保存した目標とTODOも消えます。

## 使い方

1. 目標名と期限を設定し、必要な作業をTODOに追加します。
2. TODOの編集画面で、開始番号と終了番号を設定します。**ページ番号でも問題番号でもOK**。一つのTODOでは同じ単位で入力してください。
3. 一覧で「現在」の番号を更新すると、そのTODOと目標全体の達成度が更新されます。未着手なら空欄にできます。
4. 完了したTODOにチェックを付けます。チェックと数値の達成率は別々に管理します。
5. 通知が必要なら「設定」で期限リマインダーをオンにします。iPhone/iPadでは、先にSafariからホーム画面へ追加し、そのアプリアイコンから開いてください。

初回の同意選択後にチュートリアルが始まります。後から「使い方」で再確認できます。画面下部の`v0.1.0 · コミットID`は、現在表示しているビルドを見分けるための表示です。

### 達成率の計算

開始・終了の両端を含み、現在の番号まで完了したものとして計算します。

```text
全体数 = 終了番号 - 開始番号 + 1
完了数 = 現在番号 - 開始番号 + 1（未着手なら0）
TODOの達成率 = round(完了数 / 全体数 × 100)
目標全体の達成度 = round(各TODOの達成率の合計 / TODO件数)
```

例えば問10〜109のうち問39まで進んだら、30/100で`30%`です。TODOがない場合、目標全体の達成度は`0%`になります。

## データとプライバシー

- 目標・TODO・進捗は端末内に保存します。祝日は[national-holidays.jp](https://national-holidays.jp/about.html)からオンライン時に必要な年だけ取得し、日付のみを一時保存します。
- 通知をオンにした場合、配信に必要な購読情報、目標名、期限、通知時刻、タイムゾーンをCloudflare KVに保存します。TODOや入力した番号は送信しません。
- Google Analytics 4は同意後、オンラインの公開版でのみ読み込みます。目標名、TODO本文、正確な期限、入力番号は送信しません。同意は設定から変更できます。計測値は同意した利用者に限られ、全利用者数ではありません。

### Analyticsのイベント

操作が保存・確定したときだけ、以下の独自イベントを送ります。追加パラメータは日数・件数・進捗率などの区分値で、実際の入力内容は含めません。`progress_mode=pages`は内部的な名称で、ページだけでなく問題番号などの数値範囲にも使います。

| イベント | 意味 |
| --- | --- |
| `goal_set` | 最初の目標を保存 |
| `goal_edited` | 目標名または期限を変更して保存 |
| `todo_added` | TODOを追加 |
| `progress_saved` | TODOの数値進捗を更新・確定 |
| `todo_checked` / `todo_unchecked` | TODOの完了チェックを付ける／外す |
| `tutorial_started` / `tutorial_completed` | チュートリアルを開始／完了 |

初回訪問の`first_visit`、ページ表示の`page_view`、セッション開始の`session_start`はGA4の自動収集に任せ、独自には送信しません。

## 開発

Node.js 22以降を推奨します。

```bash
npm ci
npm run dev
```

`http://localhost:5173/`でプレビューできます。開発サーバーではPWAのService Workerを無効にしています。変更後は`npm run lint`と`npm run build`で確認します。

主な構成は`src/components/`（画面）、`src/data/`（保存・祝日・Analytics）、`worker/`（通知API・定期配信）、`wrangler.jsonc`（Cloudflare設定）です。

## Cloudflareへのデプロイ

公開先はCloudflare WorkersのStatic Assetsです。`main`にマージすると、接続済みのWorkers Buildsから公開版が更新されます。設定は次のとおりです。

| 項目 | 値 |
| --- | --- |
| Production branch | `main` |
| Build command | `npm run build` |
| Deploy command | `npm run deploy:worker` |
| Assets | `dist`（`wrangler.jsonc`で指定） |
| `DEPLOY_BASE_PATH` | 設定しない（公開URLのルート`/`を使用） |

通知には`SUBSCRIPTIONS`というKVバインディング、`VAPID_PUBLIC_KEY`、Secretの`VAPID_PRIVATE_KEY`、`VAPID_SUBJECT`が必要です。公開鍵とKV IDは`wrangler.jsonc`に設定済みで、秘密鍵はCloudflare側にだけ保存します。Cronは15分ごとに起動し、登録されたタイムゾーンと通知時刻が一致した購読に送信します。通知時刻は`00`・`15`・`30`・`45`分から選べます。

Workers Logsは`wrangler.jsonc`で有効化済みです。配信を調べる際はCloudflareの**Workers & Pages → deadlineapp → Observability**でCron実行とエラーを確認できます。通知のテスト送信はアプリの設定画面から行えます。
