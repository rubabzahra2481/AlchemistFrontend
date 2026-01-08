'use client';

import React, { useState, useEffect } from 'react';

interface ProfileDebugProps {
  profile: any;
  analysis?: any;
}

export const PsychologicalProfileDebug: React.FC<ProfileDebugProps> = ({ profile, analysis }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'raw'>('overview');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['summary']));

  useEffect(() => {
    if (profile || analysis) {
      setIsOpen(true);
    }
  }, [profile, analysis]);

  const toggleModule = (moduleName: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleName)) {
      newExpanded.delete(moduleName);
    } else {
      newExpanded.add(moduleName);
    }
    setExpandedModules(newExpanded);
  };

  if (!profile && !analysis) {
    return (
      <div style={styles.container}>
        <div style={styles.header} onClick={() => setIsOpen(!isOpen)}>
          <div style={styles.headerTitle}>
            <span style={styles.headerIcon}>🧪</span>
            Debug Panel
          </div>
          <span style={styles.headerBadge}>No Data</span>
        </div>
      </div>
    );
  }

  const modules = [
    { key: 'bigFive', name: 'Big Five', icon: '🎭', color: '#8B5CF6' },
    { key: 'dass', name: 'DASS-42', icon: '💭', color: '#EC4899' },
    { key: 'rse', name: 'Self-Esteem', icon: '💪', color: '#F59E0B' },
    { key: 'darkTriad', name: 'Dark Triad', icon: '🌑', color: '#6B7280' },
    { key: 'crt', name: 'CRT', icon: '🧠', color: '#3B82F6' },
    { key: 'attachment', name: 'Attachment', icon: '💕', color: '#EF4444' },
    { key: 'enneagram', name: 'Enneagram', icon: '🔮', color: '#8B5CF6' },
    { key: 'mbti', name: 'MBTI', icon: '📊', color: '#10B981' },
    { key: 'erikson', name: 'Erikson', icon: '🌱', color: '#22C55E' },
    { key: 'gestalt', name: 'Gestalt', icon: '👁️', color: '#06B6D4' },
    { key: 'bioPsych', name: 'Bio-Psych', icon: '🧬', color: '#F97316' },
  ];

  const activeModules = modules.filter(m => profile?.[m.key]);
  const inactiveModules = modules.filter(m => !profile?.[m.key]);

  const getScoreColor = (value: string | number) => {
    if (typeof value === 'number') {
      if (value >= 0.7) return '#22C55E';
      if (value >= 0.4) return '#F59E0B';
      return '#EF4444';
    }
    const lower = String(value).toLowerCase();
    if (['high', 'severe', 'extremely_severe'].includes(lower)) return '#EF4444';
    if (['medium', 'moderate', 'mild'].includes(lower)) return '#F59E0B';
    if (['low', 'normal'].includes(lower)) return '#22C55E';
    return '#9CA3AF';
  };

  const formatValue = (key: string, value: any): React.ReactNode => {
    if (value === null || value === undefined) return <span style={{ color: '#6B7280' }}>null</span>;
    if (typeof value === 'boolean') return <span style={{ color: value ? '#22C55E' : '#EF4444' }}>{String(value)}</span>;
    if (typeof value === 'number') {
      const isPercentage = key.toLowerCase().includes('confidence');
      return <span style={{ color: getScoreColor(value) }}>{isPercentage ? `${(value * 100).toFixed(0)}%` : value.toFixed(2)}</span>;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return <span style={{ color: '#6B7280' }}>[]</span>;
      return (
        <div style={{ marginTop: '4px' }}>
          {value.slice(0, 5).map((item, i) => (
            <div key={i} style={styles.arrayItem}>• {String(item)}</div>
          ))}
          {value.length > 5 && <div style={{ ...styles.arrayItem, color: '#6B7280' }}>+{value.length - 5} more</div>}
        </div>
      );
    }
    if (typeof value === 'object') {
      return <pre style={styles.inlineJson}>{JSON.stringify(value, null, 2)}</pre>;
    }
    return <span style={{ color: getScoreColor(value) }}>{String(value)}</span>;
  };

  const renderModuleCard = (module: typeof modules[0]) => {
    const data = profile?.[module.key];
    if (!data) return null;

    const confidence = data.Confidence ?? data.confidence;
    const isExpanded = expandedModules.has(module.key);

    return (
      <div key={module.key} style={{ ...styles.moduleCard, borderLeftColor: module.color }}>
        <div style={styles.moduleHeader} onClick={() => toggleModule(module.key)}>
          <div style={styles.moduleTitle}>
            <span style={{ marginRight: '8px' }}>{module.icon}</span>
            {module.name}
            {confidence !== undefined && (
              <span style={{ ...styles.confidenceBadge, backgroundColor: getScoreColor(confidence) + '20', color: getScoreColor(confidence) }}>
                {(confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <span style={styles.expandIcon}>{isExpanded ? '−' : '+'}</span>
        </div>
        {isExpanded && (
          <div style={styles.moduleContent}>
            {Object.entries(data)
              .filter(([key]) => !['Confidence', 'confidence', 'Evidence', 'evidence', 'module_error'].includes(key))
              .map(([key, value]) => (
                <div key={key} style={styles.fieldRow}>
                  <span style={styles.fieldKey}>{key}:</span>
                  <span style={styles.fieldValue}>{formatValue(key, value)}</span>
                </div>
              ))}
            {(data.Evidence || data.evidence) && (
              <div style={styles.evidenceSection}>
                <div style={styles.evidenceTitle}>Evidence:</div>
                {(data.Evidence || data.evidence || []).slice(0, 3).map((ev: string, i: number) => (
                  <div key={i} style={styles.evidenceItem}>&quot;{ev}&quot;</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <div style={styles.headerTitle}>
          <span style={styles.headerIcon}>🧪</span>
          Psychological Debug
        </div>
        <div style={styles.headerRight}>
          <span style={styles.headerBadge}>{activeModules.length} active</span>
          <span style={styles.collapseIcon}>{isOpen ? '▼' : '▲'}</span>
        </div>
      </div>

      {isOpen && (
        <>
          {/* Tabs */}
          <div style={styles.tabBar}>
            {(['overview', 'modules', 'raw'] as const).map(tab => (
              <button
                key={tab}
                style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div style={styles.content}>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                {/* Safety Status */}
                <div style={{ ...styles.statusCard, borderLeftColor: profile?.safety?.flag === 'risk' ? '#EF4444' : '#22C55E' }}>
                  <div style={styles.statusIcon}>{profile?.safety?.flag === 'risk' ? '⚠️' : '✓'}</div>
                  <div>
                    <div style={styles.statusTitle}>Safety: {profile?.safety?.flag || 'none'}</div>
                    {profile?.safety?.category && <div style={styles.statusSub}>Category: {profile.safety.category}</div>}
                  </div>
                </div>

                {/* Summary */}
                {profile?.summaryForThisMessage && (
                  <div style={styles.summaryCard}>
                    <div style={styles.summaryTitle}>📝 Message Summary</div>
                    <div style={styles.summaryText}>{profile.summaryForThisMessage.summary}</div>
                    {profile.summaryForThisMessage.key_signals?.length > 0 && (
                      <div style={styles.signalList}>
                        {profile.summaryForThisMessage.key_signals.map((s: string, i: number) => (
                          <span key={i} style={styles.signalTag}>{s}</span>
                        ))}
                      </div>
                    )}
                    {profile.summaryForThisMessage.confidence && (
                      <div style={styles.summaryConfidence}>
                        Confidence: {(profile.summaryForThisMessage.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                )}

                {/* Active Frameworks Grid */}
                <div style={styles.sectionTitle}>Active Frameworks ({activeModules.length})</div>
                <div style={styles.frameworkGrid}>
                  {activeModules.map(m => (
                    <div key={m.key} style={{ ...styles.frameworkPill, backgroundColor: m.color + '20', borderColor: m.color }}>
                      <span>{m.icon}</span>
                      <span>{m.name}</span>
                    </div>
                  ))}
                </div>

                {/* Inactive Frameworks */}
                {inactiveModules.length > 0 && (
                  <>
                    <div style={{ ...styles.sectionTitle, marginTop: '16px', opacity: 0.5 }}>Inactive ({inactiveModules.length})</div>
                    <div style={styles.frameworkGrid}>
                      {inactiveModules.map(m => (
                        <div key={m.key} style={{ ...styles.frameworkPill, backgroundColor: '#374151', borderColor: '#4B5563', opacity: 0.5 }}>
                          <span>{m.icon}</span>
                          <span>{m.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Modules Tab */}
            {activeTab === 'modules' && (
              <div style={styles.modulesContainer}>
                {activeModules.length === 0 ? (
                  <div style={styles.emptyState}>No modules analyzed yet</div>
                ) : (
                  activeModules.map(m => renderModuleCard(m))
                )}
              </div>
            )}

            {/* Raw Tab */}
            {activeTab === 'raw' && (
              <div style={styles.rawContainer}>
                <div style={styles.rawTitle}>Raw Profile JSON</div>
                <pre style={styles.rawJson}>{JSON.stringify(profile, null, 2)}</pre>
                {analysis && (
                  <>
                    <div style={{ ...styles.rawTitle, marginTop: '16px' }}>Legacy Analysis</div>
                    <pre style={styles.rawJson}>{JSON.stringify(analysis, null, 2)}</pre>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    width: '420px',
    maxHeight: '85vh',
    backgroundColor: '#1F2937',
    borderRadius: '12px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    border: '1px solid #374151',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    fontSize: '12px',
    color: '#E5E7EB',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#111827',
    borderBottom: '1px solid #374151',
    cursor: 'pointer',
    userSelect: 'none',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: 600,
    fontSize: '13px',
  },
  headerIcon: {
    marginRight: '8px',
    fontSize: '14px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerBadge: {
    padding: '2px 8px',
    backgroundColor: '#374151',
    borderRadius: '12px',
    fontSize: '10px',
    color: '#9CA3AF',
  },
  collapseIcon: {
    fontSize: '10px',
    color: '#6B7280',
  },
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid #374151',
    backgroundColor: '#111827',
  },
  tab: {
    flex: 1,
    padding: '10px',
    border: 'none',
    background: 'none',
    color: '#9CA3AF',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.15s',
  },
  tabActive: {
    color: '#60A5FA',
    borderBottomColor: '#60A5FA',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  content: {
    padding: '16px',
    overflowY: 'auto',
    maxHeight: 'calc(85vh - 100px)',
  },
  statusCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#111827',
    borderRadius: '8px',
    borderLeft: '3px solid',
    marginBottom: '12px',
  },
  statusIcon: {
    fontSize: '18px',
  },
  statusTitle: {
    fontWeight: 600,
    fontSize: '12px',
  },
  statusSub: {
    fontSize: '10px',
    color: '#9CA3AF',
    marginTop: '2px',
  },
  summaryCard: {
    padding: '12px',
    backgroundColor: '#111827',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  summaryTitle: {
    fontWeight: 600,
    marginBottom: '8px',
    color: '#A5B4FC',
  },
  summaryText: {
    lineHeight: 1.5,
    color: '#D1D5DB',
  },
  summaryConfidence: {
    marginTop: '8px',
    fontSize: '10px',
    color: '#6B7280',
  },
  signalList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '10px',
  },
  signalTag: {
    padding: '2px 8px',
    backgroundColor: '#374151',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#A5B4FC',
  },
  sectionTitle: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  frameworkGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  frameworkPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '11px',
    border: '1px solid',
  },
  modulesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  moduleCard: {
    backgroundColor: '#111827',
    borderRadius: '8px',
    borderLeft: '3px solid',
    overflow: 'hidden',
  },
  moduleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  moduleTitle: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: 600,
  },
  confidenceBadge: {
    marginLeft: '8px',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 500,
  },
  expandIcon: {
    color: '#6B7280',
    fontSize: '14px',
  },
  moduleContent: {
    padding: '0 12px 12px',
    borderTop: '1px solid #374151',
  },
  fieldRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid #1F2937',
  },
  fieldKey: {
    color: '#9CA3AF',
    fontWeight: 500,
  },
  fieldValue: {
    textAlign: 'right',
    maxWidth: '60%',
  },
  evidenceSection: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#1F2937',
    borderRadius: '4px',
  },
  evidenceTitle: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#6B7280',
    marginBottom: '6px',
  },
  evidenceItem: {
    fontSize: '10px',
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: '4px',
  },
  arrayItem: {
    fontSize: '11px',
    color: '#D1D5DB',
    marginLeft: '8px',
  },
  inlineJson: {
    margin: 0,
    padding: '4px',
    backgroundColor: '#1F2937',
    borderRadius: '4px',
    fontSize: '9px',
    maxHeight: '80px',
    overflow: 'auto',
  },
  rawContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  rawTitle: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  rawJson: {
    margin: 0,
    padding: '12px',
    backgroundColor: '#111827',
    borderRadius: '8px',
    fontSize: '10px',
    lineHeight: 1.4,
    overflow: 'auto',
    maxHeight: '400px',
    color: '#A5B4FC',
  },
  emptyState: {
    padding: '24px',
    textAlign: 'center',
    color: '#6B7280',
  },
};
