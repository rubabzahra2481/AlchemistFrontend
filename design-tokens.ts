// Design System Tokens
// Professional UI Color Palette - Inspired by Linear, Vercel, Stripe, Notion
// Based on brand colors: #42047D (Purple) and #F6782F (Orange)

export const colors = {
  // ============================================
  // BRAND COLORS (Primary Identity)
  // ============================================
  architectIndigo: '#42047D',      // Primary Purple - Main brand color
  scaleOrange: '#F6782F',          // Primary Orange - Accent brand color
  founderRed: '#EC4049',           // Secondary Red
  deepPlum: '#841477',             // Deep Purple variant
  precisionPink: '#C72170',        // Pink variant
  
  // Brand Color Variations (for depth and hierarchy)
  brandPurple: {
    lightest: '#F5F0FA',           // 5% opacity background
    lighter: '#E8D5F5',            // 15% opacity background
    light: '#B88AE0',              // Lighter shade for hover states
    base: '#42047D',               // Primary brand purple
    dark: '#35066A',               // Darker for pressed states
    darkest: '#2A0552',            // Darkest for emphasis
  },
  
  brandOrange: {
    lightest: '#FFF5F0',           // 5% opacity background
    lighter: '#FFE8D5',            // 15% opacity background
    light: '#FFB88A',              // Lighter shade for hover states
    base: '#F6782F',               // Primary brand orange
    dark: '#D65F1F',               // Darker for pressed states
    darkest: '#B84D0F',            // Darkest for emphasis
  },
  
  // ============================================
  // NEUTRAL COLORS (Professional Gray Scale)
  // Inspired by Vercel/Linear - Perfect contrast ratios
  // ============================================
  black: '#000000',
  white: '#FFFFFF',
  
  // Surface Colors (Backgrounds)
  surface: {
    base: '#FFFFFF',               // Main surface (white)
    elevated: '#FAFAFA',           // Elevated cards (gray50)
    overlay: '#F5F5F5',           // Overlays, modals (gray100)
    subtle: '#F9F9F9',            // Subtle backgrounds
    hover: '#F0F0F0',             // Hover states
    pressed: '#E8E8E8',           // Pressed/active states
  },
  
  // Border Colors
  border: {
    subtle: '#F0F0F0',             // Subtle borders (gray200)
    base: '#E5E5E5',               // Default borders (gray300)
    medium: '#D4D4D4',             // Medium emphasis (gray400)
    strong: '#A3A3A3',             // Strong borders (gray500)
  },
  
  // Text Colors (WCAG AA compliant)
  text: {
    primary: '#0A0A0A',            // Primary text (near black)
    secondary: '#525252',          // Secondary text (gray600)
    tertiary: '#737373',           // Tertiary text (gray500)
    disabled: '#A3A3A3',           // Disabled text (gray400)
    inverse: '#FFFFFF',            // Text on dark backgrounds
    brand: '#42047D',              // Brand colored text
    brandAccent: '#F6782F',        // Brand accent text
  },
  
  // Extended Neutral Palette (for compatibility)
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#F0F0F0',              // Updated for better contrast
  gray300: '#E5E5E5',              // Updated for better contrast
  gray400: '#D4D4D4',              // Updated for better contrast
  gray500: '#A3A3A3',
  gray600: '#525252',
  gray700: '#404040',
  gray800: '#262626',
  gray900: '#0A0A0A',              // Near black for text
  
  // ============================================
  // SEMANTIC COLORS (Status & Feedback)
  // Professional, accessible, brand-aligned
  // ============================================
  // Flat semantic colors (for compatibility)
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Extended semantic colors (use these for new code)
  semantic: {
    success: {
      light: '#D1FAE5',              // Light background
      base: '#10B981',               // Primary success
      dark: '#059669',               // Dark variant
      text: '#065F46',               // Text on light
    },
    warning: {
      light: '#FEF3C7',              // Light background
      base: '#F59E0B',               // Primary warning
      dark: '#D97706',               // Dark variant
      text: '#92400E',               // Text on light
    },
    error: {
      light: '#FEE2E2',              // Light background
      base: '#EF4444',               // Primary error
      dark: '#DC2626',               // Dark variant
      text: '#991B1B',               // Text on light
    },
    info: {
      light: '#DBEAFE',              // Light background
      base: '#3B82F6',               // Primary info
      dark: '#2563EB',               // Dark variant
      text: '#1E40AF',               // Text on light
    },
  },
  
  // ============================================
  // INTERACTIVE STATES
  // ============================================
  interactive: {
    default: '#42047D',            // Default button/interactive
    hover: '#35066A',              // Hover state
    active: '#2A0552',             // Active/pressed
    disabled: '#D4D4D4',           // Disabled state
    focus: '#F6782F',              // Focus ring
  },
  
  // CTA Colors
  cta: {
    primary: '#42047D',            // Primary CTA
    primaryHover: '#35066A',       // Primary hover
    secondary: '#F6782F',          // Secondary CTA
    secondaryHover: '#D65F1F',     // Secondary hover
  },
  
  ctaHover: '#D65F1F',             // Legacy compatibility
  
  // ============================================
  // GRADIENTS (Brand-aligned)
  // ============================================
  architectScale: 'linear-gradient(135deg, #42047D 0%, #F6782F 100%)',
  architectScaleVertical: 'linear-gradient(180deg, #42047D 0%, #F6782F 100%)',
  architectScaleSubtle: 'linear-gradient(135deg, rgba(66, 4, 125, 0.12) 0%, rgba(246, 120, 47, 0.12) 100%)',
  architectScaleMedium: 'linear-gradient(135deg, rgba(66, 4, 125, 0.25) 0%, rgba(246, 120, 47, 0.25) 100%)',
  architectScaleStrong: 'linear-gradient(135deg, rgba(66, 4, 125, 0.40) 0%, rgba(246, 120, 47, 0.40) 100%)',
  
  // ============================================
  // BACKGROUND VARIANTS (Brand-tinted surfaces)
  // ============================================
  backgroundSubtle: 'rgba(66, 4, 125, 0.02)',      // Very subtle brand tint
  backgroundHover: 'rgba(246, 120, 47, 0.08)',     // Hover with brand tint
  backgroundActive: 'rgba(66, 4, 125, 0.12)',      // Active with brand tint
  backgroundSelected: 'rgba(66, 4, 125, 0.06)',    // Selected state
} as const;

export const typography = {
  // Display (Hero sections, landing pages)
  display: {
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 700,
    fontSize: { desktop: '72px', mobile: '48px' },
    lineHeight: '1.1',
    letterSpacing: '-0.03em',
  },
  // H1 (Page titles)
  h1: {
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 700,
    fontSize: { desktop: '56px', mobile: '36px' },
    lineHeight: '1.12',
    letterSpacing: '-0.025em',
  },
  // H2 (Section headers)
  h2: {
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 600,
    fontSize: { desktop: '40px', mobile: '28px' },
    lineHeight: '1.15',
    letterSpacing: '-0.02em',
  },
  // H3 (Subsection headers)
  h3: {
    fontFamily: 'DM Sans, sans-serif',
    fontWeight: 600,
    fontSize: { desktop: '24px', mobile: '20px' },
    lineHeight: '1.25',
    letterSpacing: '-0.015em',
  },
  // H4 (Card titles, small headers)
  h4: {
    fontFamily: 'DM Sans, sans-serif',
    fontWeight: 600,
    fontSize: { desktop: '18px', mobile: '16px' },
    lineHeight: '1.3',
    letterSpacing: '-0.01em',
  },
  // Body (Main content)
  body: {
    fontFamily: 'DM Sans, sans-serif',
    fontWeight: 400,
    fontSize: { desktop: '15px', mobile: '14px' },
    lineHeight: '1.6',
    letterSpacing: '0',
  },
  // Body Large (Emphasized content)
  bodyLarge: {
    fontFamily: 'DM Sans, sans-serif',
    fontWeight: 400,
    fontSize: { desktop: '17px', mobile: '16px' },
    lineHeight: '1.6',
    letterSpacing: '0',
  },
  // Small (Secondary text, metadata)
  small: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 400,
    fontSize: { desktop: '13px', mobile: '12px' },
    lineHeight: '1.5',
    letterSpacing: '0.01em',
  },
  // Caption (Labels, timestamps)
  caption: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500,
    fontSize: { desktop: '12px', mobile: '11px' },
    lineHeight: '1.4',
    letterSpacing: '0.01em',
  },
  // Label (Form labels, buttons)
  label: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500,
    fontSize: { desktop: '13px', mobile: '12px' },
    lineHeight: '1.4',
    letterSpacing: '0.02em',
    textTransform: 'uppercase' as const,
  },
} as const;

export const spacing = {
  // Micro spacing (tight elements)
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
  '5xl': '96px',
  
  // Legacy spacing (for compatibility)
  sectionPadding: { desktop: '96px', tablet: '64px', mobile: '48px' },
  containerPadding: { desktop: '24px', tablet: '20px', mobile: '16px' },
  baseline: '8px',
  sectionHeading: '48px',
  subheading: '32px',
  cardGroup: '64px',
  ctaRowBottom: '80px',
  
  // Component-specific spacing
  cardPadding: { desktop: '20px', mobile: '16px' },
  inputPadding: { desktop: '12px 16px', mobile: '10px 14px' },
  buttonPadding: {
    sm: '8px 12px',
    md: '10px 16px',
    lg: '12px 20px',
    xl: '14px 24px',
  },
} as const;

export const grid = {
  desktop: { columns: 12, gutter: '24px', maxWidth: '1440px' },
  tablet: { columns: 8, gutter: '16px', maxWidth: '1024px' },
  mobile: { columns: 4, gutter: '12px', maxWidth: '390px' },
} as const;

export const borderRadius = {
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
  md: '0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.06)',
  lg: '0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.08)',
  xl: '0 10px 15px rgba(0, 0, 0, 0.08), 0 20px 25px rgba(0, 0, 0, 0.1)',
  card: '0 1px 3px rgba(66, 4, 125, 0.08), 0 4px 6px rgba(246, 120, 47, 0.04)',
  elevated: '0 8px 16px rgba(0, 0, 0, 0.06), 0 16px 32px rgba(0, 0, 0, 0.08)',
  glow: '0 0 0 1px rgba(246, 120, 47, 0.1), 0 4px 12px rgba(246, 120, 47, 0.15)',
} as const;

export const breakpoints = {
  mobile: '390px',
  tablet: '768px',
  desktop: '1024px',
} as const;

export const motion = {
  cardHover: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  connectorLoad: '1.5s ease-in-out',
  creditFill: '1.2s linear',
  ctaClick: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  smooth: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  gentle: '0.25s ease-out',
} as const;

// Z-index scale for proper layering
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1010,
  overlay: 1020,
  modal: 1030,
  tooltip: 1040,
} as const;










