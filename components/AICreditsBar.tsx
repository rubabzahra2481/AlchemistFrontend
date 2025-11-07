'use client';

import React from 'react';
import { colors, typography, borderRadius } from '../design-tokens';

interface AICreditsBarProps {
  credits: number; // 0-100 percentage
}

export const AICreditsBar: React.FC<AICreditsBarProps> = ({ credits }) => {
  const getTier = (credits: number) => {
    if (credits >= 90) return { name: 'Unlimited', color: colors.scaleOrange };
    if (credits >= 75) return { name: 'Expanded', color: colors.architectIndigo };
    if (credits >= 50) return { name: 'Moderate', color: colors.deepPlum };
    if (credits >= 25) return { name: 'Light', color: colors.precisionPink };
    return { name: 'Preview', color: colors.founderRed };
  };

  const tier = getTier(credits);

  return (
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
          fontSize: '13px',
          lineHeight: typography.caption.lineHeight,
          color: colors.deepPlum,
          fontWeight: 600,
        }}>
          AI Credits
        </span>
        <div style={{
          width: '120px',
          height: '6px',
          background: `${colors.precisionPink}20`,
          borderRadius: '3px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            width: `${credits}%`,
            height: '100%',
            background: colors.architectScale,
            borderRadius: '3px',
            transition: 'width 1.2s linear',
          }} />
        </div>
      </div>
      
      <div style={{
        padding: '6px 12px',
        background: `${tier.color}15`,
        borderRadius: borderRadius.sm,
        border: `1px solid ${tier.color}30`,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: tier.color,
        }} />
        <span style={{
          fontFamily: typography.caption.fontFamily,
          fontSize: '13px',
          lineHeight: typography.caption.lineHeight,
          color: tier.color,
          fontWeight: 600,
        }}>
          {tier.name}
        </span>
      </div>
    </div>
  );
};










