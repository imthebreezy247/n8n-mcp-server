import axios from "axios";

const N8N_URL = "https://cshannahan.app.n8n.cloud";
const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNjljMjhhYi1iNTI2LTQ3NTItYjk5My00ZWJlOGE0MDgyNzEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyNjM4ODIzLCJleHAiOjE3NzAzNTQwMDB9.HArBOezj-BCNPH1dHtM-At2TE5wAdLnDbV3gpnXmK3k";

console.log("Testing n8n API connection with updated API key...\n");

const api = axios.create({
  baseURL: `${N8N_URL}/api/v1`,
  headers: {
    "X-N8N-API-KEY": N8N_API_KEY,
    "Content-Type": "application/json",
  },
});

try {
  // Test 1: List workflows
  console.log("Test 1: Listing workflows...");
  const response = await api.get("/workflows");
  console.log("✓ Connection successful!");
  console.log(`  Found ${response.data.data?.length || response.data.length || 0} workflows\n`);

  // Test 2: Get the movie clips workflow we just created
  console.log("Test 2: Getting Viral Movie Clips Automation workflow...");
  const workflowResponse = await api.get("/workflows/UmlJ5iLjZrXdEMH6");
  console.log("✓ Workflow retrieved successfully!");
  console.log(`  Name: ${workflowResponse.data.name}`);
  console.log(`  Active: ${workflowResponse.data.active}`);
  console.log(`  Nodes: ${workflowResponse.data.nodes.length}\n`);

  console.log("✓ All API tests passed!");
  console.log("\n🎉 Your n8n MCP configuration is correct!\n");
  console.log("The issue may be with how Claude Desktop loads the MCP server.");
  console.log("Try restarting Claude Desktop to reload the MCP configuration.\n");

} catch (error) {
  console.error("✗ API test failed!");
  console.error("Error:", error.message);
  if (error.response) {
    console.error("Status:", error.response.status);
    console.error("Response:", JSON.stringify(error.response.data, null, 2));
  }

  if (error.response?.status === 401) {
    console.error("\n⚠️  401 Unauthorized Error");
    console.error("This means the API key is invalid or expired.");
    console.error("Please generate a new API key from your n8n instance:\n");
    console.error("1. Go to https://cshannahan.app.n8n.cloud/settings/api");
    console.error("2. Create a new API key");
    console.error("3. Update the N8N_API_KEY in:");
    console.error("   - .env file");
    console.error("   - Claude Desktop config");
  }

  process.exit(1);
}
