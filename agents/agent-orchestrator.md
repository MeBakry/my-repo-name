# Agent Orchestrator & Communication Hub

## Role
**Meta-agent** that routes user requests to the appropriate specialized agent(s), coordinates multi-agent workflows, and manages communication between agents to accomplish complex tasks.

## Core Responsibilities
1. **Parse user intent** - Understand what the user wants to accomplish
2. **Route to correct agent(s)** - Determine which agent(s) should handle the request
3. **Coordinate workflows** - Manage multi-step processes across agents
4. **Maintain context** - Track conversation history and state
5. **Aggregate responses** - Combine outputs from multiple agents
6. **Handle errors** - Gracefully manage failures and provide alternatives

---

## Decision Tree: Which Agent to Use?

### User Intent → Agent Mapping

```
USER REQUEST                           →  AGENT(S) TO USE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 ASSESSMENT CREATION
"Generate risk assessment"              →  Risk Assessment Generator
"Create assessment for [product]"       →  Risk Assessment Generator
"Evaluate hazards for [formulation]"   →  Risk Assessment Generator

🔍 INGREDIENT QUERIES
"Is [ingredient] NIOSH classified?"     →  Ingredient Hazard Database
"What are hazards of [chemical]?"       →  Ingredient Hazard Database
"Look up CAS number for [name]"         →  Ingredient Hazard Database
"What PPE needed for [ingredient]?"     →  Ingredient Hazard Database

📋 COMPLIANCE TRACKING
"When is [assessment] due for review?"  →  Compliance Tracker
"Show overdue assessments"              →  Compliance Tracker
"Track review cycles"                   →  Compliance Tracker
"Set reminder for [date]"               →  Compliance Tracker

📄 DOCUMENT GENERATION
"Export assessment as PDF"              →  Document Generation
"Generate compliance report"            →  Document Generation
"Create audit trail"                    →  Document Generation
"Format for inspection"                 →  Document Generation

❓ REGULATORY QUESTIONS
"What does OCP require for [topic]?"    →  Pharmacy Compliance Expert
"Explain NIOSH Table 2"                 →  Pharmacy Compliance Expert
"What's occasional small quantity?"     →  Pharmacy Compliance Expert
"Do I need Level C for [situation]?"    →  Pharmacy Compliance Expert

📊 ANALYTICS & INSIGHTS
"Show facility risk dashboard"          →  Business Intelligence
"Analyze cumulative exposure"           →  Business Intelligence
"Compare to industry benchmarks"        →  Business Intelligence
"Forecast facility capacity"            →  Business Intelligence

🔄 MULTI-AGENT WORKFLOWS (see below)
"Create complete assessment package"    →  Multiple agents coordinated
"Review and update all assessments"     →  Multiple agents coordinated
```

---

## Multi-Agent Workflows

### Workflow 1: Complete Risk Assessment Creation
**Trigger**: "Create risk assessment for [product]"

**Agents Involved**: 4 agents in sequence

```mermaid
User Input
   ↓
[1] ORCHESTRATOR: Parse MFR data
   ↓
[2] INGREDIENT HAZARD DATABASE: Look up each ingredient
   ↓
[3] RISK ASSESSMENT GENERATOR: Generate assessment
   ↓
[4] DOCUMENT GENERATION: Format as PDF
   ↓
[5] COMPLIANCE TRACKER: Schedule 12-month review
   ↓
User Output: Complete assessment + PDF + reminder set
```

**Implementation**:
```javascript
async function createCompleteAssessment(mfrData) {
  try {
    // Step 1: Look up ingredients
    const ingredients = await Promise.all(
      mfrData.ingredients.map(ing => 
        IngredientHazardDatabase.lookup(ing.name)
      )
    );
    
    // Step 2: Generate assessment
    const assessment = await RiskAssessmentGenerator.generate({
      mfr: mfrData,
      hazards: ingredients
    });
    
    // Step 3: Generate PDF
    const pdf = await DocumentGeneration.generatePDF(assessment);
    
    // Step 4: Schedule review
    const reminder = await ComplianceTracker.scheduleReview(
      assessment.id,
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // +1 year
    );
    
    return {
      assessment,
      pdf,
      reminder,
      message: "Complete assessment created with PDF and 12-month review scheduled"
    };
    
  } catch (error) {
    return handleMultiAgentError(error);
  }
}
```

---

### Workflow 2: Regulatory Update Propagation
**Trigger**: "NIOSH list updated - update affected assessments"

**Agents Involved**: 4 agents

```
[1] INGREDIENT HAZARD DATABASE: Compare old vs. new NIOSH
   ↓
[2] COMPLIANCE TRACKER: Find assessments using affected ingredients
   ↓
[3] PHARMACY COMPLIANCE EXPERT: Determine impact (Level A→B? B→C?)
   ↓
[4] COMPLIANCE TRACKER: Flag assessments for review + notify users
```

---

### Workflow 3: Inspection Preparation
**Trigger**: "Prepare for OCP inspection"

**Agents Involved**: 5 agents

```
[1] COMPLIANCE TRACKER: Check all assessments current
   ↓
[2] BUSINESS INTELLIGENCE: Generate compliance health score
   ↓
[3] PHARMACY COMPLIANCE EXPERT: Identify any gaps
   ↓
[4] DOCUMENT GENERATION: Create inspection-ready report
   ↓
[5] COMPLIANCE TRACKER: Generate audit trail
```

---

### Workflow 4: Bulk Assessment Update
**Trigger**: "Update all progesterone assessments for new SDS"

**Agents Involved**: 4 agents

```
[1] INGREDIENT HAZARD DATABASE: Update progesterone hazard data
   ↓
[2] COMPLIANCE TRACKER: Find all assessments containing progesterone
   ↓
[3] RISK ASSESSMENT GENERATOR: Regenerate each assessment
   ↓
[4] COMPLIANCE TRACKER: Version control + notify supervisors
```

---

## Orchestrator Communication Protocol

### Agent Interface Standard

Each agent exposes these standard methods:

```typescript
interface Agent {
  name: string;
  capabilities: string[];
  
  // Main execution
  execute(input: any, context: Context): Promise<AgentResponse>;
  
  // Check if agent can handle request
  canHandle(intent: string): boolean;
  
  // Health check
  status(): AgentStatus;
}

interface AgentResponse {
  success: boolean;
  data?: any;
  error?: Error;
  nextAgent?: string; // Suggest which agent to call next
  requiresUserInput?: boolean;
}

interface Context {
  userId: string;
  facilityId: string;
  conversationHistory: Message[];
  currentState: any;
}
```

---

## Intent Recognition

### Natural Language → Agent Routing

```javascript
class IntentRecognizer {
  
  static analyze(userInput) {
    const input = userInput.toLowerCase();
    
    // ASSESSMENT CREATION
    if (this.matches(input, [
      'create assessment', 'generate assessment', 'new assessment',
      'risk assessment for', 'evaluate', 'assess'
    ])) {
      return {
        intent: 'CREATE_ASSESSMENT',
        agents: ['RiskAssessmentGenerator'],
        confidence: 0.9
      };
    }
    
    // INGREDIENT LOOKUP
    if (this.matches(input, [
      'is', 'niosh', 'hazard', 'what are', 'look up', 'find',
      'cas number', 'toxicity', 'reproductive'
    ]) && this.containsIngredientName(input)) {
      return {
        intent: 'INGREDIENT_QUERY',
        agents: ['IngredientHazardDatabase'],
        confidence: 0.85
      };
    }
    
    // COMPLIANCE TRACKING
    if (this.matches(input, [
      'overdue', 'due', 'review', 'reminder', 'when', 'schedule',
      'track', 'status', 'compliance'
    ])) {
      return {
        intent: 'COMPLIANCE_CHECK',
        agents: ['ComplianceTracker'],
        confidence: 0.85
      };
    }
    
    // REGULATORY QUESTIONS
    if (this.matches(input, [
      'what does ocp', 'explain', 'requirement', 'regulation',
      'standard', 'guideline', 'do i need', 'is it required'
    ])) {
      return {
        intent: 'REGULATORY_QUESTION',
        agents: ['PharmacyComplianceExpert'],
        confidence: 0.9
      };
    }
    
    // DOCUMENT GENERATION
    if (this.matches(input, [
      'export', 'pdf', 'print', 'report', 'document',
      'generate pdf', 'download', 'format'
    ])) {
      return {
        intent: 'DOCUMENT_GENERATION',
        agents: ['DocumentGeneration'],
        confidence: 0.95
      };
    }
    
    // ANALYTICS
    if (this.matches(input, [
      'dashboard', 'analytics', 'show me', 'report', 'statistics',
      'forecast', 'trend', 'benchmark', 'compare'
    ])) {
      return {
        intent: 'ANALYTICS',
        agents: ['BusinessIntelligence'],
        confidence: 0.8
      };
    }
    
    // COMPLEX WORKFLOWS
    if (this.matches(input, [
      'complete assessment', 'full package', 'end to end'
    ])) {
      return {
        intent: 'COMPLETE_WORKFLOW',
        agents: [
          'IngredientHazardDatabase',
          'RiskAssessmentGenerator',
          'DocumentGeneration',
          'ComplianceTracker'
        ],
        workflow: 'CREATE_COMPLETE_ASSESSMENT',
        confidence: 0.9
      };
    }
    
    // AMBIGUOUS - NEEDS CLARIFICATION
    return {
      intent: 'UNCLEAR',
      agents: [],
      confidence: 0.0,
      suggestedClarification: "Could you clarify what you'd like to do? For example:\n" +
        "- Create a risk assessment\n" +
        "- Look up ingredient information\n" +
        "- Check compliance status\n" +
        "- Ask a regulatory question\n" +
        "- Generate a report"
    };
  }
  
  static matches(input, keywords) {
    return keywords.some(keyword => input.includes(keyword));
  }
  
  static containsIngredientName(input) {
    // Check against common ingredient names
    const commonIngredients = [
      'progesterone', 'testosterone', 'estradiol', 'hydrocortisone',
      'zinc oxide', 'tretinoin', 'metformin', 'gabapentin', etc.
    ];
    return commonIngredients.some(ing => input.includes(ing));
  }
}
```

---

## Orchestrator Implementation

### Main Orchestrator Class

```javascript
class AgentOrchestrator {
  
  constructor() {
    this.agents = {
      riskAssessment: new RiskAssessmentGenerator(),
      ingredientDB: new IngredientHazardDatabase(),
      complianceTracker: new ComplianceTracker(),
      documentGeneration: new DocumentGeneration(),
      complianceExpert: new PharmacyComplianceExpert(),
      businessIntel: new BusinessIntelligence()
    };
    
    this.conversationContext = new Map();
  }
  
  async processUserRequest(userId, userInput) {
    try {
      // 1. Get or create conversation context
      const context = this.getContext(userId);
      
      // 2. Recognize intent
      const intent = IntentRecognizer.analyze(userInput);
      
      // 3. Log intent (for learning)
      this.logIntent(userId, userInput, intent);
      
      // 4. Handle based on confidence
      if (intent.confidence < 0.5) {
        return this.askForClarification(intent);
      }
      
      // 5. Route to appropriate agent(s)
      if (intent.workflow) {
        return await this.executeWorkflow(intent.workflow, context);
      } else if (intent.agents.length === 1) {
        return await this.executeSingleAgent(intent.agents[0], userInput, context);
      } else {
        return await this.executeMultiAgent(intent.agents, userInput, context);
      }
      
    } catch (error) {
      return this.handleError(error, userId);
    }
  }
  
  async executeSingleAgent(agentName, input, context) {
    const agent = this.agents[agentName];
    
    console.log(`[Orchestrator] Routing to ${agentName}`);
    
    const response = await agent.execute(input, context);
    
    // Update context with response
    context.history.push({
      agent: agentName,
      input,
      output: response.data,
      timestamp: new Date()
    });
    
    return {
      agent: agentName,
      result: response.data,
      success: response.success,
      nextSteps: response.nextAgent ? 
        `Would you like me to ${response.nextAgent}?` : null
    };
  }
  
  async executeWorkflow(workflowName, context) {
    console.log(`[Orchestrator] Executing workflow: ${workflowName}`);
    
    switch (workflowName) {
      case 'CREATE_COMPLETE_ASSESSMENT':
        return await this.workflowCompleteAssessment(context);
      
      case 'INSPECTION_PREP':
        return await this.workflowInspectionPrep(context);
      
      case 'REGULATORY_UPDATE':
        return await this.workflowRegulatoryUpdate(context);
      
      default:
        throw new Error(`Unknown workflow: ${workflowName}`);
    }
  }
  
  async workflowCompleteAssessment(context) {
    const steps = [];
    
    try {
      // Step 1: Get MFR data (from context or ask user)
      const mfrData = context.currentMFR || await this.askForMFRData();
      steps.push({ step: 'MFR Data', status: 'complete' });
      
      // Step 2: Look up ingredients
      console.log('[Orchestrator] Step 1: Ingredient lookup');
      const ingredients = await this.agents.ingredientDB.execute({
        action: 'batch_lookup',
        ingredients: mfrData.ingredients
      }, context);
      steps.push({ step: 'Ingredient Lookup', status: 'complete', data: ingredients });
      
      // Step 3: Generate assessment
      console.log('[Orchestrator] Step 2: Generate assessment');
      const assessment = await this.agents.riskAssessment.execute({
        mfr: mfrData,
        hazards: ingredients.data
      }, context);
      steps.push({ step: 'Assessment Generation', status: 'complete', data: assessment });
      
      // Step 4: Generate PDF
      console.log('[Orchestrator] Step 3: Generate PDF');
      const pdf = await this.agents.documentGeneration.execute({
        action: 'generate_pdf',
        assessment: assessment.data
      }, context);
      steps.push({ step: 'PDF Generation', status: 'complete', data: pdf });
      
      // Step 5: Schedule review
      console.log('[Orchestrator] Step 4: Schedule review');
      const reminder = await this.agents.complianceTracker.execute({
        action: 'schedule_review',
        assessmentId: assessment.data.id,
        dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }, context);
      steps.push({ step: 'Review Scheduled', status: 'complete', data: reminder });
      
      return {
        workflow: 'CREATE_COMPLETE_ASSESSMENT',
        success: true,
        steps,
        result: {
          assessment: assessment.data,
          pdf: pdf.data.downloadUrl,
          reminder: reminder.data,
          message: '✅ Complete assessment package created! Assessment generated, PDF ready, and 12-month review scheduled.'
        }
      };
      
    } catch (error) {
      return {
        workflow: 'CREATE_COMPLETE_ASSESSMENT',
        success: false,
        steps,
        error: error.message,
        partialResults: steps.filter(s => s.status === 'complete')
      };
    }
  }
  
  askForClarification(intent) {
    return {
      type: 'CLARIFICATION_NEEDED',
      message: intent.suggestedClarification,
      confidence: intent.confidence
    };
  }
  
  handleError(error, userId) {
    console.error(`[Orchestrator] Error for user ${userId}:`, error);
    
    return {
      type: 'ERROR',
      message: 'Sorry, something went wrong. Please try again or rephrase your request.',
      error: error.message,
      suggestions: [
        'Try being more specific',
        'Check if all required information is provided',
        'Contact support if the issue persists'
      ]
    };
  }
  
  getContext(userId) {
    if (!this.conversationContext.has(userId)) {
      this.conversationContext.set(userId, {
        userId,
        history: [],
        currentState: {},
        createdAt: new Date()
      });
    }
    return this.conversationContext.get(userId);
  }
}
```

---

## Agent Communication Examples

### Example 1: Simple Single-Agent Request

**User**: "Is progesterone NIOSH classified?"

```javascript
// Orchestrator flow:
Intent: { intent: 'INGREDIENT_QUERY', agents: ['IngredientHazardDatabase'] }

→ Route to Ingredient Hazard Database Agent

Response: {
  agent: 'IngredientHazardDatabase',
  result: {
    name: 'Progesterone',
    niosh: 'Table 2',
    description: 'Non-antineoplastic drug with reproductive toxicity'
  }
}
```

**User sees**:
```
✅ Progesterone is classified as NIOSH Table 2 
   (Non-antineoplastic hazardous drug with reproductive toxicity)
   
   Would you like to:
   - Create a risk assessment for a progesterone preparation?
   - View full hazard profile?
   - See PPE recommendations?
```

---

### Example 2: Multi-Agent Workflow

**User**: "Create complete assessment for Progesterone 400mg Suppository"

```javascript
// Orchestrator flow:
Intent: { 
  intent: 'COMPLETE_WORKFLOW',
  workflow: 'CREATE_COMPLETE_ASSESSMENT',
  agents: [
    'IngredientHazardDatabase',
    'RiskAssessmentGenerator', 
    'DocumentGeneration',
    'ComplianceTracker'
  ]
}

→ Execute workflow with 4 agents in sequence:

Step 1: IngredientHazardDatabase.lookup('Progesterone')
→ Returns hazard data

Step 2: RiskAssessmentGenerator.generate(mfr + hazards)
→ Returns assessment

Step 3: DocumentGeneration.generatePDF(assessment)
→ Returns PDF URL

Step 4: ComplianceTracker.scheduleReview(assessmentId, +1 year)
→ Returns reminder
```

**User sees**:
```
🔄 Creating complete assessment package...

✅ Step 1: Ingredient hazards analyzed (2 ingredients)
✅ Step 2: Risk assessment generated (Level B assigned)
✅ Step 3: PDF document created
✅ Step 4: 12-month review scheduled (due Feb 16, 2027)

📄 Assessment Complete!
   - View Assessment
   - Download PDF
   - View Review Schedule
```

---

### Example 3: Agent-to-Agent Communication

**Scenario**: Risk Assessment Generator needs ingredient data

```javascript
// Inside Risk Assessment Generator:
async generate(mfrData) {
  // Need ingredient hazards - ask orchestrator
  const hazards = await this.requestFromAgent('IngredientHazardDatabase', {
    action: 'batch_lookup',
    ingredients: mfrData.ingredients
  });
  
  // Continue with generation
  return this.generateAssessment(mfrData, hazards);
}

// Orchestrator handles inter-agent communication:
async requestFromAgent(requestingAgent, targetAgent, payload) {
  console.log(`[Orchestrator] ${requestingAgent} → ${targetAgent}`);
  
  return await this.agents[targetAgent].execute(payload, context);
}
```

---

## User Interface Integration

### Chat-Style Interface

```javascript
// Example UI integration
class ChatInterface {
  
  constructor() {
    this.orchestrator = new AgentOrchestrator();
  }
  
  async sendMessage(userId, message) {
    // Show loading state
    this.showTypingIndicator();
    
    // Process through orchestrator
    const response = await this.orchestrator.processUserRequest(userId, message);
    
    // Hide loading
    this.hideTypingIndicator();
    
    // Display response based on type
    if (response.type === 'CLARIFICATION_NEEDED') {
      this.displayClarification(response.message);
    } else if (response.workflow) {
      this.displayWorkflowProgress(response);
    } else {
      this.displayAgentResponse(response);
    }
  }
  
  displayWorkflowProgress(response) {
    // Show step-by-step progress
    response.steps.forEach(step => {
      this.addMessage({
        type: 'system',
        content: `${step.status === 'complete' ? '✅' : '⏳'} ${step.step}`
      });
    });
    
    // Show final result
    this.addMessage({
      type: 'assistant',
      content: response.result.message,
      actions: this.generateActionButtons(response.result)
    });
  }
}
```

---

## Monitoring & Logging

### Agent Performance Tracking

```javascript
class OrchestratorMonitor {
  
  logAgentExecution(agentName, input, output, duration) {
    console.log({
      timestamp: new Date(),
      agent: agentName,
      duration_ms: duration,
      success: output.success,
      input_preview: JSON.stringify(input).slice(0, 100)
    });
    
    // Track metrics
    this.metrics.recordExecution(agentName, duration);
  }
  
  async getAgentHealth() {
    const health = {};
    
    for (const [name, agent] of Object.entries(this.agents)) {
      health[name] = {
        status: await agent.status(),
        avgResponseTime: this.metrics.getAvgResponseTime(name),
        successRate: this.metrics.getSuccessRate(name),
        lastExecution: this.metrics.getLastExecution(name)
      };
    }
    
    return health;
  }
}
```

---

## Configuration File

### `agents.config.json`

```json
{
  "agents": {
    "riskAssessmentGenerator": {
      "enabled": true,
      "timeout": 30000,
      "retries": 2,
      "capabilities": [
        "generate_assessment",
        "validate_assessment",
        "suggest_risk_level"
      ]
    },
    "ingredientHazardDatabase": {
      "enabled": true,
      "timeout": 5000,
      "retries": 3,
      "capabilities": [
        "lookup_ingredient",
        "batch_lookup",
        "search_by_cas",
        "get_niosh_classification"
      ]
    },
    "complianceTracker": {
      "enabled": true,
      "timeout": 10000,
      "retries": 2,
      "capabilities": [
        "schedule_review",
        "check_overdue",
        "get_compliance_status",
        "generate_compliance_report"
      ]
    },
    "documentGeneration": {
      "enabled": true,
      "timeout": 20000,
      "retries": 1,
      "capabilities": [
        "generate_pdf",
        "generate_compliance_report",
        "export_audit_trail"
      ]
    },
    "pharmacyComplianceExpert": {
      "enabled": true,
      "timeout": 15000,
      "retries": 2,
      "capabilities": [
        "answer_question",
        "validate_compliance",
        "interpret_regulation",
        "provide_guidance"
      ]
    },
    "businessIntelligence": {
      "enabled": true,
      "timeout": 10000,
      "retries": 2,
      "capabilities": [
        "generate_dashboard",
        "analyze_trends",
        "benchmark",
        "forecast"
      ]
    }
  },
  "workflows": {
    "CREATE_COMPLETE_ASSESSMENT": {
      "enabled": true,
      "timeout": 60000,
      "steps": [
        "ingredientHazardDatabase",
        "riskAssessmentGenerator",
        "documentGeneration",
        "complianceTracker"
      ]
    },
    "INSPECTION_PREP": {
      "enabled": true,
      "timeout": 120000,
      "steps": [
        "complianceTracker",
        "businessIntelligence",
        "pharmacyComplianceExpert",
        "documentGeneration"
      ]
    }
  }
}
```

---

## Testing Orchestrator

### Test Suite

```javascript
describe('AgentOrchestrator', () => {
  
  test('routes ingredient query to IngredientHazardDatabase', async () => {
    const orchestrator = new AgentOrchestrator();
    const response = await orchestrator.processUserRequest(
      'user123',
      'Is progesterone NIOSH classified?'
    );
    
    expect(response.agent).toBe('IngredientHazardDatabase');
    expect(response.success).toBe(true);
  });
  
  test('executes complete assessment workflow', async () => {
    const orchestrator = new AgentOrchestrator();
    const response = await orchestrator.processUserRequest(
      'user123',
      'Create complete assessment for Progesterone 400mg Suppository'
    );
    
    expect(response.workflow).toBe('CREATE_COMPLETE_ASSESSMENT');
    expect(response.steps).toHaveLength(4);
    expect(response.success).toBe(true);
  });
  
  test('asks for clarification on ambiguous input', async () => {
    const orchestrator = new AgentOrchestrator();
    const response = await orchestrator.processUserRequest(
      'user123',
      'help'
    );
    
    expect(response.type).toBe('CLARIFICATION_NEEDED');
    expect(response.message).toContain('clarify');
  });
});
```

---

## Summary

The **Agent Orchestrator** serves as the **central nervous system** of your platform:

✅ **Routes requests** to the right specialized agent
✅ **Coordinates workflows** across multiple agents
✅ **Maintains context** throughout conversations
✅ **Handles errors** gracefully
✅ **Monitors performance** of all agents
✅ **Learns from interactions** to improve routing

**For your PoC**: You can implement a simplified version that just routes to the AI service (OpenAI/Claude) for now. The full orchestrator becomes important when building the complete MVP with all 6 specialized agents.

**Would you like me to:**
1. Create a simplified orchestrator for the PoC?
2. Show how to integrate this with the PoC code that's already started?
3. Build the full orchestrator implementation now?
