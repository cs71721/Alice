/**
 * PHQ-9 and GAD-7 Scoring Algorithms
 *
 * These standardized assessments use a 0-3 scale for each question:
 * 0 = Not at all
 * 1 = Several days
 * 2 = More than half the days
 * 3 = Nearly every day
 */

// PHQ-9 Questions
const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself - or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself"
];

// GAD-7 Questions
const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it is hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid, as if something awful might happen"
];

/**
 * Map text responses to numeric scores
 * Uses NLP-style keyword matching to interpret conversational responses
 */
function mapResponseToScore(responseText) {
  if (!responseText) return null;

  const text = responseText.toLowerCase();

  // Score 0: Not at all
  if (
    text.includes('not at all') ||
    text.includes('never') ||
    text.includes('none') ||
    text.includes("doesn't apply") ||
    text.includes('no') && text.length < 15
  ) {
    return 0;
  }

  // Score 3: Nearly every day / Very frequently
  if (
    text.includes('nearly every day') ||
    text.includes('every day') ||
    text.includes('all the time') ||
    text.includes('constantly') ||
    text.includes('always') ||
    text.includes('very often') ||
    text.includes('very frequently')
  ) {
    return 3;
  }

  // Score 2: More than half the days
  if (
    text.includes('more than half') ||
    text.includes('most days') ||
    text.includes('often') ||
    text.includes('frequently') ||
    text.includes('usually') ||
    text.includes('majority')
  ) {
    return 2;
  }

  // Score 1: Several days
  if (
    text.includes('several days') ||
    text.includes('some days') ||
    text.includes('sometimes') ||
    text.includes('occasionally') ||
    text.includes('a few') ||
    text.includes('once in a while')
  ) {
    return 1;
  }

  // Default: Try to infer from sentiment/intensity
  // If very short positive response, assume minimal
  if (text.includes('yes') && text.length < 20) {
    return 1; // Acknowledge presence but unclear frequency
  }

  // If mentions specific frequency numbers
  if (text.includes('1') || text.includes('2') || text.includes('one') || text.includes('two')) {
    return 1;
  }
  if (text.includes('3') || text.includes('4') || text.includes('three') || text.includes('four')) {
    return 2;
  }
  if (text.includes('5') || text.includes('6') || text.includes('7') || text.includes('five') || text.includes('six') || text.includes('seven')) {
    return 3;
  }

  // Unable to determine - return null
  return null;
}

/**
 * Calculate PHQ-9 total score and severity
 */
function calculatePHQ9Score(responses) {
  const scores = responses.map(r => r.score).filter(s => s !== null);

  if (scores.length === 0) return null;

  const totalScore = scores.reduce((sum, score) => sum + score, 0);

  let severity;
  if (totalScore >= 20) {
    severity = 'Severe';
  } else if (totalScore >= 15) {
    severity = 'Moderately Severe';
  } else if (totalScore >= 10) {
    severity = 'Moderate';
  } else if (totalScore >= 5) {
    severity = 'Mild';
  } else {
    severity = 'Minimal';
  }

  return {
    totalScore,
    severity,
    maxPossible: 27,
    questionsAnswered: scores.length,
    interpretation: getPHQ9Interpretation(totalScore)
  };
}

/**
 * Calculate GAD-7 total score and severity
 */
function calculateGAD7Score(responses) {
  const scores = responses.map(r => r.score).filter(s => s !== null);

  if (scores.length === 0) return null;

  const totalScore = scores.reduce((sum, score) => sum + score, 0);

  let severity;
  if (totalScore >= 15) {
    severity = 'Severe';
  } else if (totalScore >= 10) {
    severity = 'Moderate';
  } else if (totalScore >= 5) {
    severity = 'Mild';
  } else {
    severity = 'Minimal';
  }

  return {
    totalScore,
    severity,
    maxPossible: 21,
    questionsAnswered: scores.length,
    interpretation: getGAD7Interpretation(totalScore)
  };
}

/**
 * Get clinical interpretation for PHQ-9 score
 */
function getPHQ9Interpretation(score) {
  if (score >= 20) {
    return 'Severe depression. Immediate treatment recommended. Consider psychiatry referral and safety assessment.';
  } else if (score >= 15) {
    return 'Moderately severe depression. Treatment with pharmacotherapy and/or psychotherapy recommended.';
  } else if (score >= 10) {
    return 'Moderate depression. Treatment with psychotherapy, pharmacotherapy, or combination should be considered.';
  } else if (score >= 5) {
    return 'Mild depression. Watchful waiting with repeat PHQ-9 at follow-up. Consider treatment if symptoms persist.';
  } else {
    return 'Minimal or no depression. Continue to monitor and reassess as needed.';
  }
}

/**
 * Get clinical interpretation for GAD-7 score
 */
function getGAD7Interpretation(score) {
  if (score >= 15) {
    return 'Severe anxiety. Active treatment strongly recommended. Consider psychiatry referral.';
  } else if (score >= 10) {
    return 'Moderate anxiety. Treatment with psychotherapy and/or pharmacotherapy should be considered.';
  } else if (score >= 5) {
    return 'Mild anxiety. Watchful waiting with repeat GAD-7 at follow-up. Consider treatment if symptoms persist.';
  } else {
    return 'Minimal anxiety. Continue to monitor and reassess as needed.';
  }
}

/**
 * Extract structured data from Claude's response using markers
 * Claude can be instructed to include structured markers in responses
 */
function extractAssessmentData(message) {
  const data = {
    phq9: null,
    gad7: null,
    demographics: {},
    risk: {},
    preferences: {},
    goals: null
  };

  // Look for structured markers (these would be added to Claude's system prompt)
  const phq9Match = message.match(/\[PHQ9_Q(\d+):([^\]]+)\]/);
  if (phq9Match) {
    const questionNum = parseInt(phq9Match[1]);
    const response = phq9Match[2].trim();
    data.phq9 = {
      questionNumber: questionNum,
      response,
      score: mapResponseToScore(response)
    };
  }

  const gad7Match = message.match(/\[GAD7_Q(\d+):([^\]]+)\]/);
  if (gad7Match) {
    const questionNum = parseInt(gad7Match[1]);
    const response = gad7Match[2].trim();
    data.gad7 = {
      questionNumber: questionNum,
      response,
      score: mapResponseToScore(response)
    };
  }

  // Extract demographics
  const nameMatch = message.match(/\[NAME:([^\]]+)\]/);
  if (nameMatch) data.demographics.name = nameMatch[1].trim();

  const ageMatch = message.match(/\[AGE:([^\]]+)\]/);
  if (ageMatch) data.demographics.age = parseInt(ageMatch[1].trim());

  const pronounsMatch = message.match(/\[PRONOUNS:([^\]]+)\]/);
  if (pronounsMatch) data.demographics.pronouns = pronounsMatch[1].trim();

  const locationMatch = message.match(/\[LOCATION:([^\]]+)\]/);
  if (locationMatch) data.demographics.location = locationMatch[1].trim();

  const concernMatch = message.match(/\[CONCERN:([^\]]+)\]/);
  if (concernMatch) data.demographics.presentingConcern = concernMatch[1].trim();

  // Extract risk data
  const suicidalIdeationMatch = message.match(/\[SUICIDAL_IDEATION:(yes|no)\]/i);
  if (suicidalIdeationMatch) data.risk.suicidalIdeation = suicidalIdeationMatch[1].toLowerCase() === 'yes';

  const suicidalPlanMatch = message.match(/\[SUICIDAL_PLAN:(yes|no)\]/i);
  if (suicidalPlanMatch) data.risk.suicidalPlan = suicidalPlanMatch[1].toLowerCase() === 'yes';

  return data;
}

module.exports = {
  PHQ9_QUESTIONS,
  GAD7_QUESTIONS,
  mapResponseToScore,
  calculatePHQ9Score,
  calculateGAD7Score,
  getPHQ9Interpretation,
  getGAD7Interpretation,
  extractAssessmentData
};
