'use client';

import React, { useState, useEffect } from 'react';
import { colors, typography, borderRadius, shadows, motion } from '../design-tokens';

interface ProfileDebugProps {
  profile: any;
  analysis?: any;
}

export const PsychologicalProfileDebug: React.FC<ProfileDebugProps> = ({ profile, analysis }) => {
  // Auto-open when profile data is available
  const [isOpen, setIsOpen] = useState(!!profile || !!analysis);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  
  // Auto-open when new profile data arrives
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
    return null;
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const renderModule = (moduleName: string, moduleData: any) => {
    if (!moduleData || moduleData.module_error) {
      return (
        <div key={moduleName} style={{
          padding: '12px',
          background: colors.founderRed + '10',
          borderRadius: borderRadius.sm,
          border: `1px solid ${colors.founderRed}30`,
          marginBottom: '8px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onClick={() => toggleModule(moduleName)}>
            <span style={{
              fontFamily: typography.caption.fontFamily,
              fontSize: '13px',
              lineHeight: typography.caption.lineHeight,
              fontWeight: 600,
              color: colors.founderRed,
              textTransform: 'capitalize',
            }}>
              {moduleName} {moduleData?.module_error ? '❌ Error' : '⚠️ Missing'}
            </span>
            <span>{expandedModules.has(moduleName) ? '▲' : '▼'}</span>
          </div>
          {expandedModules.has(moduleName) && (
            <pre style={{
              marginTop: '8px',
              padding: '8px',
              background: colors.white,
              borderRadius: borderRadius.sm,
              fontSize: '11px',
              overflow: 'auto',
              maxHeight: '200px',
            }}>
              {formatValue(moduleData)}
            </pre>
          )}
        </div>
      );
    }

    const confidence = moduleData.Confidence ?? moduleData.confidence ?? 'N/A';
    const evidence = moduleData.Evidence ?? moduleData.evidence ?? [];

    return (
      <div key={moduleName} style={{
        padding: '12px',
        background: confidence >= 0.5 ? colors.scaleOrange + '10' : colors.precisionPink + '10',
        borderRadius: borderRadius.sm,
        border: `1px solid ${confidence >= 0.5 ? colors.scaleOrange : colors.precisionPink}30`,
        marginBottom: '8px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => toggleModule(moduleName)}>
          <div>
            <span style={{
              fontFamily: typography.caption.fontFamily,
              fontSize: '13px',
              lineHeight: typography.caption.lineHeight,
              fontWeight: 600,
              color: colors.architectIndigo,
              textTransform: 'capitalize',
            }}>
              {moduleName.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <span style={{
              marginLeft: '8px',
              fontSize: '11px',
              color: colors.deepPlum,
            }}>
              Confidence: {typeof confidence === 'number' ? (confidence * 100).toFixed(1) + '%' : confidence}
              {evidence.length > 0 && ` • ${evidence.length} evidence`}
            </span>
          </div>
          <span>{expandedModules.has(moduleName) ? '▲' : '▼'}</span>
        </div>
        {expandedModules.has(moduleName) && (
          <div style={{ marginTop: '8px' }}>
            {/* Show key fields for each module */}
            {Object.entries(moduleData).filter(([key]) => 
              !['Confidence', 'confidence', 'Evidence', 'evidence'].includes(key)
            ).map(([key, value]) => (
              <div key={key} style={{
                marginBottom: '6px',
                padding: '6px',
                background: colors.white,
                borderRadius: borderRadius.sm,
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: colors.architectIndigo,
                }}>
                  {key}:
                </span>
                <span style={{
                  fontSize: '11px',
                  color: colors.deepPlum,
                  marginLeft: '6px',
                }}>
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </span>
              </div>
            ))}
            {evidence.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: colors.architectIndigo,
                }}>
                  Evidence:
                </span>
                <ul style={{
                  margin: '4px 0 0 20px',
                  padding: 0,
                  fontSize: '11px',
                  color: colors.deepPlum,
                }}>
                  {evidence.slice(0, 5).map((ev: string, idx: number) => (
                    <li key={idx}>{ev}</li>
                  ))}
                  {evidence.length > 5 && <li>... and {evidence.length - 5} more</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const modules = profile ? [
    'bigFive', 'dass', 'rse', 'darkTriad', 'crt',
    'attachment', 'enneagram', 'mbti', 'erikson', 'gestalt', 'bioPsych'
  ] : [];

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '80vh',
      background: colors.white,
      borderRadius: borderRadius.lg,
      boxShadow: shadows.xl,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      transition: `all ${motion.cardHover}`,
      border: `2px solid ${colors.scaleOrange}`,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        background: colors.architectIndigo,
        color: colors.white,
        borderRadius: `${borderRadius.lg} ${borderRadius.lg} 0 0`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
      }}
      onClick={() => setIsOpen(!isOpen)}>
        <div>
          <div style={{
            fontFamily: typography.caption.fontFamily,
            fontSize: '14px',
            lineHeight: typography.caption.lineHeight,
            fontWeight: 700,
          }}>
            🧠 Psychological Profile Debug
          </div>
          <div style={{
            fontSize: '11px',
            opacity: 0.9,
            marginTop: '2px',
          }}>
            {isOpen ? 'Click to collapse' : 'Click to expand'}
          </div>
        </div>
        <span style={{ fontSize: '18px' }}>
          {isOpen ? '▼' : '▲'}
        </span>
      </div>

      {isOpen && (
        <div style={{
          padding: '16px',
          overflowY: 'auto',
          maxHeight: 'calc(80vh - 80px)',
        }}>
          {/* Safety Flag */}
          {profile?.safety && (
            <div style={{
              padding: '12px',
              background: profile.safety.flag === 'risk' 
                ? colors.founderRed + '20' 
                : colors.scaleOrange + '10',
              borderRadius: borderRadius.sm,
              border: `2px solid ${profile.safety.flag === 'risk' ? colors.founderRed : colors.scaleOrange}`,
              marginBottom: '12px',
            }}>
              <div style={{
                fontFamily: typography.caption.fontFamily, fontSize: "13px", lineHeight: typography.caption.lineHeight,
                fontWeight: 700,
                color: profile.safety.flag === 'risk' ? colors.founderRed : colors.scaleOrange,
              }}>
                {profile.safety.flag === 'risk' ? '⚠️ SAFETY ALERT' : '✓ Safety Check Passed'}
              </div>
              {profile.safety.category && (
                <div style={{ fontSize: '11px', color: colors.deepPlum, marginTop: '4px' }}>
                  Category: {profile.safety.category}
                </div>
              )}
            </div>
          )}

          {/* Summary for This Message */}
          {profile?.summaryForThisMessage && (
            <div style={{
              padding: '12px',
              background: colors.architectIndigo + '10',
              borderRadius: borderRadius.sm,
              border: `1px solid ${colors.architectIndigo}30`,
              marginBottom: '12px',
            }}>
              <div style={{
                fontFamily: typography.caption.fontFamily, fontSize: "13px", lineHeight: typography.caption.lineHeight,
                fontWeight: 600,
                color: colors.architectIndigo,
                marginBottom: '6px',
              }}>
                📝 Message Summary
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.deepPlum,
                lineHeight: '140%',
              }}>
                {profile.summaryForThisMessage.summary}
              </div>
              {profile.summaryForThisMessage.confidence && (
                <div style={{
                  fontSize: '11px',
                  color: colors.deepPlum,
                  marginTop: '4px',
                  opacity: 0.7,
                }}>
                  Confidence: {(profile.summaryForThisMessage.confidence * 100).toFixed(1)}%
                </div>
              )}
            </div>
          )}

          {/* Integration Meta: Similarities, Mild Cases, Conflict Resolutions */}
          {profile?.integrationMeta && (
            <div style={{ marginBottom: '12px' }}>
              {/* Similarities */}
              {profile.integrationMeta.similarities && profile.integrationMeta.similarities.length > 0 && (
                <div style={{
                  padding: '12px',
                  background: colors.scaleOrange + '10',
                  borderRadius: borderRadius.sm,
                  border: `1px solid ${colors.scaleOrange}30`,
                  marginBottom: '8px',
                }}>
                  <div style={{
                    fontFamily: typography.caption.fontFamily, fontSize: "13px", lineHeight: typography.caption.lineHeight,
                    fontWeight: 600,
                    color: colors.scaleOrange,
                    marginBottom: '6px',
                  }}>
                    ✅ Model Agreement (Confidence Boosted)
                  </div>
                  {profile.integrationMeta.similarities.map((sim: any, idx: number) => (
                    <div key={idx} style={{
                      fontSize: '11px',
                      color: colors.deepPlum,
                      marginBottom: '4px',
                      padding: '4px 8px',
                      background: colors.white,
                      borderRadius: borderRadius.sm,
                      borderLeft: `3px solid ${colors.scaleOrange}`,
                    }}>
                      <strong>{sim.models?.join(' + ') || 'Multiple models'}:</strong> {sim.agreement} ({sim.confidenceBoost} boost)
                    </div>
                  ))}
                </div>
              )}

              {/* Mild/In-Between Cases */}
              {profile.integrationMeta.mildCases && profile.integrationMeta.mildCases.length > 0 && (
                <div style={{
                  padding: '12px',
                  background: colors.precisionPink + '10',
                  borderRadius: borderRadius.sm,
                  border: `1px solid ${colors.precisionPink}30`,
                  marginBottom: '8px',
                }}>
                  <div style={{
                    fontFamily: typography.caption.fontFamily, fontSize: "13px", lineHeight: typography.caption.lineHeight,
                    fontWeight: 600,
                    color: colors.precisionPink,
                    marginBottom: '6px',
                  }}>
                    ⚖️ Moderate/Balanced Traits Detected
                  </div>
                  {profile.integrationMeta.mildCases.map((mild: any, idx: number) => (
                    <div key={idx} style={{
                      fontSize: '11px',
                      color: colors.deepPlum,
                      marginBottom: '4px',
                      padding: '4px 8px',
                      background: colors.white,
                      borderRadius: borderRadius.sm,
                      borderLeft: `3px solid ${colors.precisionPink}`,
                    }}>
                      <strong>{mild.trait}:</strong> {mild.value || JSON.stringify(mild.values)} - {mild.interpretation}
                    </div>
                  ))}
                </div>
              )}

              {/* Conflict Resolutions */}
              {profile.integrationMeta.conflictResolutions && profile.integrationMeta.conflictResolutions.length > 0 && (
                <div style={{
                  padding: '12px',
                  background: colors.founderRed + '10',
                  borderRadius: borderRadius.sm,
                  border: `1px solid ${colors.founderRed}30`,
                  marginBottom: '8px',
                }}>
                  <div style={{
                    fontFamily: typography.caption.fontFamily, fontSize: "13px", lineHeight: typography.caption.lineHeight,
                    fontWeight: 600,
                    color: colors.founderRed,
                    marginBottom: '6px',
                  }}>
                    ⚠️ Conflicts Resolved (Confidence Reduced)
                  </div>
                  {profile.integrationMeta.conflictResolutions.map((res: any, idx: number) => (
                    <div key={idx} style={{
                      fontSize: '11px',
                      color: colors.deepPlum,
                      marginBottom: '4px',
                      padding: '4px 8px',
                      background: colors.white,
                      borderRadius: borderRadius.sm,
                      borderLeft: `3px solid ${colors.founderRed}`,
                    }}>
                      <strong>{res.conflict}:</strong> {res.action}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conflict Flag (Legacy) */}
          {profile?.conflict !== undefined && (
            <div style={{
              padding: '12px',
              background: profile.conflict 
                ? colors.founderRed + '10' 
                : colors.scaleOrange + '10',
              borderRadius: borderRadius.sm,
              border: `1px solid ${profile.conflict ? colors.founderRed : colors.scaleOrange}30`,
              marginBottom: '12px',
            }}>
              <div style={{
                fontFamily: typography.caption.fontFamily, fontSize: "13px", lineHeight: typography.caption.lineHeight,
                fontWeight: 600,
                color: profile.conflict ? colors.founderRed : colors.scaleOrange,
                marginBottom: profile.conflict && profile.conflictDetails ? '6px' : '0',
              }}>
                {profile.conflict ? '⚠️ Profile Conflicts Detected' : '✓ No Profile Conflicts'}
              </div>
              {profile.conflict && profile.conflictDetails && Array.isArray(profile.conflictDetails) && (
                <div style={{ marginTop: '8px' }}>
                  {profile.conflictDetails.map((conflict: string, idx: number) => (
                    <div key={idx} style={{
                      fontSize: '11px',
                      color: colors.deepPlum,
                      marginBottom: '4px',
                      padding: '4px 8px',
                      background: colors.white,
                      borderRadius: borderRadius.sm,
                      borderLeft: `3px solid ${colors.founderRed}`,
                    }}>
                      • {conflict}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Module Analysis Results */}
          <div style={{
            fontFamily: typography.caption.fontFamily, fontSize: "13px", lineHeight: typography.caption.lineHeight,
            fontWeight: 700,
            color: colors.architectIndigo,
            marginBottom: '8px',
            marginTop: '12px',
          }}>
            Analysis Modules:
          </div>
          {modules.map(moduleName => {
            const moduleData = profile?.[moduleName];
            return moduleData ? renderModule(moduleName, moduleData) : null;
          })}

          {/* Raw Profile Data (collapsed by default) */}
          <div style={{ marginTop: '16px' }}>
            <div
              style={{
                padding: '8px',
                background: colors.precisionPink + '10',
                borderRadius: borderRadius.sm,
                cursor: 'pointer',
              }}
              onClick={() => toggleModule('raw')}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: colors.deepPlum,
                }}>
                  📄 Raw Profile JSON
                </span>
                <span>{expandedModules.has('raw') ? '▲' : '▼'}</span>
              </div>
            </div>
            {expandedModules.has('raw') && (
              <pre style={{
                marginTop: '8px',
                padding: '12px',
                background: colors.white,
                borderRadius: borderRadius.sm,
                border: `1px solid ${colors.precisionPink}30`,
                fontSize: '10px',
                overflow: 'auto',
                maxHeight: '300px',
                lineHeight: '140%',
              }}>
                {JSON.stringify(profile, null, 2)}
              </pre>
            )}
          </div>

          {/* Old Analysis (for compatibility) */}
          {analysis && (
            <div style={{ marginTop: '16px' }}>
              <div
                style={{
                  padding: '8px',
                  background: colors.precisionPink + '10',
                  borderRadius: borderRadius.sm,
                  cursor: 'pointer',
                }}
                onClick={() => toggleModule('oldAnalysis')}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: colors.deepPlum,
                  }}>
                    📊 Legacy Analysis Data
                  </span>
                  <span>{expandedModules.has('oldAnalysis') ? '▲' : '▼'}</span>
                </div>
              </div>
              {expandedModules.has('oldAnalysis') && (
                <pre style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: colors.white,
                  borderRadius: borderRadius.sm,
                  border: `1px solid ${colors.precisionPink}30`,
                  fontSize: '10px',
                  overflow: 'auto',
                  maxHeight: '300px',
                }}>
                  {JSON.stringify(analysis, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};











