# Linear MCP Server

A Model Context Protocol server for Linear.

## Tools

### `create_issue`
Create a new Linear issue.

### `list_issues`
List all Linear issues assigned to me.

### `list_teams`
List all Linear teams I have access to.

### `update_issue`
Update an existing Linear issue's properties (title, description, assignee, status).

### `add_comment`
Add a comment to an existing Linear issue.

### `search_issues`
Search Linear issues with flexible criteria. Supports filtering by:
- Text in title or description
- Team
- Status
- Assignee
- Priority
- Include/exclude archived issues
- Custom result limit

Example usage:
```json
{
  "query": "bug login",
  "status": "In Progress",
  "assignee": "me",
  "priority": 1,
  "limit": 5
}
```


## Examples

### Listing issues assigned to me
![Listing assigned issues](https://github.com/user-attachments/assets/11a41e9c-10ed-4cd4-a028-969708a9e389)

### Creating an issue
![Creating an issue](https://github.com/user-attachments/assets/d898e55e-17d2-4a51-82b8-2f291746ebd9)
![Created issue](https://github.com/user-attachments/assets/05761309-f3f4-4945-a7b0-15e98df9aa9d)

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

To use with Claude Desktop, add the server config.

### Automatic

```shell
npm run configure [--force] [--name=<server-name>]
```

### Manual

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "linear-context-server-ts": {
      "command": "node",
      "args": [
        "/<path-to-folder>/linear-context-server-ts/build/server.js"
      ],
      "env": {
        "LINEAR_API_KEY": <linear-api-key>
      }
    }
  }
}
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.
