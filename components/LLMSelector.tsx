'use client';

import React, { useState, useEffect, useRef } from 'react';
import { colors, typography, spacing, borderRadius, shadows, motion, zIndex } from '../design-tokens';

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
}

interface LLMSelectorProps {
  selectedLLM: string;
  onLLMChange: (llmId: string) => void;
  availableModels: LLMModel[];
  isLoading?: boolean;
  isIntegrated?: boolean;
}

export const LLMSelector: React.FC<LLMSelectorProps> = ({
  selectedLLM,
  onLLMChange,
  availableModels,
  isLoading = false,
  isIntegrated = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [opensUpward, setOpensUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Check if dropdown should open upward
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const dropdownHeight = 420; // maxHeight of dropdown
      
      // Open upward if not enough space below but enough space above
      setOpensUpward(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter models based on search term
  const filteredModels = availableModels.filter(model =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedModel = availableModels.find(model => model.id === selectedLLM);

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai': return '🤖';
      case 'claude': return '🧠';
      case 'deepseek': return '🔍';
      case 'gemini': return '💎';
      default: return '⚡';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai': return colors.architectIndigo;
      case 'claude': return colors.deepPlum;
      case 'deepseek': return colors.scaleOrange;
      case 'gemini': return colors.precisionPink;
      default: return colors.black;
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', minWidth: isIntegrated ? '100px' : '200px' }}>
      {/* Selector Button - Premium Design */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: isIntegrated ? '8px 12px' : '12px 16px',
          background: isIntegrated 
            ? (isOpen ? colors.white : colors.white)
            : colors.white,
          border: isIntegrated 
            ? `1.5px solid ${isOpen ? colors.brandOrange.base : colors.border.base}`
            : `1.5px solid ${isOpen ? colors.brandOrange.base : colors.border.base}`,
          borderRadius: isIntegrated ? '10px' : '12px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          transition: `all 200ms cubic-bezier(0.4, 0, 0.2, 1)`,
          boxShadow: isOpen 
            ? '0 4px 16px rgba(66, 4, 125, 0.2), 0 0 0 1px rgba(246, 120, 47, 0.15)' 
            : '0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
          opacity: isLoading ? 0.5 : 1,
          minHeight: isIntegrated ? '36px' : 'auto',
          fontWeight: 600,
        }}
        onMouseEnter={(e) => {
          if (!isLoading && !isOpen) {
            e.currentTarget.style.borderColor = colors.brandOrange.base;
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(246, 120, 47, 0.2), 0 2px 4px rgba(246, 120, 47, 0.1)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            if (isIntegrated) {
              e.currentTarget.style.background = colors.white;
            }
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading && !isOpen) {
            e.currentTarget.style.borderColor = colors.border.base;
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)';
            e.currentTarget.style.transform = 'translateY(0)';
            if (isIntegrated) {
              e.currentTarget.style.background = colors.white;
            }
          }
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isIntegrated ? '8px' : '10px',
          flex: 1,
          minWidth: 0,
        }}>
          <div style={{
            width: isIntegrated ? '24px' : '28px',
            height: isIntegrated ? '24px' : '28px',
            borderRadius: '8px',
            background: selectedModel 
              ? `${getProviderColor(selectedModel.provider)}25`
              : colors.surface.hover,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isIntegrated ? '14px' : '16px',
            flexShrink: 0,
            boxShadow: selectedModel 
              ? `0 2px 4px ${getProviderColor(selectedModel.provider)}20`
              : 'none',
          }}>
            {selectedModel ? getProviderIcon(selectedModel.provider) : '🤖'}
          </div>
          {!isIntegrated && (
            <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: typography.body.fontFamily,
                fontSize: "14px",
                lineHeight: '1.3',
                fontWeight: 600,
                color: colors.text.primary,
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {selectedModel?.name || 'Select AI Model'}
              </div>
              {selectedModel && (
                <div style={{
                  fontFamily: typography.caption.fontFamily,
                  fontSize: '12px',
                  lineHeight: '1.3',
                  color: colors.text.secondary,
                  margin: '2px 0 0 0',
                  textTransform: 'capitalize',
                }}>
                  {selectedModel.provider}
                </div>
              )}
            </div>
          )}
          {isIntegrated && (
            <div style={{
              fontFamily: typography.body.fontFamily,
              fontSize: '13px',
              lineHeight: '1.3',
              fontWeight: 600,
              color: colors.text.primary,
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.01em',
            }}>
              {selectedModel?.name || 'GPT-4o'}
            </div>
          )}
        </div>
        
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            color: colors.text.secondary,
            flexShrink: 0,
          }}
        >
          <path
            d="M3.5 5.25L7 8.75L10.5 5.25"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown Menu - Premium Design (Opens upward or downward based on space) */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: opensUpward ? 'auto' : '100%',
          bottom: opensUpward ? '100%' : 'auto',
          left: isIntegrated ? 'auto' : 0,
          right: isIntegrated ? '0' : 'auto',
          marginTop: opensUpward ? '0' : '10px',
          marginBottom: opensUpward ? '10px' : '0',
          background: colors.white,
          border: `1px solid ${colors.border.base}`,
          borderRadius: '16px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          zIndex: zIndex.dropdown,
          maxHeight: '420px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minWidth: isIntegrated ? '360px' : '200px',
          width: isIntegrated ? '360px' : '100%',
          animation: opensUpward ? 'fadeInUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'fadeInDown 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(12px)',
        }}>
          {/* Search Input - Premium Design */}
          <div style={{
            padding: '12px',
            borderBottom: `1px solid ${colors.border.subtle}`,
            background: colors.surface.elevated,
          }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}>
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none" 
                style={{
                  position: 'absolute',
                  left: '12px',
                  color: colors.text.tertiary,
                  pointerEvents: 'none',
                }}
              >
                <path 
                  d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M10.5 10.5L14 14" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            <input
              type="text"
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '10px 12px 10px 36px',
                  border: `1.5px solid ${colors.border.base}`,
                  borderRadius: '10px',
                  fontFamily: typography.body.fontFamily,
                  fontSize: '14px',
                  outline: 'none',
                  background: colors.white,
                  boxSizing: 'border-box',
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  color: colors.text.primary,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.brandOrange.base;
                  e.target.style.boxShadow = '0 0 0 3px rgba(246, 120, 47, 0.1), 0 2px 8px rgba(246, 120, 47, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.border.base;
                  e.target.style.boxShadow = 'none';
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    border: 'none',
                    background: colors.surface.hover,
                    color: colors.text.tertiary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    transition: `all ${motion.cardHover}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.border.base;
                    e.currentTarget.style.color = colors.text.primary;
              }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = colors.surface.hover;
                    e.currentTarget.style.color = colors.text.tertiary;
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Models List - Premium Design */}
          <div style={{
            maxHeight: '340px',
            overflowY: 'auto',
            padding: '6px',
          }}>
            {filteredModels.length === 0 ? (
              <div style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: colors.text.secondary,
                fontFamily: typography.body.fontFamily,
                fontSize: '14px',
                lineHeight: '1.5',
              }}>
                No models found
              </div>
            ) : (
              filteredModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onLLMChange(model.id);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: model.id === selectedLLM 
                      ? colors.brandPurple.lightest 
                      : 'transparent',
                    border: 'none',
                    borderLeft: model.id === selectedLLM 
                      ? `4px solid ${colors.brandPurple.base}` 
                      : '4px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'left',
                    minHeight: '68px',
                    borderRadius: '12px',
                    margin: '3px 4px',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => {
                    if (model.id !== selectedLLM) {
                      e.currentTarget.style.background = colors.surface.hover;
                      e.currentTarget.style.transform = 'translateX(3px)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                    } else {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(66, 4, 125, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (model.id !== selectedLLM) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    } else {
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: `${getProviderColor(model.provider)}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}>
                    {getProviderIcon(model.provider)}
                  </div>
                  
                  <div style={{ 
                    flex: 1, 
                    minWidth: 0,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      fontFamily: typography.body.fontFamily,
                      fontSize: '15px',
                      lineHeight: '1.4',
                      fontWeight: model.id === selectedLLM ? 600 : 500,
                      color: model.id === selectedLLM 
                        ? colors.text.brand 
                        : colors.text.primary,
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      letterSpacing: '-0.01em',
                    }}>
                      {model.name}
                    </div>
                    <div style={{
                      fontFamily: typography.caption.fontFamily,
                      fontSize: '13px',
                      lineHeight: '1.4',
                      color: colors.text.secondary,
                      margin: '4px 0 0 0',
                      textTransform: 'capitalize',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {model.provider} • {model.maxTokens.toLocaleString()} tokens
                    </div>
                  </div>

                  {model.id === selectedLLM && (
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: colors.brandOrange.base,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      color: colors.white,
                      flexShrink: 0,
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(246, 120, 47, 0.3)',
                    }}>
                      ✓
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer - Premium Design */}
          <div style={{
            padding: '10px 16px',
            borderTop: `1px solid ${colors.border.subtle}`,
            background: colors.surface.elevated,
          }}>
            <div style={{
              fontFamily: typography.caption.fontFamily,
              fontSize: '12px',
              lineHeight: '1.4',
              color: colors.text.secondary,
              textAlign: 'center',
              fontWeight: 500,
            }}>
              {availableModels.length} {availableModels.length === 1 ? 'model' : 'models'} available
            </div>
          </div>
          
          {/* Animation styles */}
          <style jsx>{`
            @keyframes fadeInDown {
              from {
                opacity: 0;
                transform: translateY(-8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};












