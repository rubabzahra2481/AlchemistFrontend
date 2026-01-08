'use client';

import React from 'react';
import { colors, borderRadius, shadows } from '../design-tokens';

export const TypingIndicator: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-start',
      marginBottom: '16px',
    }}>
      <div style={{
        padding: '16px 20px',
        borderRadius: `${borderRadius.md} ${borderRadius.md} ${borderRadius.md} 4px`,
        background: colors.white,
        boxShadow: shadows.md,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          display: 'flex',
          gap: '4px',
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: colors.scaleOrange,
                animation: `typing 1.4s infinite ease-in-out`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
        <span style={{
          color: colors.deepPlum,
          fontSize: '14px',
          fontStyle: 'italic',
        }}>
          AI is thinking...
        </span>
      </div>
      
      <style jsx>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};



















