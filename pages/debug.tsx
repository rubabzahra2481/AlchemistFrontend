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

export default function DebugPage() {
  const [message, setMessage] = useState('I am feeling stressed about work');
  const [userId, setUserId] = useState(TEST_USER_ID);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${getApiUrl()}/chat/debug/trace`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch debug trace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '24px',
      color: '#fff',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '24px'
        }}>
          🔍 Debug - Detailed LLM Responses
        </h1>

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

          <div style={{ marginBottom: '16px' }}>
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
            {loading ? '⏳ Processing...' : '🚀 Run Debug Trace'}
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

        {result && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#8b5cf6' }}>
              📊 Debug Trace Results
            </h2>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#3b82f6' }}>
                Final Response:
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px', lineHeight: '1.6' }}>
                <strong>What this is:</strong> This is the final message that gets sent back to the user. It's the personalized advice that combines everything the AI learned about the user - their personality type from the quiz, their emotional state from the message, and what psychological frameworks detected. This is what the user actually sees in the chat.
              </p>
              <div style={{
                background: 'rgba(0,0,0,0.5)',
                padding: '16px',
                borderRadius: '8px',
                whiteSpace: 'pre-wrap',
                color: '#86efac',
                fontSize: '14px'
              }}>
                {result.finalResponse || 'No response'}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#3b82f6' }}>
                Steps ({result.steps?.length || 0}):
              </h3>
              {result.steps?.map((step: any, idx: number) => {
                let explanation = '';
                let exactData = '';
                
                if (step.step === 1 && step.name === 'E-DNA Profile Fetch') {
                  explanation = 'What this does: The system looks up the user\'s personality profile from the quiz they took. This tells the AI how to communicate with them - like whether they prefer logic over emotions, how they learn best, and what their core personality type is.';
                  exactData = `Exact data it gets: Core type (${step.data?.coreType || 'not found'}), subtype (${step.data?.subtype || 'not found'}), strength level (${step.data?.strength || 'not found'}), learning style, communication preferences, and a detailed instruction guide (${step.data?.instructionsLength || 0} characters long) that tells the AI exactly how to talk to this person.`;
                } else if (step.step === 2 && step.name === 'Psychological Classification & Analysis') {
                  const frameworks = step.data?.frameworksTriggered || [];
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
                  const frameworkDisplayNames = frameworks.map((f: string) => frameworkNames[f] || f);
                  explanation = 'What this does: First, a fast AI (gpt-4o-mini) reads the user\'s message and decides which psychological tests to run. Then it runs those tests in parallel - like checking for anxiety/depression (DASS), personality traits (Big Five), self-esteem (RSE), thinking style (CRT), and others. Each test analyzes the message from its own angle.';
                  exactData = `Exact data it gets: Safety check result (${step.data?.safetyFlag || 'none'}), ${frameworks.length} framework(s) triggered: ${frameworkDisplayNames.length > 0 ? frameworkDisplayNames.join(', ') : 'none'}. Each framework returns detailed results including emotional state scores (for DASS), personality trait levels (for Big Five), confidence scores, and plain English insights about what was detected. The full results are in the JSON below.`;
                } else if (step.step === 3 && step.name === 'Per-Message Summary (Synthesis)') {
                  explanation = 'What this does: After all the psychological frameworks finish analyzing, another AI takes all their results and creates one unified summary. It combines everything into a clear picture - like "This person is feeling anxious about work, has high neuroticism, and low self-esteem right now." It also resolves any conflicts between different frameworks.';
                  exactData = `Exact data it gets: A summary paragraph combining all framework insights, key signals detected (like "anxiety", "self-criticism"), any conflicts between frameworks (like if one says high anxiety but another says low), risks identified, strengths found, and what the response should focus on.`;
                } else if (step.step === 4 && step.name === 'Advice LLM Response') {
                  explanation = 'What this does: The main AI (using the user\'s selected model like gpt-4o) takes everything - the E-DNA instructions on how to communicate, the psychological summary of what they need, and the conversation history - and generates the final personalized response. This is where it all comes together.';
                  exactData = `Exact data it gets: The full conversation history (${step.conversationHistoryCount || step.data?.conversationHistoryLength || 0} messages), system prompt (${step.data?.systemPromptLength || 0} chars), total messages sent to LLM (${step.data?.totalMessagesSent || 0}), the AI's internal reasoning (${step.data?.hasReasoning ? 'included' : 'not included'}) showing why it chose those words, and the final response text (${step.data?.responseLength || 0} characters long) that gets sent to the user.`;
                } else if (step.step === 5 && step.name === 'Advice LLM Response') {
                  explanation = 'What this does: The main AI (using the user\'s selected model like gpt-4o) takes everything - the E-DNA instructions on how to communicate, the psychological summary of what they need, and the conversation history - and generates the final personalized response. This is where it all comes together.';
                  exactData = `Exact data it gets: The full conversation history (${step.conversationHistoryCount || step.data?.conversationHistoryLength || 0} messages), system prompt (${step.data?.systemPromptLength || 0} chars), total messages sent to LLM (${step.data?.totalMessagesSent || 0}), the AI's internal reasoning (${step.data?.hasReasoning ? 'included' : 'not included'}) showing why it chose those words, and the final response text (${step.data?.responseLength || 0} characters long) that gets sent to the user.`;
                }
                
                return (
                  <div key={idx} style={{
                    background: 'rgba(0,0,0,0.5)',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#8b5cf6' }}>
                      Step {step.step}: {step.name}
                    </div>
                    {explanation && (
                      <div style={{
                        fontSize: '13px',
                        color: '#a5b4fc',
                        marginBottom: '12px',
                        padding: '12px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        borderRadius: '8px',
                        lineHeight: '1.6'
                      }}>
                        {explanation}
                      </div>
                    )}
                    {exactData && (
                      <div style={{
                        fontSize: '12px',
                        color: '#86efac',
                        marginBottom: '12px',
                        padding: '12px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: '8px',
                        lineHeight: '1.6'
                      }}>
                        {exactData}
                      </div>
                    )}
                    
                    {/* Show actual conversation history sent to LLM */}
                    {step.conversationHistorySent && step.conversationHistorySent.length > 0 && (
                      <details style={{ marginTop: '12px' }}>
                        <summary style={{ cursor: 'pointer', color: '#3b82f6', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                          📜 Actual Conversation History Sent to LLM ({step.conversationHistoryCount || step.conversationHistorySent.length} messages)
                        </summary>
                        <div style={{
                          background: 'rgba(0,0,0,0.5)',
                          padding: '12px',
                          borderRadius: '8px',
                          marginTop: '8px',
                          maxHeight: '300px',
                          overflowY: 'auto'
                        }}>
                          {step.conversationHistorySent.map((msg: any, i: number) => (
                            <div key={i} style={{ marginBottom: '8px', padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px' }}>
                              <strong style={{ color: msg.role === 'user' ? '#86efac' : '#fbbf24' }}>
                                {msg.role === 'user' ? '👤 User' : '🤖 Assistant'}:
                              </strong>
                              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                                {msg.content?.substring(0, 200)}{msg.content?.length > 200 ? '...' : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                    
                    {/* Show actual system prompt */}
                    {step.systemPrompt && step.systemPrompt !== '(Not captured)' && (
                      <details style={{ marginTop: '12px' }}>
                        <summary style={{ cursor: 'pointer', color: '#8b5cf6', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                          🧠 Actual System Prompt Sent to LLM ({step.data?.systemPromptLength || step.systemPrompt.length} chars)
                        </summary>
                        <pre style={{
                          background: 'rgba(0,0,0,0.5)',
                          padding: '12px',
                          borderRadius: '8px',
                          marginTop: '8px',
                          fontSize: '11px',
                          color: '#94a3b8',
                          overflow: 'auto',
                          maxHeight: '400px',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'Monaco, Consolas, monospace'
                        }}>
                          {step.systemPrompt}
                        </pre>
                      </details>
                    )}
                    
                    {/* Show actual E-DNA data passed */}
                    {step.ednaDataPassed && (
                      <details style={{ marginTop: '12px' }}>
                        <summary style={{ cursor: 'pointer', color: '#f97316', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                          🧬 Actual E-DNA Data Passed to Advice LLM
                        </summary>
                        <div style={{
                          background: 'rgba(0,0,0,0.5)',
                          padding: '12px',
                          borderRadius: '8px',
                          marginTop: '8px',
                          maxHeight: '400px',
                          overflowY: 'auto'
                        }}>
                          {step.ednaCharacterSummary && (
                            <div style={{ marginBottom: '12px' }}>
                              <strong style={{ color: '#f97316' }}>Character Summary:</strong>
                              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                                {step.ednaCharacterSummary}
                              </div>
                            </div>
                          )}
                          {step.ednaLayers && (
                            <details>
                              <summary style={{ cursor: 'pointer', color: '#f97316', fontSize: '12px' }}>All 7 Layers</summary>
                              <pre style={{
                                fontSize: '11px',
                                color: '#94a3b8',
                                marginTop: '8px',
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'Monaco, Consolas, monospace'
                              }}>
                                {JSON.stringify(step.ednaLayers, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </details>
                    )}
                    
                    {/* Show actual framework results */}
                    {step.frameworkResults && Object.keys(step.frameworkResults).length > 0 && (
                      <details style={{ marginTop: '12px' }}>
                        <summary style={{ cursor: 'pointer', color: '#ec4899', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                          🔬 Actual Framework Results Passed to Advice LLM ({Object.keys(step.frameworkResults).length} frameworks)
                        </summary>
                        <div style={{
                          background: 'rgba(0,0,0,0.5)',
                          padding: '12px',
                          borderRadius: '8px',
                          marginTop: '8px',
                          maxHeight: '400px',
                          overflowY: 'auto'
                        }}>
                          <pre style={{
                            fontSize: '11px',
                            color: '#94a3b8',
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'Monaco, Consolas, monospace'
                          }}>
                            {JSON.stringify(step.frameworkResults, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                    
                    {/* Show actual full messages array */}
                    {step.fullMessagesArray && step.fullMessagesArray.length > 0 && (
                      <details style={{ marginTop: '12px' }}>
                        <summary style={{ cursor: 'pointer', color: '#10b981', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                          📨 Actual Full Messages Array Sent to LLM ({step.fullMessagesArray.length} messages)
                        </summary>
                        <div style={{
                          background: 'rgba(0,0,0,0.5)',
                          padding: '12px',
                          borderRadius: '8px',
                          marginTop: '8px',
                          maxHeight: '400px',
                          overflowY: 'auto'
                        }}>
                          {step.fullMessagesArray.map((msg: any, i: number) => (
                            <div key={i} style={{ marginBottom: '12px', padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>
                              <strong style={{ color: '#10b981' }}>
                                Message {i + 1} ({msg.role}):
                              </strong>
                              <pre style={{
                                fontSize: '11px',
                                color: '#94a3b8',
                                marginTop: '4px',
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'Monaco, Consolas, monospace',
                                maxHeight: '200px',
                                overflow: 'auto'
                              }}>
                                {msg.content?.substring(0, 1000)}{msg.content?.length > 1000 ? '\n... (truncated)' : ''}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                    <pre style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      overflow: 'auto',
                      maxHeight: '400px',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'Monaco, Consolas, monospace'
                    }}>
                      {JSON.stringify(step, null, 2)}
                    </pre>
                  </div>
                );
              })}
            </div>

            <details style={{ marginTop: '24px' }}>
              <summary style={{
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                color: '#3b82f6',
                marginBottom: '12px'
              }}>
                📋 Full JSON Response
              </summary>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px', lineHeight: '1.6', padding: '0 4px' }}>
                <strong>What this is:</strong> This is the complete raw data that the backend returned. It includes everything from all steps - the timestamp, input message, all step data, E-DNA profile details, psychological framework results, conversation history, and the final response. This is useful for developers who need to see the exact structure of the data.
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
