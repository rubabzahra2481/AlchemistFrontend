# Amplify Environment Variables for Frontend

## 📋 Current Status

**Currently: NO environment variables are required.**

The backend URL is **hardcoded** in the frontend code:
- `pages/index.tsx` line 68
- `components/ChatInterface.tsx` lines 98, 154

**Current Backend URL (hardcoded):**
```
https://ptvmvy9qhn.us-east-1.awsapprunner.com
```

---

## ✅ Required: NONE (Currently)

Since the backend URL is hardcoded, you don't need to add any environment variables to Amplify.

The frontend will automatically:
- Use `http://localhost:5000` for localhost/development
- Use `https://ptvmvy9qhn.us-east-1.awsapprunner.com` for production

---

## 🔧 Recommended: Add Environment Variable

### Optional Environment Variable

**Variable Name:** `NEXT_PUBLIC_API_URL`  
**Value:** `https://ptvmvy9qhn.us-east-1.awsapprunner.com`  
**Why:** Makes the backend URL configurable instead of hardcoded

**Note:** In Next.js, environment variables must be prefixed with `NEXT_PUBLIC_` to be available in the browser.

---

## 📝 How to Add to Amplify (If You Want to Make It Configurable)

### Step 1: Go to Amplify Console

1. AWS Amplify Console
2. Select your app (e.g., `ai-alchemist-frontend`)
3. Click **Environment variables** in the left sidebar

### Step 2: Add Environment Variable

**Name:**
```
NEXT_PUBLIC_API_URL
```

**Value:**
```
https://ptvmvy9qhn.us-east-1.awsapprunner.com
```

**Note:** Must prefix with `NEXT_PUBLIC_` for Next.js to expose it to the browser.

### Step 3: Update Code to Use It (Optional)

If you want to use the environment variable instead of hardcoded URLs:

**In `pages/index.tsx`:**
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
  (isLocalhost 
    ? `http://${window.location.hostname}:5000/chat`
    : 'https://ptvmvy9qhn.us-east-1.awsapprunner.com/chat');
```

**In `components/ChatInterface.tsx`:**
```typescript
const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
  (isLocalhost 
    ? `http://${window.location.hostname}:5000`
    : 'https://ptvmvy9qhn.us-east-1.awsapprunner.com');
    
const apiUrl = `${baseUrl}/chat/session/${sessionId}/history`;
```

---

## 🎯 Summary

### Current Status: ✅ NO ENV VARS NEEDED

The frontend works without any environment variables because:
- Backend URL is hardcoded
- Token comes from Brandscaling website via `postMessage`
- No other configuration needed

### Recommended: Add `NEXT_PUBLIC_API_URL` (Optional)

Only if you want to:
- Make backend URL configurable
- Switch between environments easily
- Avoid hardcoding URLs

**But it's not required** - the current hardcoded setup works fine!

---

## 📋 Complete Environment Variables List

### Required: 0 variables
None - everything is hardcoded or comes from Brandscaling website.

### Optional: 1 variable
- `NEXT_PUBLIC_API_URL` - Backend API URL (recommended for flexibility)

---

## 💡 Notes

1. **Token Handling:** Tokens come from Brandscaling website via `postMessage`, not from environment variables.

2. **Next.js Prefix:** Any environment variable used in the browser must be prefixed with `NEXT_PUBLIC_`.

3. **Build-Time Variables:** Environment variables are baked into the build at build time, not runtime.

4. **No Secrets:** Don't add API keys or secrets here - they're exposed to the browser!

---

## ✅ Quick Answer

**Do you need to add environment variables to Amplify?**

**NO** - The frontend works without any environment variables because the backend URL is hardcoded.

**Should you add `NEXT_PUBLIC_API_URL`?**

**Optional** - Only if you want to make the backend URL configurable. It's not required.







