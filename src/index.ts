import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";


// Create server instance
const server = new McpServer({
  name: "mcp_todo_app",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.tool(
  "get_tasks",
  "TODOアプリからタスク一覧を取得する",
  {},
  async (_args, _extra) => {
    try {
      console.error("タスク取得を開始します...");
      const resp = await fetch("http://localhost:5001/api/tasks");
      if (!resp.ok) {
        throw new Error(`APIエラー: ${resp.status}`);
      }
      const tasks = await resp.json();
      console.error("タスクデータ取得成功:", JSON.stringify(tasks));
      
      // タスク一覧を見やすく整形
      const formattedTasks = tasks.map((task: any) => 
        `ID: ${task.id}, タイトル: ${task.title}, 説明: ${task.description}, 状態: ${task.status}`
      ).join('\n');
      
      const result = {
        content: [{
          type: "text" as const, 
          text: `タスク一覧：\n${formattedTasks}`
        }]
      };
      
      console.error("レスポンス:", JSON.stringify(result));
      return result;
    } catch (error) {
      console.error("タスク取得エラー:", error);
      return {
        content: [{
          type: "text" as const, 
          text: `タスクの取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  },
);

// タスク詳細取得ツール
server.tool(
  "get_task",
  "TODOアプリから指定したタスクを一件取得する",
  {
    id: z.number().int().positive("タスクIDは正の整数で指定してください")
  },
  async (args, _extra) => {
    try {
      console.error(`タスク取得を開始します... ID: ${args.id}`);
      const resp = await fetch(`http://localhost:5001/api/tasks/${args.id}`);
      
      if (!resp.ok) {
        if (resp.status === 404) {
          return {
            content: [{
              type: "text" as const,
              text: `ID: ${args.id} のタスクは見つかりませんでした。`
            }]
          };
        }
        throw new Error(`APIエラー: ${resp.status}`);
      }
      
      const task = await resp.json();
      console.error("タスク詳細取得成功:", JSON.stringify(task));
      
      const result = {
        content: [{
          type: "text" as const,
          text: `タスク詳細：\nID: ${task.id}\nタイトル: ${task.title}\n説明: ${task.description}\n状態: ${task.status}`
        }]
      };
      
      console.error("レスポンス:", JSON.stringify(result));
      return result;
    } catch (error) {
      console.error("タスク詳細取得エラー:", error);
      return {
        content: [{
          type: "text" as const,
          text: `タスク詳細の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  },
);

// タスク登録ツール
server.tool(
  "create_task",
  "TODOアプリにタスクを一件登録する",
  {
    title: z.string().min(1, "タイトルは必須項目です"),
    description: z.string().optional()
  },
  async (args, _extra) => {
    try {
      console.error("タスク登録を開始します...");
      
      const taskData = {
        title: args.title,
        description: args.description || ""
      };
      
      console.error("登録データ:", JSON.stringify(taskData));
      
      const resp = await fetch("http://localhost:5001/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(taskData)
      });
      
      if (!resp.ok) {
        throw new Error(`APIエラー: ${resp.status}`);
      }
      
      const newTask = await resp.json();
      console.error("タスク登録成功:", JSON.stringify(newTask));
      
      const result = {
        content: [{
          type: "text" as const,
          text: `新しいタスクを登録しました：\nID: ${newTask.id}\nタイトル: ${newTask.title}\n説明: ${newTask.description}\n状態: ${newTask.status || "ToDo"}`
        }]
      };
      
      console.error("レスポンス:", JSON.stringify(result));
      return result;
    } catch (error) {
      console.error("タスク登録エラー:", error);
      return {
        content: [{
          type: "text" as const,
          text: `タスクの登録に失敗しました: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  },
);

// タスクステータス更新ツール
server.tool(
  "update_task_status",
  "タスク一件のステータスを更新する",
  {
    id: z.number().int().positive("タスクIDは正の整数で指定してください"),
    status: z.enum(["ToDo", "InProgress", "Done"], {
      errorMap: () => ({ message: "ステータスは「ToDo」「InProgress」「Done」のいずれかを指定してください" })
    })
  },
  async (args, _extra) => {
    try {
      console.error(`タスクID: ${args.id} のステータスを「${args.status}」に更新します...`);
      
      // 更新前のタスク情報を取得
      const getResp = await fetch(`http://localhost:5001/api/tasks/${args.id}`);
      
      if (!getResp.ok) {
        if (getResp.status === 404) {
          return {
            content: [{
              type: "text" as const,
              text: `ID: ${args.id} のタスクは見つかりませんでした。`
            }]
          };
        }
        throw new Error(`APIエラー: ${getResp.status}`);
      }
      
      const currentTask = await getResp.json();
      console.error("現在のタスク:", JSON.stringify(currentTask));
      
      // ステータスの更新のみを行うためのデータを作成
      const updateData = {
        title: currentTask.title,
        description: currentTask.description,
        status: args.status
      };
      
      console.error("更新データ:", JSON.stringify(updateData));
      
      // タスクを更新
      const updateResp = await fetch(`http://localhost:5001/api/tasks/${args.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updateData)
      });
      
      if (!updateResp.ok) {
        throw new Error(`APIエラー: ${updateResp.status}`);
      }
      
      const updatedTask = await updateResp.json();
      console.error("タスク更新成功:", JSON.stringify(updatedTask));
      
      const result = {
        content: [{
          type: "text" as const,
          text: `タスクのステータスを更新しました：\nID: ${updatedTask.id}\nタイトル: ${updatedTask.title}\n説明: ${updatedTask.description}\n状態: ${updatedTask.status}`
        }]
      };
      
      console.error("レスポンス:", JSON.stringify(result));
      return result;
    } catch (error) {
      console.error("タスクステータス更新エラー:", error);
      return {
        content: [{
          type: "text" as const,
          text: `タスクのステータス更新に失敗しました: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TODO APP MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});