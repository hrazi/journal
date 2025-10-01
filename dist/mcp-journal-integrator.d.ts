#!/usr/bin/env node
interface MCPIntegrationConfig {
    adoProjects: string[];
    enableTeamsIntegration: boolean;
    enableNotionIntegration: boolean;
    enableStravaIntegration: boolean;
}
declare class MCPJournalIntegrator {
    private journalGenerator;
    private config;
    constructor(config?: MCPIntegrationConfig);
    /**
     * Fetch work items from Azure DevOps across multiple projects
     */
    private fetchADOWorkItems;
    /**
     * Fetch today's calendar events (mock implementation for Teams MCP)
     */
    private fetchCalendarEvents;
    /**
     * Fetch pull requests from ADO repos
     */
    private fetchPullRequests;
    /**
     * Generate comprehensive journal entry with all MCP integrations
     */
    generateComprehensiveJournal(): Promise<string>;
    /**
     * Enhance journal entry with contextual insights
     */
    private enhanceJournalEntry;
    /**
     * Calculate mood based on workload and meeting density
     */
    private calculateMood;
    /**
     * Get journal statistics and insights
     */
    getJournalInsights(): any;
    private calculateStreakDays;
}
export { MCPJournalIntegrator };
//# sourceMappingURL=mcp-journal-integrator.d.ts.map