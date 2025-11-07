# Alice - Emotional Support Companion

A compassionate AI-powered emotional support chatbot that provides warm, human-like conversation for people seeking someone to talk to. Built with Claude Sonnet 4.5 by Anthropic.

## 🎯 What This Does

Alice is an empathetic conversational companion that:

- 💬 **Provides genuine emotional support** through natural, human-like conversation
- 🌍 **Automatically detects your location** (via IP) and provides country-appropriate crisis resources
- 🎨 **Beautiful, calming interface** with gradient design and smooth animations
- 📝 **Formats responses properly** with markdown support (bold text, etc.)
- 💾 **Lets you save conversations** as downloadable text files
- 🔄 **Easy to restart** with a single click for new conversations
- 🔒 **Privacy-focused** - Your API key stays in your browser, conversations aren't stored server-side
- ⚡ **Zero setup complexity** - Just open in browser, add API key, and start chatting

**The key difference:** This isn't a questionnaire or form. It's a genuine conversation with an AI that listens, validates emotions, and provides appropriate support and resources.

## 🚀 Quick Start

**Prerequisites:**
- Node.js 16+ (for the proxy server)
- Anthropic API key ([get one here](https://console.anthropic.com/))

**Run in 3 steps:**

1. **Start the proxy server:**
   ```bash
   cd /path/to/Alice
   node proxy-server.js
   ```

2. **Open in browser:**
   - Navigate to `http://localhost:8080/`

3. **Add your API key:**
   - Paste your Anthropic API key when prompted
   - Click "Save Key"
   - Start chatting!

**That's it!** No complex setup, no database configuration, no environment variables to manage.

## 📁 What's In This Folder

```
Alice/
├── emotional-support-chatbot.html    # Main chatbot (single HTML file)
├── proxy-server.js                   # Simple CORS proxy server
├── README.md                         # This file
├── ROADMAP.md                        # Product vision and future plans
├── .gitignore                        # Git ignore rules
└── archive/                          # Old intake system (archived)
```

**That's it!** Just two files for the chatbot - couldn't be simpler.

## 🌍 Location-Aware Crisis Resources

Alice automatically detects which country you're in and provides appropriate crisis helplines:

| Country | Crisis Helplines |
|---------|------------------|
| 🇬🇧 **United Kingdom** | Samaritans: 116 123 (24/7, free)<br>Text SHOUT to 85258<br>NHS 111 for mental health crisis |
| 🇺🇸 **United States** | 988 Suicide & Crisis Lifeline (call or text)<br>Crisis Text Line: Text HOME to 741741 |
| 🇨🇦 **Canada** | Talk Suicide Canada: 1-833-456-4566<br>Crisis Text Line: Text HOME to 686868 |
| 🇦🇺 **Australia** | Lifeline: 13 11 14<br>Beyond Blue: 1300 22 4636 |
| 🇮🇪 **Ireland** | Samaritans: 116 123<br>Pieta House: 1800 247 247 |
| 🌍 **Other Countries** | Befrienders Worldwide: befrienders.org |

## 💡 How It Works

### The Conversation

Alice uses a carefully crafted system prompt that makes it:

- **Genuinely empathetic** - Validates emotions before problem-solving
- **Non-judgmental** - Honors that all feelings are valid
- **Safety-aware** - Subtly assesses for crisis indicators
- **Human-like** - Uses your words and metaphors, avoids clinical jargon
- **Appropriately boundaried** - Knows when to recommend professional help

### Technical Architecture

**Frontend (emotional-support-chatbot.html):**
- Single-page application with vanilla JavaScript
- Stores API key in browser localStorage
- Detects country via IP geolocation (ipapi.co API)
- Markdown parser for formatting bot responses
- Responsive design that works on mobile and desktop

**Backend (proxy-server.js):**
- Simple Node.js HTTP server
- Proxies requests to Anthropic API (bypasses CORS)
- Serves the HTML file
- No data persistence - completely stateless

## 🛠️ Customization

### Change the Conversation Style

Edit `emotional-support-chatbot.html` around **line 486** to modify the system prompt:

```javascript
const SYSTEM_PROMPT = `You are a compassionate emotional support companion...`
```

You can adjust:
- Tone and warmth level
- Response length
- How directive vs. reflective the bot is
- Crisis detection sensitivity

### Update the AI Model

Around **line 718**, change the model:

```javascript
model: 'claude-sonnet-4-5-20250929',  // Current model
```

Available Claude models:
- `claude-sonnet-4-5-20250929` (recommended - best balance)
- `claude-opus-4-20250514` (highest quality, slower, more expensive)
- `claude-3-5-haiku-20241022` (fastest, cheapest, lighter responses)

### Customize the Design

Edit the `<style>` section (lines 7-400) to change:
- **Colors:** Gradients, backgrounds, text colors
- **Message bubbles:** Border radius, padding, shadows
- **Animations:** Fade-in effects, typing indicator
- **Layout:** Spacing, button styles, header design

The design uses CSS custom properties, so you can easily theme it!

## 🔒 Security & Privacy

**What's Stored:**
- ✅ API key in browser localStorage (never sent to any server except Anthropic)
- ✅ Current conversation in browser memory (lost on page refresh)
- ❌ No server-side conversation storage
- ❌ No user accounts or authentication
- ❌ No analytics or tracking

**Geolocation:**
- Only detects your country (not city/address)
- Uses free ipapi.co service
- If it fails, bot still works but provides all countries' resources

**API Security:**
- Proxy server prevents direct API key exposure to browser
- CORS headers protect against cross-origin attacks
- API key never logged or stored server-side

**⚠️ For Production Use:**
- Run behind HTTPS/TLS (not HTTP)
- Implement rate limiting on proxy server
- Add authentication if storing conversations
- Consider HIPAA compliance requirements for health data

## 🐛 Troubleshooting

### "Load failed" or Connection Errors

**Problem:** Can't connect to Claude API

**Solutions:**
- Ensure proxy server is running: `node proxy-server.js`
- Check you're accessing `http://localhost:8080` (not `file://`)
- Verify API key is correct (starts with `sk-ant-`)
- Check Node.js console for error messages

### Country Not Detected

**Problem:** "Unknown" location shown in console

**Solutions:**
- Check browser console for errors
- ipapi.co may be blocked by firewall/VPN
- Turn off VPN temporarily
- It's okay - bot will still work and list all countries' resources

### Text Truncated or Formatting Issues

**Problem:** Message bubbles cut off or formatting broken

**Solutions:**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear localStorage: Open browser console and run `localStorage.clear()`
- Check if browser is up to date
- Try a different browser (Chrome, Firefox, Safari all supported)

### API Key Not Saving

**Problem:** Have to re-enter API key every time

**Solutions:**
- Check if browser blocks localStorage (privacy settings)
- Try a different browser
- Ensure cookies/site data are allowed for localhost
- Check browser console for errors

## 🔮 Future Enhancements

See [ROADMAP.md](ROADMAP.md) for the complete product vision.

**Short-term ideas:**
- **Voice input** - Speak instead of type
- **Session persistence** - Save conversations across page refreshes
- **Themes** - Dark mode, high contrast, colorblind-friendly
- **More languages** - Multi-language support beyond English
- **Mobile app** - Native iOS/Android versions

**Long-term vision:**
- **Therapist matching** - Connect users with human therapists
- **Outcome tracking** - Follow-up assessments over time
- **Blended care** - Coordinate AI + human therapy
- **Group support** - Facilitated peer support groups

## 📝 License

MIT - Feel free to use and modify for your needs.

## 🤝 Contributing

This is a personal project, but ideas and feedback are welcome!

- **Report bugs:** Open an issue on GitHub
- **Suggest features:** Describe your use case
- **Submit improvements:** Pull requests accepted

## 💬 About

**Why Alice?**

Mental health support should be accessible, immediate, and human. Alice provides a safe space for people to express themselves without judgment, while intelligently routing to professional help when needed.

**Built with:**
- Claude Sonnet 4.5 (Anthropic's latest AI model)
- Vanilla JavaScript (no frameworks = simple and fast)
- Node.js proxy (minimal backend)
- Love and care for mental health ❤️

---

**Questions?**
- Anthropic API docs: https://docs.anthropic.com
- Claude model info: https://www.anthropic.com/claude

**Emergency?**
If you're in crisis, please use the resources above or call emergency services (999 in UK, 911 in US).

---

*Built with ❤️ for better mental health access*
