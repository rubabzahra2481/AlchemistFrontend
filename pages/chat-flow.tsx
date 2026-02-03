'use client';

import React, { useState } from 'react';

// Get API URL
const getApiUrl = () => {
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168'));
  return isLocalhost 
    ? `http://${window.location.hostname}:9000`
    : 'https://ptvmvy9qhn.us-east-1.awsapprunner.com';
};

const TEST_USER_ID = '9498F4E8-3001-7088-50EB-82853A5A76EB';

export default function ChatFlowPage() {
  const [message, setMessage] = useState('I am feeling stressed and anxious about my future');
  const [userId, setUserId] = useState(TEST_USER_ID);
  const [selectedLLM, setSelectedLLM] = useState('gpt-4o');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestData, setRequestData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setRequestData(null);

    const requestBody = {
      message,
      userId,
      selectedLLM,
      sessionId: undefined, // New chat
    };

    setRequestData({
      url: `${getApiUrl()}/chat`,
      method: 'POST',
      body: requestBody,
      timestamp: new Date().toISOString(),
    });

    try {
      const startTime = Date.now();
      const response = await fetch(`${getApiUrl()}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      // Extract frameworks from profile
      const frameworksTriggered = data.profile ? Object.keys(data.profile).filter((k: string) => 
        !['safety', 'summaryForThisMessage', 'integrationMeta', 'edna'].includes(k) && data.profile[k]
      ) : [];

      setResult({
        ...data,
        frameworksTriggered,
        requestDuration: duration,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const frameworkNames: Record<string, string> = {
    'dass': 'DASS-42 (Depression, Anxiety, Stress)',
    'rse': 'RSE (Self-Esteem)',
    'bigFive': 'Big Five (Personality Traits)',
    'darkTriad': 'Dark Triad (Manipulation Patterns)',
    'crt': 'CRT (Thinking Style)',
    'attachment': 'Attachment Style',
    'enneagram': 'Enneagram (Core Motivations)',
    'mbti': 'MBTI (Personality Type)',
    'erikson': 'Erikson (Life Stage)',
    'gestalt': 'Gestalt (Emotional Awareness)',
    'bioPsych': 'Bio-Psych (Physical Factors)'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '24px',
      color: '#fff',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '24px'
        }}>
          🔄 Chat Flow - Real Request Tracking
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px' }}>
          This page shows the actual flow of a real chat request - exactly what the iOS app and web frontend use.
        </p>

        <form onSubmit={handleSubmit} style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>
              User Message:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                minHeight: '80px',
                fontFamily: 'inherit'
              }}
              placeholder="Enter a test message..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>
                User ID:
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
                placeholder="Enter user ID..."
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>
                Selected LLM:
              </label>
              <select
                value={selectedLLM}
                onChange={(e) => setSelectedLLM(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o-mini</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
                <option value="deepseek-chat">DeepSeek Chat</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: loading ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {loading ? '⏳ Processing...' : '🚀 Send Real Chat Request'}
          </button>
        </form>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '24px',
            color: '#fca5a5'
          }}>
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {requestData && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid #3b82f6',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '12px', color: '#3b82f6' }}>
              📤 Request Sent
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px', lineHeight: '1.6' }}>
              <strong>What this is:</strong> This is the exact request that was sent to the chat endpoint - the same one the iOS app and web frontend use. It includes your message, user ID, and selected LLM.
            </p>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'Monaco, Consolas, monospace',
              color: '#86efac',
              overflow: 'auto'
            }}>
              <div><strong>URL:</strong> {requestData.url}</div>
              <div><strong>Method:</strong> {requestData.method}</div>
              <div><strong>Timestamp:</strong> {requestData.timestamp}</div>
              <div style={{ marginTop: '8px' }}><strong>Body:</strong></div>
              <pre style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(requestData.body, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {result && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', color: '#8b5cf6' }}>
                📊 Chat Response Flow
              </h2>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Duration: {result.requestDuration}ms
              </div>
            </div>

            {/* Step 1: E-DNA Profile */}
            <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '12px', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#f97316' }}>
                Step 1: E-DNA Profile Fetch
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px', lineHeight: '1.6' }}>
                <strong>What this does:</strong> The system makes TWO calls to get E-DNA data: (1) <code>/api/agent/users/{userId}/profile</code> for basic info (shown in response), and (2) <code>/api/agent/users/{userId}/quiz-results</code> for full 7-layer data (used internally but not in response). The full 7-layer data includes: Layer 1 (Core Type), Layer 2 (Subtype), Layer 3 (Integration), Layer 4 (Learning Style), Layer 5 (Neurodiversity), Layer 6 (Mindset & Personality), and Layer 7 (Meta-Beliefs).
              </p>
              {result.profile?.edna ? (
                <div>
                  <p style={{ fontSize: '12px', color: '#86efac', marginBottom: '8px' }}>
                    <strong>Basic E-DNA data (from /profile endpoint):</strong> Core type: <strong>{result.profile.edna.coreType}</strong>, Subtype: <strong>{result.profile.edna.subtype}</strong>, Confidence: <strong>{result.profile.edna.confidence || 'N/A'}</strong>, Tier: <strong>{result.profile.edna.tier || 'N/A'}</strong>
                  </p>
                  <p style={{ fontSize: '11px', color: '#fbbf24', marginBottom: '8px', padding: '8px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '6px' }}>
                    ⚠️ <strong>Note:</strong> The full 7-layer E-DNA data is fetched from <code>/quiz-results</code> endpoint and used by the AI, but only basic info is included in the response. The full profile (all 7 layers) is passed to the advice generator internally.
                  </p>
                  <details>
                    <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#3b82f6', marginBottom: '8px' }}>
                      View E-DNA Data in Response
                    </summary>
                    <pre style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      overflow: 'auto',
                      maxHeight: '200px',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'Monaco, Consolas, monospace',
                      background: 'rgba(0,0,0,0.3)',
                      padding: '12px',
                      borderRadius: '8px',
                      marginTop: '8px'
                    }}>
                      {JSON.stringify(result.profile.edna, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: '#fca5a5' }}>
                  ⚠️ No E-DNA profile found. User may not have completed the quiz or profile fetch failed.
                </p>
              )}
            </div>

            {/* Step 2: Psychological Frameworks */}
            <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#8b5cf6' }}>
                Step 2: Psychological Framework Analysis
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px', lineHeight: '1.6' }}>
                <strong>What this does:</strong> First, a fast AI (gpt-4o-mini) reads the user&apos;s message and decides which psychological tests to run. Then it runs those tests in parallel - like checking for anxiety/depression (DASS), personality traits (Big Five), self-esteem (RSE), thinking style (CRT), and others. Each test analyzes the message from its own angle.
              </p>
              {result.frameworksTriggered && result.frameworksTriggered.length > 0 ? (
                <div>
                  <p style={{ fontSize: '12px', color: '#86efac', marginBottom: '12px' }}>
                    <strong>Exact data:</strong> {result.frameworksTriggered.length} framework(s) triggered: <strong>{result.frameworksTriggered.map((f: string) => frameworkNames[f] || f).join(', ')}</strong>
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                    {result.frameworksTriggered.map((framework: string) => (
                      <div key={framework} style={{
                        padding: '10px',
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid #22c55e',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}>
                        ✅ {frameworkNames[framework] || framework}
                      </div>
                    ))}
                  </div>
                  <details>
                    <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#3b82f6', marginBottom: '8px' }}>
                      View Framework Results
                    </summary>
                    <div style={{ marginTop: '8px' }}>
                      {result.frameworksTriggered.map((framework: string) => (
                        <details key={framework} style={{ marginBottom: '8px' }}>
                          <summary style={{ cursor: 'pointer', fontSize: '11px', color: '#8b5cf6', marginBottom: '4px' }}>
                            {frameworkNames[framework] || framework}
                          </summary>
                          <pre style={{
                            fontSize: '10px',
                            color: '#94a3b8',
                            overflow: 'auto',
                            maxHeight: '150px',
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'Monaco, Consolas, monospace',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '8px',
                            borderRadius: '6px',
                            marginTop: '4px'
                          }}>
                            {JSON.stringify(result.profile[framework], null, 2)}
                          </pre>
                        </details>
                      ))}
                    </div>
                  </details>
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: '#fca5a5' }}>
                  ⚠️ No frameworks triggered. The message may not contain psychological signals, or classification failed.
                </p>
              )}
            </div>

            {/* Step 3: Summary */}
            {result.profile?.summaryForThisMessage && (
              <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#22c55e' }}>
                  Step 3: Per-Message Summary (Synthesis)
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px', lineHeight: '1.6' }}>
                  <strong>What this does:</strong> After all the psychological frameworks finish analyzing, another AI takes all their results and creates one unified summary. It combines everything into a clear picture - like &quot;This person is feeling anxious about work, has high neuroticism, and low self-esteem right now.&quot;
                </p>
                <p style={{ fontSize: '12px', color: '#86efac', marginBottom: '8px' }}>
                  <strong>Exact data:</strong> Summary created with {result.profile.summaryForThisMessage.key_signals?.length || 0} key signals, {result.profile.summaryForThisMessage.risks?.length || 0} risks identified, {result.profile.summaryForThisMessage.strengths?.length || 0} strengths found.
                </p>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#86efac',
                  whiteSpace: 'pre-wrap'
                }}>
                  <strong>Summary:</strong> {result.profile.summaryForThisMessage.summary || 'No summary'}
                </div>
                <details style={{ marginTop: '8px' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '11px', color: '#3b82f6' }}>
                    View Full Summary Data
                  </summary>
                  <pre style={{
                    fontSize: '10px',
                    color: '#94a3b8',
                    overflow: 'auto',
                    maxHeight: '200px',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'Monaco, Consolas, monospace',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '8px',
                    borderRadius: '6px',
                    marginTop: '4px'
                  }}>
                    {JSON.stringify(result.profile.summaryForThisMessage, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {/* Step 4: Final Response */}
            <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#3b82f6' }}>
                Step 4: Advice LLM Response
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px', lineHeight: '1.6' }}>
                <strong>What this does:</strong> The main AI (using your selected model: <strong>{selectedLLM}</strong>) takes everything - the E-DNA instructions on how to communicate, the psychological summary of what they need, and the conversation history - and generates the final personalized response. This is what the user actually sees.
              </p>
              <p style={{ fontSize: '12px', color: '#86efac', marginBottom: '8px' }}>
                <strong>Exact data:</strong> Response length: <strong>{result.response?.length || 0} characters</strong>, Has reasoning: <strong>{result.reasoning ? 'Yes' : 'No'}</strong>, Session ID: <strong>{result.sessionId}</strong>
              </p>
              <div style={{
                background: 'rgba(0,0,0,0.5)',
                padding: '16px',
                borderRadius: '8px',
                whiteSpace: 'pre-wrap',
                color: '#86efac',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                {result.response || 'No response'}
              </div>
              {result.reasoning && (
                <details style={{ marginTop: '12px' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#3b82f6', marginBottom: '8px' }}>
                    View AI Reasoning
                  </summary>
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#94a3b8',
                    whiteSpace: 'pre-wrap',
                    marginTop: '8px'
                  }}>
                    {result.reasoning}
                  </div>
                </details>
              )}
            </div>

            {/* Full Response */}
            <details style={{ marginTop: '24px' }}>
              <summary style={{
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                color: '#3b82f6',
                marginBottom: '12px'
              }}>
                📋 Full Response JSON
              </summary>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px', lineHeight: '1.6' }}>
                <strong>What this is:</strong> This is the complete response that the iOS app and web frontend receive. It includes the response text, session ID, analysis, recommendations, reasoning, and the full profile with all framework results and E-DNA data.
              </p>
              <pre style={{
                background: 'rgba(0,0,0,0.5)',
                padding: '16px',
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '600px',
                fontSize: '12px',
                color: '#94a3b8',
                fontFamily: 'Monaco, Consolas, monospace'
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
