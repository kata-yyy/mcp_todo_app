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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TODO APP MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});