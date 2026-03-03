'use client';

import React, { useState, useRef, useEffect } from 'react';
import { colors, typography, spacing, borderRadius, shadows, motion, zIndex } from '../design-tokens';

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
  onDeleteSession?: (sessionId: string) => Promise<void>;
  onRenameSession?: (sessionId: string, newTitle: string) => Promise<void>;
  isLoading?: boolean;
  authTimeout?: boolean;
  isLayoutSidebar?: boolean; // If true, sidebar is part of layout (not overlay)
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  isLoading = false,
  authTimeout = false,
  isLayoutSidebar = false,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [isSubmittingRename, setIsSubmittingRename] = useState(false);
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Prevent body scroll when sidebar is open (only for overlay mode)
  useEffect(() => {
    if (!isLayoutSidebar && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isLayoutSidebar]);
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const menuElement = menuRefs.current[openMenuId];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuId]);

  const handleMenuClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent triggering session select
    setOpenMenuId(openMenuId === sessionId ? null : sessionId);
  };

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setOpenMenuId(null);
    
    if (onDeleteSession) {
      if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
        try {
          await onDeleteSession(sessionId);
        } catch (error) {
          console.error('Failed to delete session:', error);
          alert('Failed to delete chat. Please try again.');
        }
      }
    }
  };

  const handleRename = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setRenamingSessionId(session.id);
    setRenameValue(session.title);
    setTimeout(() => renameInputRef.current?.focus(), 0);
  };

  const handleRenameSubmit = async (e: React.FormEvent | React.KeyboardEvent, sessionId: string) => {
    e.stopPropagation();
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }
    
    if (!renameValue.trim() || !onRenameSession || isSubmittingRename) {
      setRenamingSessionId(null);
      setIsSubmittingRename(false);
      return;
    }

    setIsSubmittingRename(true);
    try {
      await onRenameSession(sessionId, renameValue.trim());
      setRenamingSessionId(null);
      setRenameValue('');
    } catch (error) {
      console.error('Failed to rename session:', error);
      alert('Failed to rename chat. Please try again.');
    } finally {
      setIsSubmittingRename(false);
    }
  };

  const handleRenameCancel = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setRenamingSessionId(null);
    setRenameValue('');
    setIsSubmittingRename(false);
  };

  // Layout sidebar (part of layout) vs overlay sidebar
  if (isLayoutSidebar) {
    return (
      <div
        style={{
          width: isOpen ? '280px' : '0px',
          height: '100%',
          background: colors.white,
          borderRight: isOpen ? `1px solid ${colors.gray200}` : 'none',
          overflow: 'hidden',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          willChange: 'width',
        }}
      >
        <div
          style={{
            width: '280px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            opacity: isOpen ? 1 : 0,
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.1s',
            overflow: 'hidden',
          }}
        >
        {/* New Chat Button - ChatGPT style minimal */}
        <div
          style={{
            padding: '8px',
            opacity: isOpen ? 1 : 0,
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.1s',
          }}
        >
          <button
            onClick={onNewChat}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: colors.architectScaleMedium,
              color: colors.text.primary,
              border: `1px solid ${colors.border.base}`,
              borderRadius: '8px',
              fontFamily: typography.body.fontFamily,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: `all ${motion.smooth}`,
              textAlign: 'left',
              boxShadow: shadows.sm,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.architectScaleStrong;
              e.currentTarget.style.borderColor = colors.brandOrange.base;
              e.currentTarget.style.boxShadow = shadows.md;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.architectScaleMedium;
              e.currentTarget.style.borderColor = colors.border.base;
              e.currentTarget.style.boxShadow = shadows.sm;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <path d="M8 3.5V12.5M3.5 8H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>New chat</span>
          </button>
        </div>

        {/* Chat Sessions List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px',
            opacity: isOpen ? 1 : 0,
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.15s',
          }}
        >
          {isLoading && sessions.length === 0 ? (
            // Loading state (Option 1)
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: colors.gray100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: `2px solid ${colors.gray300}`,
                    borderTopColor: colors.gray600,
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                </div>
                <p
                  style={{
                    fontFamily: typography.body.fontFamily,
                    fontSize: "13px",
                    lineHeight: '1.4',
                    color: colors.gray600,
                    margin: 0,
                  }}
                >
                  Loading chats...
                </p>
              </div>
          ) : authTimeout ? (
            // Timeout message (Option 2)
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: colors.gray100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                    <path d="M8 4V8M8 10H8.01M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" stroke={colors.gray600} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p
                  style={{
                    fontFamily: typography.body.fontFamily,
                    fontSize: "13px",
                    lineHeight: '1.4',
                    color: colors.gray700,
                    margin: '0 0 4px 0',
                  }}
                >
                  Waiting for authentication...
                </p>
                <p
                  style={{
                    fontFamily: typography.body.fontFamily,
                    fontSize: "12px",
                    lineHeight: '1.4',
                    color: colors.gray500,
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
                  padding: '40px 20px',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontFamily: typography.body.fontFamily,
                    fontSize: "13px",
                    lineHeight: '1.5',
                    color: colors.gray500,
                    margin: 0,
                  }}
                >
                  No conversations yet
                </p>
              </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onMouseEnter={() => setHoveredSessionId(session.id)}
                onMouseLeave={() => setHoveredSessionId(null)}
                onClick={() => {
                  if (renamingSessionId !== session.id) {
                    onSessionSelect(session.id);
                  }
                }}
                style={{
                  padding: '10px 12px',
                  marginBottom: '1px',
                  borderRadius: '8px',
                  cursor: renamingSessionId === session.id ? 'default' : 'pointer',
                  background: session.id === activeSessionId 
                    ? colors.gray100
                    : hoveredSessionId === session.id
                    ? colors.gray50
                    : 'transparent',
                  transition: `all ${motion.smooth}`,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {renamingSessionId === session.id ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flex: '0 1 auto',
                        maxWidth: 'calc(100% - 120px)',
                        marginRight: '8px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRenameCancel(e as any);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          fontFamily: typography.body.fontFamily,
                          fontSize: "16px",
                          fontWeight: 600,
                          color: colors.architectIndigo,
                          border: `1px solid ${colors.architectScale}`,
                          borderRadius: borderRadius.sm,
                          outline: 'none',
                          background: colors.white,
                          minWidth: 0,
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (renameValue.trim() && !isSubmittingRename) {
                            handleRenameSubmit(e as any, session.id);
                          }
                        }}
                        disabled={!renameValue.trim() || isSubmittingRename}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: borderRadius.sm,
                          border: 'none',
                          background: renameValue.trim() && !isSubmittingRename 
                            ? colors.architectScale 
                            : `${colors.architectScale}40`,
                          color: colors.white,
                          cursor: renameValue.trim() && !isSubmittingRename ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: `all ${motion.cardHover}`,
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          if (renameValue.trim() && !isSubmittingRename) {
                            e.currentTarget.style.background = colors.ctaHover;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (renameValue.trim() && !isSubmittingRename) {
                            e.currentTarget.style.background = colors.architectScale;
                          }
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>✓</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameCancel(e);
                        }}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: borderRadius.sm,
                          border: 'none',
                          background: `${colors.precisionPink}20`,
                          color: colors.deepPlum,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: `all ${motion.cardHover}`,
                          flexShrink: 0,
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
                        <span style={{ fontSize: '16px' }}>✕</span>
                      </button>
                    </div>
                  ) : (
                    <h3
                      style={{
                        fontFamily: typography.body.fontFamily,
                        fontSize: "14px",
                        lineHeight: '1.4',
                        fontWeight: session.id === activeSessionId ? 500 : 400,
                        color: session.id === activeSessionId 
                          ? colors.gray900 
                          : colors.gray700,
                        margin: 0,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {session.title}
                    </h3>
                  )}
                  {(onDeleteSession || onRenameSession) && renamingSessionId !== session.id && (
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={(e) => handleMenuClick(e, session.id)}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colors.gray500,
                            opacity: hoveredSessionId === session.id || openMenuId === session.id ? 1 : 0,
                            transition: `all ${motion.smooth}`,
                            padding: 0,
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = colors.gray200;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="4" r="1.5" fill="currentColor"/>
                            <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                            <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
                          </svg>
                        </button>
                        {openMenuId === session.id && (
                          <div
                            ref={(el) => {
                              menuRefs.current[session.id] = el;
                            }}
                            style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              marginTop: '4px',
                              background: colors.white,
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              minWidth: '140px',
                              zIndex: 1000,
                              border: `1px solid ${colors.gray200}`,
                              overflow: 'hidden',
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {onRenameSession && (
                              <button
                                onClick={(e) => handleRename(e, session)}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontFamily: typography.body.fontFamily,
                                  fontSize: '13px',
                                  color: colors.gray700,
                                  transition: `all ${motion.smooth}`,
                                  textAlign: 'left',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = colors.gray100;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                                  <path d="M8 3.5V12.5M3.5 8H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                                <span>Rename</span>
                              </button>
                            )}
                            {onDeleteSession && (
                              <button
                                onClick={(e) => handleDelete(e, session.id)}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontFamily: typography.body.fontFamily,
                                  fontSize: '13px',
                                  color: colors.error,
                                  transition: `all ${motion.smooth}`,
                                  textAlign: 'left',
                                  borderTop: `1px solid ${colors.gray200}`,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = colors.gray100;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            ))
          )}
        </div>

        </div>
      </div>
    );
  }

  // Overlay mode (fallback for mobile or when not using layout)
  return null; // For now, we only use layout sidebar
};













