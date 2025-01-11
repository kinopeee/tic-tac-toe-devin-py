# オンライン三目並べ (Online Tic-Tac-Toe)

リアルタイムで遊べるオンライン三目並べゲームです。
An online tic-tac-toe game that can be played in real-time.

## 機能 (Features)

- ✨ リアルタイムマルチプレイヤー対戦 (Real-time multiplayer gameplay)
- 🎮 ルーム作成・参加機能 (Create and join game rooms)
- 🎯 勝利/敗北演出 (Winner/loser animations)
- 🎨 カラフルなデザイン (Colorful design)

## プロジェクト構成 (Project Structure)

```
.
├── frontend/          # React + TypeScript frontend
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── dist/         # Built files
└── backend/          # FastAPI backend
    └── app/          # Application code
```

## 技術スタック (Tech Stack)

### フロントエンド (Frontend)
- React + TypeScript
- Tailwind CSS
- shadcn/ui
- WebSocket for real-time updates

### バックエンド (Backend)
- FastAPI
- WebSocket
- In-memory game state management

## セットアップ (Setup)

### フロントエンド (Frontend)
```bash
cd frontend
npm install
npm run dev
```

### バックエンド (Backend)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## デプロイメント (Deployment)

フロントエンドとバックエンドは別々にデプロイされています：
The frontend and backend are deployed separately:

- Frontend: https://wake-up-app-ya3wayqu.devinapps.com
- Backend: https://app-hmpxhnsm.fly.dev

## 使い方 (How to Play)

1. 最初のプレイヤーが「新しいゲームを作成」をクリック (First player clicks "Create New Game")
2. 生成されたルームIDを2番目のプレイヤーと共有 (Share the generated room ID with the second player)
3. 2番目のプレイヤーがルームIDを入力して参加 (Second player enters room ID and joins)
4. 交互に手を打って対戦開始！ (Take turns playing!)
