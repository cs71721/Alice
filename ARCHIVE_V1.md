# Alice Mental Health Chatbot - Version 1 Archive

**Archive Date:** November 7, 2025
**Archive Branch:** `claude/archive-alice-v1-011CUtSzT259yfxghggqessq`
**Version Tag:** `v1.0.0`

## Overview

This is the archived version 1 of the Alice Mental Health Chatbot project. This version represents the initial implementation of a mental health assessment and support system with AI-powered conversations, intake assessments, and reporting capabilities.

## Version 1 Features

### Core Functionality
- **AI-Powered Chat Interface**: Interactive mental health support chatbot
- **Intake Assessment System**: Comprehensive mental health screening
- **Risk Assessment & Scoring**: PHQ-9, GAD-7, and custom risk evaluation
- **Report Generation**: Detailed clinical reports with visualizations
- **Client Management**: Database-backed client information storage

### Technology Stack
- **Frontend**: React application (client/)
- **Backend**: Node.js with Express (server/)
- **Database**: SQLite for data persistence
- **AI Integration**: Claude AI API for conversational support

## Project Structure

```
Alice/
├── client/              # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── App.js      # Main application component
│   │   ├── index.js
│   │   └── styles
│   └── package.json
├── server/              # Node.js backend
│   ├── index.js         # Main server entry point
│   ├── database.js      # SQLite database management
│   ├── scoring.js       # Assessment scoring logic
│   └── reportGenerator.js  # Report generation
├── README.md            # Project documentation
├── QUICKSTART.md        # Quick setup guide
├── REPORTING.md         # Reporting system documentation
├── ROADMAP.md           # Future development plans
├── mental-health-chatbot-v2.jsx  # Component reference
├── package.json         # Root dependencies
└── setup.sh            # Setup script
```

## Documentation Files

- **README.md**: Main project documentation and setup instructions
- **QUICKSTART.md**: Fast-track setup guide for developers
- **REPORTING.md**: Detailed reporting functionality documentation
- **ROADMAP.md**: Feature roadmap and future development plans

## Key Components

### Server Components
- `server/index.js`: Express server with API endpoints
- `server/database.js`: SQLite database schema and operations
- `server/scoring.js`: Mental health assessment scoring algorithms
- `server/reportGenerator.js`: Clinical report generation with chart creation

### Client Components
- `client/src/App.js`: Main React application with chat interface
- Intake assessment forms
- Results visualization

## Setup & Configuration

### Environment Variables
See `.env.example` for required configuration:
- `ANTHROPIC_API_KEY`: Claude AI API key
- `PORT`: Server port (default: 3001)

### Installation
```bash
npm install
cd client && npm install
```

### Running the Application
```bash
# Development mode
npm run dev

# Or use setup script
./setup.sh
```

## Database Schema

The SQLite database includes tables for:
- Clients
- Assessments
- Chat history
- Risk scores

## Known Limitations & Future Improvements

See ROADMAP.md for planned enhancements that may be carried forward to v2.

## Version History

- **v1.0.0** (November 7, 2025): Initial release
  - Core chat functionality
  - Intake assessment system
  - Report generation
  - Client database management

## Transition to Version 2

This version is archived to preserve the initial implementation. Version 2 will build upon these foundations with improvements and new features as specified in the v2 requirements.

## License & Acknowledgments

Developed using Claude AI by Anthropic for mental health support and assessment.

---

**Note**: This is an archived version. For the latest version, see the main development branch or v2 documentation.
