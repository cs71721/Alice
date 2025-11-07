# Quick Start Guide 🚀

Get your mental health intake chatbot running in under 5 minutes!

## Prerequisites

- Node.js 16+ ([download here](https://nodejs.org/))
- Anthropic API key ([get one here](https://console.anthropic.com/))

## Installation (One Command!)

```bash
./setup.sh
```

This will:
- ✅ Check your Node.js installation
- ✅ Install all dependencies (backend + frontend)
- ✅ Create a `.env` file from the template

## Configuration

1. **Add your API key** to `.env`:
   ```bash
   nano .env  # or use any text editor
   ```

2. **Replace** `your_api_key_here` with your actual Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx...
   ```

3. **Save** the file (Ctrl+O, Enter, Ctrl+X if using nano)

## Run It!

```bash
npm run dev
```

This starts both:
- 🖥️ Backend server on port 3001
- 🌐 Frontend on port 3000

## Use It!

Open your browser to: **http://localhost:3000**

You'll see:
```
Hi there, I'm here to help you get started with mental health
support. Thanks for reaching out – that takes courage. I'd love
to learn a bit about you and what brings you here today.
What's your name?
```

## What to Expect

The chatbot will:
1. Ask your name warmly
2. Explore what brings you there
3. Naturally weave in demographics
4. Conduct PHQ-9 (depression) assessment conversationally
5. Conduct GAD-7 (anxiety) assessment
6. Screen for risk factors sensitively
7. Discuss therapy preferences
8. Identify treatment goals
9. Provide a summary when complete

### If Crisis Detected

A red banner will appear at the top with immediate resources:
- 988 Suicide & Crisis Lifeline
- Crisis Text Line (741741)
- Emergency Services (911)

## Test Conversations

Try these to see different paths:

### Normal Flow:
```
You: Hi, I'm Sarah
Bot: Hi Sarah, it's really nice to meet you...
You: I've been feeling really stressed at work lately
```

### Crisis Detection:
```
You: I'm John
Bot: Hi John...
You: I've been having thoughts about ending my life
Bot: [Crisis banner appears with resources]
```

## Project Structure

```
mental-health-intake-chatbot/
├── server/
│   └── index.js              # Backend API (port 3001)
├── client/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js            # Chat interface
│       ├── App.css           # Styling
│       └── index.js
├── package.json              # Root config
├── .env                      # Your secrets (DO NOT commit!)
├── setup.sh                  # Automated setup script
├── README.md                 # Full documentation
└── QUICKSTART.md             # This file
```

## Troubleshooting

### "Cannot connect to server"
- Make sure backend is running (you should see "🏥 Mental Health Intake Chatbot API running on port 3001")
- Check `.env` has your API key

### "API key invalid"
- Verify you copied the full key from https://console.anthropic.com/
- Key should start with `sk-ant-`
- No extra spaces in `.env`

### Port already in use
Edit `.env`:
```
PORT=3002
```

Then update `client/package.json`:
```json
"proxy": "http://localhost:3002"
```

## Next Steps

- 📖 Read the full [README.md](README.md) for detailed documentation
- 🎨 Customize the UI by editing `client/src/App.css`
- 🤖 Adjust conversation flow by editing the system prompt in `server/index.js`
- 🗄️ Add a database to store intake data
- 🔐 Add authentication for production use

## Need Help?

- Check the [README.md](README.md) Troubleshooting section
- Review Anthropic docs: https://docs.anthropic.com
- React documentation: https://react.dev

---

**You're all set! 🎉 Start chatting and experience the natural conversation flow.**
