require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const { v4: uuidv4 } = require('uuid');
const { dbOperations } = require('./database');
const { mapResponseToScore, PHQ9_QUESTIONS, GAD7_QUESTIONS } = require('./scoring');
const {
  generateTherapistReport,
  generateTextReport,
  generateCSVExport,
  generateHTMLReport
} = require('./reportGenerator');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// In-memory session storage for active chats
const activeSessions = new Map();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000'
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mental Health Intake Chatbot API is running' });
});

// Create new session
app.post('/api/session/create', async (req, res) => {
  try {
    const sessionId = uuidv4();
    await dbOperations.createSession(sessionId);

    // Initialize session tracking
    activeSessions.set(sessionId, {
      phq9Count: 0,
      gad7Count: 0,
      hasName: false,
      hasAge: false,
      hasPresentingConcern: false
    });

    res.json({ sessionId });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get session report
app.get('/api/report/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const report = await generateTherapistReport(sessionId);
    res.json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Export report as text
app.get('/api/report/:sessionId/text', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const textReport = await generateTextReport(sessionId);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="intake-report-${sessionId}.txt"`);
    res.send(textReport);
  } catch (error) {
    console.error('Error generating text report:', error);
    res.status(500).json({ error: 'Failed to generate text report' });
  }
});

// Export report as CSV
app.get('/api/report/:sessionId/csv', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const csvReport = await generateCSVExport(sessionId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="intake-data-${sessionId}.csv"`);
    res.send(csvReport);
  } catch (error) {
    console.error('Error generating CSV report:', error);
    res.status(500).json({ error: 'Failed to generate CSV report' });
  }
});

// Export report as HTML
app.get('/api/report/:sessionId/html', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const htmlReport = await generateHTMLReport(sessionId);
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlReport);
  } catch (error) {
    console.error('Error generating HTML report:', error);
    res.status(500).json({ error: 'Failed to generate HTML report' });
  }
});

// Get all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await dbOperations.getAllSessions();
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, sessionId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Get or create session tracking
    if (!activeSessions.has(sessionId)) {
      activeSessions.set(sessionId, {
        phq9Count: 0,
        gad7Count: 0,
        hasName: false,
        hasAge: false,
        hasPresentingConcern: false
      });
    }

    const sessionTracking = activeSessions.get(sessionId);

    // System prompt for the mental health intake bot
    const systemPrompt = `You are a warm, empathetic mental health intake specialist conducting an initial assessment. Your goal is to gather comprehensive information through natural conversation while building trust.

**Your Approach:**
- Be genuinely warm and human - acknowledge feelings, normalize experiences
- Never feel like a questionnaire - weave questions naturally into the conversation
- Adapt your pace based on the person's comfort level
- Use follow-up questions that show you're listening

**Information to Gather (in natural order):**
1. **Name and Basic Demographics** - age, pronouns, location
2. **Presenting Concerns** - what brings them here, current struggles
3. **PHQ-9 Assessment** (Depression screening - introduce naturally: "I'm going to ask about some experiences over the past 2 weeks that help me understand what you've been going through...")
   Questions to ask one at a time over the course of conversation:
   - Little interest or pleasure in doing things
   - Feeling down, depressed, or hopeless
   - Trouble falling/staying asleep, or sleeping too much
   - Feeling tired or having little energy
   - Poor appetite or overeating
   - Feeling bad about yourself or that you're a failure
   - Trouble concentrating
   - Moving/speaking slowly or being fidgety/restless
   - Thoughts of being better off dead or hurting yourself

4. **GAD-7 Assessment** (Anxiety screening - "Now I'd like to understand your anxiety levels...")
   Questions to ask one at a time:
   - Feeling nervous, anxious, or on edge
   - Not being able to stop or control worrying
   - Worrying too much about different things
   - Trouble relaxing
   - Being so restless it's hard to sit still
   - Becoming easily annoyed or irritable
   - Feeling afraid as if something awful might happen

5. **Risk Assessment** (introduce sensitively: "These are questions I ask everyone to ensure I can connect you with the right level of care...")
   - Current suicidal thoughts or plans
   - History of suicide attempts
   - Self-harm behaviors
   - Substance use that concerns them
   - Safety in current living situation

6. **Preferences** (conversational: "When you think about therapy, what feels most important to you?")
   - Therapy approach (CBT, psychodynamic, EMDR, or open to suggestions)
   - Scheduling preferences (days, times)
   - Language preferences
   - Cost/insurance considerations
   - Therapist characteristics that matter to them

7. **Goals** - what they hope to achieve through therapy

**IMPORTANT - Data Capture:**
After the user responds to specific assessment questions, include hidden markers in your response (these won't be shown to the user):
- When asking PHQ-9 question 1-9: Include [PHQ9_Q1:response], [PHQ9_Q2:response], etc.
- When asking GAD-7 question 1-7: Include [GAD7_Q1:response], [GAD7_Q2:response], etc.
- When learning demographics: [NAME:value], [AGE:value], [PRONOUNS:value], [LOCATION:value]
- When discussing presenting concern: [CONCERN:description]
- For risk assessment: [SUICIDAL_IDEATION:yes/no], [SUICIDAL_PLAN:yes/no], [SELF_HARM:yes/no], [SUBSTANCE_USE:yes/no]

Example: "I understand you've been feeling down most days. [PHQ9_Q2:feeling down most days] That must be really difficult..."

**Critical Safety Protocol:**
If you detect HIGH RISK (current suicidal ideation with plan, active self-harm, severe substance dependence), immediately respond with:
"CRISIS_DETECTED: [brief summary of risk factors]"

Then provide warm, direct guidance:
"I'm hearing some really serious concerns, and I want to make sure you get immediate support. Have you thought about calling a crisis line or going to an emergency room? I can provide those resources right now."

**Completion:**
When you've gathered all key information, end with:
"INTAKE_COMPLETE: Thank you so much for sharing all of this with me, [name]. You've given me a really helpful picture of what's going on and what you're looking for. [Warm summary of their situation and next steps]"

Remember: You're a skilled clinician having a genuine conversation, not administering a form. Build rapport, show empathy, and gather information naturally.`;

    // Save user message to database
    const userMessage = messages[messages.length - 1];
    if (userMessage.role === 'user') {
      await dbOperations.saveMessage(sessionId, 'user', userMessage.content);
    }

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      system: systemPrompt,
      messages: messages
    });

    // Extract the assistant's response
    let assistantMessage = response.content[0].text;

    // Save assistant message to database
    await dbOperations.saveMessage(sessionId, 'assistant', assistantMessage);

    // Extract and store structured data
    await extractAndStoreData(sessionId, assistantMessage, sessionTracking);

    // Check for crisis detection
    const hasCrisis = assistantMessage.includes('CRISIS_DETECTED');

    // Check for completion
    const isComplete = assistantMessage.includes('INTAKE_COMPLETE');

    // If completed, mark session as complete
    if (isComplete) {
      const conversationJson = JSON.stringify(messages);
      await dbOperations.completeSession(sessionId, conversationJson);

      // Calculate and store final scores
      await calculateAndStoreFinalScores(sessionId);
    }

    // Remove markers from message before sending to client
    const cleanedMessage = assistantMessage.replace(/\[PHQ9_Q\d+:[^\]]+\]/g, '')
      .replace(/\[GAD7_Q\d+:[^\]]+\]/g, '')
      .replace(/\[NAME:[^\]]+\]/g, '')
      .replace(/\[AGE:[^\]]+\]/g, '')
      .replace(/\[PRONOUNS:[^\]]+\]/g, '')
      .replace(/\[LOCATION:[^\]]+\]/g, '')
      .replace(/\[CONCERN:[^\]]+\]/g, '')
      .replace(/\[SUICIDAL_IDEATION:[^\]]+\]/g, '')
      .replace(/\[SUICIDAL_PLAN:[^\]]+\]/g, '')
      .replace(/\[SELF_HARM:[^\]]+\]/g, '')
      .replace(/\[SUBSTANCE_USE:[^\]]+\]/g, '')
      .trim();

    res.json({
      message: cleanedMessage,
      hasCrisis,
      isComplete
    });

  } catch (error) {
    console.error('Error calling Claude API:', error);
    res.status(500).json({
      error: 'Failed to process message',
      details: error.message
    });
  }
});

// Helper function to extract and store data from assistant message
async function extractAndStoreData(sessionId, message, sessionTracking) {
  try {
    // Extract PHQ-9 responses
    const phq9Matches = message.matchAll(/\[PHQ9_Q(\d+):([^\]]+)\]/g);
    for (const match of phq9Matches) {
      const questionNum = parseInt(match[1]);
      const response = match[2].trim();
      const score = mapResponseToScore(response);

      if (questionNum >= 1 && questionNum <= 9) {
        const questionText = PHQ9_QUESTIONS[questionNum - 1];
        await dbOperations.savePHQ9Response(sessionId, questionNum, questionText, response, score);
        sessionTracking.phq9Count++;
      }
    }

    // Extract GAD-7 responses
    const gad7Matches = message.matchAll(/\[GAD7_Q(\d+):([^\]]+)\]/g);
    for (const match of gad7Matches) {
      const questionNum = parseInt(match[1]);
      const response = match[2].trim();
      const score = mapResponseToScore(response);

      if (questionNum >= 1 && questionNum <= 7) {
        const questionText = GAD7_QUESTIONS[questionNum - 1];
        await dbOperations.saveGAD7Response(sessionId, questionNum, questionText, response, score);
        sessionTracking.gad7Count++;
      }
    }

    // Extract demographics
    const demographics = {};
    const nameMatch = message.match(/\[NAME:([^\]]+)\]/);
    if (nameMatch) {
      demographics.name = nameMatch[1].trim();
      sessionTracking.hasName = true;
    }

    const ageMatch = message.match(/\[AGE:([^\]]+)\]/);
    if (ageMatch) {
      demographics.age = parseInt(ageMatch[1].trim());
      sessionTracking.hasAge = true;
    }

    const pronounsMatch = message.match(/\[PRONOUNS:([^\]]+)\]/);
    if (pronounsMatch) {
      demographics.pronouns = pronounsMatch[1].trim();
    }

    const locationMatch = message.match(/\[LOCATION:([^\]]+)\]/);
    if (locationMatch) {
      demographics.location = locationMatch[1].trim();
    }

    const concernMatch = message.match(/\[CONCERN:([^\]]+)\]/);
    if (concernMatch) {
      demographics.presentingConcern = concernMatch[1].trim();
      sessionTracking.hasPresentingConcern = true;
    }

    if (Object.keys(demographics).length > 0) {
      await dbOperations.updateDemographics(sessionId, demographics);
    }

    // Extract risk assessment
    const risk = {};
    const suicidalIdeationMatch = message.match(/\[SUICIDAL_IDEATION:(yes|no)\]/i);
    if (suicidalIdeationMatch) {
      risk.suicidalIdeation = suicidalIdeationMatch[1].toLowerCase() === 'yes';
    }

    const suicidalPlanMatch = message.match(/\[SUICIDAL_PLAN:(yes|no)\]/i);
    if (suicidalPlanMatch) {
      risk.suicidalPlan = suicidalPlanMatch[1].toLowerCase() === 'yes';
    }

    const selfHarmMatch = message.match(/\[SELF_HARM:(yes|no)\]/i);
    if (selfHarmMatch) {
      risk.selfHarm = selfHarmMatch[1].toLowerCase() === 'yes';
    }

    const substanceUseMatch = message.match(/\[SUBSTANCE_USE:(yes|no)\]/i);
    if (substanceUseMatch) {
      risk.substanceUse = substanceUseMatch[1].toLowerCase() === 'yes';
    }

    if (Object.keys(risk).length > 0) {
      await dbOperations.updateRiskAssessment(sessionId, risk);
    }
  } catch (error) {
    console.error('Error extracting and storing data:', error);
  }
}

// Helper function to calculate and store final scores
async function calculateAndStoreFinalScores(sessionId) {
  try {
    // Get PHQ-9 responses and calculate score
    const phq9Responses = await dbOperations.getPHQ9Responses(sessionId);
    if (phq9Responses.length > 0) {
      const { calculatePHQ9Score } = require('./scoring');
      const phq9Result = calculatePHQ9Score(phq9Responses);
      if (phq9Result) {
        await dbOperations.updatePHQ9Score(sessionId, phq9Result.totalScore, phq9Result.severity);
      }
    }

    // Get GAD-7 responses and calculate score
    const gad7Responses = await dbOperations.getGAD7Responses(sessionId);
    if (gad7Responses.length > 0) {
      const { calculateGAD7Score } = require('./scoring');
      const gad7Result = calculateGAD7Score(gad7Responses);
      if (gad7Result) {
        await dbOperations.updateGAD7Score(sessionId, gad7Result.totalScore, gad7Result.severity);
      }
    }
  } catch (error) {
    console.error('Error calculating final scores:', error);
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🏥 Mental Health Intake Chatbot API running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
