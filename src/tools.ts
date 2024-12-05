// Names
export const CREATE_ISSUE = "create_issue";
export const LIST_ISSUES = "list_issues";
export const LIST_TEAMS = "list_teams";

// Definitions
export const TOOLS = [
  {
    name: CREATE_ISSUE,
    description: "Create a new Linear issue.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        assignee: {
          type: "string",
          description: "Set to 'me' to assign to self",
        },
      },
      required: ["title"],
    },
  },
  {
    name: LIST_ISSUES,
    description: "List all Linear issues assigned to me.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: LIST_TEAMS,
    description: "List all Linear teams I have access to.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];
