# MCP TODO アプリ

これはModel Context Protocol (MCP) を使用してTODOアプリと連携するサーバーです。VS Code内からタスク管理ができるようになります。

## 概要

このMCPサーバーは、TODOアプリのAPIと連携し、以下の機能を提供します：

- タスク一覧の取得
- 特定のタスク詳細の取得
- 新しいタスクの登録
- タスクステータスの更新

## セットアップ方法

### 前提条件

- Node.js (v16以上)
- TODOアプリバックエンド (http://localhost:5001/api/tasks)

### インストール

1. 依存関係をインストール:

```bash
npm install
```

2. サーバーをビルド:

```bash
npm run build
```

### 設定

VS Codeの設定ファイル (`settings.json`) またはClaude Desktop Config (`claude_desktop_config.json`) に以下を追加してMCPサーバーを設定します：

```json
"mcp": {
  "servers": {
    "mcp_todo_app": {
      "command": "node",
      "args": [
        "/path/to/mcp_todo_app/build/index.js"
      ],
      "env": {
        "NODE_PATH": "/path/to/mcp_todo_app/node_modules"
      }
    }
  }
}
```

## 使用方法

### 利用可能なツール

| ツール名 | 説明 | パラメータ |
|----------|------|------------|
| get_tasks | TODOアプリからタスク一覧を取得する | なし |
| get_task | 特定のタスク詳細を取得する | id: number |
| create_task | 新しいタスクを登録する | title: string, description?: string |
| update_task_status | タスクステータスを更新する | id: number, status: "ToDo" \| "InProgress" \| "Done" |

### 使用例

#### タスク一覧を取得

```javascript
{
  "kind": "tool_call",
  "name": "get_tasks",
  "inputs": {}
}
```

#### タスク詳細を取得

```javascript
{
  "kind": "tool_call",
  "name": "get_task",
  "inputs": {
    "id": 1
  }
}
```

#### 新しいタスクを登録

```javascript
{
  "kind": "tool_call",
  "name": "create_task",
  "inputs": {
    "title": "新しいタスク",
    "description": "詳細説明"
  }
}
```

#### タスクステータスを更新

```javascript
{
  "kind": "tool_call",
  "name": "update_task_status",
  "inputs": {
    "id": 1,
    "status": "InProgress"
  }
}
```

## API接続

このMCPサーバーは、デフォルトで `http://localhost:5001/api/tasks` にあるTODOアプリAPIと通信します。
異なるアドレスのAPIを使用したい場合は、`src/index.ts` のURLを更新してください。

## 開発

### ディレクトリ構造

```
mcp_todo_app/
  ├── src/
  │   └── index.ts     # MCPサーバーのメイン実装
  ├── build/           # コンパイル済みのJavaScriptファイル
  ├── package.json     # 依存関係と構成
  └── tsconfig.json    # TypeScript設定
```

### 新しいツールの追加

新しいツールを追加するには、`src/index.ts` に新しい `server.tool()` メソッドを追加し、ビルドしてください。

```typescript
server.tool(
  "tool_name",
  "ツールの説明",
  {
    // ZodによるパラメータスキーマDefinition
    param1: z.string(),
    param2: z.number()
  },
  async (args, _extra) => {
    // ツールの実装
    return {
      content: [{
        type: "text" as const,
        text: `結果テキスト`
      }]
    };
  }
);
```
