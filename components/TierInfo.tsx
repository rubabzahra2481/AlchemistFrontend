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

  useEffect(() => {
    if (!userId || userId === '00000000-0000-0000-0000-000000000000') {
      setLoading(false);
      return;
    }

    const fetchTierInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = `${apiUrl}/chat/tier-info/${userId}`;
        console.log('🔍 [TierInfo] Fetching tier info from:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [TierInfo] Failed to fetch:', response.status, errorText);
          throw new Error(`Failed to fetch tier information: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ [TierInfo] Tier info received:', data);
        setTierInfo(data);
      } catch (err: any) {
        console.error('❌ [TierInfo] Error fetching tier info:', err);
        setError(err.message || 'Failed to load tier information');
      } finally {
        setLoading(false);
      }
    };

    fetchTierInfo();
    
    // Refresh every 30 seconds to update budget status
    const interval = setInterval(fetchTierInfo, 30000);
    return () => clearInterval(interval);
  }, [userId, apiUrl]);

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

  const { tierDisplay, limits, allowedModels, models, budgetStatus, message } = tierInfo;

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

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ padding: spacing.md }}>
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
