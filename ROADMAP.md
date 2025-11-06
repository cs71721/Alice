# Product Roadmap: Mental Health Platform

## Vision

A comprehensive mental health platform that provides intelligent triage, smart therapist matching, and coordinated blended care to improve access and outcomes for mental health services.

---

## Complete User Journey

### Phase 1: Discovery & Fast Triage (0–10 minutes)

**User Experience:**
Alice lands on the service through search, GP referral, or an employee portal. She completes a comprehensive 6–10 minute intake that includes:

- **Demographics** - Basic information to contextualize care
- **Brief validated measures** - Standardized clinical assessments
  - PHQ-9 (depression screening)
  - GAD-7 (anxiety screening)
- **Urgent risk questions** - Immediate safety assessment
  - Suicidal ideation
  - Self-harm behaviors
  - Substance dependence
- **Preferences** - Personalized care options
  - Therapy style (CBT, psychodynamic, EMDR)
  - Availability and scheduling
  - Language preferences
  - Cost/budget considerations
- **Goals** - Treatment objectives and desired outcomes

**Safety Protocol:**
If risk is flagged, the platform immediately:
- Provides crisis guidance
- Routes to emergency care resources
- Escalates appropriately based on severity

**Status:** ✅ *Initial chatbot implementation complete*

---

### Phase 2: Smart Routing (seconds–minutes)

**User Experience:**
After intake completion, the platform runs a sophisticated matching engine that:

**Clinical Routing:**
- Analyzes severity + risk factors
- Recommends appropriate care tier:
  - Self-help modules (low intensity)
  - Guided iCBT (low-to-moderate)
  - High-intensity therapist (moderate-to-severe)
  - Psychiatry consultation (severe/complex)

**Therapist Matching:**
- Filters by clinical fit (specialisms, approach, experience)
- Checks availability (next open slots)
- Incorporates soft-fit signals:
  - Therapist areas of expertise
  - Client reviews and feedback
  - Historical outcomes data

**Presentation:**
Alice sees 3–6 best-match therapists presented as clear, plain-English cards showing:
- Next available appointment slot
- Price (if private practice)
- Therapy style and approach
- Estimated "fit score" with explanation (why this match?)
- Therapist bio and credentials

**Status:** 🔜 *Not yet implemented*

---

### Phase 3: Low-Commitment Trial

**User Experience:**
To reduce the risk of long-term mismatch, the platform offers:

**Options:**
- **Short discovery session** - 30-minute trial at reduced price
- **Introductory call** - 15-minute phone/video chat with therapist
- **Purpose** - Test therapeutic fit before committing to full treatment

**Benefits:**
- Reduces anxiety about choosing "wrong" therapist
- Lowers financial/time commitment barrier
- Increases long-term engagement and satisfaction

**Status:** 🔜 *Not yet implemented*

---

### Phase 4: Onboarding + Blended Care

**User Experience:**
Once a match is accepted, Alice receives comprehensive coordinated care:

**Initial Session:**
- Professional intake with matched therapist
- Development of personalized care plan:
  - Number of recommended sessions
  - Measurable goals with timelines
  - Treatment modality and approach

**Digital Support:**
- Access to matched digital CBT modules (if clinically appropriate)
- Self-help resources between sessions
- Psychoeducation materials

**Outcome Tracking:**
- Automated measurement-based care
- PHQ-9/GAD-7 repeated every 2–4 weeks
- Progress tracking against initial goals
- Therapist notes and session summaries

**Care Coordination:**
- With patient consent, shareable progress summaries
- Integration with GP for holistic care
- Reports to employer clinician (if applicable)
- Coordination across care team

**Status:** 🔜 *Not yet implemented*

---

### Phase 5: Active Waiting Management

**User Experience:**
If no immediate therapist is available, the platform provides interim support to prevent drop-out:

**Waiting Period Options:**
- **Guided iCBT** - Structured digital therapy program
- **Coach check-ins** - Regular support from trained coach
- **Priority waitlist** - Automatic notification when slots open

**Dynamic Re-matching:**
- Platform continuously monitors for better matches
- If a more suitable therapist becomes available, Alice is notified
- Reduces waitlist abandonment
- Maintains engagement during waiting period

**Benefits:**
- Prevents deterioration during wait times
- Maintains user engagement with service
- Provides some therapeutic benefit immediately
- Reduces no-shows when therapist becomes available

**Status:** 🔜 *Not yet implemented*

---

### Phase 6: Transparent Exit & Re-entry

**User Experience:**
Upon treatment completion, Alice receives comprehensive closure and future support:

**Exit Package:**
- **Outcomes report** - Visual summary of progress
  - Pre/post assessment scores
  - Goals achieved
  - Skills learned
- **Relapse prevention plan** - Personalized strategies
  - Warning signs to watch for
  - Coping techniques
  - When to seek help again
- **Fast re-entry route** - Simplified return process
  - If symptoms return, skip full intake
  - Priority access to previous therapist (if available)
  - Continuity of care

**Benefits:**
- Normalizes episodic care for mental health
- Reduces stigma of "needing help again"
- Makes re-engagement easy and quick
- Maintains relationship with service

**Status:** 🔜 *Not yet implemented*

---

## Implementation Priorities

### Current State
We have implemented the foundation:
- ✅ Conversational intake chatbot
- ✅ PHQ-9 and GAD-7 assessment collection
- ✅ Risk screening (suicidal ideation, self-harm, substance use)
- ✅ Preference collection (therapy style, availability, language, cost)
- ✅ Crisis detection with immediate resources
- ✅ Basic React/Node.js architecture

### Next Phases (Recommended Order)

1. **Data Persistence & Backend** (Foundation)
   - Database schema for intake data
   - User authentication and sessions
   - Secure data storage (HIPAA considerations)

2. **Smart Routing Engine** (Phase 2)
   - Clinical decision rules (severity → care tier)
   - Therapist database and profiles
   - Matching algorithm (clinical + availability + fit)
   - Presentation layer for therapist cards

3. **Onboarding & Outcome Tracking** (Phase 4)
   - Automated outcome measures (PHQ-9/GAD-7 scheduling)
   - Care plan templates
   - Digital CBT module integration
   - GP/employer sharing functionality

4. **Trial Sessions** (Phase 3)
   - Scheduling system for discovery calls
   - Payment integration (reduced pricing)
   - Feedback collection post-trial

5. **Waiting Management** (Phase 5)
   - iCBT module library
   - Coach matching and check-in system
   - Re-matching notification engine

6. **Exit & Re-entry** (Phase 6)
   - Outcomes report generation
   - Relapse prevention plan templates
   - Fast re-entry flow (skip full intake)

---

## Success Metrics

### Phase 1: Intake
- Completion rate (target: >85%)
- Time to complete (target: <12 minutes)
- Crisis detection accuracy
- User satisfaction score

### Phase 2: Matching
- Match acceptance rate (target: >70%)
- Time to first appointment (target: <7 days)
- Match quality (measured by retention)

### Phase 3-6: Engagement & Outcomes
- Treatment initiation rate (target: >80% of matches)
- Session attendance rate (target: >75%)
- Clinical improvement (PHQ-9/GAD-7 reduction)
- Re-engagement rate for episodic care

---

## Technical Considerations

### Scalability
- Cloud infrastructure (AWS/Azure/GCP)
- Load balancing for peak usage
- Database optimization for matching queries

### Security & Compliance
- HIPAA compliance (if US-based)
- Data encryption at rest and in transit
- Audit logging for all data access
- Business Associate Agreements with vendors

### Integrations
- EHR/EMR systems for GP coordination
- Calendar systems for scheduling
- Payment processors
- Video conferencing platforms
- iCBT/digital therapy platforms

---

## References

This roadmap describes the complete user experience journey. Use this document to:
- Guide feature prioritization
- Ensure consistency across development phases
- Communicate vision to stakeholders
- Measure progress against the complete vision

**Current Status:** Phase 1 (Intake) foundational implementation complete. Ready to proceed with data persistence and Phase 2 (Smart Routing).
