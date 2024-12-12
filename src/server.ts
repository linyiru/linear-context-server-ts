#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  CallToolResult,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  TextContent,
  Tool,
  Prompt,
} from '@modelcontextprotocol/sdk/types.js';
import { config as dotenvConfig } from "dotenv";
import { Issue, LinearClient, LinearDocument } from "@linear/sdk";
import { TOOLS, CREATE_ISSUE, LIST_ISSUES, LIST_TEAMS, UPDATE_ISSUE, ADD_COMMENT, SEARCH_ISSUES } from './tools.js';

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

async function getMyIssues() {
  const me = await linearClient.viewer;
  const myIssues = await me.assignedIssues();
  return myIssues.nodes;
}


const serverPrompt: Prompt = {
  name: 'linear-server-prompt',
  description: 'Instructions for using the Linear MCP server effectively',
  instructions: `This server provides access to Linear, a project management tool. Use it to manage issues, track work, and coordinate with teams.

Key capabilities:
- Create and update issues: Create new tickets or modify existing ones with titles, descriptions, priorities, and team assignments.
- Search functionality: Find issues across the organization using flexible search queries with team and user filters.
- Team coordination: Access team-specific issues and manage work distribution within teams.
- Issue tracking: Add comments and track progress through status updates and assignments.
- Organization overview: View team structures and user assignments across the organization.

Tool Usage:
- linear_create_issue:
  - use teamId from linear-organization: resource
  - priority levels: 1=urgent, 2=high, 3=normal, 4=low
  - status must match exact Linear workflow state names (e.g., "In Progress", "Done")

- linear_update_issue:
  - get issue IDs from search_issues or linear-issue:/// resources
  - only include fields you want to change
  - status changes must use valid state IDs from the team's workflow

- linear_search_issues:
  - combine multiple filters for precise results
  - use labels array for multiple tag filtering
  - query searches both title and description
  - returns max 10 results by default

- linear_get_user_issues:
  - omit userId to get authenticated user's issues
  - useful for workload analysis and sprint planning
  - returns most recently updated issues first

- linear_add_comment:
  - supports full markdown formatting
  - use displayIconUrl for bot/integration avatars
  - createAsUser for custom comment attribution

Best practices:
- When creating issues:
  - Write clear, actionable titles that describe the task well (e.g., "Implement user authentication for mobile app")
  - Include concise but appropriately detailed descriptions in markdown format with context and acceptance criteria
  - Set appropriate priority based on the context (1=critical to 4=nice-to-have)
  - Always specify the correct team ID (default to the user's team if possible)

- When searching:
  - Use specific, targeted queries for better results (e.g., "auth mobile app" rather than just "auth")
  - Apply relevant filters when asked or when you can infer the appropriate filters to narrow results

- When adding comments:
  - Use markdown formatting to improve readability and structure
  - Keep content focused on the specific issue and relevant updates
  - Include action items or next steps when appropriate

- General best practices:
  - Fetch organization data first to get valid team IDs
  - Use search_issues to find issues for bulk operations
  - Include markdown formatting in descriptions and comments

Resource patterns:
- linear-issue:///{issueId} - Single issue details (e.g., linear-issue:///c2b318fb-95d2-4a81-9539-f3268f34af87)
- linear-team:///{teamId}/issues - Team's issue list (e.g., linear-team:///OPS/issues)
- linear-user:///{userId}/assigned - User assignments (e.g., linear-user:///USER-123/assigned)
- linear-organization: - Organization for the current user
- linear-viewer: - Current user context

The server uses the authenticated user's permissions for all operations.`,
};

const server = new Server(
  {
    name: 'linear-context-server-ts',
    version: '0.1.0',
  },
  {
    capabilities: {
      prompts: {
        default: serverPrompt,
      },
      resources: {},
      tools: {},
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
    const issues = await getMyIssues();
    const issueResources = issues.map((issue) => ({
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
      description: issue.description || "No description",
    };

    return {
      contents: [{
        uri: request.params.uri,
        mimeType: "application/json",
        text: JSON.stringify(issueData, null, 2),
      }],
    };
  }

  throw new Error(`Unsupported resource type: ${url.protocol}`);
});

/**
 * Handler that lists available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

/**
 * Handler for calling tools.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;

  switch (name) {
    case LIST_ISSUES: {
      const issues = await getMyIssues();
      const issuesData = await Promise.all(
        issues.map(async (issue) => ({
          id: issue.identifier,
          title: issue.title,
          state: (await issue.state)?.name || "Unknown",
          url: issue.url,
        })),
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(issuesData, null, 2),
          } as TextContent,
        ],
        isError: false,
      } as CallToolResult;
    }

    case LIST_TEAMS: {
      const me = await linearClient.viewer;
      const teams = await me.teams();

      const teamsData = await Promise.all(
        teams.nodes.map(async (team) => ({
          id: team.id,
          name: team.name,
          key: team.key,
        })),
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(teamsData, null, 2),
          } as TextContent,
        ],
        isError: false,
      } as CallToolResult;
    }

    case CREATE_ISSUE: {
      const args = request.params.arguments as {
        title: string;
        description?: string;
        assignee?: string;
      };
      const { title, description, assignee } = args;

      let assigneeId: string | undefined;
      if (assignee === "me") {
        const me = await linearClient.viewer;
        assigneeId = me.id;
      }

      // Get the default team to create the issue in
      const me = await linearClient.viewer;
      const teams = await me.teams();
      const team = teams.nodes[0]; // Use first team

      if (!team) {
        throw new Error("No team found to create issue in");
      }

      // Create the issue
      const response = await linearClient.createIssue({
        title: title,
        description: description,
        assigneeId: assigneeId,
        teamId: team.id,
      });

      // Return the created issue data
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2),
          } as TextContent,
        ],
        isError: false,
      } as CallToolResult;
    }

    case UPDATE_ISSUE: {
      const args = request.params.arguments as {
        issueId: string;
        title?: string;
        description?: string;
        assignee?: string;
        status?: string;
      };
      const { issueId, title, description, assignee, status } = args;

      // Get the issue
      const issue = await linearClient.issue(issueId);
      if (!issue) {
        throw new Error(`Issue ${issueId} not found`);
      }

      let assigneeId: string | undefined;
      if (assignee === "me") {
        const me = await linearClient.viewer;
        assigneeId = me.id;
      }

      // Update the issue
      const response = await issue.update({
        title,
        description,
        assigneeId,
        stateId: status,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2),
          } as TextContent,
        ],
        isError: false,
      } as CallToolResult;
    }

    case ADD_COMMENT: {
      const args = request.params.arguments as {
        issueId: string;
        body: string;
      };
      const { issueId, body } = args;

      // Get the issue
      const issue = await linearClient.issue(issueId);
      if (!issue) {
        throw new Error(`Issue ${issueId} not found`);
      }

      // Create the comment
      const response = await linearClient.createComment({
        issueId: issue.id,
        body: body,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2),
          } as TextContent,
        ],
        isError: false,
      } as CallToolResult;
    }

    case SEARCH_ISSUES: {
      const args = request.params.arguments as {
        query?: string;
        teamId?: string;
        status?: string;
        assignee?: string;
        priority?: number;
        includeArchived?: boolean;
        limit?: number;
      };

      // Build the filter object
      const filter: any = {};
      
      if (args.query) {
        filter.or = [
          { title: { contains: args.query } },
          { description: { contains: args.query } }
        ];
      }

      if (args.teamId) {
        filter.team = { id: { eq: args.teamId } };
      }

      if (args.status) {
        filter.state = { name: { eq: args.status } };
      }

      // Handle assignee filter
      if (args.assignee) {
        if (args.assignee === 'me') {
          const me = await linearClient.viewer;
          filter.assignee = { id: { eq: me.id } };
        } else {
          filter.assignee = { id: { eq: args.assignee } };
        }
      }

      if (args.priority) {
        filter.priority = { eq: args.priority };
      }

      // Perform the search
      const result = await linearClient.issues({
        filter,
        first: args.limit || 10,
        includeArchived: args.includeArchived || false,
        orderBy: LinearDocument.PaginationOrderBy.UpdatedAt,
      });

      // Format the results
      const issuesData = await Promise.all(
        result.nodes.map(async (issue) => ({
          id: issue.identifier,
          title: issue.title,
          description: issue.description,
          priority: issue.priority,
          state: (await issue.state)?.name || "Unknown",
          assignee: (await issue.assignee)?.name || "Unassigned",
          url: issue.url,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
        }))
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              total: result.nodes.length,
              issues: issuesData
            }, null, 2),
          } as TextContent,
        ],
        isError: false,
      } as CallToolResult;
    }

    default:
      return {
        content: [
          {
            type: "text",
            text: `Error: Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
  }
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Linear MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
