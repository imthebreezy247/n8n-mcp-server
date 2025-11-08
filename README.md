# N8N MCP Server

Model Context Protocol (MCP) server for n8n workflow automation. This server allows AI assistants like Claude to create, manage, and execute n8n workflows programmatically.

## Features

- Create workflows with nodes and connections
- List all workflows
- Get workflow details
- Activate/deactivate workflows
- Execute workflows manually
- View execution history
- Update existing workflows
- Delete workflows

## Installation

```bash
npm install
npm run build
```

## Configuration

The server requires two environment variables:

- `N8N_URL` - Your n8n instance URL (e.g., `https://yourdomain.app.n8n.cloud`)
- `N8N_API_KEY` - Your n8n API key

### Getting Your N8N API Key

1. Log into your n8n instance
2. Go to Settings → API
3. Create a new API key
4. Copy the JWT token

## Usage

### Method 1: Direct Execution

Create a `.env` file:
```env
N8N_URL=https://cshannahan.app.n8n.cloud
N8N_API_KEY=your_api_key_here
```

Run the server:
```bash
node build/index.js
```

### Method 2: Claude Desktop Integration

Add to your Claude Desktop config file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "n8n": {
      "command": "node",
      "args": ["c:\\Coding-projects\\n8n-mcp-server\\build\\index.js"],
      "env": {
        "N8N_URL": "https://cshannahan.app.n8n.cloud",
        "N8N_API_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNjljMjhhYi1iNTI2LTQ3NTItYjk5My00ZWJlOGE0MDgyNzEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyNjM4ODIzLCJleHAiOjE3NzAzNTQwMDB9.HArBOezj-BCNPH1dHtM-At2TE5wAdLnDbV3gpnXmK3k"
      }
    }
  }
}
```

**Important:** Replace `your_api_key_here` with your actual n8n API key.

## Troubleshooting

### 401 Unauthorized Error

If you get `401 unauthorized` errors when using the MCP:

1. **Check API Key**: Ensure your API key is correct and hasn't expired
2. **Check Environment Variables**: Make sure `N8N_API_KEY` is set in the MCP configuration
3. **Test Connection**: Run the direct API test:
   ```bash
   node test-connection.js
   ```
4. **Check URL**: Ensure `N8N_URL` doesn't have a trailing slash

### Common Issues

- **Empty API Key**: If the environment variable isn't set, the server will use an empty string and fail authentication
- **Wrong URL Format**: The URL should be just the base URL without `/api/v1` (the server adds this automatically)
- **Expired API Key**: n8n API keys can expire - generate a new one if needed

## Available Tools

### create_workflow
Create a new n8n workflow with nodes and connections.

**Parameters:**
- `name` (string): Workflow name
- `nodes` (array): Array of node configurations
- `connections` (object): Node connections

### list_workflows
List all workflows in your n8n instance.

**Parameters:**
- `active` (boolean, optional): Filter by active status

### get_workflow
Get detailed information about a specific workflow.

**Parameters:**
- `workflow_id` (string): The workflow ID

### activate_workflow
Activate or deactivate a workflow.

**Parameters:**
- `workflow_id` (string): The workflow ID
- `active` (boolean): True to activate, false to deactivate

### execute_workflow
Manually trigger a workflow execution.

**Parameters:**
- `workflow_id` (string): The workflow ID
- `data` (object, optional): Input data for the workflow

### get_executions
Get execution history for workflows.

**Parameters:**
- `workflow_id` (string, optional): Filter by workflow ID
- `limit` (number): Number of executions to return (default: 10)

### update_workflow
Update an existing workflow's configuration.

**Parameters:**
- `workflow_id` (string): The workflow ID to update
- `name` (string, optional): New workflow name
- `nodes` (array, optional): Updated node configurations
- `connections` (object, optional): Updated connections

### delete_workflow
Delete a workflow permanently.

**Parameters:**
- `workflow_id` (string): The workflow ID to delete

## Example: Viral Movie Clips Automation

A complete workflow has been created at:
**Workflow ID:** UmlJ5iLjZrXdEMH6

**URL:** https://cshannahan.app.n8n.cloud/workflow/UmlJ5iLjZrXdEMH6

This workflow:
- Runs every 4 hours
- Fetches trending movies from Reddit and TMDB
- Calculates viral potential scores
- Generates clip ideas with hashtags
- Ranks content by priority (high/medium/low)

## Development

Edit `src/index.ts` and rebuild:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run dev
```

## License

MIT
