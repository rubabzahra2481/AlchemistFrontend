'use client';

import React from 'react';
import { colors, typography, borderRadius, shadows, motion, zIndex } from '../design-tokens';
import { Message } from './ChatInterface';

interface MessageBubbleProps {
  message: Message;
  showReasoning?: boolean;
  isEditing?: boolean;
  editedContent?: string;
  onEditStart?: () => void;
  onEditChange?: (content: string) => void;
  onEditSave?: () => void;
  onEditCancel?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  showReasoning = false,
  isEditing = false,
  editedContent = '',
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel
}) => {
  const isUser = message.isUser;
  const [showActions, setShowActions] = React.useState(false);
  const [isReasoningExpanded, setIsReasoningExpanded] = React.useState(false);

  React.useEffect(() => {
    if (!showReasoning) {
      setIsReasoningExpanded(false);
    }
  }, [showReasoning]);

  const hasReasoning = Boolean(!isUser && message.reasoning);

  // Format message content to handle markdown-like formatting
  const formatMessageContent = (content: string) => {
    const elements: JSX.Element[] = [];
    let currentListItems: string[] = [];
    let elementKey = 0;
    
    // Split into lines and process
    const lines = content.split(/\n/);
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Check if this is a numbered list item (e.g., "1. Something" or "2. Something")
      if (/^\d+\.\s+/.test(trimmedLine)) {
        // Add to current list
        currentListItems.push(trimmedLine);
        i++;
      } else if (trimmedLine === '' && currentListItems.length > 0) {
        // Empty line - check if next line is also a list item
        if (i + 1 < lines.length && /^\d+\.\s+/.test(lines[i + 1].trim())) {
          // Next line is a list item, so skip this empty line and continue the list
          i++;
        } else {
          // End of list - render it
          elements.push(
            <ol key={elementKey++} style={{ 
              margin: '12px 0', 
              paddingLeft: '24px',
              lineHeight: '180%',
            }}>
              {currentListItems.map((item, iIndex) => {
                // Remove the number and period from the start
                const cleanItem = item.replace(/^\d+\.\s*/, '');
                return (
                  <li key={iIndex} style={{ marginBottom: '8px' }}>
                    {formatInlineText(cleanItem)}
                  </li>
                );
              })}
            </ol>
          );
          currentListItems = [];
          i++;
        }
      } else {
        // Not a list item - flush any pending list first
        if (currentListItems.length > 0) {
          elements.push(
            <ol key={elementKey++} style={{ 
              margin: '12px 0', 
              paddingLeft: '24px',
              lineHeight: '180%',
            }}>
              {currentListItems.map((item, iIndex) => {
                const cleanItem = item.replace(/^\d+\.\s*/, '');
                return (
                  <li key={iIndex} style={{ marginBottom: '8px' }}>
                    {formatInlineText(cleanItem)}
                  </li>
                );
              })}
            </ol>
          );
          currentListItems = [];
        }
        
        // Regular text line
        if (trimmedLine !== '') {
          elements.push(
            <div key={elementKey++} style={{ marginBottom: '0' }}>
              {formatInlineText(line)}
            </div>
          );
        } else {
          // Empty line - add spacing
          elements.push(<div key={elementKey++} style={{ height: '8px' }} />);
        }
        i++;
      }
    }
    
    // Flush any remaining list items
    if (currentListItems.length > 0) {
      elements.push(
        <ol key={elementKey++} style={{ 
          margin: '12px 0', 
          paddingLeft: '24px',
          lineHeight: '180%',
        }}>
          {currentListItems.map((item, iIndex) => {
            const cleanItem = item.replace(/^\d+\.\s*/, '');
            return (
              <li key={iIndex} style={{ marginBottom: '8px' }}>
                {formatInlineText(cleanItem)}
              </li>
            );
          })}
        </ol>
      );
    }
    
    return elements;
  };

  // Format inline text (bold, italic)
  const formatInlineText = (text: string) => {
    const parts = [];
    let lastIndex = 0;
    
    // Match **bold** text
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      // Add bold text
      parts.push(<strong key={match.index}>{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  const [isMobile, setIsMobile] = React.useState(false);

  // Detect mobile viewport
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '12px',
    }}>
      <div 
        style={{
          maxWidth: isMobile ? '85%' : '75%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Message Bubble */}
        <div style={{
          padding: isEditing ? '16px' : (isUser ? '14px 18px' : '16px 20px'),
          borderRadius: isUser 
            ? '16px 16px 4px 16px'
            : '16px 16px 16px 4px',
          background: isEditing 
            ? colors.architectScale
            : (isUser ? colors.architectScale : colors.white),
          color: isUser ? colors.white : colors.gray900,
          boxShadow: isEditing ? shadows.lg : (isUser ? shadows.md : shadows.sm),
          position: 'relative',
          transition: `all ${motion.smooth}`,
          minWidth: isEditing ? '400px' : 'auto',
          border: isUser ? 'none' : `1px solid ${colors.gray200}`,
        }}
        onMouseEnter={(e) => {
          if (!isEditing) {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = isUser ? shadows.lg : shadows.card;
          }
        }}
        onMouseLeave={(e) => {
          if (!isEditing) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isUser ? shadows.md : shadows.sm;
          }
        }}>
          {isEditing ? (
            <div style={{
              width: '100%',
            }}>
              <textarea
                value={editedContent}
                onChange={(e) => onEditChange && onEditChange(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px 16px',
                  border: `2px solid ${colors.precisionPink}30`,
                  borderRadius: borderRadius.md,
                  fontFamily: typography.body.fontFamily,
                  fontSize: "16px",
                  lineHeight: typography.body.lineHeight,
                  background: colors.white,
                  color: colors.black,
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '12px',
              }}>
                <button
                  onClick={onEditCancel}
                  style={{
                    padding: '8px 16px',
                    background: colors.white,
                    color: colors.black,
                    border: `1px solid rgba(0,0,0,0.2)`,
                    borderRadius: borderRadius.sm,
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = colors.white;
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={onEditSave}
                  style={{
                    padding: '8px 16px',
                    background: colors.black,
                    color: colors.white,
                    border: 'none',
                    borderRadius: borderRadius.sm,
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#333';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = colors.black;
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <div style={{
                fontFamily: typography.body.fontFamily,
                fontSize: "15px",
                lineHeight: '1.6',
                margin: 0,
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
              }}>
                {formatMessageContent(message.content)}
              </div>

            </div>
          )}
          {/* Copy Button - positioned at the end of the message bubble */}
          {!isUser && !isEditing && (
            <button
              onClick={() => navigator.clipboard.writeText(message.content)}
              style={{
                position: 'absolute',
                bottom: '-40px',
                right: '0',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: `1px solid ${colors.gray300}`,
                background: colors.white,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: `all ${motion.smooth}`,
                boxShadow: shadows.sm,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.gray100;
                e.currentTarget.style.boxShadow = shadows.md;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.white;
                e.currentTarget.style.boxShadow = shadows.sm;
              }}
              title="Copy response"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#666' }}>
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          )}
        </div>

        {/* See LLM Thought Button - below the white bubble */}
        {!isUser && hasReasoning && showReasoning && (
          <div style={{
            marginTop: '8px',
          }}>
            <button
              onClick={() => setIsReasoningExpanded(prev => !prev)}
              style={{
                border: 'none',
                background: 'transparent',
                color: colors.gray600,
                fontFamily: typography.caption.fontFamily,
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: 0,
                cursor: 'pointer',
                width: 'fit-content',
              }}
            >
              <span>{isReasoningExpanded ? 'Hide llm thought' : 'See llm thought'}</span>
              <span style={{
                transform: isReasoningExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                fontSize: '16px',
              }}>
                {isReasoningExpanded ? '▲' : '>'}
              </span>
            </button>
          </div>
        )}

        {/* Timestamp and Action Buttons */}
        <div style={{
          marginTop: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            fontSize: '12px',
            color: colors.gray500,
            fontWeight: 400,
          }}>
            {(() => {
              try {
                // Handle timestamp - it can be Date object or string
                let timestamp = message.timestamp;
                
                // If timestamp is already a Date object, use it directly
                if (timestamp instanceof Date) {
                  const isValid = !isNaN(timestamp.getTime());
                  if (isValid) {
                    return timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    });
                  }
                  return '';
                }
                
                // If timestamp is a string or number, parse it
                if (!timestamp) {
                  return '';
                }
                
                const date = new Date(timestamp);
                const isValid = !isNaN(date.getTime());
                
                if (isValid) {
                  return date.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                }
                
                return '';
              } catch (error) {
                console.error('❌ [MessageBubble] Error formatting timestamp:', error, 'timestamp:', message.timestamp);
                return '';
              }
            })()}
          </div>
          
          {/* Action Buttons - ChatGPT Style */}
          {isUser && onEditStart && !isEditing && showActions && (
            <button
              onClick={onEditStart}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'rgba(0,0,0,0.05)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
              }}
              title="Edit message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#666' }}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          )}
          
        </div>

        {/* Reasoning Display (for AI messages when enabled) */}
        {!isUser && showReasoning && message.reasoning && isReasoningExpanded && (
          <div style={{
            marginTop: '8px',
            padding: '16px',
            background: `${colors.architectIndigo}05`,
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.architectIndigo}20`,
            borderLeft: `4px solid ${colors.architectIndigo}`,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}>
              <span style={{ fontSize: '16px' }}>💭</span>
              <span style={{
                fontFamily: typography.caption.fontFamily,
                fontSize: "16px",
                lineHeight: typography.caption.lineHeight,
                fontWeight: 600,
                color: colors.architectIndigo,
              }}>
                AI Reasoning Process
              </span>
            </div>
            <div style={{
              fontFamily: typography.body.fontFamily,
              fontSize: '14px',
              lineHeight: '140%',
              color: colors.deepPlum,
              fontStyle: 'italic',
              whiteSpace: 'pre-wrap',
            }}>
              {message.reasoning}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


















