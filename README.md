# Daily Journal System

An automated daily journal system that integrates with Azure DevOps Model Context Protocol (MCP) to track work items, meetings, and personal productivity.

## 🎯 Features

- 📋 **Work Item Tracking**: Automatically pulls assigned Azure DevOps work items
- 🔗 **Interactive HTML**: Clickable links to Azure DevOps work items
- 📅 **Daily Entries**: Structured markdown and HTML journal entries
- 🎯 **Progress Tracking**: Categorizes work items by status (In Progress, New, Active)
- 📊 **Analytics**: Workload summaries and productivity insights
- 🔄 **Real-time Updates**: Refresh work items on demand
- 🎨 **Professional Styling**: Clean, responsive HTML design

## 🏗️ Architecture

### Core Components

- **`journal-generator.ts`** - Core journal creation logic with TypeScript classes
- **`mcp-journal-integrator.ts`** - Enhanced MCP integration orchestrating multiple data sources
- **`package.json`** - Project configuration with journal-specific npm scripts
- **`tsconfig.json`** - TypeScript configuration for ES modules

### Generated Files

- `journal-YYYY-MM-DD.md` - Daily journal entries in markdown format
- `journal-YYYY-MM-DD.html` - Interactive HTML versions with clickable work item links
- `dist/` - Compiled JavaScript files

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- TypeScript
- Azure DevOps MCP server configured

### Installation
```bash
# Clone the repository
git clone https://github.com/hrazi/journal.git
cd journal

# Install dependencies
npm install

# Build the project
npm run build
```

## 📖 Usage

### Generate Today's Journal
```bash
# Basic journal generation
npm run journal

# Enhanced journal with MCP integration
npm run journal:enhanced

# User-specific work items only
npm run journal:enhanced -- --user-only
```

### Development
```bash
# Build TypeScript files
npm run build

# Watch for changes
npm run build -- --watch
```

## 📁 Project Structure

```
journal/
├── journal-generator.ts      # Core journal creation logic
├── mcp-journal-integrator.ts # MCP integration system  
├── package.json             # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── dist/                   # Compiled JavaScript
├── journal-entries/        # Generated journal files
│   ├── journal-2025-10-01.md
│   └── journal-2025-10-01.html
└── README.md              # This file
```

## 🔧 Configuration

### Azure DevOps MCP Integration
The system integrates with Azure DevOps through MCP tools:
- `mcp_ado_search_workitem` - Search for work items
- `mcp_ado_wit_get_work_items_batch_by_ids` - Batch retrieve work items
- Filters by assignment and status automatically

### Work Item Categories
- **🔄 In Progress** - Currently active work items
- **📋 New & Active** - Recently assigned or high-priority items  
- **⚠️ Total Workload** - Complete assignment overview

## 🎨 HTML Features

The generated HTML includes:
- **Color-coded sections** for different work item states
- **Clickable work item links** that open Azure DevOps directly
- **Responsive design** that works on all devices  
- **Professional styling** with proper typography and spacing
- **Hover effects** and interactive elements

## 📊 Sample Output

### Work Item Summary
- **Total Active Workload**: 40 work items across SPOOL project
- **In Progress**: 8 items (immediate focus)
- **New/Active**: 32 items (planning & coordination)

### Key Focus Areas
- Government Cloud Compliance (GCCH/GCCM)
- Azure Communication Services (ACS) Platform Features
- Security Reviews & Documentation
- Customer Managed Keys & Privacy Features

## 🔗 Links

- **Azure DevOps Work Items**: Direct links to `https://dev.azure.com/skype/SPOOL/_workitems/edit/{ID}`
- **Interactive Navigation**: Click any work item number to jump to Azure DevOps
- **Cross-references**: Next Steps section includes linked work items

## 🤝 Contributing

This is a personal productivity system, but feel free to fork and adapt for your own Azure DevOps integration needs.

---
*Generated using Azure DevOps Model Context Protocol (MCP) integration*