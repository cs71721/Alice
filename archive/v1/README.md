# Mental Health Intake Chatbot

A conversational AI-powered mental health intake system that feels human, not mechanical. Built with Claude AI, React, and Node.js.

## 🎯 What This Does

Alice (or any user) lands on the service and has a natural conversation with an empathetic AI assistant that:

- **Gathers comprehensive intake information** naturally through conversation
- **Conducts clinical assessments** (PHQ-9 for depression, GAD-7 for anxiety)
- **Screens for risk** (suicidal ideation, self-harm, substance use)
- **Collects preferences** (therapy style, scheduling, language, cost)
- **Identifies goals** for treatment
- **Detects crises** automatically and provides immediate resources
- **Generates comprehensive reports** with PHQ-9/GAD-7 scores and clinical recommendations
- **Exports data** in multiple formats (HTML, Text, CSV)

**The key difference:** Instead of filling out forms, users have a genuine conversation. The chatbot knows its stuff but speaks like a human being. Plus, all data is now captured, scored, and formatted into professional reports for therapists.

## 🏗️ Architecture

```
mental-health-intake-chatbot/
├── server/
│   ├── index.js              # Express API server with Claude integration
│   ├── database.js           # SQLite database setup and operations
│   ├── scoring.js            # PHQ-9/GAD-7 scoring algorithms
│   ├── reportGenerator.js    # Report generation (HTML/Text/CSV)
│   └── intake_sessions.db    # SQLite database (created on first run)
├── client/
│   ├── public/
│   │   └── index.html        # HTML entry point
│   └── src/
│       ├── App.js            # Main chat interface with report viewing
│       ├── App.css           # Styling (includes report modal)
│       ├── index.js          # React entry point
│       └── index.css         # Global styles
├── package.json              # Root dependencies
├── .env.example              # Environment variable template
├── README.md                 # This file
└── REPORTING.md              # Detailed reporting system documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd /path/to/mental-health-intake-chatbot
   ```

2. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` and add your API key:**
   ```
   ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
   PORT=3001
   CLIENT_URL=http://localhost:3000
   ```

### Running the Application

**Option 1: Run both server and client together (recommended):**
```bash
npm run dev
```

**Option 2: Run separately:**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run client
```

### Access the Application

Open your browser and go to: **http://localhost:3000**

The chatbot will greet you and start the intake conversation naturally!

## 💬 How It Works

### Conversation Flow

1. **Greeting & Name** - Warm introduction, asks for name
2. **Presenting Concerns** - "What brings you here today?"
3. **Demographics** - Age, pronouns, location (woven naturally)
4. **PHQ-9 Assessment** - Depression screening (9 questions over past 2 weeks)
5. **GAD-7 Assessment** - Anxiety screening (7 questions)
6. **Risk Screening** - Suicidal ideation, self-harm, substance use
7. **Preferences** - Therapy style, scheduling, language, cost
8. **Goals** - What they hope to achieve

### Crisis Detection

If the AI detects high-risk indicators:
- Red crisis banner appears at the top
- Shows immediate resources (988 Lifeline, Crisis Text Line, Emergency Services)
- Conversation continues but with appropriate urgency

### Completion

When all information is gathered:
- "✓ Intake Complete" badge appears
- AI provides warm summary and next steps
- **Report buttons appear** allowing therapists to:
  - View summary report (modal with key findings)
  - View full HTML report (printable, detailed)
  - Download text report (.txt file)
  - Download CSV data (for analytics)
- All assessment scores are automatically calculated
- Clinical recommendations are generated based on severity

## 🔧 Configuration

### Adjusting the System Prompt

Edit `/server/index.js` around line 30 to modify:
- Conversation tone/style
- Question order and phrasing
- Clinical frameworks
- What information to prioritize

### Changing the Model

In `/server/index.js`, line 119:
```javascript
model: 'claude-3-5-sonnet-20241022',  // Change this
```

Available models:
- `claude-3-5-sonnet-20241022` (recommended - balanced quality & speed)
- `claude-3-opus-20240229` (highest quality, slower)
- `claude-3-haiku-20240307` (fastest, lower cost)

### Adjusting UI/Styling

Edit `/client/src/App.css` to customize:
- Colors and gradients
- Message bubble styles
- Crisis banner appearance
- Animations and transitions

## 📊 Data Collected & Stored

The chatbot systematically gathers and **stores in a SQLite database**:

| Category | Information | Stored In |
|----------|-------------|-----------|
| **Demographics** | Name, age, pronouns, location | intake_sessions table |
| **Clinical** | PHQ-9 score (0-27), GAD-7 score (0-21) | Calculated and stored with severity levels |
| **Assessment Details** | Individual responses to all PHQ-9 and GAD-7 questions | phq9_responses & gad7_responses tables |
| **Risk** | Suicidal ideation, self-harm, substance use, safety concerns | Risk assessment fields with HIGH/MODERATE/LOW rating |
| **Preferences** | Therapy approach, availability, language, cost | Therapy preferences fields |
| **Goals** | Treatment objectives | Treatment goals field |
| **Conversation** | Complete message history | messages table |

**Reports Generated:**
- Comprehensive therapist summary with all scores
- Clinical recommendations based on severity
- Risk assessment with safety protocols
- Exportable in HTML, Text, and CSV formats

See [REPORTING.md](REPORTING.md) for detailed documentation on the reporting system.

## 🛡️ Security & Privacy

- **API keys** are stored server-side only (never exposed to client)
- **CORS** is configured to only allow your frontend
- **Data storage** - All intake data is stored in a local SQLite database
- **Environment variables** protect sensitive configuration

**⚠️ IMPORTANT FOR PRODUCTION:**
The current implementation stores data locally without encryption. For production use with real patient data:
1. Implement database encryption at rest
2. Use HTTPS/TLS for all communications
3. Add user authentication and role-based access control
4. Implement HIPAA-compliant audit logging
5. Set up regular automated backups
6. Add data retention and deletion policies
7. Conduct security audits

See [REPORTING.md](REPORTING.md) for more security considerations.

## 🐛 Troubleshooting

### "Cannot connect to server"
- Check that backend is running on port 3001
- Verify `.env` file has correct `ANTHROPIC_API_KEY`
- Check console for errors: `npm run server`

### "API key invalid"
- Ensure you copied the full API key from Anthropic Console
- Key should start with `sk-ant-`
- No extra spaces or quotes in `.env` file

### Port already in use
Change ports in `.env`:
```
PORT=3002  # Backend port
```

And update proxy in `client/package.json`:
```json
"proxy": "http://localhost:3002"
```

### Crisis banner won't appear
The AI must explicitly say "CRISIS_DETECTED" in its response. Test by mentioning serious self-harm or suicidal thoughts.

## 🔮 Next Steps / Enhancements

**✅ Recently Added:**
- ✅ **Database Integration** - SQLite storage for all intake data
- ✅ **Report Generation** - Comprehensive therapist reports with PHQ-9/GAD-7 scores
- ✅ **Data Export** - HTML, Text, and CSV export formats
- ✅ **Clinical Scoring** - Automated calculation of assessment scores with severity levels

**To make this production-ready, consider adding:**

1. **Authentication** - User accounts and sessions tied to providers/patients
2. **HIPAA Compliance** - Encryption, audit logs, BAA with hosting provider
3. **Provider Dashboard** - View all patient intakes, track completion rates
4. **Multi-language Support** - i18n for Spanish, Mandarin, etc.
5. **SMS/Email Notifications** - Send intake summary to clinicians
6. **Video Chat Integration** - Seamless transition to live sessions
7. **Progress Saving** - Allow users to pause and resume intake
8. **Accessibility** - Screen reader support, keyboard navigation
9. **Load Testing** - Ensure it scales for production traffic
10. **Follow-up Tracking** - Compare scores over time across multiple sessions

## 📝 License

MIT - feel free to use and modify for your needs.

## 🤝 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review Anthropic API docs: https://docs.anthropic.com
3. Check React documentation: https://react.dev

---

**Built with ❤️ for better mental health access**
