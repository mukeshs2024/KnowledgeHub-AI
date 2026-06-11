/**
 * QUICK START GUIDE - AGENTIC AI SYSTEM
 * 
 * For developers getting started with the KnowledgeHub AI system
 */

export const QUICK_START_GUIDE = `
# Quick Start Guide - KnowledgeHub AI Agentic System

## For Frontend Developers

### 1. Using the System in React Components

\`\`\`jsx
import { agenticAISystem } from './lib/agenticAISystem.js';

// In your component:
const [response, setResponse] = useState(null);

// Query the system
const handleQuery = async (userQuery) => {
  const result = await agenticAISystem.query(userQuery);
  setResponse(result);
};

// Response structure:
// {
//   answer: string,
//   agentUsed: string,
//   confidence: number,
//   sources: array,
//   workflow: array,
//   metadata: { timestamp, usedGemini, ... }
// }
\`\`\`

### 2. Initialize System on Dataset Upload

\`\`\`jsx
import { agenticAISystem } from './lib/agenticAISystem.js';

const handleUpload = async (file) => {
  const fileContent = await file.text();
  const fileType = file.name.split('.').pop().toUpperCase();
  
  await agenticAISystem.processDataset(fileContent, file.name, fileType);
  // System is now ready for queries!
};
\`\`\`

### 3. Get Dashboard Data

\`\`\`jsx
import { agenticAISystem } from './lib/agenticAISystem.js';

// Get summary for dashboard
const summary = agenticAISystem.getDashboardSummary();

// Summary includes:
// - datasetSummary (teams, members, projects, etc.)
// - aiInsights (most active team, most used tech, etc.)
// - executiveSummary (AI-generated summary)
// - systemStatus
\`\`\`

### 4. Check System Status

\`\`\`jsx
const status = agenticAISystem.getStatus();

// Returns:
// {
//   status: 'READY' | 'PROCESSING' | 'ERROR',
//   isReady: boolean,
//   components: { datasetProcessor, knowledgeGenerator, ... },
//   data: { documentsGenerated, graphNodes, graphEdges }
// }
\`\`\`

### 5. Reset System (Clear Dataset)

\`\`\`jsx
agenticAISystem.reset();
// System ready for new dataset
\`\`\`

## For API / Backend Developers

### 1. Import the API Module

\`\`\`javascript
import AgenticAIAPI from './lib/agenticAIAPI.js';

// All methods are static, no need to instantiate
\`\`\`

### 2. Available API Methods

\`\`\`javascript
// Query - Main endpoint
const response = await AgenticAIAPI.query('Your question here');

// Upload dataset
const result = await AgenticAIAPI.uploadDataset(fileContent, fileName, fileType);

// Get summaries
const summary = AgenticAIAPI.getDashboardSummary();
const status = AgenticAIAPI.getSystemStatus();

// Specific analyses
const teamAnalysis = await AgenticAIAPI.analyzeTeam('T001');
const memberAnalysis = await AgenticAIAPI.analyzeMember('M001');
const projectAnalysis = await AgenticAIAPI.analyzeProject('Project Name');
const techAnalysis = await AgenticAIAPI.analyzeTechnology('React');
const domainAnalysis = await AgenticAIAPI.analyzeDomain('Healthcare');

// Get all entities
const teams = AgenticAIAPI.getTeams();
const members = AgenticAIAPI.getMembers();
const projects = AgenticAIAPI.getProjects();

// Graph analytics
const topNodes = AgenticAIAPI.getInfluentialNodes(10);
const stats = AgenticAIAPI.getGraphStatistics();

// Search
const searchResults = AgenticAIAPI.search('query text', { topK: 5 });

// Reset
AgenticAIAPI.reset();
\`\`\`

## Common Query Patterns

### Pattern 1: Team Analysis
\`\`\`javascript
const response = await agenticAISystem.query('Analyze team T001');
// Returns: Team structure, members, projects, technologies
\`\`\`

### Pattern 2: Member Details
\`\`\`javascript
const response = await agenticAISystem.query('Who is M001?');
// Returns: Member profile, role, team, projects
\`\`\`

### Pattern 3: Project Information
\`\`\`javascript
const response = await agenticAISystem.query('Tell me about Smart City project');
// Returns: Project scope, tech stack, team, status
\`\`\`

### Pattern 4: Technology Usage
\`\`\`javascript
const response = await agenticAISystem.query('Which projects use React?');
// Returns: List of projects, domains, team involvement
\`\`\`

### Pattern 5: Business Insights
\`\`\`javascript
const response = await agenticAISystem.query('Give me insights about this dataset');
// Returns: Summary, metrics, trends, recommendations
\`\`\`

### Pattern 6: Domain Analysis
\`\`\`javascript
const response = await agenticAISystem.query('Analyze Healthcare domain');
// Returns: Domain overview, projects, teams, technologies
\`\`\`

## Response Handling Examples

### Basic Response Handling
\`\`\`javascript
try {
  const response = await agenticAISystem.query(userQuery);
  
  // Check if successful
  if (response.status === 'ERROR') {
    console.error(response.error);
    return;
  }
  
  // Display answer
  console.log(response.answer);
  
  // Show metadata
  console.log(\`Agent: \${response.agentUsed}\`);
  console.log(\`Confidence: \${response.confidence}%\`);
  console.log(\`Sources: \${response.sourceCount}\`);
  
} catch (error) {
  console.error('Query failed:', error);
}
\`\`\`

### Format for Display
\`\`\`javascript
import ResponseFormatter from './lib/responseFormatter.js';

const response = await agenticAISystem.query(userQuery);
const formatted = ResponseFormatter.formatAgentResponse(response);

// Now formatted has:
// - formatted.answer
// - formatted.agentUsed
// - formatted.confidencePercentage
// - formatted.workflow (array of steps)
// - formatted.citations (array of sources)
// - formatted.metadata
\`\`\`

### Generate Markdown Report
\`\`\`javascript
import ResponseFormatter from './lib/responseFormatter.js';

const response = await agenticAISystem.query(userQuery);
const markdown = ResponseFormatter.generateMarkdownReport(response);

// markdown is ready to display or save as file
console.log(markdown);
\`\`\`

## Configuration

### Set Environment Variables

Create a \`.env.local\` file:

\`\`\`env
# Gemini API Configuration (optional but recommended)
VITE_GEMINI_ENDPOINT=https://api.example.com/gemini
VITE_GEMINI_API_KEY=your-secret-key

# Backend API (optional for REST integration)
VITE_API_URL=http://localhost:8000
\`\`\`

### Without Gemini
The system works perfectly without Gemini API configured. It will use semantic search fallback with lower confidence scores.

## Error Handling

### Handle Query Errors
\`\`\`javascript
try {
  const response = await agenticAISystem.query(userQuery);
  
  if (response.error) {
    // Handle specific error
    console.error('Query error:', response.error);
  }
} catch (err) {
  // Network or system error
  console.error('System error:', err.message);
}
\`\`\`

### Check System Status Before Query
\`\`\`javascript
const status = agenticAISystem.getStatus();

if (!status.isReady) {
  console.log('System not ready. Please upload a dataset first.');
  return;
}

// Safe to query
const response = await agenticAISystem.query(userQuery);
\`\`\`

## Performance Tips

1. **Cache Queries** - Store commonly asked questions to avoid re-processing
2. **Batch Queries** - Process multiple queries sequentially
3. **Use Gemini** - Enables better reasoning but adds 1-2s latency
4. **Limit Results** - Use topK parameter to limit retrieved documents
5. **Filter by Type** - Use entityType filter to narrow search scope

## Debugging

### Enable Logging
\`\`\`javascript
// In browser console
localStorage.debug = 'agenticai:*';

// Now all system logs will be visible
\`\`\`

### Check Internal State
\`\`\`javascript
// View full system state
console.log(agenticAISystem.state);

// Check specific components
console.log('Documents:', agenticAISystem.state.documents.length);
console.log('Graph nodes:', agenticAISystem.state.knowledgeGraph.nodes.size);
console.log('Gemini ready:', agenticAISystem.state.geminiEngine.isConfigured());
\`\`\`

## Testing Examples

### Test Dataset Upload
\`\`\`javascript
const csvContent = \`Team ID,Team Name,Member ID,Member Name\\nT001,Alpha,M001,John\\n\`;
const result = await agenticAISystem.processDataset(csvContent, 'test.csv', 'CSV');
console.log('Upload successful:', result.success);
\`\`\`

### Test Query
\`\`\`javascript
const response = await agenticAISystem.query('Tell me about teams');
console.log('Response:', response.answer);
console.log('Agent:', response.agentUsed);
console.log('Confidence:', response.confidence);
\`\`\`

### Test Dashboard Summary
\`\`\`javascript
const summary = agenticAISystem.getDashboardSummary();
console.log('Teams:', summary.datasetSummary.totalTeams);
console.log('Insights:', summary.executiveSummary);
\`\`\`

## Common Issues & Solutions

### Issue: System not ready
**Solution:** Ensure dataset is uploaded first
\`\`\`javascript
if (!agenticAISystem.getStatus().isReady) {
  // Wait for dataset upload
}
\`\`\`

### Issue: Low confidence scores
**Solution:** Ensure data has quality schema detection
\`\`\`javascript
// Check metadata
const metadata = agenticAISystem.state.metadata;
console.log('Data quality:', metadata.dataQuality);
\`\`\`

### Issue: Gemini API errors
**Solution:** System falls back to semantic search
\`\`\`javascript
// Check Gemini status
if (!agenticAISystem.state.geminiEngine.isConfigured()) {
  console.log('Using semantic search fallback');
}
\`\`\`

## Next Steps

1. ✅ Upload a dataset
2. ✅ Make your first query
3. ✅ Explore different agent types (TEAM, MEMBER, PROJECT, INSIGHT)
4. ✅ Check dashboard summary
5. ✅ Implement response formatting
6. ✅ Add error handling
7. ✅ Enable Gemini for better insights

---

**Need Help?** Check the AGENTIC_AI_SYSTEM_ARCHITECTURE.md file for detailed documentation.
`;

export default QUICK_START_GUIDE;
