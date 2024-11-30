#!/usr/bin/env node

/**
 * This is a template MCP server that implements a simple notes system.
 * It demonstrates core MCP concepts like resources and tools by allowing:
 * - Listing notes as resources
 * - Reading individual notes
 * - Creating new notes via a tool
 * - Summarizing all notes via a prompt
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { config as dotenvConfig } from "dotenv";
import { LinearClient, Issue } from "@linear/sdk";

// Load environment variables
dotenvConfig();
const linearApiKey = process.env.LINEAR_API_KEY;
if (!linearApiKey) {
  throw new Error("LINEAR_API_KEY environment variable is not set");
}

async function getMyIssues(client: LinearClient) {
  const me = await client.viewer;
  const myIssues = await me.assignedIssues();

  // if (myIssues.nodes.length) {
  //   myIssues.nodes.map((issue: Issue) => console.error(`${me.displayName} has issue: ${issue.title}`));
  // } else {
  //   console.error(`${me.displayName} has no issues`);
  // }
}

const server = new Server(
  {
    name: "linear-context-server-ts",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  },
);

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  throw new Error("not implemented");
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "create_note": {
      return {
        content: [],
      };
    }

    default:
      throw new Error("Unknown tool");
  }
});

/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  const client = new LinearClient({
    apiKey: linearApiKey,
  });

  getMyIssues(client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
