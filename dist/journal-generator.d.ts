#!/usr/bin/env node
interface WorkItem {
    id: number;
    title: string;
    state: string;
    workItemType: string;
    tags?: string;
}
interface JournalEntry {
    date: string;
    dayOfWeek: string;
    workItems: {
        inProgress: WorkItem[];
        open: WorkItem[];
        pending: WorkItem[];
    };
    pullRequests: any[];
    meetings: any[];
    accomplishments: string[];
    challenges: string[];
    nextSteps: string[];
    mood: string;
    notes: string;
}
declare class DailyJournalGenerator {
    private journalDir;
    constructor();
    private ensureJournalDirExists;
    private formatDate;
    private getDayOfWeek;
    private categorizeWorkItems;
    generateTodaysEntry(workItems?: any[], pullRequests?: any[], meetings?: any[]): JournalEntry;
    saveEntry(entry: JournalEntry): string;
    private generateMarkdown;
    loadEntry(date: string): JournalEntry | null;
    listEntries(): string[];
}
export { DailyJournalGenerator, JournalEntry, WorkItem };
//# sourceMappingURL=journal-generator.d.ts.map