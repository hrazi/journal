#!/usr/bin/env node
/**
 * Azure DevOps MCP Server
 *
 * This Model Context Protocol server provides integration with Azure DevOps services,
 * allowing AI assistants to interact with Azure DevOps projects, work items, repos, and builds.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as azdev from "azure-devops-node-api";
import dotenv from "dotenv";
// Load environment variables
dotenv.config();
class AzureDevOpsService {
    connection;
    config;
    constructor(config) {
        this.config = config;
        const authHandler = azdev.getPersonalAccessTokenHandler(config.token);
        this.connection = new azdev.WebApi(config.orgUrl, authHandler);
    }
    async getWorkItemTrackingApi() {
        return await this.connection.getWorkItemTrackingApi();
    }
    async getCoreApi() {
        return await this.connection.getCoreApi();
    }
    async getGitApi() {
        return await this.connection.getGitApi();
    }
    async getBuildApi() {
        return await this.connection.getBuildApi();
    }
}
// Initialize Azure DevOps service
const azureConfig = {
    orgUrl: process.env.AZURE_DEVOPS_ORG_URL || "",
    token: process.env.AZURE_DEVOPS_PAT || ""
};
if (!azureConfig.orgUrl || !azureConfig.token) {
    console.error("Error: Azure DevOps configuration missing. Please set AZURE_DEVOPS_ORG_URL and AZURE_DEVOPS_PAT environment variables.");
    process.exit(1);
}
const azureService = new AzureDevOpsService(azureConfig);
// Create MCP Server
const server = new McpServer({
    name: "azure-devops-mcp",
    version: "1.0.0",
    description: "Azure DevOps Model Context Protocol Server"
});
// Tool: List Azure DevOps Projects
server.registerTool("list-projects", {
    title: "List Azure DevOps Projects",
    description: "List all projects in the Azure DevOps organization",
    inputSchema: {}
}, async () => {
    try {
        const coreApi = await azureService.getCoreApi();
        const projects = await coreApi.getProjects();
        return {
            content: [
                {
                    type: "text",
                    text: `Found ${projects.length} projects:\n\n` +
                        projects.map(p => `• ${p.name} (${p.id})\n  Description: ${p.description || 'No description'}`).join('\n\n')
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error listing projects: ${error instanceof Error ? error.message : String(error)}`
                }
            ]
        };
    }
});
// Tool: Get Work Items
server.registerTool("get-work-items", {
    title: "Get Work Items",
    description: "Get work items from Azure DevOps using WIQL (Work Item Query Language)",
    inputSchema: {
        project: z.string().describe("Project name or ID"),
        wiql: z.string().optional().describe("WIQL query (optional, defaults to recent items)"),
        top: z.number().optional().describe("Maximum number of items to return (default: 50)")
    }
}, async ({ project, wiql, top = 50 }) => {
    try {
        const workItemApi = await azureService.getWorkItemTrackingApi();
        const defaultWiql = `SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo], [System.WorkItemType] FROM WorkItems WHERE [System.TeamProject] = '${project}' ORDER BY [System.ChangedDate] DESC`;
        const queryWiql = wiql || defaultWiql;
        const queryResult = await workItemApi.queryByWiql({ query: queryWiql }, project, undefined, undefined, top);
        if (!queryResult.workItems || queryResult.workItems.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: "No work items found matching the criteria."
                    }
                ]
            };
        }
        const workItemIds = queryResult.workItems.map(wi => wi.id);
        const workItems = await workItemApi.getWorkItems(workItemIds, undefined, undefined, undefined, undefined, project);
        return {
            content: [
                {
                    type: "text",
                    text: `Found ${workItems.length} work items:\n\n` +
                        workItems.map(wi => {
                            const fields = wi.fields;
                            return `• #${wi.id} - ${fields['System.Title']}\n` +
                                `  Type: ${fields['System.WorkItemType']}\n` +
                                `  State: ${fields['System.State']}\n` +
                                `  Assigned To: ${fields['System.AssignedTo']?.displayName || 'Unassigned'}\n` +
                                `  URL: ${wi._links?.html?.href || 'N/A'}`;
                        }).join('\n\n')
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error getting work items: ${error instanceof Error ? error.message : String(error)}`
                }
            ]
        };
    }
});
// Tool: Create Work Item
server.registerTool("create-work-item", {
    title: "Create Work Item",
    description: "Create a new work item in Azure DevOps",
    inputSchema: {
        project: z.string().describe("Project name or ID"),
        workItemType: z.string().describe("Type of work item (e.g., 'Bug', 'Task', 'User Story')"),
        title: z.string().describe("Title of the work item"),
        description: z.string().optional().describe("Description of the work item"),
        assignedTo: z.string().optional().describe("Email or display name of the assignee"),
        priority: z.number().optional().describe("Priority (1-4, where 1 is highest)"),
        severity: z.string().optional().describe("Severity for bugs (1-Critical, 2-High, 3-Medium, 4-Low)")
    }
}, async ({ project, workItemType, title, description, assignedTo, priority, severity }) => {
    try {
        const workItemApi = await azureService.getWorkItemTrackingApi();
        const patchDocument = [
            {
                op: "add",
                path: "/fields/System.Title",
                value: title
            }
        ];
        if (description) {
            patchDocument.push({
                op: "add",
                path: "/fields/System.Description",
                value: description
            });
        }
        if (assignedTo) {
            patchDocument.push({
                op: "add",
                path: "/fields/System.AssignedTo",
                value: assignedTo
            });
        }
        if (priority) {
            patchDocument.push({
                op: "add",
                path: "/fields/Microsoft.VSTS.Common.Priority",
                value: priority
            });
        }
        if (severity && workItemType.toLowerCase() === 'bug') {
            patchDocument.push({
                op: "add",
                path: "/fields/Microsoft.VSTS.Common.Severity",
                value: severity
            });
        }
        const workItem = await workItemApi.createWorkItem(undefined, patchDocument, project, workItemType);
        return {
            content: [
                {
                    type: "text",
                    text: `Successfully created ${workItemType} #${workItem.id}: "${workItem.fields['System.Title']}"\n` +
                        `URL: ${workItem._links?.html?.href || 'N/A'}`
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error creating work item: ${error instanceof Error ? error.message : String(error)}`
                }
            ]
        };
    }
});
// Tool: Get Repositories
server.registerTool("get-repositories", {
    title: "Get Repositories",
    description: "List repositories in a project",
    inputSchema: {
        project: z.string().describe("Project name or ID")
    }
}, async ({ project }) => {
    try {
        const gitApi = await azureService.getGitApi();
        const repos = await gitApi.getRepositories(project);
        return {
            content: [
                {
                    type: "text",
                    text: `Found ${repos.length} repositories in project "${project}":\n\n` +
                        repos.map(repo => `• ${repo.name}\n` +
                            `  ID: ${repo.id}\n` +
                            `  Default Branch: ${repo.defaultBranch}\n` +
                            `  URL: ${repo.webUrl || 'N/A'}`).join('\n\n')
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error getting repositories: ${error instanceof Error ? error.message : String(error)}`
                }
            ]
        };
    }
});
// Tool: Get Recent Builds
server.registerTool("get-builds", {
    title: "Get Recent Builds",
    description: "Get recent builds for a project",
    inputSchema: {
        project: z.string().describe("Project name or ID"),
        top: z.number().optional().describe("Maximum number of builds to return (default: 10)")
    }
}, async ({ project, top = 10 }) => {
    try {
        const buildApi = await azureService.getBuildApi();
        const builds = await buildApi.getBuilds(project, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, top);
        return {
            content: [
                {
                    type: "text",
                    text: `Found ${builds.length} recent builds in project "${project}":\n\n` +
                        builds.map(build => `• Build #${build.buildNumber} (${build.definition?.name})\n` +
                            `  Status: ${build.status}\n` +
                            `  Result: ${build.result || 'In Progress'}\n` +
                            `  Started: ${build.startTime}\n` +
                            `  URL: ${build._links?.web?.href || 'N/A'}`).join('\n\n')
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error getting builds: ${error instanceof Error ? error.message : String(error)}`
                }
            ]
        };
    }
});
// Resource: Azure DevOps Documentation
server.registerResource("azure-devops-help", "azure-devops://help", {
    title: "Azure DevOps MCP Server Help",
    description: "Documentation and usage guide for the Azure DevOps MCP server",
    mimeType: "text/markdown"
}, async () => ({
    contents: [{
            uri: "azure-devops://help",
            text: `# Azure DevOps MCP Server

This MCP server provides integration with Azure DevOps services.

## Configuration

Set the following environment variables:
- \`AZURE_DEVOPS_ORG_URL\`: Your Azure DevOps organization URL (e.g., https://dev.azure.com/yourorg)
- \`AZURE_DEVOPS_PAT\`: Personal Access Token with appropriate permissions

## Available Tools

### list-projects
List all projects in your Azure DevOps organization.

### get-work-items
Get work items from a project using WIQL queries.
- **project**: Project name or ID
- **wiql**: Optional WIQL query (defaults to recent items)
- **top**: Maximum number of items (default: 50)

### create-work-item
Create a new work item.
- **project**: Project name or ID
- **workItemType**: Type (Bug, Task, User Story, etc.)
- **title**: Work item title
- **description**: Optional description
- **assignedTo**: Optional assignee email/name
- **priority**: Optional priority (1-4)
- **severity**: Optional severity for bugs

### get-repositories
List Git repositories in a project.
- **project**: Project name or ID

### get-builds
Get recent builds for a project.
- **project**: Project name or ID
- **top**: Maximum number of builds (default: 10)

## Usage Examples

1. List projects: Use the \`list-projects\` tool
2. Get recent work items: Use \`get-work-items\` with just a project name
3. Create a bug: Use \`create-work-item\` with workItemType="Bug"
4. Search work items: Use \`get-work-items\` with custom WIQL query
`
        }]
}));
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Azure DevOps MCP Server running on stdio");
    console.error(`Organization URL: ${azureConfig.orgUrl}`);
}
main().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map