#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { randomUUID } from "crypto";

const N8N_URL = process.env.N8N_URL || "https://cshannahan.app.n8n.cloud";
const N8N_API_KEY = process.env.N8N_API_KEY || "";

const api = axios.create({
  baseURL: `${N8N_URL}/api/v1`,
  headers: {
    "X-N8N-API-KEY": N8N_API_KEY,
    "Content-Type": "application/json",
  },
});

const server = new Server(
  {
    name: "n8n-automation-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_workflow",
        description: "Create a new N8N workflow from a structured definition. Accepts workflow name, trigger type, and node configurations.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the workflow",
            },
            nodes: {
              type: "array",
              description: "Array of node configurations",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    description: "Node type (e.g., 'n8n-nodes-base.emailTrigger', 'n8n-nodes-base.httpRequest')",
                  },
                  name: {
                    type: "string",
                    description: "Display name for the node",
                  },
                  parameters: {
                    type: "object",
                    description: "Node-specific parameters",
                  },
                  position: {
                    type: "array",
                    description: "X,Y coordinates [x, y]",
                    items: { type: "number" },
                  },
                },
                required: ["type", "name", "parameters"],
              },
            },
            connections: {
              type: "object",
              description: "Connections between nodes",
            },
          },
          required: ["name", "nodes"],
        },
      },
      {
        name: "list_workflows",
        description: "List all workflows in N8N. Returns workflow IDs, names, active status, and tags.",
        inputSchema: {
          type: "object",
          properties: {
            active: {
              type: "boolean",
              description: "Filter by active status (optional)",
            },
          },
        },
      },
      {
        name: "get_workflow",
        description: "Get detailed information about a specific workflow including all nodes and connections.",
        inputSchema: {
          type: "object",
          properties: {
            workflow_id: {
              type: "string",
              description: "The workflow ID",
            },
          },
          required: ["workflow_id"],
        },
      },
      {
        name: "activate_workflow",
        description: "Activate or deactivate a workflow",
        inputSchema: {
          type: "object",
          properties: {
            workflow_id: {
              type: "string",
              description: "The workflow ID",
            },
            active: {
              type: "boolean",
              description: "True to activate, false to deactivate",
            },
          },
          required: ["workflow_id", "active"],
        },
      },
      {
        name: "delete_workflow",
        description: "Delete a workflow permanently",
        inputSchema: {
          type: "object",
          properties: {
            workflow_id: {
              type: "string",
              description: "The workflow ID to delete",
            },
          },
          required: ["workflow_id"],
        },
      },
      {
        name: "execute_workflow",
        description: "Manually trigger a workflow execution with optional input data",
        inputSchema: {
          type: "object",
          properties: {
            workflow_id: {
              type: "string",
              description: "The workflow ID",
            },
            data: {
              type: "object",
              description: "Optional input data for the workflow",
            },
          },
          required: ["workflow_id"],
        },
      },
      {
        name: "get_executions",
        description: "Get execution history for a workflow",
        inputSchema: {
          type: "object",
          properties: {
            workflow_id: {
              type: "string",
              description: "The workflow ID (optional - omit for all workflows)",
            },
            limit: {
              type: "number",
              description: "Number of executions to return (default 10)",
            },
          },
        },
      },
      {
        name: "update_workflow",
        description: "Update an existing workflow's nodes, connections, or settings",
        inputSchema: {
          type: "object",
          properties: {
            workflow_id: {
              type: "string",
              description: "The workflow ID to update",
            },
            name: {
              type: "string",
              description: "New workflow name (optional)",
            },
            nodes: {
              type: "array",
              description: "Updated node configurations (optional)",
            },
            connections: {
              type: "object",
              description: "Updated connections (optional)",
            },
          },
          required: ["workflow_id"],
        },
      },
    ],
  };
});

// Tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "create_workflow": {
        const { name, nodes, connections } = request.params.arguments as any;
        
        const workflow = {
          name,
          nodes: nodes.map((node: any) => ({
            id: randomUUID(),
            name: node.name,
            type: node.type,
            typeVersion: node.typeVersion || 1,
            position: node.position || [250, 300],
            parameters: node.parameters || {},
          })),
          connections: connections || {},
          settings: {
            executionOrder: "v1"
          },
          staticData: null,
        };

        const response = await api.post("/workflows", workflow);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                workflow_id: response.data.id,
                name: response.data.name,
                message: "Workflow created successfully",
              }, null, 2),
            },
          ],
        };
      }

      case "list_workflows": {
        const { active } = (request.params.arguments as any) || {};
        const response = await api.get("/workflows");
        
        let workflows = response.data.data || response.data;
        
        if (active !== undefined) {
          workflows = workflows.filter((w: any) => w.active === active);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(workflows.map((w: any) => ({
                id: w.id,
                name: w.name,
                active: w.active,
                tags: w.tags,
                createdAt: w.createdAt,
                updatedAt: w.updatedAt,
              })), null, 2),
            },
          ],
        };
      }

      case "get_workflow": {
        const { workflow_id } = request.params.arguments as any;
        const response = await api.get(`/workflows/${workflow_id}`);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case "activate_workflow": {
        const { workflow_id, active } = request.params.arguments as any;
        const response = await api.patch(`/workflows/${workflow_id}`, { active });
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                workflow_id: response.data.id,
                active: response.data.active,
                message: `Workflow ${active ? 'activated' : 'deactivated'} successfully`,
              }, null, 2),
            },
          ],
        };
      }

      case "delete_workflow": {
        const { workflow_id } = request.params.arguments as any;
        await api.delete(`/workflows/${workflow_id}`);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                workflow_id,
                message: "Workflow deleted successfully",
              }, null, 2),
            },
          ],
        };
      }

      case "execute_workflow": {
        const { workflow_id, data } = request.params.arguments as any;
        const response = await api.post(`/workflows/${workflow_id}/execute`, data || {});
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                execution_id: response.data.id,
                status: response.data.status,
                message: "Workflow executed successfully",
              }, null, 2),
            },
          ],
        };
      }

      case "get_executions": {
        const { workflow_id, limit } = (request.params.arguments as any) || {};
        const params: any = { limit: limit || 10 };
        
        if (workflow_id) {
          params.workflowId = workflow_id;
        }
        
        const response = await api.get("/executions", { params });
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data.data || response.data, null, 2),
            },
          ],
        };
      }

      case "update_workflow": {
        const { workflow_id, name, nodes, connections } = request.params.arguments as any;
        
        // First, get the existing workflow
        const existing = await api.get(`/workflows/${workflow_id}`);
        
        // Merge updates with existing data
        const workflow = {
          ...existing.data,
          name: name || existing.data.name,
          nodes: nodes || existing.data.nodes,
          connections: connections || existing.data.connections,
        };
        
        // Use PUT to update the entire workflow
        const response = await api.put(`/workflows/${workflow_id}`, workflow);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                workflow_id: response.data.id,
                message: "Workflow updated successfully",
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: true,
            message: error.message,
            details: error.response?.data || error,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("N8N MCP Server running on stdio");
}

runServer();