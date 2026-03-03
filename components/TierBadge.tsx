'use client';

import React, { useState, useEffect, useRef } from 'react';
import { colors, typography, spacing, borderRadius, shadows, motion } from '../design-tokens';

interface TierInfoData {
  tier: string;
  tierDisplay: {
    name: string;
    color: string;
    badge: string;
  };
  limits: {
    maxOutputTokens: number;
    maxOutputWords: number;
  };
  allowedModels: string[];
  budgetStatus: Array<{
    modelId: string;
    modelName: string;
    monthlyLimit: number;
    spent: number;
    remaining: number;
    percentageUsed: number;
  }>;
  credits?: {
    allowed: boolean;
    message: string | null;
    tokensUsed: number;
    tokensIncluded: number;
    usagePercentage: number;
    warning: boolean;
  };
}

interface TierBadgeProps {
  userId: string;
  apiUrl: string;
  selectedModel?: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ userId, apiUrl, selectedModel }) => {
  const [tierInfo, setTierInfo] = useState<TierInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const fetchTierInfo = React.useCallback(async () => {
    if (!userId || userId === '00000000-0000-0000-0000-000000000000') return;
    try {
      const response = await fetch(`${apiUrl}/chat/tier-info/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setTierInfo(data);
      }
    } catch (err) {
      // Keep previous tierInfo or null so we can show fallback
    } finally {
      setLoading(false);
    }
  }, [userId, apiUrl]);

  useEffect(() => {
    fetchTierInfo();
    const interval = setInterval(fetchTierInfo, 30000);
    return () => clearInterval(interval);
  }, [fetchTierInfo]);

  // Refetch when user opens tooltip so "Monthly Credits" is never stale vs banner/button
  useEffect(() => {
    if (showTooltip) fetchTierInfo();
  }, [showTooltip, fetchTierInfo]);

  useEffect(() => {
    // Close tooltip when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTooltip]);

  // Show loading pill so badge area is visible; show fallback if fetch failed (e.g. backend not on same port)
  if (loading && !tierInfo) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: borderRadius.md,
        background: colors.gray100,
        color: colors.gray500,
        fontSize: '11px',
        fontWeight: 500,
      }}>
        Tier…
      </div>
    );
  }
  if (!tierInfo) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: borderRadius.md,
        background: colors.gray100,
        color: colors.gray600,
        fontSize: '11px',
        fontWeight: 500,
        border: `1px solid ${colors.gray200}`,
      }} title="Tier info unavailable — is the backend running on port 9000?">
        Tier
      </div>
    );
  }

  const { tierDisplay, limits, allowedModels, budgetStatus = [], credits } = tierInfo;
  const isModelBlocked = selectedModel && !allowedModels.includes(selectedModel);
  const hasBudgetWarning = budgetStatus && budgetStatus.length > 0 && budgetStatus.some(b => b.percentageUsed > 80);
  const creditsExhausted = credits && !credits.allowed;
  const creditsWarning = credits && credits.warning && credits.allowed;

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(true);
    timeoutRef.current = setTimeout(() => setShowTooltip(true), 200); // Small delay for better UX
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(false);
    timeoutRef.current = setTimeout(() => setShowTooltip(false), 150);
  };

  const handleClick = () => {
    setShowTooltip(!showTooltip);
  };

  return (
    <>
      {/* Minimal Badge - Like ChatGPT's subtle indicators */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: borderRadius.md,
          background: creditsExhausted
            ? '#FEF2F2'
            : isModelBlocked 
              ? '#FEF2F2' 
              : hasBudgetWarning || creditsWarning
                ? '#FFFBEB' 
                : `${tierDisplay.color}08`,
          border: `1px solid ${
            creditsExhausted || isModelBlocked 
              ? '#FEE2E2' 
              : hasBudgetWarning || creditsWarning
                ? '#FEF3C7' 
                : `${tierDisplay.color}20`
          }`,
          cursor: 'pointer',
          transition: `all ${motion.smooth}`,
          fontSize: typeof typography.caption.fontSize === 'string' 
            ? typography.caption.fontSize 
            : typography.caption.fontSize.desktop || '11px',
          fontWeight: 500,
          color: creditsExhausted || isModelBlocked 
            ? '#DC2626' 
            : hasBudgetWarning || creditsWarning
              ? '#D97706' 
              : tierDisplay.color,
          position: 'relative',
        }}
      >
        <span style={{ fontSize: '12px' }}>{tierDisplay.badge}</span>
        <span>{tierDisplay.name}</span>
        {isModelBlocked && (
          <span style={{ 
            fontSize: '10px', 
            color: '#DC2626',
            marginLeft: '2px',
          }}>⚠️</span>
        )}
        {hasBudgetWarning && !isModelBlocked && (
          <span style={{ 
            fontSize: '10px', 
            color: '#D97706',
            marginLeft: '2px',
          }}>⚠️</span>
        )}
      </div>

      {/* Elegant Tooltip/Popover - Appears on hover/click */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '320px',
            background: colors.white,
            borderRadius: borderRadius.lg,
            border: `1px solid ${colors.gray200}`,
            boxShadow: shadows.xl,
            padding: spacing.md,
            zIndex: 1000,
            animation: 'fadeIn 0.15s ease-out',
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={handleMouseLeave}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-4px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.sm,
            paddingBottom: spacing.sm,
            borderBottom: `1px solid ${colors.gray200}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <span style={{ fontSize: '16px' }}>{tierDisplay.badge}</span>
              <span style={{
                fontSize: typeof typography.body.fontSize === 'string' 
                  ? typography.body.fontSize 
                  : typography.body.fontSize.desktop || '14px',
                fontWeight: 600,
                color: colors.gray900,
              }}>
                {tierDisplay.name} Plan
              </span>
            </div>
          </div>

          {/* Limits - Clean, minimal */}
          <div style={{ marginBottom: spacing.md }}>
            <div style={{
              fontSize: typeof typography.caption.fontSize === 'string' 
                ? typography.caption.fontSize 
                : typography.caption.fontSize.desktop || '11px',
              color: colors.gray600,
              marginBottom: spacing.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 600,
            }}>
              Limits
            </div>
            <div style={{
              display: 'flex',
              gap: spacing.md,
            }}>
              <div>
                <div style={{
                  fontSize: typeof typography.body.fontSize === 'string' 
                    ? typography.body.fontSize 
                    : typography.body.fontSize.desktop || '14px',
                  fontWeight: 600,
                  color: colors.gray900,
                }}>
                  {limits.maxOutputWords.toLocaleString()}
                </div>
                <div style={{
                  fontSize: typeof typography.caption.fontSize === 'string' 
                    ? typography.caption.fontSize 
                    : typography.caption.fontSize.desktop || '11px',
                  color: colors.gray500,
                  marginTop: '2px',
                }}>
                  words/response
                </div>
              </div>
            </div>
          </div>

          {/* Model Status */}
          {isModelBlocked && (
            <div style={{
              padding: spacing.sm,
              background: '#FEF2F2',
              borderRadius: borderRadius.md,
              border: '1px solid #FEE2E2',
              marginBottom: spacing.sm,
            }}>
              <div style={{
                fontSize: typeof typography.caption.fontSize === 'string' 
                  ? typography.caption.fontSize 
                  : typography.caption.fontSize.desktop || '11px',
                color: '#DC2626',
                fontWeight: 500,
              }}>
                ⚠️ {selectedModel} is not available on {tierDisplay.name} plan
              </div>
            </div>
          )}

          {/* Budget Warnings */}
          {hasBudgetWarning && budgetStatus.map(budget => (
            budget.percentageUsed > 80 && (
              <div
                key={budget.modelId}
                style={{
                  padding: spacing.sm,
                  background: budget.percentageUsed > 90 
                    ? '#FEF2F2' 
                    : '#FFFBEB',
                  borderRadius: borderRadius.md,
                  border: `1px solid ${budget.percentageUsed > 90 ? '#FEE2E2' : '#FEF3C7'}`,
                  marginBottom: spacing.xs,
                }}
              >
                <div style={{
                  fontSize: typeof typography.caption.fontSize === 'string' 
                    ? typography.caption.fontSize 
                    : typography.caption.fontSize.desktop || '11px',
                  color: budget.percentageUsed > 90 ? '#DC2626' : '#D97706',
                  fontWeight: 500,
                  marginBottom: '4px',
                }}>
                  {budget.modelName}: ${budget.spent.toFixed(2)} / ${budget.monthlyLimit.toFixed(2)}
                </div>
                <div style={{
                  width: '100%',
                  height: '4px',
                  background: colors.gray200,
                  borderRadius: borderRadius.sm,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${Math.min(budget.percentageUsed, 100)}%`,
                    height: '100%',
                    background: budget.percentageUsed > 90 
                      ? '#EF4444' 
                      : '#F59E0B',
                    transition: `width ${motion.smooth}`,
                  }} />
                </div>
              </div>
            )
          ))}

          {/* Credits Status */}
          {credits && (
            <div style={{ marginBottom: spacing.sm }}>
              <div style={{
                fontSize: typeof typography.caption.fontSize === 'string' 
                  ? typography.caption.fontSize 
                  : typography.caption.fontSize.desktop || '11px',
                color: colors.gray600,
                marginBottom: spacing.xs,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 600,
              }}>
                Monthly Credits
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px',
              }}>
                <span style={{
                  fontSize: '12px',
                  color: colors.gray700,
                }}>
                  {credits.tokensUsed.toLocaleString()} / {credits.tokensIncluded.toLocaleString()}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: !credits.allowed ? '#DC2626' : credits.warning ? '#D97706' : '#10B981',
                }}>
                  {credits.usagePercentage.toFixed(0)}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: colors.gray200,
                borderRadius: borderRadius.sm,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.min(credits.usagePercentage, 100)}%`,
                  height: '100%',
                  background: !credits.allowed ? '#EF4444' : credits.usagePercentage > 90 ? '#EF4444' : credits.usagePercentage > 70 ? '#F59E0B' : '#10B981',
                  transition: `width ${motion.smooth}`,
                }} />
              </div>
              {!credits.allowed && (
                <div style={{
                  fontSize: '11px',
                  color: '#DC2626',
                  fontWeight: 500,
                  marginTop: '4px',
                }}>
                  Credits exhausted — upgrade to continue
                </div>
              )}
            </div>
          )}

          {/* Available Models Count */}
          <div style={{
            fontSize: typeof typography.caption.fontSize === 'string' 
              ? typography.caption.fontSize 
              : typography.caption.fontSize.desktop || '11px',
            color: colors.gray500,
            marginTop: spacing.sm,
            paddingTop: spacing.sm,
            borderTop: `1px solid ${colors.gray200}`,
          }}>
            {allowedModels.length} model{allowedModels.length !== 1 ? 's' : ''} available
          </div>
        </div>
      )}
    </>
  );
};
