import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { colors, spacing, borderRadius, shadows } from '../design-tokens';

// Get API URL
const getApiUrl = () => {
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168'));
  return isLocalhost 
    ? `http://${window.location.hostname}:5000`
    : 'https://ptvmvy9qhn.us-east-1.awsapprunner.com';
};

// Test user ID (same as index.tsx)
const TEST_USER_ID = '9498f4e8-3001-7088-50eb-82853a5a76eb';

interface DebugData {
  sessionId: string;
  messages: any[];
  latestAnalysis: any;
  latestProfile: any;
  latestReasoning: string;
  ednaProfile: any;
  frameworksTriggered: string[];
}

export default function DebugPanel() {
  const router = useRouter();
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'flow' | 'edna' | 'history' | 'frameworks'>('flow');

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Load session data when selected
  useEffect(() => {
    if (selectedSession) {
      loadSessionData(selectedSession);
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/chat/sessions?userId=${TEST_USER_ID}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
        if (data.length > 0) {
          setSelectedSession(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadSessionData = async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/chat/session/${sessionId}/history`);
      if (response.ok) {
        const data = await response.json();
        
        // Extract the latest AI message with analysis
        const aiMessages = data.filter((m: any) => m.role === 'assistant' || m.role === 'agent');
        const latestAI = aiMessages[aiMessages.length - 1];
        
        setDebugData({
          sessionId,
          messages: data,
          latestAnalysis: latestAI?.analysis || latestAI?.metadata?.analysis || null,
          latestProfile: latestAI?.profileSnapshot || latestAI?.metadata?.profileSnapshot || null,
          latestReasoning: latestAI?.reasoning || latestAI?.metadata?.reasoning || '',
          ednaProfile: latestAI?.metadata?.ednaProfile || null,
          frameworksTriggered: latestAI?.metadata?.frameworksTriggered || [],
        });
      }
    } catch (error) {
      console.error('Failed to load session data:', error);
    }
    setLoading(false);
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      padding: spacing.lg,
      color: '#fff',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xl,
      paddingBottom: spacing.md,
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    title: {
      fontSize: '28px',
      fontWeight: 700,
      background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    backButton: {
      padding: `${spacing.sm} ${spacing.md}`,
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      borderRadius: borderRadius.md,
      color: '#fff',
      cursor: 'pointer',
      fontSize: '14px',
    },
    sessionSelector: {
      marginBottom: spacing.lg,
    },
    select: {
      width: '100%',
      maxWidth: '400px',
      padding: spacing.sm,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: borderRadius.md,
      color: '#fff',
      fontSize: '14px',
    },
    tabs: {
      display: 'flex',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    tab: {
      padding: `${spacing.sm} ${spacing.md}`,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: borderRadius.md,
      color: '#aaa',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s',
    },
    tabActive: {
      background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
      color: '#fff',
      border: '1px solid transparent',
    },
    panel: {
      background: 'rgba(0,0,0,0.3)',
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      border: '1px solid rgba(255,255,255,0.1)',
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 600,
      marginBottom: spacing.sm,
      color: '#8b5cf6',
      display: 'flex',
      alignItems: 'center',
      gap: spacing.xs,
    },
    code: {
      background: 'rgba(0,0,0,0.5)',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      fontSize: '12px',
      fontFamily: 'Monaco, Consolas, monospace',
      overflow: 'auto',
      maxHeight: '300px',
      whiteSpace: 'pre-wrap',
      color: '#86efac',
    },
    flowDiagram: {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md,
    },
    flowStep: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
    },
    flowBox: {
      padding: spacing.md,
      borderRadius: borderRadius.md,
      minWidth: '200px',
    },
    flowArrow: {
      color: '#4ade80',
      fontSize: '20px',
    },
    messageItem: {
      padding: spacing.md,
      background: 'rgba(255,255,255,0.05)',
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
    },
    userMsg: {
      borderLeft: '3px solid #3b82f6',
    },
    aiMsg: {
      borderLeft: '3px solid #8b5cf6',
    },
    badge: {
      display: 'inline-block',
      padding: `${spacing.xs} ${spacing.sm}`,
      background: 'rgba(139, 92, 246, 0.2)',
      borderRadius: borderRadius.sm,
      fontSize: '11px',
      marginRight: spacing.xs,
      marginBottom: spacing.xs,
    },
    empty: {
      color: '#666',
      fontStyle: 'italic',
    },
  };

  const renderFlowTab = () => (
    <div>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>🔄 Information Flow to LLMs</div>
        <div style={styles.flowDiagram}>
          <div style={{...styles.flowBox, background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6'}}>
            <strong>1. User Message</strong>
            <p style={{fontSize: '12px', marginTop: '4px', color: '#94a3b8'}}>
              {debugData?.messages?.filter(m => m.role === 'user').slice(-1)[0]?.content || 'No message'}
            </p>
          </div>
          
          <div style={styles.flowArrow}>↓</div>
          
          <div style={{...styles.flowBox, background: 'rgba(249, 115, 22, 0.2)', border: '1px solid #f97316'}}>
            <strong>2. E-DNA Profile Fetched</strong>
            <p style={{fontSize: '12px', marginTop: '4px', color: '#94a3b8'}}>
              Core Type: {debugData?.ednaProfile?.coreType || debugData?.latestProfile?.edna?.coreType || 'architect'} | 
              User: {TEST_USER_ID.slice(0, 8)}...
            </p>
          </div>
          
          <div style={styles.flowArrow}>↓</div>
          
          <div style={{...styles.flowBox, background: 'rgba(139, 92, 246, 0.2)', border: '1px solid #8b5cf6'}}>
            <strong>3. Psychological Frameworks Analyzed</strong>
            <div style={{marginTop: '8px'}}>
              {((debugData?.frameworksTriggered && debugData.frameworksTriggered.length > 0) 
                ? debugData.frameworksTriggered 
                : (debugData?.latestProfile?.frameworksUsed || ['dass', 'bigFive', 'attachment'])
              ).map((f: string) => (
                <span key={f} style={styles.badge}>{f}</span>
              ))}
            </div>
          </div>
          
          <div style={styles.flowArrow}>↓</div>
          
          <div style={{...styles.flowBox, background: 'rgba(34, 197, 94, 0.2)', border: '1px solid #22c55e'}}>
            <strong>4. Final Advice LLM (GPT-4o)</strong>
            <p style={{fontSize: '12px', marginTop: '4px', color: '#94a3b8'}}>
              Combines E-DNA + Psychological Analysis + Chat History → Personalized Response
            </p>
          </div>
        </div>
      </div>
      
      <div style={styles.section}>
        <div style={styles.sectionTitle}>🧠 AI Reasoning (What LLM Thought)</div>
        <div style={styles.code}>
          {debugData?.latestReasoning || 'No reasoning data available for this session'}
        </div>
      </div>
    </div>
  );

  const renderEdnaTab = () => (
    <div>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>🧬 E-DNA Profile Used</div>
        <div style={styles.code}>
          {JSON.stringify(debugData?.ednaProfile || debugData?.latestProfile?.edna || {
            coreType: 'architect',
            note: 'E-DNA data fetched from /api/agent/users/{userId}/quiz-results'
          }, null, 2)}
        </div>
      </div>
      
      <div style={styles.section}>
        <div style={styles.sectionTitle}>📊 Full Profile Snapshot</div>
        <div style={styles.code}>
          {JSON.stringify(debugData?.latestProfile || { note: 'Select a session with AI responses' }, null, 2)}
        </div>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>💬 Chat History (Sent to LLM)</div>
        {debugData?.messages?.length ? (
          debugData.messages.map((msg, idx) => (
            <div 
              key={idx} 
              style={{
                ...styles.messageItem,
                ...(msg.role === 'user' ? styles.userMsg : styles.aiMsg)
              }}
            >
              <div style={{fontSize: '11px', color: '#888', marginBottom: '4px'}}>
                {msg.role === 'user' ? '👤 User' : '🤖 AI'} • Message {idx + 1}
              </div>
              <div style={{fontSize: '13px'}}>
                {msg.content?.slice(0, 300)}{msg.content?.length > 300 ? '...' : ''}
              </div>
            </div>
          ))
        ) : (
          <p style={styles.empty}>No messages in this session</p>
        )}
      </div>
    </div>
  );

  const renderFrameworksTab = () => (
    <div>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>🔬 Psychological Frameworks Called</div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: spacing.md}}>
          {['DASS-42', 'Big Five', 'Dark Triad', 'RSE', 'Attachment', 'Enneagram', 'MBTI', 'Erikson', 'Gestalt', 'CRT', 'BioPsych'].map(framework => {
            const triggered = debugData?.frameworksTriggered?.includes(framework.toLowerCase().replace(/[- ]/g, '')) ||
                             debugData?.latestProfile?.frameworksUsed?.includes(framework.toLowerCase());
            return (
              <div 
                key={framework}
                style={{
                  padding: spacing.md,
                  background: triggered ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${triggered ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: borderRadius.md,
                }}
              >
                <div style={{fontWeight: 600, marginBottom: '4px'}}>
                  {triggered ? '✅' : '⚪'} {framework}
                </div>
                <div style={{fontSize: '11px', color: '#888'}}>
                  {triggered ? 'Called this session' : 'Not triggered'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div style={styles.section}>
        <div style={styles.sectionTitle}>📋 Analysis Results</div>
        <div style={styles.code}>
          {JSON.stringify(debugData?.latestAnalysis || { note: 'Select a session to see analysis' }, null, 2)}
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🔍 Debug Panel - LLM Flow</h1>
        <button style={styles.backButton} onClick={() => router.push('/')}>
          ← Back to Chat
        </button>
      </div>

      <div style={styles.sessionSelector}>
        <label style={{display: 'block', marginBottom: spacing.xs, color: '#888', fontSize: '12px'}}>
          Select Session:
        </label>
        <select 
          style={styles.select}
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
        >
          {sessions.length === 0 && <option value="">No sessions found</option>}
          {sessions.map(s => (
            <option key={s.id} value={s.id}>
              {s.title || 'Untitled'} ({s.messageCount || 0} msgs)
            </option>
          ))}
        </select>
      </div>

      <div style={styles.tabs}>
        {[
          { id: 'flow', label: '🔄 Flow' },
          { id: 'edna', label: '🧬 E-DNA' },
          { id: 'history', label: '💬 History' },
          { id: 'frameworks', label: '🔬 Frameworks' },
        ].map(tab => (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.panel}>
        {loading ? (
          <p style={{textAlign: 'center', color: '#888'}}>Loading...</p>
        ) : (
          <>
            {activeTab === 'flow' && renderFlowTab()}
            {activeTab === 'edna' && renderEdnaTab()}
            {activeTab === 'history' && renderHistoryTab()}
            {activeTab === 'frameworks' && renderFrameworksTab()}
          </>
        )}
      </div>
    </div>
  );
}
