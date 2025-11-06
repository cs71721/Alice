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

**The key difference:** Instead of filling out forms, users have a genuine conversation. The chatbot knows its stuff but speaks like a human being.

## 🏗️ Architecture

```
mental-health-intake-chatbot/
├── server/
│   └── index.js              # Express API server with Claude integration
├── client/
│   ├── public/
│   │   └── index.html        # HTML entry point
│   └── src/
│       ├── App.js            # Main chat interface
│       ├── App.css           # Styling
│       ├── index.js          # React entry point
│       └── index.css         # Global styles
├── package.json              # Root dependencies
├── .env.example              # Environment variable template
└── README.md                 # This file
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

## 📊 Data Collected

The chatbot systematically gathers:

| Category | Information |
|----------|-------------|
| **Demographics** | Name, age, pronouns, location |
| **Clinical** | PHQ-9 score, GAD-7 score |
| **Risk** | Suicidal ideation, self-harm, substance use |
| **Preferences** | Therapy approach, availability, language, cost |
| **Goals** | Treatment objectives |

## 🛡️ Security & Privacy

- **API keys** are stored server-side only (never exposed to client)
- **CORS** is configured to only allow your frontend
- **No data storage** - conversations are not saved (you'll need to add a database if you want persistence)
- **Environment variables** protect sensitive configuration

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

**To make this production-ready, consider adding:**

1. **Database Integration** - Store intake data (PostgreSQL, MongoDB)
2. **Authentication** - User accounts and sessions
3. **HIPAA Compliance** - Encryption, audit logs, BAA with hosting provider
4. **Analytics Dashboard** - Track completion rates, common concerns
5. **Multi-language Support** - i18n for Spanish, Mandarin, etc.
6. **SMS/Email Notifications** - Send intake summary to clinicians
7. **Video Chat Integration** - Seamless transition to live sessions
8. **Progress Saving** - Allow users to pause and resume intake
9. **Accessibility** - Screen reader support, keyboard navigation
10. **Load Testing** - Ensure it scales for production traffic

## 📝 License

MIT - feel free to use and modify for your needs.

## 🤝 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review Anthropic API docs: https://docs.anthropic.com
3. Check React documentation: https://react.dev

---

**Built with ❤️ for better mental health access**
