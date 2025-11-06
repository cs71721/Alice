# Intake Assessment Reporting System

This document describes the comprehensive reporting and data storage functionality added to the Mental Health Intake Chatbot.

## Overview

The chatbot now includes a complete system for:
- **Storing** all intake session data in a SQLite database
- **Calculating** PHQ-9 and GAD-7 scores automatically
- **Generating** comprehensive therapist reports
- **Exporting** reports in multiple formats (HTML, Text, CSV)

## Features Added

### 1. Data Persistence

All intake data is now stored in a SQLite database (`server/intake_sessions.db`) including:
- Patient demographics (name, age, pronouns, location)
- Presenting concerns
- Individual PHQ-9 responses (all 9 questions with scores)
- Individual GAD-7 responses (all 7 questions with scores)
- Risk assessment data (suicidal ideation, self-harm, substance use)
- Therapy preferences
- Treatment goals
- Complete conversation history

### 2. Automated Scoring

The system automatically calculates:
- **PHQ-9 Total Score** (0-27 scale)
- **PHQ-9 Severity Level** (Minimal, Mild, Moderate, Moderately Severe, Severe)
- **GAD-7 Total Score** (0-21 scale)
- **GAD-7 Severity Level** (Minimal, Mild, Moderate, Severe)
- **Risk Level Assessment** (Low, Moderate, High)

### 3. Report Generation

Comprehensive therapist reports include:
- Patient information and demographics
- Presenting concerns
- Complete PHQ-9 assessment with question-by-question breakdown
- Complete GAD-7 assessment with question-by-question breakdown
- Risk assessment with safety recommendations
- Therapy preferences
- Treatment goals
- Clinical recommendations based on scores and risk factors

### 4. Export Formats

Reports can be exported in three formats:

#### HTML Report
- Professional, printable format
- Color-coded severity indicators
- Includes all assessment details
- Can be printed or saved as PDF

#### Text Report
- Plain text format for easy reading
- Includes all report sections
- Suitable for EHR copy-paste

#### CSV Export
- Data format for analytics
- Includes key metrics and scores
- Can be imported into spreadsheets

## API Endpoints

### Create Session
```
POST /api/session/create
```
Creates a new intake session and returns a session ID.

**Response:**
```json
{
  "sessionId": "uuid-v4-string"
}
```

### Chat Endpoint (Updated)
```
POST /api/chat
```
Now requires `sessionId` in addition to messages. Automatically extracts and stores assessment data.

**Request:**
```json
{
  "messages": [...],
  "sessionId": "uuid"
}
```

### Get Report
```
GET /api/report/:sessionId
```
Returns comprehensive report data as JSON.

### Export Text Report
```
GET /api/report/:sessionId/text
```
Downloads report as `.txt` file.

### Export CSV Report
```
GET /api/report/:sessionId/csv
```
Downloads report data as `.csv` file.

### Export HTML Report
```
GET /api/report/:sessionId/html
```
Opens formatted HTML report in new window (can be printed to PDF).

### Get All Sessions
```
GET /api/sessions
```
Returns list of all intake sessions with metadata.

## Database Schema

### intake_sessions
Stores main session information including demographics, scores, and metadata.

### phq9_responses
Individual responses to each PHQ-9 question with calculated scores.

### gad7_responses
Individual responses to each GAD-7 question with calculated scores.

### messages
Complete conversation history for each session.

## How It Works

### 1. Session Creation
When a user starts a chat, a session is automatically created with a unique ID.

### 2. Data Extraction
As the conversation progresses, Claude includes hidden markers in responses:
- `[NAME:John]` - Patient name
- `[AGE:25]` - Patient age
- `[PHQ9_Q1:several days]` - PHQ-9 response
- `[GAD7_Q1:nearly every day]` - GAD-7 response
- `[SUICIDAL_IDEATION:no]` - Risk assessment

These markers are:
- Extracted by the backend
- Stored in the database
- Removed before displaying to the user

### 3. Score Calculation
The system uses NLP-based text mapping to convert conversational responses into numeric scores:
- "Not at all" → 0
- "Several days" → 1
- "More than half the days" → 2
- "Nearly every day" → 3

### 4. Report Generation
When the intake is marked complete:
- All scores are calculated
- Risk level is assessed
- Clinical recommendations are generated based on severity
- Reports become available for viewing/export

## Clinical Scoring Reference

### PHQ-9 (Depression Screening)
- **0-4**: Minimal depression
- **5-9**: Mild depression
- **10-14**: Moderate depression
- **15-19**: Moderately severe depression
- **20-27**: Severe depression

### GAD-7 (Anxiety Screening)
- **0-4**: Minimal anxiety
- **5-9**: Mild anxiety
- **10-14**: Moderate anxiety
- **15-21**: Severe anxiety

### Risk Assessment
Combines multiple factors:
- Suicidal ideation with plan → HIGH risk
- PHQ-9 Q9 score ≥ 2 → HIGH risk
- Suicidal ideation without plan → MODERATE risk
- PHQ-9 score ≥ 20 → MODERATE risk
- Otherwise → LOW risk

## User Interface

### Completion Actions
When an intake is complete, users see buttons to:
1. **View Summary Report** - Opens modal with key findings
2. **View Full Report** - Opens detailed HTML report in new tab
3. **Download (TXT)** - Downloads text file
4. **Download (CSV)** - Downloads CSV for data analysis

### Report Modal
The summary modal displays:
- Patient information
- Presenting concern
- PHQ-9 score with severity indicator (color-coded)
- GAD-7 score with severity indicator (color-coded)
- Risk assessment with safety information
- Treatment goals
- Clinical recommendations

## Clinical Recommendations

The system automatically generates evidence-based recommendations:

**For Severe Depression (PHQ-9 ≥ 20):**
- Combined psychotherapy and pharmacotherapy
- Psychiatry consultation recommended

**For Moderate Depression (PHQ-9 10-19):**
- Psychotherapy recommended (CBT, IPT, or psychodynamic)
- Monitor symptoms closely

**For Severe Anxiety (GAD-7 ≥ 15):**
- Anxiety treatment indicated
- Consider medication evaluation

**For High Risk:**
- URGENT: Immediate safety assessment required
- Establish safety plan before discharge
- Schedule follow-up within 24-48 hours

## File Structure

```
server/
├── database.js           # Database initialization and operations
├── scoring.js            # PHQ-9/GAD-7 scoring algorithms
├── reportGenerator.js    # Report generation in multiple formats
├── index.js              # Updated API with new endpoints
└── intake_sessions.db    # SQLite database (created on first run)

client/src/
├── App.js                # Updated with report viewing UI
└── App.css               # Added styles for reports and modals
```

## Security & Privacy Considerations

### Current Implementation
- Data stored locally in SQLite database
- No authentication system (sessions not tied to user accounts)
- No encryption at rest

### For Production Use
You should implement:
1. **User Authentication** - Tie sessions to authenticated users
2. **HIPAA Compliance**:
   - Encrypt database at rest
   - Use TLS for all communications
   - Implement audit logging
   - Regular security audits
3. **Access Controls** - Role-based access for viewing reports
4. **Data Retention** - Policies for data archival and deletion
5. **Backup System** - Regular automated backups

## Future Enhancements

Potential additions:
- Multi-session tracking (follow-up assessments)
- Progress charts over time
- Provider dashboard to view all patient intakes
- Email notifications to therapists
- Integration with EHR systems
- Additional assessment tools (PCL-5, etc.)
- Secure patient portal for viewing own reports

## Troubleshooting

### Database Issues
If the database doesn't initialize:
1. Check write permissions in `/server` directory
2. Ensure SQLite is properly installed
3. Delete `intake_sessions.db` to reset

### Scoring Issues
If scores aren't calculated:
1. Check that Claude is including markers in responses
2. Verify the marker format matches expected patterns
3. Review server logs for extraction errors

### Missing Data in Reports
If some fields show "Not provided":
- This is expected if the conversation didn't cover those topics
- The system stores whatever data is collected
- Partial reports are still useful for therapists

## Development Notes

### Adding New Assessment Tools
To add a new assessment (e.g., PCL-5 for PTSD):
1. Add questions to scoring.js
2. Create table in database.js
3. Add extraction logic in server/index.js
4. Update report generation in reportGenerator.js

### Modifying Scoring Logic
Scoring algorithms are in `server/scoring.js` - the `mapResponseToScore()` function can be adjusted to improve accuracy of conversational response mapping.

## Support

For issues or questions:
1. Check server console logs for errors
2. Verify database was created successfully
3. Test API endpoints individually
4. Review Claude's responses for marker formatting

---

**Version:** 1.0.0
**Last Updated:** 2025
