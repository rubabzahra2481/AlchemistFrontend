// Design System Tokens
// Based on the provided design guidelines

export const colors = {
  // Primary Colors
  architectIndigo: '#42047D',
  scaleOrange: '#F6782F',
  founderRed: '#EC4049',
  deepPlum: '#841477',
  precisionPink: '#C72170',
  
  // Neutral Colors
  black: '#000000',
  white: '#FFFFFF',
  
  // CTA Hover
  ctaHover: '#F56A1F',
  
  // Gradients
  architectScale: 'linear-gradient(90deg, #42047D 0%, #F6782F 100%)',
  architectScaleVertical: 'linear-gradient(180deg, #42047D 0%, #F6782F 100%)',
} as const;

export const typography = {
  h1: {
    fontFamily: 'Agrandir Grand, sans-serif',
    fontWeight: 700,
    fontSize: { desktop: '64px', mobile: '40px' },
    lineHeight: '110%',
  },
  h2: {
    fontFamily: 'Agrandir Grand, sans-serif',
    fontWeight: 600,
    fontSize: { desktop: '44px', mobile: '30px' },
    lineHeight: '115%',
  },
  h3: {
    fontFamily: 'Suisse Intl, sans-serif',
    fontWeight: 500,
    fontSize: { desktop: '28px', mobile: '22px' },
    lineHeight: '125%',
  },
  body: {
    fontFamily: 'Suisse Intl, sans-serif',
    fontWeight: 400,
    fontSize: { desktop: '16px', mobile: '15px' },
    lineHeight: '150%',
  },
  caption: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500,
    fontSize: { desktop: '13px', mobile: '12px' },
    lineHeight: '130%',
  },
} as const;

export const spacing = {
  sectionPadding: { desktop: '96px', tablet: '64px', mobile: '48px' },
  containerPadding: { desktop: '32px', tablet: '20px' },
  baseline: '8px',
  sectionHeading: '48px',
  subheading: '32px',
  cardGroup: '64px',
  ctaRowBottom: '80px',
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
  sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
} as const;

export const breakpoints = {
  mobile: '390px',
  tablet: '768px',
  desktop: '1024px',
} as const;

export const motion = {
  cardHover: '0.25s ease-out',
  connectorLoad: '1.5s ease-in-out',
  creditFill: '1.2s linear',
  ctaClick: '0.4s ease-out',
} as const;










