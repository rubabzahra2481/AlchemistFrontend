'use client';

import React, { useState, useEffect, useRef } from 'react';
import { colors, typography, spacing, borderRadius, shadows, motion } from '../design-tokens';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: isIntegrated ? '6px 8px' : '12px 16px',
          background: isIntegrated ? 'transparent' : colors.white,
          border: isIntegrated ? 'none' : `2px solid ${isOpen ? colors.scaleOrange : `${colors.precisionPink}30`}`,
          borderRadius: isIntegrated ? borderRadius.sm : borderRadius.md,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: `all ${motion.cardHover}`,
          boxShadow: isOpen ? shadows.md : 'none',
          opacity: isLoading ? 0.6 : 1,
          minHeight: isIntegrated ? '32px' : 'auto',
        }}
        onMouseEnter={(e) => {
          if (!isLoading && !isOpen) {
            if (isIntegrated) {
              e.currentTarget.style.background = `${colors.scaleOrange}10`;
            } else {
              e.currentTarget.style.borderColor = colors.scaleOrange;
              e.currentTarget.style.boxShadow = shadows.sm;
            }
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading && !isOpen) {
            if (isIntegrated) {
              e.currentTarget.style.background = 'transparent';
            } else {
              e.currentTarget.style.borderColor = `${colors.precisionPink}30`;
              e.currentTarget.style.boxShadow = 'none';
            }
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isIntegrated ? '4px' : '8px' }}>
          <span style={{ fontSize: isIntegrated ? '14px' : '16px' }}>
            {selectedModel ? getProviderIcon(selectedModel.provider) : '🤖'}
          </span>
          {!isIntegrated && (
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontFamily: typography.caption.fontFamily, fontSize: "13px", lineHeight: typography.caption.lineHeight,
                fontWeight: 600,
                color: colors.architectIndigo,
                margin: 0,
              }}>
                {selectedModel?.name || 'Select AI Model'}
              </div>
              {selectedModel && (
                <div style={{
                  fontFamily: typography.caption.fontFamily,
                  fontSize: '11px',
                  lineHeight: typography.caption.lineHeight,
                  color: colors.deepPlum,
                  margin: 0,
                  textTransform: 'capitalize',
                }}>
                  {selectedModel.provider}
                </div>
              )}
            </div>
          )}
          {isIntegrated && (
            <div style={{
              fontFamily: typography.caption.fontFamily,
              fontSize: '12px',
              lineHeight: typography.caption.lineHeight,
              fontWeight: 600,
              color: colors.architectIndigo,
              margin: 0,
            }}>
              {selectedModel?.name || 'GPT-4o'}
            </div>
          )}
        </div>
        
        <div style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: `transform ${motion.cardHover}`,
          fontSize: isIntegrated ? '10px' : '12px',
          color: colors.deepPlum,
        }}>
          ▼
        </div>
      </button>

      {/* Dropdown Menu - Opens upward */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: isIntegrated ? 'auto' : 0,
          right: isIntegrated ? '0' : 'auto',
          marginBottom: '12px',
          background: colors.white,
          border: `2px solid ${colors.precisionPink}30`,
          borderRadius: borderRadius.md,
          boxShadow: shadows.lg,
          zIndex: 1000,
          maxHeight: '300px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minWidth: isIntegrated ? '280px' : '200px',
          width: isIntegrated ? '280px' : '100%',
        }}>
          {/* Search Input */}
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.precisionPink}20`,
          }}>
            <input
              type="text"
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${colors.precisionPink}30`,
                borderRadius: borderRadius.sm,
                fontFamily: typography.body.fontFamily,
                fontSize: typography.caption.fontSize.desktop,
                outline: 'none',
                background: colors.white,
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.scaleOrange;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = `${colors.precisionPink}30`;
              }}
            />
          </div>

          {/* Models List */}
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            padding: '8px 0',
          }}>
            {filteredModels.length === 0 ? (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                color: colors.deepPlum,
                fontFamily: typography.caption.fontFamily,
                fontSize: '13px',
                lineHeight: typography.caption.lineHeight,
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
                    padding: '12px 16px',
                    background: model.id === selectedLLM ? `${colors.scaleOrange}10` : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: `all ${motion.cardHover}`,
                    textAlign: 'left',
                    minHeight: '48px',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => {
                    if (model.id !== selectedLLM) {
                      e.currentTarget.style.background = `${colors.precisionPink}10`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (model.id !== selectedLLM) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '16px' }}>
                    {getProviderIcon(model.provider)}
                  </span>
                  
                  <div style={{ 
                    flex: 1, 
                    minWidth: 0, // Allow text to wrap
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      fontFamily: typography.caption.fontFamily, fontSize: "13px", lineHeight: typography.caption.lineHeight,
                      fontWeight: model.id === selectedLLM ? 600 : 500,
                      color: model.id === selectedLLM ? colors.scaleOrange : colors.architectIndigo,
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {model.name}
                    </div>
                    <div style={{
                      fontFamily: typography.caption.fontFamily, fontSize: '11px', lineHeight: typography.caption.lineHeight,
                      color: colors.deepPlum,
                      margin: 0,
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
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: colors.scaleOrange,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: colors.white,
                    }}>
                      ✓
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '8px 16px',
            borderTop: `1px solid ${colors.precisionPink}20`,
            background: `${colors.architectIndigo}05`,
          }}>
            <div style={{
              fontFamily: typography.caption.fontFamily, fontSize: '11px', lineHeight: typography.caption.lineHeight,
              color: colors.deepPlum,
              textAlign: 'center',
            }}>
              {availableModels.length} models available
            </div>
          </div>
        </div>
      )}
    </div>
  );
};












