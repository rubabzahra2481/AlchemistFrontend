'use client';

import React from 'react';
import { colors, typography, spacing, borderRadius, shadows, motion } from '../design-tokens';

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  isActive?: boolean;
}

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  isLoading?: boolean;
  authTimeout?: boolean;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewChat,
  isLoading = false,
  authTimeout = false,
}) => {
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            zIndex: 998,
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '320px',
          background: colors.white,
          borderRight: `1px solid ${colors.precisionPink}20`,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: `transform ${motion.cardHover}`,
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: shadows.lg,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: spacing.containerPadding.desktop,
            borderBottom: `1px solid ${colors.precisionPink}20`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              fontFamily: typography.h3.fontFamily,
              fontSize: '28px',
              lineHeight: typography.h3.lineHeight,
              color: colors.architectIndigo,
              margin: 0,
            }}
          >
            Chat History
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: `${colors.precisionPink}20`,
              color: colors.deepPlum,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `all ${motion.cardHover}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.precisionPink;
              e.currentTarget.style.color = colors.white;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${colors.precisionPink}20`;
              e.currentTarget.style.color = colors.deepPlum;
            }}
          >
            ✕
          </button>
        </div>

        {/* New Chat Button */}
        <div
          style={{
            padding: spacing.containerPadding.desktop,
            borderBottom: `1px solid ${colors.precisionPink}20`,
          }}
        >
          <button
            onClick={onNewChat}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: colors.architectScale,
              color: colors.white,
              border: 'none',
              borderRadius: borderRadius.md,
              fontFamily: typography.body.fontFamily,
              fontSize: typography.body.fontSize.desktop,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: `all ${motion.cardHover}`,
              boxShadow: shadows.sm,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.ctaHover;
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = shadows.md;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.architectScale;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = shadows.sm;
            }}
          >
            <span>+</span>
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat Sessions List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 0',
          }}
        >
          {isLoading && sessions.length === 0 ? (
            // Loading state (Option 1)
            <div
              style={{
                padding: spacing.containerPadding.desktop,
                textAlign: 'center',
                color: colors.deepPlum,
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: `${colors.architectIndigo}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  animation: 'spin 1s linear infinite',
                }}
              >
                <span style={{ fontSize: '20px' }}>⏳</span>
              </div>
              <p
                style={{
                  fontFamily: typography.caption.fontFamily, fontSize: "16px", lineHeight: typography.caption.lineHeight,
                  color: colors.deepPlum,
                  margin: 0,
                }}
              >
                Loading your chat history...
              </p>
            </div>
          ) : authTimeout ? (
            // Timeout message (Option 2)
            <div
              style={{
                padding: spacing.containerPadding.desktop,
                textAlign: 'center',
                color: colors.deepPlum,
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: `${colors.precisionPink}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <span style={{ fontSize: '20px' }}>🔐</span>
              </div>
              <p
                style={{
                  fontFamily: typography.caption.fontFamily, fontSize: "14px", lineHeight: typography.caption.lineHeight,
                  color: colors.deepPlum,
                  margin: '0 0 8px 0',
                }}
              >
                Waiting for authentication...
              </p>
              <p
                style={{
                  fontFamily: typography.caption.fontFamily, fontSize: "12px", lineHeight: typography.caption.lineHeight,
                  color: colors.deepPlum,
                  opacity: 0.7,
                  margin: 0,
                }}
              >
                If this persists, please refresh.
              </p>
            </div>
          ) : sessions.length === 0 ? (
            // Empty state (no sessions)
            <div
              style={{
                padding: spacing.containerPadding.desktop,
                textAlign: 'center',
                color: colors.deepPlum,
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: `${colors.architectIndigo}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <span style={{ fontSize: '20px' }}>💬</span>
              </div>
              <p
                style={{
                  fontFamily: typography.caption.fontFamily, fontSize: "16px", lineHeight: typography.caption.lineHeight,
                  color: colors.deepPlum,
                  margin: 0,
                }}
              >
                No chat history yet.<br />
                Start a conversation!
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                style={{
                  padding: '12px 16px',
                  margin: '4px 8px',
                  borderRadius: borderRadius.md,
                  cursor: 'pointer',
                  background: session.id === activeSessionId 
                    ? `${colors.architectScale}20` 
                    : 'transparent',
                  border: session.id === activeSessionId 
                    ? `1px solid ${colors.architectScale}40` 
                    : '1px solid transparent',
                  transition: `all ${motion.cardHover}`,
                }}
                onMouseEnter={(e) => {
                  if (session.id !== activeSessionId) {
                    e.currentTarget.style.background = `${colors.precisionPink}10`;
                    e.currentTarget.style.borderColor = `${colors.precisionPink}30`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (session.id !== activeSessionId) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '4px',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: typography.body.fontFamily,
                      fontSize: "16px",
                      lineHeight: typography.body.lineHeight,
                      fontWeight: 600,
                      color: session.id === activeSessionId 
                        ? colors.architectIndigo 
                        : colors.deepPlum,
                      margin: 0,
                    }}
                  >
                    {session.title}
                  </h3>
                  <span
                    style={{
                      fontFamily: typography.caption.fontFamily, fontSize: "16px", lineHeight: typography.caption.lineHeight,
                      color: colors.deepPlum,
                      opacity: 0.7,
                      whiteSpace: 'nowrap',
                      marginLeft: '8px',
                    }}
                  >
                    {formatTimestamp(session.timestamp)}
                  </span>
                </div>
                
                <p
                  style={{
                    fontFamily: typography.caption.fontFamily,
                    fontSize: "13px",
                    lineHeight: typography.caption.lineHeight,
                    color: colors.deepPlum,
                    opacity: 0.8,
                    margin: '4px 0 0 0',
                  }}
                >
                  {truncateText(session.lastMessage)}
                </p>
                
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '8px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: typography.caption.fontFamily,
                      fontSize: '11px',
                      lineHeight: typography.caption.lineHeight,
                      color: colors.deepPlum,
                      opacity: 0.6,
                    }}
                  >
                    {session.messageCount} message{session.messageCount !== 1 ? 's' : ''}
                  </span>
                  
                  {session.id === activeSessionId && (
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: colors.architectScale,
                      }}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: spacing.containerPadding.desktop,
            borderTop: `1px solid ${colors.precisionPink}20`,
            background: `${colors.architectIndigo}05`,
          }}
        >
          <p
            style={{
              fontFamily: typography.caption.fontFamily, fontSize: "16px", lineHeight: typography.caption.lineHeight,
              color: colors.deepPlum,
              opacity: 0.7,
              margin: 0,
              textAlign: 'center',
            }}
          >
            {sessions.length} conversation{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};













