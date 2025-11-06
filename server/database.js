const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'intake_sessions.db');

// Initialize database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Create tables
function initializeDatabase() {
  db.serialize(() => {
    // Intake sessions table
    db.run(`
      CREATE TABLE IF NOT EXISTS intake_sessions (
        id TEXT PRIMARY KEY,
        session_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'in_progress',
        completed_at DATETIME,

        -- Demographics
        patient_name TEXT,
        age INTEGER,
        pronouns TEXT,
        location TEXT,

        -- Presenting concern
        presenting_concern TEXT,

        -- Assessment scores
        phq9_score INTEGER,
        phq9_severity TEXT,
        gad7_score INTEGER,
        gad7_severity TEXT,

        -- Risk flags
        suicidal_ideation BOOLEAN,
        suicidal_plan BOOLEAN,
        self_harm BOOLEAN,
        substance_use BOOLEAN,
        safety_concerns TEXT,

        -- Therapy preferences
        therapy_approach TEXT,
        scheduling_preference TEXT,
        language_preference TEXT,
        cost_insurance TEXT,
        therapist_preferences TEXT,

        -- Goals
        treatment_goals TEXT,

        -- Full conversation
        conversation_json TEXT
      )
    `);

    // PHQ-9 responses table
    db.run(`
      CREATE TABLE IF NOT EXISTS phq9_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        question_number INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        response_text TEXT,
        score INTEGER,
        FOREIGN KEY (session_id) REFERENCES intake_sessions(id)
      )
    `);

    // GAD-7 responses table
    db.run(`
      CREATE TABLE IF NOT EXISTS gad7_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        question_number INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        response_text TEXT,
        score INTEGER,
        FOREIGN KEY (session_id) REFERENCES intake_sessions(id)
      )
    `);

    // Messages table for full conversation history
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES intake_sessions(id)
      )
    `);

    console.log('Database tables initialized');
  });
}

// Database operations
const dbOperations = {
  // Create new session
  createSession: (sessionId) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO intake_sessions (id) VALUES (?)',
        [sessionId],
        function(err) {
          if (err) reject(err);
          else resolve(sessionId);
        }
      );
    });
  },

  // Save message
  saveMessage: (sessionId, role, content) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)',
        [sessionId, role, content],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  // Update session demographics
  updateDemographics: (sessionId, demographics) => {
    const fields = [];
    const values = [];

    if (demographics.name) {
      fields.push('patient_name = ?');
      values.push(demographics.name);
    }
    if (demographics.age) {
      fields.push('age = ?');
      values.push(demographics.age);
    }
    if (demographics.pronouns) {
      fields.push('pronouns = ?');
      values.push(demographics.pronouns);
    }
    if (demographics.location) {
      fields.push('location = ?');
      values.push(demographics.location);
    }
    if (demographics.presentingConcern) {
      fields.push('presenting_concern = ?');
      values.push(demographics.presentingConcern);
    }

    if (fields.length === 0) return Promise.resolve();

    values.push(sessionId);

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE intake_sessions SET ${fields.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  // Save PHQ-9 response
  savePHQ9Response: (sessionId, questionNumber, questionText, responseText, score) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO phq9_responses (session_id, question_number, question_text, response_text, score) VALUES (?, ?, ?, ?, ?)',
        [sessionId, questionNumber, questionText, responseText, score],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  // Save GAD-7 response
  saveGAD7Response: (sessionId, questionNumber, questionText, responseText, score) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO gad7_responses (session_id, question_number, question_text, response_text, score) VALUES (?, ?, ?, ?, ?)',
        [sessionId, questionNumber, questionText, responseText, score],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  // Update PHQ-9 score
  updatePHQ9Score: (sessionId, totalScore, severity) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE intake_sessions SET phq9_score = ?, phq9_severity = ? WHERE id = ?',
        [totalScore, severity, sessionId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  // Update GAD-7 score
  updateGAD7Score: (sessionId, totalScore, severity) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE intake_sessions SET gad7_score = ?, gad7_severity = ? WHERE id = ?',
        [totalScore, severity, sessionId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  // Update risk assessment
  updateRiskAssessment: (sessionId, riskData) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE intake_sessions SET
          suicidal_ideation = ?,
          suicidal_plan = ?,
          self_harm = ?,
          substance_use = ?,
          safety_concerns = ?
        WHERE id = ?`,
        [
          riskData.suicidalIdeation || false,
          riskData.suicidalPlan || false,
          riskData.selfHarm || false,
          riskData.substanceUse || false,
          riskData.safetyConcerns || null,
          sessionId
        ],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  // Update therapy preferences
  updateTherapyPreferences: (sessionId, preferences) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE intake_sessions SET
          therapy_approach = ?,
          scheduling_preference = ?,
          language_preference = ?,
          cost_insurance = ?,
          therapist_preferences = ?
        WHERE id = ?`,
        [
          preferences.approach || null,
          preferences.scheduling || null,
          preferences.language || null,
          preferences.costInsurance || null,
          preferences.therapistPreferences || null,
          sessionId
        ],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  // Update treatment goals
  updateTreatmentGoals: (sessionId, goals) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE intake_sessions SET treatment_goals = ? WHERE id = ?',
        [goals, sessionId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  // Mark session as complete
  completeSession: (sessionId, conversationJson) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE intake_sessions SET status = ?, completed_at = CURRENT_TIMESTAMP, conversation_json = ? WHERE id = ?',
        ['completed', conversationJson, sessionId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  // Get session by ID
  getSession: (sessionId) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM intake_sessions WHERE id = ?',
        [sessionId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  // Get PHQ-9 responses
  getPHQ9Responses: (sessionId) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM phq9_responses WHERE session_id = ? ORDER BY question_number',
        [sessionId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  // Get GAD-7 responses
  getGAD7Responses: (sessionId) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM gad7_responses WHERE session_id = ? ORDER BY question_number',
        [sessionId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  // Get all messages for a session
  getMessages: (sessionId) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp',
        [sessionId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  // Get all sessions
  getAllSessions: () => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM intake_sessions ORDER BY session_date DESC',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
};

module.exports = { db, dbOperations };
