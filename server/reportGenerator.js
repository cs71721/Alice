const { dbOperations } = require('./database');
const { calculatePHQ9Score, calculateGAD7Score } = require('./scoring');

/**
 * Generate comprehensive therapist report
 */
async function generateTherapistReport(sessionId) {
  try {
    // Fetch all data
    const session = await dbOperations.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const phq9Responses = await dbOperations.getPHQ9Responses(sessionId);
    const gad7Responses = await dbOperations.getGAD7Responses(sessionId);
    const messages = await dbOperations.getMessages(sessionId);

    // Calculate scores
    const phq9Results = phq9Responses.length > 0 ? calculatePHQ9Score(phq9Responses) : null;
    const gad7Results = gad7Responses.length > 0 ? calculateGAD7Score(gad7Responses) : null;

    // Build report
    const report = {
      metadata: {
        sessionId: session.id,
        sessionDate: formatDate(session.session_date),
        completedAt: session.completed_at ? formatDate(session.completed_at) : 'In Progress',
        status: session.status
      },
      patientInfo: {
        name: session.patient_name || 'Not provided',
        age: session.age || 'Not provided',
        pronouns: session.pronouns || 'Not provided',
        location: session.location || 'Not provided'
      },
      presentingConcern: session.presenting_concern || 'Not documented',
      assessmentScores: {
        phq9: phq9Results ? {
          totalScore: phq9Results.totalScore,
          severity: phq9Results.severity,
          maxPossible: phq9Results.maxPossible,
          interpretation: phq9Results.interpretation,
          responses: phq9Responses.map(r => ({
            question: r.question_text,
            response: r.response_text,
            score: r.score
          }))
        } : null,
        gad7: gad7Results ? {
          totalScore: gad7Results.totalScore,
          severity: gad7Results.severity,
          maxPossible: gad7Results.maxPossible,
          interpretation: gad7Results.interpretation,
          responses: gad7Responses.map(r => ({
            question: r.question_text,
            response: r.response_text,
            score: r.score
          }))
        } : null
      },
      riskAssessment: {
        suicidalIdeation: session.suicidal_ideation === 1 ? 'Yes' : session.suicidal_ideation === 0 ? 'No' : 'Not assessed',
        suicidalPlan: session.suicidal_plan === 1 ? 'Yes' : session.suicidal_plan === 0 ? 'No' : 'Not assessed',
        selfHarm: session.self_harm === 1 ? 'Yes' : session.self_harm === 0 ? 'No' : 'Not assessed',
        substanceUse: session.substance_use === 1 ? 'Yes' : session.substance_use === 0 ? 'No' : 'Not assessed',
        safetyConcerns: session.safety_concerns || 'None documented',
        riskLevel: assessRiskLevel(session, phq9Responses)
      },
      therapyPreferences: {
        approach: session.therapy_approach || 'Not specified',
        scheduling: session.scheduling_preference || 'Not specified',
        language: session.language_preference || 'Not specified',
        costInsurance: session.cost_insurance || 'Not specified',
        therapistPreferences: session.therapist_preferences || 'Not specified'
      },
      treatmentGoals: session.treatment_goals || 'Not documented',
      clinicalRecommendations: generateRecommendations(session, phq9Results, gad7Results),
      conversationSummary: messages.length > 0 ? summarizeConversation(messages) : 'No messages recorded'
    };

    return report;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
}

/**
 * Generate formatted text report for export
 */
async function generateTextReport(sessionId) {
  const report = await generateTherapistReport(sessionId);

  let text = '';
  text += '═══════════════════════════════════════════════════════════════\n';
  text += '                 MENTAL HEALTH INTAKE ASSESSMENT REPORT\n';
  text += '═══════════════════════════════════════════════════════════════\n\n';

  // Metadata
  text += '📋 SESSION INFORMATION\n';
  text += '─────────────────────────────────────────────────────────────\n';
  text += `Session ID:      ${report.metadata.sessionId}\n`;
  text += `Session Date:    ${report.metadata.sessionDate}\n`;
  text += `Completed:       ${report.metadata.completedAt}\n`;
  text += `Status:          ${report.metadata.status.toUpperCase()}\n\n`;

  // Patient Info
  text += '👤 PATIENT INFORMATION\n';
  text += '─────────────────────────────────────────────────────────────\n';
  text += `Name:            ${report.patientInfo.name}\n`;
  text += `Age:             ${report.patientInfo.age}\n`;
  text += `Pronouns:        ${report.patientInfo.pronouns}\n`;
  text += `Location:        ${report.patientInfo.location}\n\n`;

  // Presenting Concern
  text += '💭 PRESENTING CONCERN\n';
  text += '─────────────────────────────────────────────────────────────\n';
  text += `${report.presentingConcern}\n\n`;

  // PHQ-9 Results
  if (report.assessmentScores.phq9) {
    text += '📊 PHQ-9 DEPRESSION SCREENING\n';
    text += '─────────────────────────────────────────────────────────────\n';
    text += `Total Score:     ${report.assessmentScores.phq9.totalScore}/${report.assessmentScores.phq9.maxPossible}\n`;
    text += `Severity:        ${report.assessmentScores.phq9.severity}\n`;
    text += `Interpretation:  ${report.assessmentScores.phq9.interpretation}\n\n`;
    text += 'Question-by-Question Responses:\n';
    report.assessmentScores.phq9.responses.forEach((r, idx) => {
      text += `  ${idx + 1}. ${r.question}\n`;
      text += `     Response: ${r.response}\n`;
      text += `     Score: ${r.score}/3\n\n`;
    });
  }

  // GAD-7 Results
  if (report.assessmentScores.gad7) {
    text += '📊 GAD-7 ANXIETY SCREENING\n';
    text += '─────────────────────────────────────────────────────────────\n';
    text += `Total Score:     ${report.assessmentScores.gad7.totalScore}/${report.assessmentScores.gad7.maxPossible}\n`;
    text += `Severity:        ${report.assessmentScores.gad7.severity}\n`;
    text += `Interpretation:  ${report.assessmentScores.gad7.interpretation}\n\n`;
    text += 'Question-by-Question Responses:\n';
    report.assessmentScores.gad7.responses.forEach((r, idx) => {
      text += `  ${idx + 1}. ${r.question}\n`;
      text += `     Response: ${r.response}\n`;
      text += `     Score: ${r.score}/3\n\n`;
    });
  }

  // Risk Assessment
  text += '⚠️  RISK ASSESSMENT\n';
  text += '─────────────────────────────────────────────────────────────\n';
  text += `Risk Level:       ${report.riskAssessment.riskLevel}\n`;
  text += `Suicidal Ideation: ${report.riskAssessment.suicidalIdeation}\n`;
  text += `Suicidal Plan:     ${report.riskAssessment.suicidalPlan}\n`;
  text += `Self-Harm:         ${report.riskAssessment.selfHarm}\n`;
  text += `Substance Use:     ${report.riskAssessment.substanceUse}\n`;
  text += `Safety Concerns:   ${report.riskAssessment.safetyConcerns}\n\n`;

  // Therapy Preferences
  text += '🎯 THERAPY PREFERENCES\n';
  text += '─────────────────────────────────────────────────────────────\n';
  text += `Approach:         ${report.therapyPreferences.approach}\n`;
  text += `Scheduling:       ${report.therapyPreferences.scheduling}\n`;
  text += `Language:         ${report.therapyPreferences.language}\n`;
  text += `Cost/Insurance:   ${report.therapyPreferences.costInsurance}\n`;
  text += `Therapist Prefs:  ${report.therapyPreferences.therapistPreferences}\n\n`;

  // Treatment Goals
  text += '🎯 TREATMENT GOALS\n';
  text += '─────────────────────────────────────────────────────────────\n';
  text += `${report.treatmentGoals}\n\n`;

  // Clinical Recommendations
  text += '💊 CLINICAL RECOMMENDATIONS\n';
  text += '─────────────────────────────────────────────────────────────\n';
  report.clinicalRecommendations.forEach(rec => {
    text += `• ${rec}\n`;
  });
  text += '\n';

  // Conversation Summary
  text += '💬 CONVERSATION SUMMARY\n';
  text += '─────────────────────────────────────────────────────────────\n';
  text += `${report.conversationSummary}\n\n`;

  text += '═══════════════════════════════════════════════════════════════\n';
  text += '                          END OF REPORT\n';
  text += '═══════════════════════════════════════════════════════════════\n';

  return text;
}

/**
 * Generate CSV export for data analysis
 */
async function generateCSVExport(sessionId) {
  const report = await generateTherapistReport(sessionId);

  let csv = 'Field,Value\n';
  csv += `Session ID,${report.metadata.sessionId}\n`;
  csv += `Session Date,${report.metadata.sessionDate}\n`;
  csv += `Patient Name,${report.patientInfo.name}\n`;
  csv += `Age,${report.patientInfo.age}\n`;
  csv += `Pronouns,${report.patientInfo.pronouns}\n`;
  csv += `Location,${report.patientInfo.location}\n`;

  if (report.assessmentScores.phq9) {
    csv += `PHQ-9 Total Score,${report.assessmentScores.phq9.totalScore}\n`;
    csv += `PHQ-9 Severity,${report.assessmentScores.phq9.severity}\n`;
  }

  if (report.assessmentScores.gad7) {
    csv += `GAD-7 Total Score,${report.assessmentScores.gad7.totalScore}\n`;
    csv += `GAD-7 Severity,${report.assessmentScores.gad7.severity}\n`;
  }

  csv += `Risk Level,${report.riskAssessment.riskLevel}\n`;
  csv += `Suicidal Ideation,${report.riskAssessment.suicidalIdeation}\n`;
  csv += `Suicidal Plan,${report.riskAssessment.suicidalPlan}\n`;

  return csv;
}

/**
 * Generate HTML report for web viewing
 */
async function generateHTMLReport(sessionId) {
  const report = await generateTherapistReport(sessionId);

  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Intake Assessment Report - ${report.patientInfo.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .report-container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    h2 {
      color: #34495e;
      margin-top: 30px;
      border-left: 4px solid #3498db;
      padding-left: 10px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 10px;
      margin: 20px 0;
    }
    .label {
      font-weight: bold;
      color: #555;
    }
    .score-box {
      background: #ecf0f1;
      padding: 15px;
      border-radius: 5px;
      margin: 10px 0;
    }
    .score-value {
      font-size: 2em;
      font-weight: bold;
      color: #2c3e50;
    }
    .severity-minimal { color: #27ae60; }
    .severity-mild { color: #f39c12; }
    .severity-moderate { color: #e67e22; }
    .severity-severe { color: #c0392b; }
    .risk-high {
      background: #fee;
      border-left: 4px solid #c00;
      padding: 15px;
      margin: 10px 0;
    }
    .response-item {
      margin: 15px 0;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    .print-button {
      background: #3498db;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      margin: 20px 0;
    }
    .print-button:hover {
      background: #2980b9;
    }
    @media print {
      body { background: white; }
      .print-button { display: none; }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <button class="print-button" onclick="window.print()">🖨️ Print Report</button>

    <h1>Mental Health Intake Assessment Report</h1>

    <h2>📋 Session Information</h2>
    <div class="info-grid">
      <div class="label">Session ID:</div><div>${report.metadata.sessionId}</div>
      <div class="label">Date:</div><div>${report.metadata.sessionDate}</div>
      <div class="label">Status:</div><div>${report.metadata.status}</div>
    </div>

    <h2>👤 Patient Information</h2>
    <div class="info-grid">
      <div class="label">Name:</div><div>${report.patientInfo.name}</div>
      <div class="label">Age:</div><div>${report.patientInfo.age}</div>
      <div class="label">Pronouns:</div><div>${report.patientInfo.pronouns}</div>
      <div class="label">Location:</div><div>${report.patientInfo.location}</div>
    </div>

    <h2>💭 Presenting Concern</h2>
    <p>${report.presentingConcern}</p>

    ${report.assessmentScores.phq9 ? `
    <h2>📊 PHQ-9 Depression Screening</h2>
    <div class="score-box">
      <div class="score-value">${report.assessmentScores.phq9.totalScore}/${report.assessmentScores.phq9.maxPossible}</div>
      <div class="severity-${report.assessmentScores.phq9.severity.toLowerCase().replace(' ', '-')}">${report.assessmentScores.phq9.severity}</div>
      <p>${report.assessmentScores.phq9.interpretation}</p>
    </div>
    <h3>Detailed Responses:</h3>
    ${report.assessmentScores.phq9.responses.map((r, idx) => `
      <div class="response-item">
        <strong>${idx + 1}. ${r.question}</strong><br>
        Response: ${r.response}<br>
        Score: ${r.score}/3
      </div>
    `).join('')}
    ` : ''}

    ${report.assessmentScores.gad7 ? `
    <h2>📊 GAD-7 Anxiety Screening</h2>
    <div class="score-box">
      <div class="score-value">${report.assessmentScores.gad7.totalScore}/${report.assessmentScores.gad7.maxPossible}</div>
      <div class="severity-${report.assessmentScores.gad7.severity.toLowerCase()}">${report.assessmentScores.gad7.severity}</div>
      <p>${report.assessmentScores.gad7.interpretation}</p>
    </div>
    <h3>Detailed Responses:</h3>
    ${report.assessmentScores.gad7.responses.map((r, idx) => `
      <div class="response-item">
        <strong>${idx + 1}. ${r.question}</strong><br>
        Response: ${r.response}<br>
        Score: ${r.score}/3
      </div>
    `).join('')}
    ` : ''}

    <h2>⚠️ Risk Assessment</h2>
    <div class="${report.riskAssessment.riskLevel === 'HIGH' ? 'risk-high' : ''}">
      <div class="info-grid">
        <div class="label">Risk Level:</div><div><strong>${report.riskAssessment.riskLevel}</strong></div>
        <div class="label">Suicidal Ideation:</div><div>${report.riskAssessment.suicidalIdeation}</div>
        <div class="label">Suicidal Plan:</div><div>${report.riskAssessment.suicidalPlan}</div>
        <div class="label">Self-Harm:</div><div>${report.riskAssessment.selfHarm}</div>
        <div class="label">Substance Use:</div><div>${report.riskAssessment.substanceUse}</div>
        <div class="label">Safety Concerns:</div><div>${report.riskAssessment.safetyConcerns}</div>
      </div>
    </div>

    <h2>🎯 Treatment Goals</h2>
    <p>${report.treatmentGoals}</p>

    <h2>💊 Clinical Recommendations</h2>
    <ul>
      ${report.clinicalRecommendations.map(rec => `<li>${rec}</li>`).join('')}
    </ul>
  </div>
</body>
</html>
  `;

  return html;
}

// Helper functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function assessRiskLevel(session, phq9Responses) {
  // High risk if suicidal ideation with plan
  if (session.suicidal_ideation && session.suicidal_plan) {
    return 'HIGH';
  }

  // High risk if PHQ-9 question 9 (self-harm) scored 2 or 3
  const q9 = phq9Responses.find(r => r.question_number === 9);
  if (q9 && q9.score >= 2) {
    return 'HIGH';
  }

  // Moderate risk if suicidal ideation without plan or self-harm
  if (session.suicidal_ideation || session.self_harm) {
    return 'MODERATE';
  }

  // Moderate risk if severe depression
  if (session.phq9_score >= 20) {
    return 'MODERATE';
  }

  return 'LOW';
}

function generateRecommendations(session, phq9Results, gad7Results) {
  const recommendations = [];

  // Risk-based recommendations
  const riskLevel = assessRiskLevel(session, []);
  if (riskLevel === 'HIGH') {
    recommendations.push('URGENT: Immediate safety assessment required. Consider hospitalization or crisis intervention.');
    recommendations.push('Establish safety plan before discharge from intake.');
    recommendations.push('Schedule follow-up within 24-48 hours.');
  } else if (riskLevel === 'MODERATE') {
    recommendations.push('Safety assessment recommended within one week.');
    recommendations.push('Develop safety plan collaboratively with patient.');
  }

  // PHQ-9 based recommendations
  if (phq9Results) {
    if (phq9Results.totalScore >= 15) {
      recommendations.push('Consider combined psychotherapy and pharmacotherapy for depression treatment.');
      recommendations.push('Psychiatry consultation recommended for medication evaluation.');
    } else if (phq9Results.totalScore >= 10) {
      recommendations.push('Psychotherapy recommended (CBT, IPT, or psychodynamic therapy).');
      recommendations.push('Monitor symptoms closely; reassess PHQ-9 in 2-4 weeks.');
    } else if (phq9Results.totalScore >= 5) {
      recommendations.push('Watchful waiting with supportive therapy.');
      recommendations.push('Repeat PHQ-9 at follow-up to monitor progression.');
    }
  }

  // GAD-7 based recommendations
  if (gad7Results) {
    if (gad7Results.totalScore >= 10) {
      recommendations.push('Anxiety treatment indicated: Consider CBT, exposure therapy, or relaxation techniques.');
      if (gad7Results.totalScore >= 15) {
        recommendations.push('Severe anxiety: Consider medication evaluation for anxiolytic or SSRI.');
      }
    } else if (gad7Results.totalScore >= 5) {
      recommendations.push('Mild anxiety: Consider brief supportive therapy and stress management techniques.');
    }
  }

  // Substance use
  if (session.substance_use) {
    recommendations.push('Substance use screening recommended (AUDIT, DAST, or CAGE).');
    recommendations.push('Consider integrated treatment addressing both mental health and substance use.');
  }

  // Default
  if (recommendations.length === 0) {
    recommendations.push('Regular therapeutic support with ongoing assessment.');
  }

  recommendations.push('Document all interventions and maintain HIPAA-compliant records.');

  return recommendations;
}

function summarizeConversation(messages) {
  const userMessages = messages.filter(m => m.role === 'user').length;
  const assistantMessages = messages.filter(m => m.role === 'assistant').length;
  return `Conversation consisted of ${messages.length} total messages (${userMessages} from patient, ${assistantMessages} from intake bot). Full conversation transcript available in database.`;
}

module.exports = {
  generateTherapistReport,
  generateTextReport,
  generateCSVExport,
  generateHTMLReport
};
