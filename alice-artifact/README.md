# Alice - Reflective Chatbot (Claude Artifact)

A warm, emotionally intelligent wellbeing chatbot designed for thoughtful conversations about feelings, relationships, and everyday challenges. Built as a Claude artifact for easy publishing and embedding.

## What is This?

This is a **Claude Artifact** - React code that runs in Claude.ai's environment. When published, it becomes a shareable, embeddable web application that uses the viewer's Claude.ai session (no API keys needed).

## Features

- **Safety-First Protocol**: Prioritises emotional safety before providing information
- **Reflective Listening**: Empathetic, non-directive conversation style
- **Literary Design**: Serif fonts, cream background, minimalist book-page aesthetic
- **UK Mental Health Resources**: Crisis support information in footer
- **Session Memory**: Maintains conversation context within each session
- **No Storage**: Conversations are not saved between sessions

## Files in This Folder

```
alice-artifact/
├── AliceReflectiveChatbot.jsx    # Main React component (paste into Claude)
├── alice-system-prompt.txt        # Full system prompt for reference
├── README.md                      # This file
└── embedding-example.html         # Sample HTML for embedding
```

## How to Publish This Artifact

### Step 1: Create the Artifact in Claude.ai

1. Go to [claude.ai](https://claude.ai) and start a new conversation
2. Tell Claude: "Create a React artifact with the following code:"
3. Copy the **entire contents** of `AliceReflectiveChatbot.jsx`
4. Paste it into the chat
5. Claude will create an interactive artifact that you can test immediately

### Step 2: Test the Artifact

- Type messages in the chat interface
- Verify Alice responds with empathy and reflection
- Check that the API calls work (they should work automatically in Claude's environment)
- Test the responsive design on different screen sizes

### Step 3: Publish the Artifact

1. Click the **"Publish"** button in the artifact preview
2. Give it a name: "Alice - Reflective Chatbot"
3. Add a description (optional)
4. Claude will generate a **shareable link** like:
   ```
   https://claude.site/artifacts/[artifact-id]
   ```
5. **Save this link** - this is your published artifact URL

### Step 4: Get the Embed Code

After publishing, you'll have two options:

**Option A: Direct Link**
- Share the `claude.site` URL directly
- Anyone with a Claude account can access it
- Opens in Claude's artifact viewer

**Option B: Embed via iframe** (Recommended for your website)
```html
<iframe
  src="https://claude.site/artifacts/[your-artifact-id]"
  width="100%"
  height="800px"
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 8px;"
></iframe>
```

## Embedding on Your GitHub Pages Site

You have two options for adding Alice to your website:

### Option 1: Separate Page

Create a new file `alice.html` in your Alice repository:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alice - Reflective Chatbot</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f3f4f6;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    h1 {
      text-align: center;
      margin-bottom: 2rem;
      color: #111827;
    }
    iframe {
      display: block;
      margin: 0 auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Alice - Reflective Chatbot</h1>
    <iframe
      src="https://claude.site/artifacts/[your-artifact-id]"
      width="100%"
      height="800px"
      frameborder="0"
    ></iframe>
  </div>
</body>
</html>
```

Then access it at: `https://cs71721.github.io/Alice/alice.html`

### Option 2: Add to Existing index.html

Add the iframe to your current `index.html` (the Jane Eyre page):

```html
<!-- Add this section after the Jane Eyre content -->
<div style="max-width: 900px; margin: 4rem auto; padding: 0 1.5rem;">
  <h2 style="font-size: 2rem; margin-bottom: 1rem;">Talk to Alice</h2>
  <p style="margin-bottom: 2rem; color: #6b7280;">
    Alice is a reflective chatbot designed for thoughtful conversations
    about feelings, relationships, and everyday challenges.
  </p>
  <iframe
    src="https://claude.site/artifacts/[your-artifact-id]"
    width="100%"
    height="800px"
    frameborder="0"
    style="border: 1px solid #e5e7eb; border-radius: 8px;"
  ></iframe>
</div>
```

## Updating the Artifact

If you need to make changes:

1. Go back to your Claude.ai conversation where you created the artifact
2. Say: "Update the artifact with this new code:"
3. Paste the modified `AliceReflectiveChatbot.jsx`
4. The published version will update automatically
5. **The embed URL stays the same** - no need to change your website code

## Technical Details

### API Usage

- **Model**: `claude-sonnet-4-20250514`
- **Max Tokens**: 2000 per response
- **Authentication**: Automatic via Claude.ai viewer session
- **Cost**: Free for Claude Pro subscribers viewing the artifact

### System Prompt

The full Alice system prompt is embedded in the component. It includes:
- Safety-first emotional distress detection
- Tiered reflection protocol (mild/moderate/crisis)
- Reflective inquiry over directive advice
- UK English language style
- Clear boundaries around non-clinical support

### Design Specifications

- **Font**: Crimson Text (Google Fonts) fallback to Georgia, Garamond
- **Background**: `#FFFEF7` (warm cream)
- **Text**: `#111827` (near-black)
- **Font Size**: 17px body, 1.7 line-height
- **Responsive**: Works on mobile and desktop
- **Accessibility**: Semantic HTML, keyboard navigation support

## Privacy & Safety

- **No Data Storage**: Conversations are not saved between sessions
- **Session-Only Memory**: Alice remembers context within one conversation
- **No Analytics**: No tracking or analytics embedded
- **Crisis Resources**: UK and US crisis helplines displayed in footer
- **Not a Substitute**: Clear disclaimers about professional support

## Support & Resources

### UK Crisis Support
- **Samaritans**: 116 123 (24/7)
- **Shout**: Text SHOUT to 85258 (24/7)
- **[Find A Helpline](https://findahelpline.com)**: Global crisis support

### US Crisis Support
- **Crisis Text Line**: Text HOME to 741741 (24/7)

## Troubleshooting

### Artifact not responding
- Ensure you're logged into Claude.ai
- Check browser console for errors
- Try refreshing the artifact

### API errors
- Claude artifact environment handles authentication automatically
- If seeing auth errors, the artifact viewer may need to log into Claude.ai
- Free Claude users may hit rate limits

### Iframe not loading
- Check the artifact URL is correct
- Ensure the artifact is published (not just created)
- Some browsers may block iframes - check browser console

### Styling issues
- The artifact uses inline styles and imports Google Fonts
- If fonts don't load, it falls back to Georgia/Garamond
- Mobile responsive design should work automatically

## License

This chatbot is designed for wellbeing support and education. Not for medical diagnosis or treatment. Always consult qualified professionals for mental health care.

## Credits

Built with React and Claude API. Design inspired by literary aesthetics and calm, reflective spaces.
