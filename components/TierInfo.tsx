'use client';

import React, { useState, useEffect } from 'react';
import { colors, typography, spacing, borderRadius, shadows, motion } from '../design-tokens';

interface TierInfoData {
  userId: string;
  tier: string;
  tierDisplay: {
    name: string;
    color: string;
    badge: string;
    features: string[];
  };
  limits: {
    maxOutputTokens: number;
    maxInputTokens: number;
    maxOutputWords: number;
    maxInputWords: number;
  };
  allowedModels: string[];
  defaultModel: string;
  models: Array<{
    id: string;
    name: string;
    provider: string;
    allowed: boolean;
    pricingTier: string;
    isDefault: boolean;
  }>;
  budgetStatus: Array<{
    modelId: string;
    modelName: string;
    monthlyLimit: number;
    spent: number;
    remaining: number;
    percentageUsed: number;
  }>;
  credits: {
    allowed: boolean;
    message: string | null;
    tokensUsed: number;
    tokensIncluded: number;
    usagePercentage: number;
    warning: boolean;
  };
  message: string;
}

interface TierInfoProps {
  userId: string;
  apiUrl: string;
}

export const TierInfo: React.FC<TierInfoProps> = ({ userId, apiUrl }) => {
  const [tierInfo, setTierInfo] = useState<TierInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchTierInfo = React.useCallback(async (silent = false) => {
    if (!userId || userId === '00000000-0000-0000-0000-000000000000') {
      if (!silent) setLoading(false);
      return;
    }
    try {
      if (!silent) setLoading(true);
      setError(null);
      const url = `${apiUrl}/chat/tier-info/${userId}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch tier information: ${response.status}`);
      }
      const data = await response.json();
      setTierInfo(data);
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load tier information');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId, apiUrl]);

  useEffect(() => {
    fetchTierInfo(false);
    const interval = setInterval(() => fetchTierInfo(false), 30000);
    return () => clearInterval(interval);
  }, [fetchTierInfo]);

  // Refetch when user expands the card so "Monthly Credits" matches banner/button state
  useEffect(() => {
    if (isExpanded) fetchTierInfo(true);
  }, [isExpanded, fetchTierInfo]);

  if (loading) {
    return (
      <div style={{
        padding: spacing.md,
        background: colors.white,
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.gray200}`,
        fontSize: typeof typography.body.fontSize === 'string' ? typography.body.fontSize : typography.body.fontSize.desktop || '14px',
        color: colors.gray600,
      }}>
        Loading tier information...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: spacing.md,
        background: colors.white,
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.gray200}`,
        fontSize: typeof typography.body.fontSize === 'string' ? typography.body.fontSize : typography.body.fontSize.desktop || '14px',
        color: colors.gray600,
      }}>
        ⚠️ Could not load tier information: {error}
      </div>
    );
  }

  if (!tierInfo) {
    return null; // Still loading or no data
  }

  const { tierDisplay, limits, allowedModels, models, budgetStatus, credits, message } = tierInfo;

  const getPricingTierColor = (tier: string) => {
    switch (tier) {
      case 'cheap': return '#10B981'; // green
      case 'standard': return '#3B82F6'; // blue
      case 'premium': return '#8B5CF6'; // purple
      case 'expensive': return '#F59E0B'; // orange
      default: return colors.gray500;
    }
  };

  const getPricingTierLabel = (tier: string) => {
    switch (tier) {
      case 'cheap': return '💰 Cheap';
      case 'standard': return '⭐ Standard';
      case 'premium': return '💎 Premium';
      case 'expensive': return '👑 Expensive';
      default: return tier;
    }
  };

  return (
    <div style={{
      background: colors.white,
      borderRadius: borderRadius.lg,
      border: `1px solid ${colors.gray200}`,
      boxShadow: shadows.sm,
      overflow: 'hidden',
      marginBottom: spacing.md,
    }}>
      {/* Header - Always Visible */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: spacing.md,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${tierDisplay.color}15 0%, ${tierDisplay.color}05 100%)`,
          borderBottom: isExpanded ? `1px solid ${colors.gray200}` : 'none',
          transition: `all ${motion.smooth}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `linear-gradient(135deg, ${tierDisplay.color}20 0%, ${tierDisplay.color}10 100%)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `linear-gradient(135deg, ${tierDisplay.color}15 0%, ${tierDisplay.color}05 100%)`;
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span style={{ fontSize: '20px' }}>{tierDisplay.badge}</span>
          <div>
            <div style={{
              fontSize: typeof typography.h2?.fontSize === 'string' ? typography.h2.fontSize : typography.h2?.fontSize?.desktop || '18px',
              fontWeight: typography.h2?.fontWeight || 600,
              color: colors.gray900,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
            }}>
              {tierDisplay.name} Plan
              <span style={{
                fontSize: typeof typography.caption.fontSize === 'string' ? typography.caption.fontSize : typography.caption.fontSize.desktop || '12px',
                color: tierDisplay.color,
                fontWeight: 600,
                padding: '2px 8px',
                background: `${tierDisplay.color}15`,
                borderRadius: borderRadius.sm,
              }}>
                {tierInfo.tier}
              </span>
            </div>
            <div style={{
              fontSize: typeof typography.caption.fontSize === 'string' ? typography.caption.fontSize : typography.caption.fontSize.desktop || '12px',
              color: colors.gray600,
              marginTop: '2px',
            }}>
              {message}
            </div>
          </div>
        </div>
        <div style={{
          fontSize: typeof typography.body.fontSize === 'string' ? typography.body.fontSize : typography.body.fontSize.desktop || '14px',
          color: colors.gray500,
          transition: `transform ${motion.smooth}`,
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          ▼
        </div>
      </div>

      {/* Credit Status Banner - Always visible when not allowed */}
      {credits && !credits.allowed && (
        <div style={{
          padding: spacing.md,
          background: '#FEF2F2',
          borderBottom: '1px solid #FEE2E2',
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
        }}>
          <span style={{ fontSize: '20px' }}>🚫</span>
          <div>
            <div style={{ fontWeight: 600, color: '#DC2626', fontSize: '14px' }}>
              Credits Exhausted
            </div>
            <div style={{ fontSize: '12px', color: '#991B1B', marginTop: '2px' }}>
              {credits.message || 'You have used all your monthly credits. Upgrade your plan or wait until next month.'}
            </div>
          </div>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ padding: spacing.md }}>
          {/* Credits Section */}
          {credits && (
            <div style={{ marginBottom: spacing.lg }}>
              <h3 style={{
                fontSize: typeof typography.h3?.fontSize === 'string' ? typography.h3.fontSize : typography.h3?.fontSize?.desktop || '16px',
                fontWeight: typography.h3?.fontWeight || 600,
                color: colors.gray900,
                marginBottom: spacing.sm,
              }}>
                💳 Monthly Credits
              </h3>
              <div style={{
                padding: spacing.sm,
                background: !credits.allowed ? '#FEF2F2' : credits.warning ? '#FFFBEB' : colors.gray50,
                borderRadius: borderRadius.md,
                border: `1px solid ${!credits.allowed ? '#FEE2E2' : credits.warning ? '#FEF3C7' : colors.gray200}`,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.xs,
                }}>
                  <span style={{ fontSize: '13px', color: colors.gray700, fontWeight: 500 }}>
                    {credits.tokensUsed.toLocaleString()} / {credits.tokensIncluded.toLocaleString()} tokens
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: !credits.allowed ? '#DC2626' : credits.warning ? '#D97706' : '#10B981',
                  }}>
                    {credits.usagePercentage.toFixed(0)}% used
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '10px',
                  background: colors.gray200,
                  borderRadius: borderRadius.sm,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${Math.min(credits.usagePercentage, 100)}%`,
                    height: '100%',
                    background: !credits.allowed
                      ? '#EF4444'
                      : credits.usagePercentage > 90
                        ? '#EF4444'
                        : credits.usagePercentage > 70
                          ? '#F59E0B'
                          : '#10B981',
                    transition: `width ${motion.smooth}`,
                    borderRadius: borderRadius.sm,
                  }} />
                </div>
                {credits.message && (
                  <div style={{
                    fontSize: '12px',
                    color: !credits.allowed ? '#DC2626' : '#D97706',
                    marginTop: spacing.xs,
                    fontWeight: 500,
                  }}>
                    {credits.message}
                  </div>
                )}
                {!credits.allowed && (
                  <div style={{
                    marginTop: spacing.sm,
                    padding: '8px 12px',
                    background: '#DC2626',
                    color: '#fff',
                    borderRadius: borderRadius.md,
                    fontSize: '13px',
                    fontWeight: 600,
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}>
                    Upgrade Plan
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Limits Section */}
          <div style={{ marginBottom: spacing.lg }}>
            <h3 style={{
              fontSize: typeof typography.h3?.fontSize === 'string' ? typography.h3.fontSize : typography.h3?.fontSize?.desktop || '16px',
              fontWeight: typography.h3?.fontWeight || 600,
              color: colors.gray900,
              marginBottom: spacing.sm,
            }}>
              📊 Your Limits
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: spacing.sm,
            }}>
              <div style={{
                padding: spacing.sm,
                background: colors.gray50,
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.gray200}`,
              }}>
                <div style={{
                  fontSize: typeof typography.caption.fontSize === 'string' ? typography.caption.fontSize : typography.caption.fontSize.desktop || '12px',
                  color: colors.gray600,
                  marginBottom: '4px',
                }}>
                  Max Response Length
                </div>
                <div style={{
                  fontSize: typeof typography.h2?.fontSize === 'string' ? typography.h2.fontSize : typography.h2?.fontSize?.desktop || '18px',
                  fontWeight: 600,
                  color: colors.gray900,
                }}>
                  {limits.maxOutputWords.toLocaleString()} words
                </div>
                <div style={{
                  fontSize: typeof typography.caption.fontSize === 'string' ? typography.caption.fontSize : typography.caption.fontSize.desktop || '12px',
                  color: colors.gray500,
                  marginTop: '2px',
                }}>
                  ({limits.maxOutputTokens} tokens)
                </div>
              </div>
              <div style={{
                padding: spacing.sm,
                background: colors.gray50,
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.gray200}`,
              }}>
                <div style={{
                  fontSize: typeof typography.caption.fontSize === 'string' ? typography.caption.fontSize : typography.caption.fontSize.desktop || '12px',
                  color: colors.gray600,
                  marginBottom: '4px',
                }}>
                  Max Context
                </div>
                <div style={{
                  fontSize: typeof typography.h2?.fontSize === 'string' ? typography.h2.fontSize : typography.h2?.fontSize?.desktop || '18px',
                  fontWeight: 600,
                  color: colors.gray900,
                }}>
                  {limits.maxInputWords.toLocaleString()} words
                </div>
                <div style={{
                  fontSize: typeof typography.caption.fontSize === 'string' ? typography.caption.fontSize : typography.caption.fontSize.desktop || '12px',
                  color: colors.gray500,
                  marginTop: '2px',
                }}>
                  ({limits.maxInputTokens.toLocaleString()} tokens)
                </div>
              </div>
            </div>
          </div>

          {/* Allowed Models Section */}
          <div style={{ marginBottom: spacing.lg }}>
            <h3 style={{
              fontSize: typeof typography.h3?.fontSize === 'string' ? typography.h3.fontSize : typography.h3?.fontSize?.desktop || '16px',
              fontWeight: typography.h3?.fontWeight || 600,
              color: colors.gray900,
              marginBottom: spacing.sm,
            }}>
              🤖 Available Models ({allowedModels.length})
            </h3>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: spacing.xs,
            }}>
              {models
                .filter(m => m.allowed)
                .map(model => (
                  <div
                    key={model.id}
                    style={{
                      padding: '6px 12px',
                      background: model.isDefault 
                        ? `${tierDisplay.color}15` 
                        : colors.gray50,
                      borderRadius: borderRadius.md,
                      border: `1px solid ${
                        model.isDefault 
                          ? tierDisplay.color 
                          : colors.gray200
                      }`,
                      fontSize: typeof typography.caption.fontSize === 'string' ? typography.caption.fontSize : typography.caption.fontSize.desktop || '12px',
                      color: colors.gray900,
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                    }}
                  >
                    <span style={{
                      fontSize: '10px',
                      color: getPricingTierColor(model.pricingTier),
                    }}>
                      {getPricingTierLabel(model.pricingTier).split(' ')[0]}
                    </span>
                    <span style={{ fontWeight: model.isDefault ? 600 : 400 }}>
                      {model.name}
                    </span>
                    {model.isDefault && (
                      <span style={{
                        fontSize: '10px',
                        color: tierDisplay.color,
                        fontWeight: 600,
                      }}>
                        (default)
                      </span>
                    )}
                  </div>
                ))}
            </div>
            {models.filter(m => !m.allowed).length > 0 && (
              <div style={{ marginTop: spacing.sm }}>
                <div style={{
                  fontSize: typeof typography.caption.fontSize === 'string' ? typography.caption.fontSize : typography.caption.fontSize.desktop || '12px',
                  color: colors.gray600,
                  marginBottom: spacing.xs,
                }}>
                  🔒 Blocked Models ({models.filter(m => !m.allowed).length}):
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: spacing.xs,
                }}>
                  {models
                    .filter(m => !m.allowed)
                    .map(model => (
                      <div
                        key={model.id}
                        style={{
                          padding: '6px 12px',
                          background: colors.gray100,
                          borderRadius: borderRadius.md,
                          border: `1px solid ${colors.gray300}`,
                          fontSize: typeof typography.caption.fontSize === 'string' ? typography.caption.fontSize : typography.caption.fontSize.desktop || '12px',
                          color: colors.gray500,
                          textDecoration: 'line-through',
                        }}
                      >
                        {model.name}
                      </div>
                    ))}
                </div>
                <div style={{
                  fontSize: typeof typography.caption.fontSize === 'string' ? typography.caption.fontSize : typography.caption.fontSize.desktop || '12px',
                  color: colors.gray600,
                  marginTop: spacing.xs,
                  fontStyle: 'italic',
                }}>
                  Upgrade your plan to access these models
                </div>
              </div>
            )}
          </div>

          {/* Budget Status Section */}
          {budgetStatus.length > 0 && (
            <div>
              <h3 style={{
                fontSize: typeof typography.h3?.fontSize === 'string' ? typography.h3.fontSize : typography.h3?.fontSize?.desktop || '16px',
                fontWeight: typography.h3?.fontWeight || 600,
                color: colors.gray900,
                marginBottom: spacing.sm,
              }}>
                💰 Monthly Budget Status
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.sm,
              }}>
                {budgetStatus.map(budget => (
                  <div
                    key={budget.modelId}
                    style={{
                      padding: spacing.sm,
                      background: colors.gray50,
                      borderRadius: borderRadius.md,
                      border: `1px solid ${colors.gray200}`,
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: spacing.xs,
                    }}>
                      <div style={{
                        fontSize: typeof typography.body.fontSize === 'string' ? typography.body.fontSize : typography.body.fontSize.desktop || '14px',
                        fontWeight: 600,
                        color: colors.gray900,
                      }}>
                        {budget.modelName}
                      </div>
                      <div style={{
                        fontSize: typeof typography.caption.fontSize === 'string' ? typography.caption.fontSize : typography.caption.fontSize.desktop || '12px',
                        color: colors.gray600,
                      }}>
                        ${budget.spent.toFixed(2)} / ${budget.monthlyLimit.toFixed(2)}
                      </div>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: colors.gray200,
                      borderRadius: borderRadius.sm,
                      overflow: 'hidden',
                      marginBottom: spacing.xs,
                    }}>
                      <div style={{
                        width: `${Math.min(budget.percentageUsed, 100)}%`,
                        height: '100%',
                        background: budget.percentageUsed > 90 
                          ? '#EF4444' 
                          : budget.percentageUsed > 70 
                            ? '#F59E0B' 
                            : '#10B981',
                        transition: `width ${motion.smooth}`,
                      }} />
                    </div>
                    <div style={{
                      fontSize: typeof typography.caption.fontSize === 'string' ? typography.caption.fontSize : typography.caption.fontSize.desktop || '12px',
                      color: colors.gray600,
                    }}>
                      {budget.remaining > 0 
                        ? `$${budget.remaining.toFixed(2)} remaining this month`
                        : 'Budget exhausted - upgrade to continue using this model'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
