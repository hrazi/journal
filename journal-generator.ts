#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

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

class DailyJournalGenerator {
  private journalDir: string;

  constructor() {
    this.journalDir = path.join(process.cwd(), 'journal-entries');
    this.ensureJournalDirExists();
  }

  private ensureJournalDirExists(): void {
    if (!fs.existsSync(this.journalDir)) {
      fs.mkdirSync(this.journalDir, { recursive: true });
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private getDayOfWeek(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  private categorizeWorkItems(workItems: any[]): { inProgress: WorkItem[], open: WorkItem[], pending: WorkItem[] } {
    const categorized = {
      inProgress: [] as WorkItem[],
      open: [] as WorkItem[],
      pending: [] as WorkItem[]
    };

    workItems.forEach(item => {
      const workItem: WorkItem = {
        id: item.id,
        title: item.fields['System.Title'],
        state: item.fields['System.State'],
        workItemType: item.fields['System.WorkItemType'],
        tags: item.fields['System.Tags']
      };

      switch (item.fields['System.State'].toLowerCase()) {
        case 'in progress':
        case 'active':
          categorized.inProgress.push(workItem);
          break;
        case 'pending':
          categorized.pending.push(workItem);
          break;
        case 'open':
        case 'new':
          categorized.open.push(workItem);
          break;
      }
    });

    return categorized;
  }

  public generateTodaysEntry(workItems: any[] = [], pullRequests: any[] = [], meetings: any[] = []): JournalEntry {
    const today = new Date();
    const workItemCategories = this.categorizeWorkItems(workItems);

    const entry: JournalEntry = {
      date: this.formatDate(today),
      dayOfWeek: this.getDayOfWeek(today),
      workItems: workItemCategories,
      pullRequests,
      meetings,
      accomplishments: [
        // Pre-populate with work item progress
        ...workItemCategories.inProgress.map(item => 
          `Continued work on ${item.workItemType}: ${item.title} (ID: ${item.id})`
        )
      ],
      challenges: [],
      nextSteps: [
        // Pre-populate with open work items
        ...workItemCategories.open.map(item => 
          `Start/continue ${item.workItemType}: ${item.title} (ID: ${item.id})`
        )
      ],
      mood: "productive", // Default mood
      notes: ""
    };

    return entry;
  }

  public saveEntry(entry: JournalEntry): string {
    const filename = `journal-${entry.date}.md`;
    const filepath = path.join(this.journalDir, filename);
    
    const markdown = this.generateMarkdown(entry);
    fs.writeFileSync(filepath, markdown, 'utf8');
    
    return filepath;
  }

  private generateMarkdown(entry: JournalEntry): string {
    const markdown = `# Daily Journal - ${entry.date} (${entry.dayOfWeek})

## 📋 Work Items Status

### 🔄 In Progress
${entry.workItems.inProgress.length === 0 ? '_No items in progress_' : 
  entry.workItems.inProgress.map(item => 
    `- **${item.workItemType} #${item.id}**: ${item.title}${item.tags ? `\\n  _Tags: ${item.tags}_` : ''}`
  ).join('\\n')
}

### 📂 Open Items
${entry.workItems.open.length === 0 ? '_No open items_' : 
  entry.workItems.open.map(item => 
    `- **${item.workItemType} #${item.id}**: ${item.title}${item.tags ? `\\n  _Tags: ${item.tags}_` : ''}`
  ).join('\\n')
}

### ⏸️ Pending Items
${entry.workItems.pending.length === 0 ? '_No pending items_' : 
  entry.workItems.pending.map(item => 
    `- **${item.workItemType} #${item.id}**: ${item.title}${item.tags ? `\\n  _Tags: ${item.tags}_` : ''}`
  ).join('\\n')
}

## 🔀 Pull Requests
${entry.pullRequests.length === 0 ? '_No active pull requests_' : 
  entry.pullRequests.map(pr => `- **PR #${pr.id}**: ${pr.title} - ${pr.status}`).join('\\n')
}

## 📅 Meetings & Events
${entry.meetings.length === 0 ? '_No meetings tracked_' : 
  entry.meetings.map(meeting => `- ${meeting.time}: ${meeting.title}`).join('\\n')
}

## ✅ Accomplishments
${entry.accomplishments.length === 0 ? '_Add your accomplishments here_' : 
  entry.accomplishments.map(item => `- ${item}`).join('\\n')
}

## 🚧 Challenges
${entry.challenges.length === 0 ? '_Add any challenges you faced_' : 
  entry.challenges.map(item => `- ${item}`).join('\\n')
}

## 🎯 Next Steps
${entry.nextSteps.length === 0 ? '_Add your planned next steps_' : 
  entry.nextSteps.map(item => `- ${item}`).join('\\n')
}

## 😊 Mood: ${entry.mood}

## 📝 Notes
${entry.notes || '_Add any additional notes or thoughts here_'}

---
_Generated on ${new Date().toISOString()}_
`;

    return markdown;
  }

  public loadEntry(date: string): JournalEntry | null {
    const filename = `journal-${date}.md`;
    const filepath = path.join(this.journalDir, filename);
    
    if (!fs.existsSync(filepath)) {
      return null;
    }
    
    // For now, just return a basic structure - could parse markdown in the future
    const content = fs.readFileSync(filepath, 'utf8');
    return {
      date,
      dayOfWeek: this.getDayOfWeek(new Date(date)),
      workItems: { inProgress: [], open: [], pending: [] },
      pullRequests: [],
      meetings: [],
      accomplishments: [],
      challenges: [],
      nextSteps: [],
      mood: "unknown",
      notes: content
    };
  }

  public listEntries(): string[] {
    const files = fs.readdirSync(this.journalDir)
      .filter(file => file.startsWith('journal-') && file.endsWith('.md'))
      .map(file => file.replace('journal-', '').replace('.md', ''))
      .sort()
      .reverse(); // Most recent first
    
    return files;
  }
}

// Always generate journal when this file is run
const generator = new DailyJournalGenerator();

// Sample work items from our ADO query
const workItems = [
  {
    id: 2523677,
    fields: {
      'System.Title': '[ACS][EUDB] Workstream 1: Comply with EU Data Boundary requirements for EUII/CC processing and storage only within EUDB by 06/30/22',
      'System.State': 'In Progress',
      'System.WorkItemType': 'Feature',
      'System.Tags': 'Consumer:IC3-ACS; CY21H2; CY22H2; dcrreview; EUDB; EUDB-IC3; IC3-ACS; IC3-EUDB-W1; IC3Horizontal; IC3horizontalapproved; Producer:IC3-ACS; Semester:Cu; Spool2HCY2023-Dependencies'
    }
  },
  {
    id: 2572902,
    fields: {
      'System.Title': '[ACS] Data tagging for SMBA and ACS auth (identified during bot implementation)',
      'System.State': 'Pending',
      'System.WorkItemType': 'Exception',
      'System.Tags': 'IC3 ACS'
    }
  },
  {
    id: 2627349,
    fields: {
      'System.Title': '[ACS][EUDB] Workstream 2: Re-design & provision EUPI pipelines/storage by 6/30/22 to route processing and storage of EUPI in the EU by 12/31/22',
      'System.State': 'Open',
      'System.WorkItemType': 'Feature',
      'System.Tags': 'Consumer:IC3-ACS; CY22H2; IC3Horizontal; IC3horizontalapproved; PartnerAsk; Producer:IC3-ACS; Semester:Cu; Spool2HCY2023-Dependencies'
    }
  },
  {
    id: 2627393,
    fields: {
      'System.Title': '[ACS][EUDB] Workstream 3: For EUDB tenants, Process and Store Support data in EU by Dec 31, 2022',
      'System.State': 'Open',
      'System.WorkItemType': 'Feature',
      'System.Tags': 'IC3Horizontal; PartnerAsk; Producer:IC3-ACS; Semester:Cu; Semester:Ni'
    }
  }
];

console.log('🗓️  Generating daily journal entry...');

const todaysEntry = generator.generateTodaysEntry(workItems, [], []);
const filepath = generator.saveEntry(todaysEntry);

console.log(`✅ Journal entry saved to: ${filepath}`);
console.log(`📁 All entries: ${generator.listEntries().length} total entries`);
console.log(`📝 Recent entries: ${generator.listEntries().slice(0, 5).join(', ')}`);

// Check if entry was created and show preview
try {
  const content = generator.loadEntry(todaysEntry.date);
  if (content) {
    console.log('\\n📖 Preview of today\'s journal entry:');
    console.log('=====================================');
    console.log(content.notes.substring(0, 500) + '...');
  }
} catch (error) {
  console.log('📝 Journal entry created but preview unavailable');
}

export { DailyJournalGenerator, JournalEntry, WorkItem };