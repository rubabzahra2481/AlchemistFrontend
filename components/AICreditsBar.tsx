'use client';

import React from 'react';
import { colors, typography, borderRadius, shadows } from '../design-tokens';

interface AICreditsBarProps {
  credits: number; // 0-100 percentage
  warning?: boolean; // Show warning if >= 80%
  message?: string; // Warning or error message
}

export const AICreditsBar: React.FC<AICreditsBarProps> = ({ credits, warning = false, message }) => {
  const getTier = (credits: number) => {
    if (credits >= 100) return { name: 'Exceeded', color: colors.founderRed };
    if (credits >= 90) return { name: 'Critical', color: colors.founderRed };
    if (credits >= 80) return { name: 'Warning', color: colors.scaleOrange };
    if (credits >= 50) return { name: 'Moderate', color: colors.deepPlum };
    if (credits >= 25) return { name: 'Light', color: colors.precisionPink };
    return { name: 'Available', color: colors.architectIndigo };
  };

  const tier = getTier(credits);
  const displayCredits = Math.min(100, Math.max(0, credits)); // Clamp between 0-100

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '4px',
        }}>
          <span style={{
            fontFamily: typography.caption.fontFamily,
            fontSize: '12px',
            lineHeight: typography.caption.lineHeight,
            color: colors.gray600,
            fontWeight: 500,
          }}>
            AI Credits
          </span>
          <div style={{
            width: '100px',
            height: '4px',
            background: colors.gray200,
            borderRadius: '2px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              width: `${displayCredits}%`,
              height: '100%',
              background: tier.color,
              borderRadius: '2px',
              transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
        </div>
        
        <div style={{
          padding: '6px 10px',
          background: tier.color === colors.founderRed 
            ? `${colors.founderRed}10`
            : tier.color === colors.scaleOrange
            ? `${colors.scaleOrange}10`
            : colors.gray100,
          borderRadius: '8px',
          border: `1px solid ${colors.gray200}`,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: tier.color,
          }} />
          <span style={{
            fontFamily: typography.caption.fontFamily,
            fontSize: '12px',
            lineHeight: typography.caption.lineHeight,
            color: tier.color === colors.founderRed || tier.color === colors.scaleOrange
              ? tier.color
              : colors.gray700,
            fontWeight: 600,
          }}>
            {displayCredits.toFixed(0)}%
          </span>
        </div>
      </div>
      
      {/* Warning/Error Message */}
      {message && (warning || displayCredits >= 80) && (
        <div style={{
          padding: '8px 12px',
          background: displayCredits >= 100 
            ? `${colors.founderRed}08` 
            : `${colors.scaleOrange}08`,
          borderRadius: '8px',
          border: `1px solid ${displayCredits >= 100 ? `${colors.founderRed}30` : `${colors.scaleOrange}30`}`,
        }}>
          <span style={{
            fontFamily: typography.caption.fontFamily,
            fontSize: '11px',
            lineHeight: typography.caption.lineHeight,
            color: displayCredits >= 100 ? colors.founderRed : colors.scaleOrange,
            fontWeight: 500,
          }}>
            {message}
          </span>
        </div>
      )}
    </div>
  );
};










