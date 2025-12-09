#!/usr/bin/env node
/**
 * Bridge script to connect Claude to n8n's HTTP-based MCP server
 * Converts stdio transport to HTTP transport
 */

import { createInterface } from 'readline';

const N8N_MCP_URL = 'https://cshannahan.app.n8n.cloud/mcp-server/http';
const N8N_MCP_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNjljMjhhYi1iNTI2LTQ3NTItYjk5My00ZWJlOGE0MDgyNzEiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjZmYmYyZTY4LTZlMTEtNDBkYi05ZWVjLWQ4YTQ2OWU1YWU3MCIsImlhdCI6MTc2NTI2NTkyNX0.SNbRlUvyj2xBr2C5oJkbt0sTdsHnYZToWFbhQs7ydxI';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

async function sendToN8n(message) {
  try {
    const response = await fetch(N8N_MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${N8N_MCP_TOKEN}`
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(JSON.stringify({
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32603,
          message: `HTTP ${response.status}: ${error}`
        }
      }));
      return;
    }

    const result = await response.json();
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(JSON.stringify({
      jsonrpc: '2.0',
      id: message.id,
      error: {
        code: -32603,
        message: error.message
      }
    }));
  }
}

rl.on('line', async (line) => {
  try {
    const message = JSON.parse(line);
    await sendToN8n(message);
  } catch (error) {
    console.error(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error'
      }
    }));
  }
});

process.stderr.write('n8n MCP bridge started\n');
