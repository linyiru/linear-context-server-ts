// Names
export const CREATE_ISSUE = "create_issue";
export const LIST_ISSUES = "list_issues";
export const LIST_TEAMS = "list_teams";
export const UPDATE_ISSUE = "update_issue";
export const ADD_COMMENT = "add_comment";
export const SEARCH_ISSUES = "search_issues";

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
    name: UPDATE_ISSUE,
    description: "Update an existing Linear issue.",
    inputSchema: {
      type: "object",
      properties: {
        issueId: { type: "string", description: "ID of the issue to update" },
        title: { type: "string", description: "New title for the issue" },
        description: { type: "string", description: "New description for the issue" },
        assignee: {
          type: "string",
          description: "Set to 'me' to assign to self",
        },
        status: { type: "string", description: "New status for the issue" },
      },
      required: ["issueId"],
    },
  },
  {
    name: ADD_COMMENT,
    description: "Add a comment to an existing Linear issue.",
    inputSchema: {
      type: "object",
      properties: {
        issueId: { type: "string", description: "ID of the issue to comment on" },
        body: { type: "string", description: "Comment text (supports markdown)" },
      },
      required: ["issueId", "body"],
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
  {
    name: SEARCH_ISSUES,
    description: "Search Linear issues with flexible criteria.",
    inputSchema: {
      type: "object",
      properties: {
        query: { 
          type: "string", 
          description: "Search text to find in title or description" 
        },
        teamId: { 
          type: "string", 
          description: "Filter by team ID" 
        },
        status: { 
          type: "string", 
          description: "Filter by status (e.g., 'In Progress', 'Done')" 
        },
        assignee: {
          type: "string",
          description: "Filter by assignee (use 'me' for self-assigned issues)",
        },
        priority: {
          type: "number",
          description: "Filter by priority (1=urgent, 2=high, 3=normal, 4=low)",
        },
        includeArchived: {
          type: "boolean",
          description: "Include archived issues in results",
        },
        limit: {
          type: "number",
          description: "Maximum number of issues to return (default: 10)",
        },
      },
    },
  },
];
