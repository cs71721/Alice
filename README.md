# Invisible Thoughts - An AI Art Project

An artistic exploration of AI, emotional reflection, and the questions we ask ourselves when no one's listening. Features a fictional conversation between Jane Eyre and Alice, followed by an interactive chatbot experience.

**Live Website:** https://cs71721.github.io/Alice/

**This is not a mental health app.** It's a literary experiment: what happens when we step into a reflective conversation with an AI, knowing it cannot truly understand us, but might still help us understand ourselves?

---

## 🎨 What This Is

Invisible Thoughts is a literary art project that explores AI as a reflective companion through two parts:

1. **Fictional First Session** - A complete conversation between Jane Eyre (age 18, leaving Lowood) and Alice, an anonymous AI listener
2. **Interactive Experience** - A live chatbot where you can have your own reflective conversation with Alice

This is not a mental health service or therapy tool - it's an exploration of what happens when we speak our invisible thoughts aloud, even to something that isn't human.

## 🎭 Project Philosophy

This is an art project first, a technical artifact second. The goal is to create a space for reflection and emotional honesty, while being transparent about the limitations and boundaries of AI.

### Key Principles

- Frame as artistic/literary exploration, not mental health tool
- Never position Alice as a "companion" or replacement for human connection
- Be explicit that this is experimental, not therapeutic
- Provide clear pathways to real human support
- Respect the viewer's agency and intelligence

---

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

---

## 🚀 Setup Instructions

### STEP 1: Publish the Alice Artifact

1. Open Claude.ai and create the Alice artifact using the Phase 1 prompt (in `alice-artifact/AliceReflectiveChatbot.jsx`)
2. Test the artifact thoroughly - have a conversation to verify it works
3. Click the **"Publish"** button in the top right corner of the artifact
4. Click **"Get embed code"** in the dialog that appears
5. Copy the iframe URL (it will look like: `https://claude.site/public/artifacts/.../embed`)

### STEP 2: Update Your Website

1. Open `index.html` in your text editor
2. Find the iframe embed section (around line 782):
   ```html
   <iframe src="https://claude.site/public/artifacts/[YOUR-ARTIFACT-ID]/embed"
   ```
3. Replace `[YOUR-ARTIFACT-ID]` with your published artifact ID
4. Customize the colophon section:
   - Replace `[YOUR NAME]` placeholder with your actual name
   - Add any additional attribution you'd like
5. Save the file

### STEP 3: Test Locally

1. Open `index.html` in a web browser:
   ```bash
   # Option 1: Python simple server
   python3 -m http.server 8000
   # Open http://localhost:8000

   # Option 2: Node.js http-server
   npx http-server -p 8000
   ```
2. Read through the Jane Eyre conversation
3. Scroll to the transition section
4. Verify the Alice chatbot loads in the iframe
5. Test chat functionality (you'll need to be logged into Claude.ai)
6. Check that all sections display correctly
7. Test on mobile device or browser DevTools mobile view

### STEP 4: Deploy to GitHub Pages

**If creating a new repository:**
```bash
git init
git add .
git commit -m "Initial commit: Invisible Thoughts art project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

**Then enable GitHub Pages:**
1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (in left sidebar)
3. Under "Source", select **main** branch
4. Click **Save**
5. Your site will be live at: `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME`

**To update after deployment:**
```bash
# Make your changes to index.html, styles.css, or script.js
git add .
git commit -m "Update website"
git push origin main

# Wait 1-2 minutes for GitHub Pages to rebuild
```

### Alternative Deployment Options

#### Netlify (Easiest)
1. Go to https://app.netlify.com/drop
2. Drag your project folder onto the page
3. Your site is instantly live with a random URL

#### Vercel
1. Install Vercel CLI: `npm install -g vercel`
2. In your project folder: `vercel`
3. Follow the prompts

#### Other Options
- Cloudflare Pages
- Azure Static Web Apps
- AWS S3 + CloudFront

---

## 🔧 How It Works

### Technical Overview

- **The fictional chat** is static HTML - loads instantly, no dependencies
- **The embedded Alice chatbot** is a published Claude artifact
- **Users must be logged into Claude.ai** to use the chatbot
- **Chat uses viewer's Claude credits**, not yours
- **No backend needed** - all processing happens in Claude's infrastructure
- **No API keys to manage** - authentication handled by Claude.ai

### User Requirements

To chat with Alice, users need:
- A Claude.ai account (free or paid)
- To be logged in when they visit your site
- Available message credits (free tier includes daily messages)

### What Happens When Someone Chats

1. User types a message in the embedded iframe
2. Message is sent to Claude's API using their logged-in session
3. Alice (powered by Claude Sonnet 4.5) responds
4. Conversation is maintained in browser memory (not saved between sessions)
5. Uses viewer's message allocation, not your API quota

---

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
- Iframe height: 800px (desktop), 700px (mobile)

---

## 📝 Content Sections

### 1. Header
- Title: "Invisible Thoughts"
- Subtitle: "If Jane Eyre had someone to talk to at 2am"
- Project description

### 2. Fictional Chat
- Complete Jane Eyre conversation
- All 3 acts with theatrical structure:
  - **Act I:** "Is it wicked to desire justice?" - Jane questions whether her anger at injustice is sinful
  - **Act II:** "Honest inwardly, cautious outwardly" - Alice helps Jane find a way to maintain integrity while surviving
  - **Act III:** "I may be unseen by them, but I will not be unseen by myself" - Jane discovers how to stand vigil over her own soul
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
- 800px height (desktop), 700px (mobile)
- Clean border and shadow

### 6. Support Resources
- UK mental health helplines
- Samaritans, Shout, NHS 111, findahelpline
- Calm, readable styling

### 7. Colophon
- Project description
- Creator attribution ([YOUR NAME] placeholder)
- Built with Claude (Anthropic)

---

## 🛠️ Customization

### Update the Artifact

**Updating the embedded chatbot:**
1. Edit `alice-artifact/AliceReflectiveChatbot.jsx`
2. Paste the updated code into Claude.ai as an artifact
3. Publish the artifact
4. Update the iframe src in `index.html` with the new artifact ID
5. The website will automatically show the updated version

**Current artifact URL format:**
```html
<iframe src="https://claude.site/public/artifacts/e06425e6-00bc-4f20-b4c2-17889c8c0320/embed"
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

### Customization Ideas

#### Add More Fictional Conversations

Create additional fictional chats with other literary characters:
- Hamlet talking about existential anxiety
- Elizabeth Bennet discussing social expectations
- Holden Caulfield exploring teenage isolation
- Scout Finch processing childhood observations

Each fictional chat serves as a different "trailer" for the reflective experience.

#### Create a Gallery

If you get permission from users, you could:
- Collect anonymous reflections inspired by the experience
- Create a gallery of "invisible thoughts" (heavily anonymized)
- Invite artistic responses to the project

#### Expand the Art Series

Position this as part of a larger exploration:
- "What do we confess to machines that we won't tell humans?"
- "The aesthetics of AI empathy"
- "Digital confessionals and the performance of vulnerability"

#### Educational Context

For academic or exhibition contexts, you might add:
- Artist statement explaining your intentions
- Technical documentation of how AI reflective listening works
- References to relevant philosophy/literature
- Discussion questions for viewers

---

## 🤝 Ethical Considerations

### The Responsibility of Creating Reflective AI

This project walks a careful line between artistic exploration and emotional support. Some things to consider:

**The disclaimers are not legal boilerplate** - they're genuine boundaries. People in distress deserve human support, not language models.

**If someone reaches out about using this in crisis**, be prepared to:
- Respond with care (not defensiveness)
- Direct them to appropriate resources
- Consider whether you need to add additional safety messaging

**The "art project" framing is protective** - for you and for users. It signals:
- This is experimental, not proven
- The creator is an artist, not a clinician
- Engagement is voluntary and exploratory

**Monitor how people talk about the project**. If it starts being positioned as a mental health tool:
- Clarify the boundaries publicly
- Consider whether additional disclaimers are needed
- Be willing to take it down if it causes harm

### Privacy Considerations

- Conversations happen in Claude's infrastructure (see Anthropic's privacy policy)
- No conversation data comes to you (the site creator)
- Users control their own chat history in Claude.ai
- Zero analytics, no tracking scripts, no cookies
- Hosted on GitHub Pages (no server-side code)

### Accessibility

- Ensure the site works with screen readers
- Provide text alternatives for any images
- Use semantic HTML throughout
- Test keyboard navigation
- Consider offering the fictional chat in multiple formats

---

## 🔒 Privacy & Safety

### What's Embedded

- Claude artifact runs in Claude's environment
- Uses viewer's Claude.ai session
- No separate API keys needed
- Conversations not stored by this website

### Crisis Resources

The website prominently displays:
- **Samaritans:** 116 123 (24/7, UK)
- **Shout:** Text SHOUT to 85258 (UK)
- **Crisis Text Line:** Text HOME to 741741 (US)
- **Find A Helpline:** findahelpline.com (global)
- **NHS Mental Health Crisis:** 111

**Clear boundaries:**
- "Not therapy, not crisis service"
- Encourages professional support when needed
- Resources displayed prominently

### Data Collection

- Zero analytics
- No tracking scripts
- No cookies
- Hosted on GitHub Pages (no server-side code)

---

## 📚 Alice System Prompt

Alice is designed to be:
- **Safety-first:** Emotional distress detection before providing information
- **Reflective:** Questions > advice
- **Emotionally aware:** Names unspoken feelings
- **Boundaried:** "I'm not a therapist"
- **UK-focused:** Uses UK English, UK resources

Full system prompt available in `alice-artifact/alice-system-prompt.txt`

---

## 🐛 Troubleshooting

### Chatbot Not Loading

**Problem:** iframe shows blank or error

**Solutions:**
- Ensure you're logged into Claude.ai
- Check the artifact URL is correct and includes `/embed`
- Verify artifact is set to "Published" (not just "Shared")
- Try opening the artifact URL directly in a new tab
- Check browser console for errors
- Check if there are Claude.ai service disruptions

### Mobile Display Issues

**Problem:** Layout broken on small screens

**Solutions:**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Check if browser supports CSS Grid and Flexbox
- Try a different mobile browser
- Verify viewport meta tag is in HTML
- Check iframe height settings for mobile

### Styling Doesn't Match

**Problem:** Colors or fonts look different

**Solutions:**
- Clear browser cache
- Check if styles.css is loaded (view page source)
- Verify no browser extensions modifying CSS
- Check if using dark mode (may affect colors)

### Chat Doesn't Work When I Click Send

**Problem:** Message won't send in chatbot

**Solutions:**
- You must be logged into Claude.ai
- Check that you have available message credits
- Try the artifact directly at its published URL to isolate the issue
- Verify the artifact ID is correct in the iframe src

---

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

---

## 🔮 Future Ideas

### Content
- More fictional first sessions (other literary characters)
- Multiple endings/variations of conversations
- Audio/voice version of Jane Eyre conversation
- Gallery of anonymous user reflections (with permission)

### Technical
- Dark mode toggle
- Print-friendly stylesheet
- Accessibility improvements (screen reader optimization)
- Internationalization (other languages)

### Artistic
- Illustrated vignettes between acts
- Calligraphic pull quotes
- Companion short essays about AI and reflection
- Exhibition materials for galleries
- Workshop/discussion guide

---

## 📋 Changelog

### Version 1.0 (November 2025)
- Initial public release
- Jane Eyre fictional conversation (3 acts)
- Embedded Alice chatbot (Claude Sonnet 4.5)
- Literary aesthetic design
- UK mental health resources
- Deployed to GitHub Pages
- Mobile responsive design
- Artifact ID: `e06425e6-00bc-4f20-b4c2-17889c8c0320`

---

## 📝 License

Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)

- ✅ Share and adapt for non-commercial purposes
- ✅ Attribution required
- ❌ No commercial use without permission

---

## 💬 About

### Why this project?

Mental health conversations are often framed as "problems to solve" or "symptoms to treat." But sometimes we need a different kind of space - one that's reflective rather than prescriptive, literary rather than clinical, exploratory rather than goal-oriented.

This project asks: What would it look like if Jane Eyre - brilliant, passionate, isolated - had someone to talk to? And by extension: what does it feel like for us to have that kind of conversation?

### Built with

- Claude Sonnet 4.5 (Anthropic)
- Claude Artifacts (embedded React)
- HTML/CSS/JavaScript (no frameworks)
- GitHub Pages (hosting)
- Thoughtfulness and care

---

## ✅ Final Checklist

### Before deploying:
- [ ] Alice artifact tested and published
- [ ] iframe URL updated in index.html with `/embed` suffix
- [ ] Your name added to colophon (or left as placeholder)
- [ ] All HTML validated (use https://validator.w3.org/)
- [ ] CSS validated
- [ ] Tested on desktop browser
- [ ] Tested on mobile device
- [ ] All links work
- [ ] UK mental health resources are accurate and current
- [ ] Disclaimers are clear
- [ ] README is complete
- [ ] Privacy considerations documented
- [ ] Ethical framework is clear

### After deploying:
- [ ] Test live site on multiple devices
- [ ] Verify embedded chatbot works
- [ ] Check loading times
- [ ] Monitor for any user feedback
- [ ] Have a plan for handling concerning messages
- [ ] Share thoughtfully with appropriate framing

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

**Remember**: This is art first, technology second. The goal is to create a space for reflection and inquiry, not to solve problems or replace human connection. Approach it with the seriousness and care that emotional work deserves.
