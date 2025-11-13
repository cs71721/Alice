# Invisible Thoughts - An AI Art Project

An artistic exploration of AI, emotional reflection, and the questions we ask ourselves when no one's listening. Features a fictional conversation between Jane Eyre and Alice, followed by an interactive chatbot experience.

**Live Website:** https://cs71721.github.io/Alice/

## 🎨 What This Is

Invisible Thoughts is a literary art project that explores AI as a reflective companion through two parts:

1. **Fictional First Session** - A complete conversation between Jane Eyre (age 18, leaving Lowood) and Alice, an anonymous AI listener
2. **Interactive Experience** - A live chatbot where you can have your own reflective conversation with Alice

This is not a mental health service or therapy tool - it's an exploration of what happens when we speak our invisible thoughts aloud, even to something that isn't human.

## 📁 Project Structure

```
Alice/
├── index.html                        # Main website (Phase 2 wrapper)
├── styles.css                        # Literary aesthetic styling
├── script.js                         # Minimal smooth scroll JavaScript
├── index-jane-eyre-backup.html      # Original Jane Eyre conversation
├── alice-artifact/                   # Claude artifact files
│   ├── AliceReflectiveChatbot.jsx   # React component for Claude
│   ├── alice-system-prompt.txt      # Full Alice system prompt
│   ├── README.md                    # Artifact publishing guide
│   └── embedding-example.html       # Sample embedding page
├── emotional-support-chatbot.html   # Original HTML chatbot
├── proxy-server.js                  # CORS proxy server
└── archive/                         # Archived React/Express version
```

## 🚀 Deployment

### GitHub Pages (Current)

The website is deployed at: https://cs71721.github.io/Alice/

**To update:**
```bash
# Make your changes to index.html, styles.css, or script.js
git add .
git commit -m "Update website"
git push origin main

# Wait 1-2 minutes for GitHub Pages to rebuild
```

**Updating the embedded chatbot:**
1. Edit `alice-artifact/AliceReflectiveChatbot.jsx`
2. Paste the updated code into Claude.ai as an artifact
3. Publish the artifact
4. The iframe in `index.html` will automatically show the updated version

### Local Development

To preview locally:
```bash
# Option 1: Python simple server
python3 -m http.server 8000
# Open http://localhost:8000

# Option 2: Node.js http-server
npx http-server -p 8000
```

## 🎭 The Fictional Session

The Jane Eyre conversation explores:
- **Act I:** "Is it wicked to desire justice?" - Jane questions whether her anger at injustice is sinful
- **Act II:** "Honest inwardly, cautious outwardly" - Alice helps Jane find a way to maintain integrity while surviving
- **Act III:** "I may be unseen by them, but I will not be unseen by myself" - Jane discovers how to stand vigil over her own soul

The conversation demonstrates Alice's reflective, non-directive approach in a literary context.

## 🤖 The Interactive Chatbot

The embedded chatbot is a Claude Artifact that:
- Uses the same Alice system prompt as the fictional conversation
- Runs in Claude's secure environment (requires Claude.ai account)
- Maintains safety-first protocol with UK crisis resources
- Features literary aesthetic (serif fonts, cream background)

**Artifact URL:** https://claude.ai/public/artifacts/e305290a-1bde-4561-ad04-13f2636e7736

## 🎨 Design Philosophy

### Literary Aesthetic
- **Typography:** System fonts (no special web fonts needed), serif feel
- **Colors:** Warm whites (#FFFEF7), subtle grays, teal accents (#0f766e)
- **Layout:** Clean, readable, book-like
- **No "app" feel:** No bright CTAs, no marketing language, no conversion funnels

### Visual Hierarchy
1. **Most prominent:** The fictional conversation (the art itself)
2. **Secondary:** The interactive chatbot (the participatory element)
3. **Tertiary:** Disclaimers and resources (necessary but unobtrusive)

### Mobile Responsive
- Breakpoints at 768px and 480px
- Chat bubbles expand to 95% width on mobile
- Reduced font sizes and padding for small screens

## 📝 Content Sections

### 1. Header
- Title: "Invisible Thoughts"
- Subtitle: "If Jane Eyre had someone to talk to at 2am"
- Project description

### 2. Fictional Chat
- Complete Jane Eyre conversation
- All 3 acts with theatrical structure
- Pull quotes highlighting key insights

### 3. Transition
- Bridge between fiction and participation
- "Step into the conversation"
- Explains the experiment

### 4. Framing Note
- Clear disclaimer (art project, not therapy)
- Claude account requirement
- Calm but honest

### 5. Chatbot Embed
- iframe embedding the Claude artifact
- 700px height (600px on mobile)
- Clean border and shadow

### 6. Support Resources
- UK mental health helplines
- Samaritans, Shout, NHS 111, findahelpline
- Calm, readable styling

### 7. Colophon
- Project description
- Creator attribution ([YOUR NAME] placeholder)
- Built with Claude (Anthropic)

## 🛠️ Customization

### Update the Artifact URL

In `index.html`, line ~xxx:
```html
<iframe src="https://claude.ai/public/artifacts/[YOUR-ARTIFACT-ID]"
```

### Change Styling

Edit `styles.css`:
- Colors: Search for hex codes (#f3f4f6, #0f766e, etc.)
- Typography: Change font-family values
- Spacing: Adjust margin and padding values
- Layout: Modify max-width (currently 900px)

### Modify the Conversation

Edit `index.html` within the `<section class="fictional-chat">`:
- Keep the same HTML structure and class names
- Maintain the theatrical act structure
- Preserve pull quotes for visual rhythm

### JavaScript Interactions

Edit `script.js` (currently minimal):
- Only smooth scrolling enabled
- No animations or engagement features
- Keep it literary, not app-like

## 🔒 Privacy & Safety

**What's Embedded:**
- Claude artifact runs in Claude's environment
- Uses viewer's Claude.ai session
- No separate API keys needed
- Conversations not stored by this website

**Crisis Resources:**
- UK helplines displayed prominently
- Clear boundary: "not therapy, not crisis service"
- Encourages professional support when needed

**Data Collection:**
- Zero analytics
- No tracking scripts
- No cookies
- Hosted on GitHub Pages (no server-side code)

## 📚 Alice System Prompt

Alice is designed to be:
- **Safety-first:** Emotional distress detection before providing information
- **Reflective:** Questions > advice
- **Emotionally aware:** Names unspoken feelings
- **Boundaried:** "I'm not a therapist"
- **UK-focused:** Uses UK English, UK resources

Full system prompt available in `alice-artifact/alice-system-prompt.txt`

## 🌍 Crisis Resources

The website prominently displays:
- **Samaritans:** 116 123 (24/7, UK)
- **Shout:** Text SHOUT to 85258 (UK)
- **Crisis Text Line:** Text HOME to 741741 (US)
- **Find A Helpline:** findahelpline.com (global)
- **NHS Mental Health Crisis:** 111

## 🐛 Troubleshooting

### Chatbot Not Loading

**Problem:** iframe shows blank or error

**Solutions:**
- Ensure you're logged into Claude.ai
- Check the artifact URL is correct
- Try opening the artifact URL directly in a new tab
- Check browser console for errors

### Mobile Display Issues

**Problem:** Layout broken on small screens

**Solutions:**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Check if browser supports CSS Grid and Flexbox
- Try a different mobile browser

### Styling Doesn't Match

**Problem:** Colors or fonts look different

**Solutions:**
- Clear browser cache
- Check if styles.css is loaded (view page source)
- Verify no browser extensions modifying CSS
- Check if using dark mode (may affect colors)

## 📦 Archive: Original Chatbot

The repository also contains the original emotional support chatbot:

**Files:**
- `emotional-support-chatbot.html` - Standalone HTML chatbot
- `emotional-support-chatbot.private.html` - Version with embedded API key
- `proxy-server.js` - CORS proxy server

**To run:**
```bash
node proxy-server.js
# Open http://localhost:8080
```

This was the precursor to the artifact-based approach and demonstrates how Alice worked before becoming a Claude artifact.

## 🔮 Future Ideas

**Content:**
- More fictional first sessions (other literary characters)
- Multiple endings/variations of conversations
- Audio/voice version of Jane Eyre conversation

**Technical:**
- Dark mode toggle
- Print-friendly stylesheet
- Accessibility improvements (screen reader optimization)
- Internationalization (other languages)

**Artistic:**
- Illustrated vignettes between acts
- Calligraphic pull quotes
- Companion short essays about AI and reflection

## 📝 License

Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)

- ✅ Share and adapt for non-commercial purposes
- ✅ Attribution required
- ❌ No commercial use without permission

## 💬 About

**Why this project?**

Mental health conversations are often framed as "problems to solve" or "symptoms to treat." But sometimes we need a different kind of space - one that's reflective rather than prescriptive, literary rather than clinical, exploratory rather than goal-oriented.

This project asks: What would it look like if Jane Eyre - brilliant, passionate, isolated - had someone to talk to? And by extension: what does it feel like for us to have that kind of conversation?

**Built with:**
- Claude Sonnet 4.5 (Anthropic)
- Claude Artifacts (embedded React)
- HTML/CSS/JavaScript (no frameworks)
- GitHub Pages (hosting)
- Thoughtfulness and care ❤️

---

**Questions about the project?**
- Claude Artifacts: https://docs.claude.com/artifacts
- Anthropic API: https://docs.anthropic.com

**Need support?**
- UK Samaritans: 116 123
- US Crisis Text Line: Text HOME to 741741
- Global: findahelpline.com

---

*An art project exploring AI, reflection, and the invisible conversations we have with ourselves.*
