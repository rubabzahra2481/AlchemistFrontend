/**
 * Secure token handling for cross-origin authentication
 * Uses postMessage API to receive token from brandscaling website
 */

export interface TokenMessage {
  type: 'SUPABASE_TOKEN' | 'SUPABASE_AUTH';
  token?: string; // For SUPABASE_TOKEN format
  accessToken?: string; // For SUPABASE_AUTH format
  refreshToken?: string;
  user?: any;
  timestamp?: number;
}

/**
 * Listen for token from brandscaling website via postMessage
 * Works for both iframe and popup scenarios
 * This is secure because postMessage is only received by the intended recipient
 */
export function listenForToken(callback: (token: string) => void): () => void {
  const handleMessage = (event: MessageEvent<TokenMessage>) => {
    // Security: Only accept messages from trusted origins
    const allowedOrigins = [
      'https://www.brandscaling.co.uk', // ✅ Verified: Brandscaling production domain
      'https://brandscaling.co.uk', // Also allow non-www version
      'https://brandscaling.com', // Alternative domain
      'https://www.brandscaling.com', // Alternative domain with www
      // For development:
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:8000',
    ];

    // Verify origin - only accept messages from trusted Brandscaling domain
    if (!allowedOrigins.includes(event.origin)) {
      console.warn('⚠️ Ignoring message from untrusted origin:', event.origin);
      return;
    }

    // Verify message format - support both formats
    if (event.data && (event.data.type === 'SUPABASE_TOKEN' || event.data.type === 'SUPABASE_AUTH')) {
      let token: string | null = null;

      // Handle SUPABASE_TOKEN format (legacy)
      if (event.data.type === 'SUPABASE_TOKEN' && typeof event.data.token === 'string') {
        token = event.data.token;
      }
      // Handle SUPABASE_AUTH format (from Brandscaling)
      else if (event.data.type === 'SUPABASE_AUTH' && typeof event.data.accessToken === 'string') {
        token = event.data.accessToken;
        
        // Optionally store refresh token and user data
        if (event.data.refreshToken) {
          localStorage.setItem('supabase_refresh_token', event.data.refreshToken);
        }
        if (event.data.user) {
          localStorage.setItem('supabase_user', JSON.stringify(event.data.user));
        }
      }

      if (token) {
        // Store token securely in localStorage
        localStorage.setItem('supabase_token', token);
        localStorage.setItem('supabase_token_timestamp', Date.now().toString());
        
        // Call callback with token
        callback(token);
      }
    }
  };

  // Listen for messages from parent window (iframe) or opener (popup)
  window.addEventListener('message', handleMessage);

  // If in iframe, request token from parent on load
  if (window.self !== window.top) {
    // We're in an iframe - request token from parent
    window.parent.postMessage(
      {
        type: 'REQUEST_SUPABASE_TOKEN',
        target: window.location.origin,
      },
      '*' // Parent will validate origin on their side
    );
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('message', handleMessage);
  };
}

/**
 * Request token from opener window (if opened via popup/window.open)
 * Or from parent window (if in iframe)
 */
export function requestTokenFromOpener() {
  // If opened via popup
  if (window.opener) {
    window.opener.postMessage(
      {
        type: 'REQUEST_SUPABASE_TOKEN',
        target: window.location.origin,
      },
      '*', // Parent will validate origin on their side
    );
  }
  
  // If in iframe, request from parent
  if (window.self !== window.top && window.parent) {
    window.parent.postMessage(
      {
        type: 'REQUEST_SUPABASE_TOKEN',
        target: window.location.origin,
      },
      '*' // Parent will validate origin on their side
    );
  }
}

/**
 * Check if token exists and is valid
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('supabase_token');
  const timestamp = localStorage.getItem('supabase_token_timestamp');

  if (!token) return null;

  // Optional: Check if token is too old (e.g., > 1 hour)
  if (timestamp) {
    const tokenAge = Date.now() - parseInt(timestamp, 10);
    const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
    
    if (tokenAge > maxAge) {
      // Token might be expired, but let backend validate
      console.warn('Token is older than 1 hour, may need refresh');
    }
  }

  return token;
}

/**
 * Clear stored token (logout)
 */
export function clearStoredToken() {
  localStorage.removeItem('supabase_token');
  localStorage.removeItem('supabase_token_timestamp');
}

