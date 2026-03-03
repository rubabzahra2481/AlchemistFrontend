/**
 * Secure token handling for cross-origin authentication
 * Uses postMessage API to receive token from brandscaling website
 */

export interface TokenMessage {
  type: 'SUPABASE_TOKEN' | 'SUPABASE_AUTH' | 'AGENT_AUTH';
  token?: string; // For SUPABASE_TOKEN and AGENT_AUTH formats
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

    // Verify message format - support all formats (legacy + new Agent token)
    if (event.data && (event.data.type === 'SUPABASE_TOKEN' || event.data.type === 'SUPABASE_AUTH' || event.data.type === 'AGENT_AUTH')) {
      let token: string | null = null;

      // Handle AGENT_AUTH format (new lightweight token from Brandscaling)
      // Brandscaling sends: { type: "AGENT_AUTH", token: "..." }
      if (event.data.type === 'AGENT_AUTH' && typeof event.data.token === 'string') {
        token = event.data.token;
        console.log('✅ [Token] Received Agent access token (AGENT_AUTH)');
      }
      // Handle SUPABASE_TOKEN format (legacy)
      else if (event.data.type === 'SUPABASE_TOKEN' && typeof event.data.token === 'string') {
        token = event.data.token;
      }
      // Handle SUPABASE_AUTH format (from Brandscaling - legacy)
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
    // Brandscaling sends AGENT_AUTH messages with lightweight JWT tokens
    window.parent.postMessage(
      {
        type: 'REQUEST_AGENT_TOKEN', // Request Agent token from Brandscaling
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
        type: 'REQUEST_AGENT_TOKEN', // New request type for Agent token
        target: window.location.origin,
      },
      '*', // Parent will validate origin on their side
    );
  }
  
  // If in iframe, request from parent
  if (window.self !== window.top && window.parent) {
    window.parent.postMessage(
      {
        type: 'REQUEST_AGENT_TOKEN', // New request type for Agent token
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

  // Check if token is too old (e.g., > 2 hours for Agent token)
  if (timestamp) {
    const tokenAge = Date.now() - parseInt(timestamp, 10);
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours in milliseconds (Agent token expiry)
    
    if (tokenAge > maxAge) {
      // Token is definitely expired - clear it
      console.warn('⚠️ [Token] Token is older than 2 hours, clearing stale token');
      clearStoredToken();
      return null;
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
  localStorage.removeItem('supabase_refresh_token');
  localStorage.removeItem('supabase_user');
}

/**
 * Get token age in milliseconds
 */
export function getTokenAge(): number | null {
  if (typeof window === 'undefined') return null;
  
  const timestamp = localStorage.getItem('supabase_token_timestamp');
  if (!timestamp) return null;
  
  return Date.now() - parseInt(timestamp, 10);
}

/**
 * Check if token is about to expire (within threshold)
 */
export function isTokenExpiringSoon(thresholdMinutes: number = 10): boolean {
  const tokenAge = getTokenAge();
  if (tokenAge === null) return true; // No token = treat as expired
  
  const thresholdMs = thresholdMinutes * 60 * 1000;
  const maxAge = 2 * 60 * 60 * 1000; // 2 hours in milliseconds (Agent token expiry)
  
  // Token is expiring soon if it's within threshold of max age
  return tokenAge > (maxAge - thresholdMs);
}

/**
 * Request a fresh token from Brandscaling via postMessage
 * Returns a Promise that resolves with the new token or rejects if refresh fails
 */
export function requestFreshToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Set timeout for refresh request (30 seconds)
    const timeout = setTimeout(() => {
      reject(new Error('Token refresh request timed out'));
    }, 30000);

    // Listen for token response
    const handleTokenResponse = (event: MessageEvent<TokenMessage>) => {
      const allowedOrigins = [
        'https://www.brandscaling.co.uk',
        'https://brandscaling.co.uk',
        'https://brandscaling.com',
        'https://www.brandscaling.com',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:8000',
      ];

      if (!allowedOrigins.includes(event.origin)) {
        return; // Ignore messages from untrusted origins
      }

      if (event.data && (event.data.type === 'SUPABASE_TOKEN' || event.data.type === 'SUPABASE_AUTH' || event.data.type === 'AGENT_AUTH')) {
        let token: string | null = null;

        // Handle AGENT_AUTH format (new lightweight token from Brandscaling)
        // Brandscaling sends: { type: "AGENT_AUTH", token: "..." }
        if (event.data.type === 'AGENT_AUTH' && typeof event.data.token === 'string') {
          token = event.data.token;
        }
        // Handle SUPABASE_TOKEN format (legacy)
        else if (event.data.type === 'SUPABASE_TOKEN' && typeof event.data.token === 'string') {
          token = event.data.token;
        }
        // Handle SUPABASE_AUTH format (legacy)
        else if (event.data.type === 'SUPABASE_AUTH' && typeof event.data.accessToken === 'string') {
          token = event.data.accessToken;
          
          if (event.data.refreshToken) {
            localStorage.setItem('supabase_refresh_token', event.data.refreshToken);
          }
          if (event.data.user) {
            localStorage.setItem('supabase_user', JSON.stringify(event.data.user));
          }
        }

        if (token) {
          // Store new token
          localStorage.setItem('supabase_token', token);
          localStorage.setItem('supabase_token_timestamp', Date.now().toString());
          
          clearTimeout(timeout);
          window.removeEventListener('message', handleTokenResponse);
          resolve(token);
        }
      }
    };

    window.addEventListener('message', handleTokenResponse);

    // Request fresh token from Brandscaling
    if (window.opener) {
      // Popup scenario
      window.opener.postMessage(
        {
          type: 'REQUEST_AGENT_TOKEN', // Request new Agent token
          target: window.location.origin,
        },
        '*'
      );
    } else if (window.self !== window.top && window.parent) {
      // Iframe scenario
      window.parent.postMessage(
        {
          type: 'REQUEST_AGENT_TOKEN', // Request new Agent token
          target: window.location.origin,
        },
        '*'
      );
    } else {
      // Standalone window - try to send to parent/opener
      window.postMessage(
        {
          type: 'REQUEST_AGENT_TOKEN', // Request new Agent token
          target: window.location.origin,
        },
        '*'
      );
    }
  });
}

/**
 * Refresh token on 401 error (fallback mechanism)
 * Tries to get fresh token from Brandscaling and retries the failed request
 */
export async function refreshTokenOn401<T>(
  apiCall: (token: string) => Promise<T>
): Promise<T> {
  console.log('🔄 [Token] Attempting to refresh token after 401 error...');
  
  try {
    // Request fresh token from Brandscaling
    const newToken = await requestFreshToken();
    console.log('✅ [Token] Token refreshed successfully');
    
    // Retry the API call with new token
    return await apiCall(newToken);
  } catch (error) {
    console.error('❌ [Token] Failed to refresh token:', error);
    throw new Error('Token refresh failed. Please log in again on the company website.');
  }
}

/**
 * Start proactive token refresh timer
 * Checks token age periodically and refreshes before expiration
 * @param refreshThresholdMinutes - Refresh if token is within this many minutes of expiring (default: 10)
 * @param checkIntervalMinutes - How often to check token age (default: 5)
 * @returns Cleanup function to stop the timer
 */
export function startTokenRefreshTimer(
  refreshThresholdMinutes: number = 10,
  checkIntervalMinutes: number = 5
): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // SSR - no timer needed
  }

  console.log('⏰ [Token] Starting proactive token refresh timer');
  
  const checkInterval = checkIntervalMinutes * 60 * 1000; // Convert to milliseconds
  let refreshInProgress = false;

  const checkAndRefresh = async () => {
    // Skip if refresh is already in progress
    if (refreshInProgress) {
      console.log('⏳ [Token] Token refresh already in progress, skipping check');
      return;
    }

    const token = getStoredToken();
    if (!token) {
      console.log('⚠️ [Token] No token found, skipping refresh check');
      return;
    }

    if (isTokenExpiringSoon(refreshThresholdMinutes)) {
      console.log('🔄 [Token] Token expiring soon, refreshing proactively...');
      refreshInProgress = true;

      try {
        await requestFreshToken();
        console.log('✅ [Token] Token refreshed proactively');
      } catch (error) {
        console.warn('⚠️ [Token] Proactive token refresh failed:', error);
        // Don't throw - fallback to 401 refresh will handle it
      } finally {
        refreshInProgress = false;
      }
    } else {
      const tokenAge = getTokenAge();
      const ageMinutes = tokenAge ? Math.floor(tokenAge / 60000) : 0;
      console.log(`✅ [Token] Token still valid (${ageMinutes} minutes old)`);
    }
  };

  // Check immediately on start
  checkAndRefresh();

  // Set up interval
  const intervalId = setInterval(checkAndRefresh, checkInterval);

  // Return cleanup function
  return () => {
    console.log('🛑 [Token] Stopping token refresh timer');
    clearInterval(intervalId);
  };
}

