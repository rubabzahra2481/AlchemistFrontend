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
}

interface TierBadgeProps {
  userId: string;
  apiUrl: string;
  selectedModel?: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ userId, apiUrl, selectedModel }) => {
  const [tierInfo, setTierInfo] = useState<TierInfoData | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId || userId === '00000000-0000-0000-0000-000000000000') {
      return;
    }

    const fetchTierInfo = async () => {
      try {
        const response = await fetch(`${apiUrl}/chat/tier-info/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setTierInfo(data);
        }
      } catch (err) {
        // Silently fail - don't show errors
      }
    };

    fetchTierInfo();
    const interval = setInterval(fetchTierInfo, 30000);
    return () => clearInterval(interval);
  }, [userId, apiUrl]);

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

  if (!tierInfo) return null;

  const { tierDisplay, limits, allowedModels, budgetStatus = [] } = tierInfo;
  const isModelBlocked = selectedModel && !allowedModels.includes(selectedModel);
  const hasBudgetWarning = budgetStatus && budgetStatus.length > 0 && budgetStatus.some(b => b.percentageUsed > 80);

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
          background: isModelBlocked 
            ? '#FEF2F2' 
            : hasBudgetWarning 
              ? '#FFFBEB' 
              : `${tierDisplay.color}08`,
          border: `1px solid ${
            isModelBlocked 
              ? '#FEE2E2' 
              : hasBudgetWarning 
                ? '#FEF3C7' 
                : `${tierDisplay.color}20`
          }`,
          cursor: 'pointer',
          transition: `all ${motion.smooth}`,
          fontSize: typeof typography.caption.fontSize === 'string' 
            ? typography.caption.fontSize 
            : typography.caption.fontSize.desktop || '11px',
          fontWeight: 500,
          color: isModelBlocked 
            ? '#DC2626' 
            : hasBudgetWarning 
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
