# 期限くん

期限から逆算して、目標までにやることと進み具合を管理するモバイルファーストのPWAです。

Appleの[Human Interface Guidelines](https://developer.apple.com/jp/design/human-interface-guidelines/)を参考に、迷わず使えるシンプルな画面と、メインカラー`#26A79A`で設計しています。

**公開版:** [https://zuiken-code.github.io/DeadlineApp/](https://zuiken-code.github.io/DeadlineApp/)

## 主な機能

- 目標名と期限を登録し、残り日数を表示
- 期間内の土日・日本の祝日を重複なしで集計
- TODOの追加、完了チェック、削除
- スマートフォンではスワイプ、PCでは削除ボタンからTODOを削除
- 各TODOの達成度を`0 / 25 / 50 / 75 / 100%`の5段階で記録
- 各TODOの達成度から、目標全体の達成度を自動計算
- 初めて使う人向けの使い方チュートリアル
- localStorageによる端末内保存
- PWAとしてホーム画面へ追加でき、アプリ本体はオフラインでも利用可能

## 使い方

1. 「目標」から目標名と期限を設定します。
2. 期限までに必要な作業をTODOへ追加します。
3. 各TODOのスライダーで現在の達成度を更新します。
4. 完了したTODOにチェックを付けます。
5. 不要なTODOは、スマートフォンでは右スワイプ、PCでは削除ボタンから削除します。

画面上部には、期限までの残り日数、休日数、TODO全体から算出した目標達成度が表示されます。

## 達成度の計算

各TODOの5段階を内部では`0〜4`として保存し、その平均値をパーセントへ変換します。

```text
全体達成度 = round((TODOごとの段階値の合計 / TODO件数) × 25)
```

たとえば、3件のTODOが`25%・75%・100%`の場合、全体達成度は`67%`です。TODOがない場合は`0%`として表示します。完了チェックと達成度は別々に管理されます。

## 休日データ

日本の祝日は[national-holidays.jp](https://national-holidays.jp/about.html)からオンライン時に取得します。

- 期限に関係する年だけ取得
- 保存するのは祝日の日付のみ
- 年単位でlocalStorageへキャッシュ
- キャッシュの有効期間は30日
- 土日と祝日が重なる場合は1日として集計
- オフライン時は取得済みキャッシュを使用
- 利用可能なキャッシュがない場合は「休日データ未取得」と表示

## 技術構成

- React 19
- TypeScript
- Vite
- vite-plugin-pwa / Workbox
- Oxlint
- GitHub Actions
- GitHub Pages

## ローカル開発

Node.js 22を推奨します。

```bash
npm ci
npm run dev
```

開発サーバーは通常`http://localhost:5173/`で起動します。開発中はService Workerを無効化しているため、PWAキャッシュに邪魔されず変更を確認できます。

### 品質チェック

```bash
npm run lint
npm run build
```

本番ビルドをローカルで確認する場合は、次を実行します。

```bash
npm run preview
```

## ディレクトリ構成

```text
src/
├─ components/       UIコンポーネント
├─ data/
│  ├─ appStorage.ts  目標・TODOの保存と日付処理
│  └─ holidayApi.ts  祝日APIとキャッシュ
├─ App.tsx            状態管理と画面構成
├─ App.css            アプリ固有のスタイル
└─ main.tsx           エントリーポイント

public/               PWAアイコンなどの静的ファイル
.github/workflows/    GitHub Pagesの自動デプロイ
```

## データとプライバシー

目標、TODO、達成度はブラウザのlocalStorageに保存され、アプリのサーバーには送信されません。祝日数を計算する際のみ、対象年を指定して祝日APIへアクセスします。

ブラウザのサイトデータを削除すると、保存した目標とTODOも削除されます。現時点では端末間同期やバックアップ機能はありません。

## デプロイ

`main`へのpushをきっかけにGitHub Actionsが本番ビルドを作成し、GitHub Pagesへ自動デプロイします。

通常の開発フローは次のとおりです。

1. `main`から作業ブランチを作成
2. 実装後に`npm run lint`と`npm run build`を実行
3. Pull Requestを作成
4. `main`へマージ
5. GitHub Actionsで自動デプロイ

## ロードマップ

優先度の高い改善候補です。

- TODOの編集、並べ替え、優先度設定
- TODOごとの作業量を考慮した加重達成率
- データのJSONエクスポート・インポート・全削除
- 日付計算、祝日キャッシュ、保存データ移行の自動テスト
- Pull RequestごとのLint・ビルド・UIテスト
- 期限前のリマインダー通知
- 複数の目標を切り替えて管理する機能
- 任意のクラウド同期と複数端末対応
- VoiceOver、キーボード操作、配色コントラストの継続的な確認
