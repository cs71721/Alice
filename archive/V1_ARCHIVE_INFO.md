# Alice Version 1 - Archive Information

**Archive Date**: November 7, 2025
**Archive Location**: `/archive/v1/`
**Archive Branch**: `claude/archive-alice-v1-011CUtSzT259yfxghggqessq`
**Version Tag**: `v1.0.0`

## What's Archived

This directory contains the complete Version 1 of the Alice Mental Health Chatbot, including:

### Application Code
- `client/` - React frontend application
- `server/` - Node.js backend with Express
- `mental-health-chatbot-v2.jsx` - Reference component

### Configuration & Setup
- `package.json` - Project dependencies
- `package-lock.json` - Dependency lock file
- `setup.sh` - Setup script

### Documentation
- `README.md` - Main project documentation
- `QUICKSTART.md` - Quick start guide
- `REPORTING.md` - Reporting system documentation
- `ROADMAP.md` - Feature roadmap

## Version 1 Features

- AI-powered conversational interface using Claude
- Comprehensive intake assessment system
- Mental health scoring (PHQ-9, GAD-7, risk assessment)
- Clinical report generation with visualizations
- SQLite database for client and assessment management
- Full documentation suite

## Accessing Version 1

### View the Code
All v1 source code is available in this directory (`/archive/v1/`).

### Checkout the Archive Branch
```bash
git checkout claude/archive-alice-v1-011CUtSzT259yfxghggqessq
```

### View the Tagged Release
```bash
git checkout v1.0.0
```

## Running Version 1

To run the archived v1 application:

```bash
cd archive/v1
npm install
cd client && npm install && cd ..
./setup.sh
```

See `README.md` in this directory for detailed setup instructions.

## Transition to Version 2

Version 1 has been archived to preserve the initial implementation while allowing for a clean start with Version 2. The lessons learned and foundational concepts from v1 will inform v2 development.

---

For current development, see the main project README at `/README.md`
