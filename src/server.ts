#!/usr/bin/env node

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

// Initialize Linear client
const linearClient = new LinearClient({
  apiKey: linearApiKey,
});

async function getMyIssues(client: LinearClient) {
  const me = await client.viewer;
  const myIssues = await me.assignedIssues();
  return myIssues.nodes;
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
  }
);

/**
 * Handler for listing available resources.
 * Lists Linear issues assigned to the current user.
 */
server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
  const resources = [];

  // Add Linear issues if requested
  if (!request.params?.type || request.params.type === "issue") {
    const issues = await getMyIssues(linearClient);
    const issueResources = issues.map(issue => ({
      uri: `issue://${issue.id}`,
      mimeType: "application/json",
      name: issue.title,
      description: `Linear issue: ${issue.title} (${issue.identifier})`,
    }));
    resources.push(...issueResources);
  }

  return {
    resources,
  };
});

/**
 * Handler for reading resources.
 * Retrieves and formats Linear issue details.
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (!request.params?.uri) {
    throw new Error("URI is required");
  }

  const url = new URL(request.params.uri);

  // Handle Linear issues
  if (url.protocol === "issue:") {
    const issueId = url.hostname;
    const issue = await linearClient.issue(issueId);

    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    const issueData = {
      title: issue.title,
      id: issue.identifier,
      state: (await issue.state)?.name || "Unknown",
      assignee: (await issue.assignee)?.name || "Unassigned",
      description: issue.description || "No description"
    };

    return {
      contents: [{
        uri: request.params.uri,
        mimeType: "application/json",
        text: JSON.stringify(issueData, null, 2)
      }]
    };
  }

  throw new Error(`Unsupported resource type: ${url.protocol}`);
});

/**
 * Handler that lists available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: []
  };
});

/**
 * Handler that lists available prompts.
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: []
  };
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
