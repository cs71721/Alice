# Lava - Collaborative Document Editor

A real-time collaborative document editor with chat and AI-powered editing capabilities.

## Features

- **Split-screen interface**: Chat (40%) on the left, document (60%) on the right
- **Real-time chat**: Messages update every second via polling
- **AI-powered editing**: Use `@lava [instruction]` in chat to update the document
- **Change highlighting**: Document changes are highlighted in yellow for 3 seconds
- **Simple username system**: Just enter a username to join

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
3. **Use @lava commands** to update the document:
   - `@lava add a section about getting started`
   - `@lava make the heading bigger`
   - `@lava fix spelling errors`
4. **Watch the document update** with highlighted changes

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
Lava/
├── app/
│   ├── api/
│   │   ├── messages/route.js   # GET messages
│   │   ├── send/route.js       # POST new message + @lava handling
│   │   └── document/route.js   # GET document
│   ├── layout.js               # Root layout
│   ├── page.js                 # Main page (split screen)
│   └── globals.css             # Global styles
├── components/
│   ├── Chat.js                 # Chat component with polling
│   └── Document.js             # Document component with highlighting
├── lib/
│   ├── kv.js                   # Vercel KV utilities
│   └── openai.js               # OpenAI integration
├── .env.example                # Environment variables template
├── package.json                # Dependencies
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
3. OpenAI API is called with current document + instruction
4. Document is updated with AI-generated content
5. System message confirms the update
6. Document component highlights changed lines

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
