#!/usr/bin/env node
import { DailyJournalGenerator } from './journal-generator.js';
class MCPJournalIntegrator {
    journalGenerator;
    config;
    constructor(config = {
        adoProjects: ['SCC', 'SPOOL'],
        enableTeamsIntegration: true,
        enableNotionIntegration: false,
        enableStravaIntegration: false
    }) {
        this.journalGenerator = new DailyJournalGenerator();
        this.config = config;
    }
    /**
     * Fetch work items from Azure DevOps across multiple projects
     */
    async fetchADOWorkItems() {
        try {
            // In a real implementation, these would be actual MCP calls
            // For now, using the sample data we already have
            const workItems = [
                {
                    id: 2523677,
                    fields: {
                        'System.Title': '[ACS][EUDB] Workstream 1: Comply with EU Data Boundary requirements for EUII/CC processing and storage only within EUDB by 06/30/22',
                        'System.State': 'In Progress',
                        'System.WorkItemType': 'Feature',
                        'System.Tags': 'Consumer:IC3-ACS; CY21H2; CY22H2; dcrreview; EUDB; EUDB-IC3; IC3-ACS; IC3-EUDB-W1; IC3Horizontal; IC3horizontalapproved; Producer:IC3-ACS; Semester:Cu; Spool2HCY2023-Dependencies',
                        'System.ChangedDate': new Date().toISOString()
                    }
                },
                {
                    id: 2572902,
                    fields: {
                        'System.Title': '[ACS] Data tagging for SMBA and ACS auth (identified during bot implementation)',
                        'System.State': 'Pending',
                        'System.WorkItemType': 'Exception',
                        'System.Tags': 'IC3 ACS',
                        'System.ChangedDate': new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
                    }
                }
            ];
            console.log(`📊 Fetched ${workItems.length} work items from Azure DevOps`);
            return workItems;
        }
        catch (error) {
            console.error('❌ Error fetching ADO work items:', error);
            return [];
        }
    }
    /**
     * Fetch today's calendar events (mock implementation for Teams MCP)
     */
    async fetchCalendarEvents() {
        try {
            // Mock calendar events - in reality, this would call the Teams/Calendar MCP
            const mockEvents = [
                {
                    title: 'Daily Standup - ACS Team',
                    startTime: '09:00 AM',
                    endTime: '09:30 AM',
                    attendees: 5,
                    type: 'meeting'
                },
                {
                    title: 'EUDB Architecture Review',
                    startTime: '2:00 PM',
                    endTime: '3:00 PM',
                    attendees: 12,
                    type: 'review'
                },
                {
                    title: 'Focus Time - Code Review',
                    startTime: '10:00 AM',
                    endTime: '11:30 AM',
                    attendees: 1,
                    type: 'focus'
                }
            ];
            console.log(`📅 Fetched ${mockEvents.length} calendar events`);
            return mockEvents;
        }
        catch (error) {
            console.error('❌ Error fetching calendar events:', error);
            return [];
        }
    }
    /**
     * Fetch pull requests from ADO repos
     */
    async fetchPullRequests() {
        try {
            // Mock PR data - would be real MCP calls
            const mockPRs = [
                {
                    id: 12345,
                    title: 'Fix EUDB compliance validation logic',
                    status: 'Active',
                    reviewers: ['john.doe', 'jane.smith'],
                    createdDate: new Date().toISOString(),
                    repository: 'acs-backend'
                }
            ];
            console.log(`🔀 Fetched ${mockPRs.length} pull requests`);
            return mockPRs;
        }
        catch (error) {
            console.error('❌ Error fetching pull requests:', error);
            return [];
        }
    }
    /**
     * Generate comprehensive journal entry with all MCP integrations
     */
    async generateComprehensiveJournal() {
        console.log('🚀 Starting comprehensive journal generation...');
        // Fetch data from all integrated MCPs
        const [workItems, meetings, pullRequests] = await Promise.all([
            this.fetchADOWorkItems(),
            this.fetchCalendarEvents(),
            this.fetchPullRequests()
        ]);
        // Generate base journal entry
        const journalEntry = this.journalGenerator.generateTodaysEntry(workItems, pullRequests, meetings);
        // Enhance with additional insights
        const enhancedEntry = this.enhanceJournalEntry(journalEntry, { workItems, meetings, pullRequests });
        // Save the enhanced journal
        const filepath = this.journalGenerator.saveEntry(enhancedEntry);
        console.log('✅ Comprehensive journal generated successfully!');
        return filepath;
    }
    /**
     * Enhance journal entry with contextual insights
     */
    enhanceJournalEntry(entry, data) {
        const { workItems, meetings, pullRequests } = data;
        // Add contextual accomplishments
        const contextualAccomplishments = [];
        if (meetings.find((m) => m.type === 'review')) {
            contextualAccomplishments.push('Participated in architecture review meeting');
        }
        if (pullRequests.length > 0) {
            contextualAccomplishments.push(`Created/reviewed ${pullRequests.length} pull request(s)`);
        }
        // Add enhanced next steps based on work item priorities
        const prioritizedNextSteps = [
            ...entry.nextSteps,
            'Review pending EUDB compliance requirements',
            'Follow up on architecture review feedback'
        ];
        // Calculate productivity insights
        const totalWorkItems = workItems.length;
        const activeItems = workItems.filter((item) => item.fields['System.State'] === 'In Progress' || item.fields['System.State'] === 'Active').length;
        const productivityNote = `Productivity Overview: ${activeItems}/${totalWorkItems} work items active, ${meetings.length} meetings scheduled`;
        return {
            ...entry,
            accomplishments: [...entry.accomplishments, ...contextualAccomplishments],
            nextSteps: prioritizedNextSteps,
            notes: `${productivityNote}\\n\\n${entry.notes}`,
            mood: this.calculateMood(workItems, meetings)
        };
    }
    /**
     * Calculate mood based on workload and meeting density
     */
    calculateMood(workItems, meetings) {
        const workloadScore = workItems.length;
        const meetingLoad = meetings.length;
        if (workloadScore < 3 && meetingLoad < 4)
            return 'relaxed';
        if (workloadScore < 5 && meetingLoad < 6)
            return 'productive';
        if (workloadScore < 8)
            return 'busy';
        return 'overwhelmed';
    }
    /**
     * Get journal statistics and insights
     */
    getJournalInsights() {
        const entries = this.journalGenerator.listEntries();
        return {
            totalEntries: entries.length,
            recentEntries: entries.slice(0, 7), // Last 7 days
            streakDays: this.calculateStreakDays(entries),
            weeklyStats: {
                avgWorkItems: 0, // Could calculate from entries
                avgMeetings: 0,
                commonMood: 'productive'
            }
        };
    }
    calculateStreakDays(entries) {
        if (entries.length === 0)
            return 0;
        const today = new Date();
        let streak = 0;
        for (let i = 0; i < entries.length; i++) {
            const entryDate = new Date(entries[i]);
            const dayDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
            if (dayDiff === i) {
                streak++;
            }
            else {
                break;
            }
        }
        return streak;
    }
}
// CLI execution
const integrator = new MCPJournalIntegrator();
console.log('🗓️  Generating comprehensive daily journal with MCP integrations...');
integrator.generateComprehensiveJournal()
    .then((filepath) => {
    console.log(`\\n✅ Enhanced journal entry saved to: ${filepath}`);
    const insights = integrator.getJournalInsights();
    console.log(`\\n📈 Journal Insights:`);
    console.log(`   📊 Total entries: ${insights.totalEntries}`);
    console.log(`   🔥 Current streak: ${insights.streakDays} days`);
    console.log(`   📅 Recent entries: ${insights.recentEntries.join(', ')}`);
})
    .catch((error) => {
    console.error('❌ Error generating journal:', error);
});
export { MCPJournalIntegrator };
//# sourceMappingURL=mcp-journal-integrator.js.map