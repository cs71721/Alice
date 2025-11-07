import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi there, I'm here to help you get started with mental health support. Thanks for reaching out – that takes courage. I'd love to learn a bit about you and what brings you here today. What's your name?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create session on mount
  useEffect(() => {
    const createSession = async () => {
      try {
        const response = await fetch('/api/session/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSessionId(data.sessionId);
          console.log('Session created:', data.sessionId);
        }
      } catch (error) {
        console.error('Error creating session:', error);
      }
    };

    createSession();
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !sessionId) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          sessionId: sessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Clean the message by removing system markers
      let cleanMessage = data.message
        .replace(/CRISIS_DETECTED:.*?\n/g, '')
        .replace(/INTAKE_COMPLETE:.*?\n/g, '')
        .trim();

      setMessages([...newMessages, { role: 'assistant', content: cleanMessage }]);

      if (data.hasCrisis) {
        setShowCrisis(true);
      }

      if (data.isComplete) {
        setIsComplete(true);
      }

    } catch (error) {
      console.error('Error:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again in a moment."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReport = async () => {
    if (!sessionId) return;

    setLoadingReport(true);
    try {
      const response = await fetch(`/api/report/${sessionId}`);
      if (response.ok) {
        const reportData = await response.json();
        setReport(reportData);
        setShowReport(true);
      }
    } catch (error) {
      console.error('Error loading report:', error);
      alert('Failed to load report. Please try again.');
    } finally {
      setLoadingReport(false);
    }
  };

  const downloadReport = async (format) => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/report/${sessionId}/${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `intake-report-${sessionId}.${format === 'html' ? 'html' : format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  const viewHTMLReport = () => {
    if (!sessionId) return;
    window.open(`/api/report/${sessionId}/html`, '_blank');
  };

  return (
    <div className="App">
      {showCrisis && (
        <div className="crisis-banner">
          <div className="crisis-content">
            <span className="crisis-icon">⚠️</span>
            <div className="crisis-text">
              <strong>Immediate Support Available</strong>
              <div className="crisis-resources">
                <p>If you're in crisis, please reach out now:</p>
                <ul>
                  <li>
                    <strong>988 Suicide & Crisis Lifeline:</strong> Call or text 988
                  </li>
                  <li>
                    <strong>Crisis Text Line:</strong> Text HOME to 741741
                  </li>
                  <li>
                    <strong>Emergency Services:</strong> Call 911 or go to nearest ER
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="chat-container">
        <div className="chat-header">
          <h1>Mental Health Intake</h1>
          <p className="subtitle">A safe space to share your story</p>
          {isComplete && (
            <div className="completion-section">
              <div className="completion-badge">
                ✓ Intake Complete
              </div>
              <div className="report-actions">
                <button
                  onClick={loadReport}
                  disabled={loadingReport}
                  className="action-button primary"
                >
                  {loadingReport ? 'Loading...' : 'View Summary Report'}
                </button>
                <button
                  onClick={viewHTMLReport}
                  className="action-button"
                >
                  View Full Report
                </button>
                <button
                  onClick={() => downloadReport('text')}
                  className="action-button"
                >
                  Download (TXT)
                </button>
                <button
                  onClick={() => downloadReport('csv')}
                  className="action-button"
                >
                  Download (CSV)
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-content">
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="message-input"
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="send-button">
            Send
          </button>
        </form>
      </div>

      {showReport && report && (
        <div className="report-modal">
          <div className="report-content">
            <div className="report-header">
              <h2>Intake Assessment Summary</h2>
              <button onClick={() => setShowReport(false)} className="close-button">×</button>
            </div>

            <div className="report-body">
              <section className="report-section">
                <h3>Patient Information</h3>
                <p><strong>Name:</strong> {report.patientInfo.name}</p>
                <p><strong>Age:</strong> {report.patientInfo.age}</p>
                <p><strong>Pronouns:</strong> {report.patientInfo.pronouns}</p>
              </section>

              <section className="report-section">
                <h3>Presenting Concern</h3>
                <p>{report.presentingConcern}</p>
              </section>

              {report.assessmentScores.phq9 && (
                <section className="report-section score-section">
                  <h3>PHQ-9 Depression Screening</h3>
                  <div className="score-display">
                    <div className="score-number">{report.assessmentScores.phq9.totalScore}/27</div>
                    <div className={`severity severity-${report.assessmentScores.phq9.severity.toLowerCase().replace(' ', '-')}`}>
                      {report.assessmentScores.phq9.severity}
                    </div>
                  </div>
                  <p className="interpretation">{report.assessmentScores.phq9.interpretation}</p>
                </section>
              )}

              {report.assessmentScores.gad7 && (
                <section className="report-section score-section">
                  <h3>GAD-7 Anxiety Screening</h3>
                  <div className="score-display">
                    <div className="score-number">{report.assessmentScores.gad7.totalScore}/21</div>
                    <div className={`severity severity-${report.assessmentScores.gad7.severity.toLowerCase()}`}>
                      {report.assessmentScores.gad7.severity}
                    </div>
                  </div>
                  <p className="interpretation">{report.assessmentScores.gad7.interpretation}</p>
                </section>
              )}

              <section className="report-section risk-section">
                <h3>Risk Assessment</h3>
                <div className={`risk-level risk-${report.riskAssessment.riskLevel.toLowerCase()}`}>
                  Risk Level: {report.riskAssessment.riskLevel}
                </div>
                <div className="risk-details">
                  <p><strong>Suicidal Ideation:</strong> {report.riskAssessment.suicidalIdeation}</p>
                  <p><strong>Suicidal Plan:</strong> {report.riskAssessment.suicidalPlan}</p>
                  <p><strong>Self-Harm:</strong> {report.riskAssessment.selfHarm}</p>
                  <p><strong>Substance Use:</strong> {report.riskAssessment.substanceUse}</p>
                </div>
              </section>

              <section className="report-section">
                <h3>Treatment Goals</h3>
                <p>{report.treatmentGoals}</p>
              </section>

              <section className="report-section">
                <h3>Clinical Recommendations</h3>
                <ul>
                  {report.clinicalRecommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="report-footer">
              <button onClick={() => setShowReport(false)} className="action-button">
                Close
              </button>
              <button onClick={viewHTMLReport} className="action-button primary">
                View Full Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
