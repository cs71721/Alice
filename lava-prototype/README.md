# Lava - Collaborative Document Editor

A real-time collaborative document editor with chat and AI-powered editing capabilities.

## Features

### Core Features
- **Split-screen interface**: Chat (40%) on the left, document (60%) on the right
- **Real-time updates**: Chat and document poll every second
- **Simple username system**: Just enter a username to join
- **Change highlighting**: Document changes are highlighted in yellow for 3 seconds

### Document Editing
- **Direct editing**: Click "Edit" button to modify document directly
- **AI-powered editing**: Use `@lava [instruction]` for AI assistance
- **Smart edit summaries**: See what changed (e.g., "Changed title to 'New Title'")
- **Edit attribution**: All edits show who made them in chat
- **Document versioning**: Track version numbers (v1, v2, etc.)

### AI Capabilities
- **Intent-based routing**: Three AI modes automatically selected
  - **EDIT mode**: Precise document modifications
  - **CREATE mode**: Generate new content
  - **CHAT mode**: Answer questions without editing
- **Context-aware**: AI understands chat history and references
- **Token management**: Accurate GPT-4 token counting with tiktoken

### Collaboration
- **Conflict resolution**: CAS (Compare-And-Swap) prevents lost updates
- **Audit trail**: All changes logged in chat with username and summary
- **Version tracking**: See document version in header

## Tech Stack

- **Next.js 14** (App Router)
- **Tailwind CSS** for styling
- **Vercel KV** for data storage (messages and document state)
- **OpenAI API** for AI-powered document updates

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Vercel KV (get from Vercel Dashboard > Storage > KV)
KV_URL=your_kv_url_here
KV_REST_API_URL=your_kv_rest_api_url_here
KV_REST_API_TOKEN=your_kv_rest_api_token_here
KV_REST_API_READ_ONLY_TOKEN=your_kv_rest_api_read_only_token_here

# OpenAI (get from platform.openai.com)
OPENAI_API_KEY=sk-your_openai_api_key_here
```

### 3. Set Up Vercel KV

1. Go to [vercel.com](https://vercel.com)
2. Navigate to **Storage** → **Create Database** → **KV**
3. Create a new KV database
4. Copy the environment variables to your `.env.local`

### 4. Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account or sign in
3. Navigate to **API Keys** and create a new key
4. Add it to your `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Enter your username** to join the chat
2. **Send messages** to communicate with other users
3. **Edit the document** in two ways:
   - **Direct editing**: Click "Edit" button, make changes, press Save (Cmd+S)
   - **AI assistance**: Use `@lava [instruction]` in chat
4. **@lava command examples**:
   - `@lava add a section about getting started`
   - `@lava change the title to "Project Overview"`
   - `@lava fix spelling errors`
   - `@lava what do you think about this approach?` (chat without editing)
5. **Watch changes in real-time**:
   - Yellow highlighting shows recent changes
   - Chat logs show who made edits and what changed
   - Version number updates with each change

## Deployment to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

Vercel will automatically:
- Build your Next.js app
- Connect to your Vercel KV database
- Set up the production environment

## Project Structure

```
lava-prototype/
├── app/
│   ├── api/
│   │   ├── messages/route.js   # GET messages
│   │   ├── send/route.js       # POST new message + @lava handling
│   │   └── document/route.js   # GET/PUT document with versioning
│   ├── layout.js               # Root layout
│   ├── page.js                 # Main page (split screen)
│   └── globals.css             # Global styles
├── components/
│   ├── Chat.js                 # Chat with polling and username entry
│   └── Document.js             # Document viewer/editor with versioning
├── lib/
│   ├── kv.js                   # Vercel KV utilities with versioning
│   ├── documentEngine.js       # AI intent detection and routing
│   └── tokenCounter.js         # Accurate GPT-4 token counting
├── .env.example                # Environment variables template
├── package.json                # Dependencies (includes tiktoken, diff)
├── tailwind.config.js          # Tailwind configuration
└── README.md                   # This file
```

## How It Works

### Real-time Updates

- Chat and document poll their respective API endpoints every second
- Messages are stored in Vercel KV as an array
- Document is stored in Vercel KV with content and timestamp

### @lava Commands

When a message contains `@lava [instruction]`:

1. The message is added to chat normally
2. System detects the @lava pattern
3. **DocumentEngine** determines intent:
   - **EDIT**: Mechanical changes (formatting, moving text)
   - **CREATE**: Generate new content (writing sections)
   - **CHAT**: Answer questions without modifying document
4. Appropriate GPT-4 handler is called with:
   - Role-specific prompt and temperature
   - Adaptive context (20-100 messages based on intent)
   - Current document content
5. For EDIT/CREATE: Document is updated with versioning
6. Chat logs show: username, version, and semantic summary

### Direct Editing

When clicking the "Edit" button:

1. Document switches to editable textarea mode
2. User makes changes (supports Cmd+S to save, Escape to cancel)
3. On save, system checks for version conflicts (CAS)
4. If conflict: Shows who edited and offers refresh or manual merge
5. If no conflict: Updates document with new version
6. Chat logs: "Username: 📝 Manual edit (v3): Changed title to 'New Title'"
7. Smart summaries detect what changed using diff library

### Change Highlighting

- Document component compares old and new content line-by-line
- Changed lines are marked with yellow background
- Highlights fade after 3 seconds

## Troubleshooting

**Messages not updating?**
- Check that Vercel KV environment variables are correct
- Check browser console for errors

**@lava not working?**
- Verify OpenAI API key is correct
- Check API route logs for errors
- Ensure you have credits in your OpenAI account

**Build errors?**
- Run `npm install` to ensure all dependencies are installed
- Check that all environment variables are set

## License

MIT
