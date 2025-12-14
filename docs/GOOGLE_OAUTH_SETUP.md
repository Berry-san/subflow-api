# Google OAuth Production Setup Guide

## 📋 What You Need

### 1. **Google Cloud Console Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - App name: "Sublow"
   - User support email: your email
   - Developer contact: your email
   - Scopes: `email`, `profile`, `openid`
   - Add test users (for development)

6. Create OAuth Client ID:
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:5500` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:5500/api/v1/auth/google/callback` (dev)
     - `https://yourdomain.com/api/v1/auth/google/callback` (prod)

7. Copy **Client ID** and **Client Secret**

### 2. **Environment Variables**
Add to your `.env`:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5500/api/v1/auth/google/callback
```

For production:
```env
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/v1/auth/google/callback
```

### 3. **Frontend Integration**

#### **Option A: Redirect Flow (Recommended for Web)**
```typescript
// Redirect to Google OAuth
function loginWithGoogle() {
  window.location.href = 'http://localhost:5500/api/v1/auth/google';
}

// Handle callback (create a callback page)
// URL: /auth/callback?access_token=xxx&refresh_token=yyy
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('access_token');
const refreshToken = urlParams.get('refresh_token');

if (accessToken && refreshToken) {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  window.location.href = '/dashboard';
}
```

#### **Option B: Popup Flow**
```typescript
function loginWithGoogle() {
  const width = 500;
  const height = 600;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;
  
  const popup = window.open(
    'http://localhost:5500/api/v1/auth/google',
    'Google Login',
    `width=${width},height=${height},left=${left},top=${top}`
  );
  
  // Listen for message from popup
  window.addEventListener('message', (event) => {
    if (event.origin !== 'http://localhost:5500') return;
    
    const { access_token, refresh_token } = event.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    
    popup?.close();
    window.location.href = '/dashboard';
  });
}
```

### 4. **Mobile App Integration (React Native/Flutter)**

#### **Using Deep Links:**
```typescript
// 1. Configure deep link in your app
// iOS: sublow://auth/callback
// Android: sublow://auth/callback

// 2. Update callback URL
GOOGLE_CALLBACK_URL=sublow://auth/callback

// 3. Open OAuth in browser
import { Linking } from 'react-native';

Linking.openURL('http://api.yourdomain.com/api/v1/auth/google');

// 4. Handle deep link
Linking.addEventListener('url', (event) => {
  const url = new URL(event.url);
  const accessToken = url.searchParams.get('access_token');
  const refreshToken = url.searchParams.get('refresh_token');
  
  // Store tokens and navigate
});
```

## 🔧 Backend Improvements Needed

### 1. **Better Callback Handling**
Current implementation needs to redirect with tokens instead of just returning JSON.

### 2. **Error Handling**
Handle OAuth failures gracefully.

### 3. **State Parameter**
Add CSRF protection with state parameter.

### 4. **Multiple Environments**
Support different callback URLs for dev/staging/prod.

## 🚀 Production Checklist

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] OAuth credentials created
- [ ] Environment variables set
- [ ] Callback URL whitelisted in Google Console
- [ ] Frontend redirect/popup flow implemented
- [ ] Deep links configured (for mobile)
- [ ] Error handling implemented
- [ ] HTTPS enabled in production
- [ ] Privacy policy URL added to consent screen
- [ ] Terms of service URL added
- [ ] App verified by Google (for production)

## 🔒 Security Best Practices

1. **Never expose Client Secret** on frontend
2. **Use HTTPS** in production
3. **Validate state parameter** to prevent CSRF
4. **Implement rate limiting** on OAuth endpoints
5. **Log OAuth attempts** for security monitoring
6. **Handle token refresh** properly
7. **Revoke tokens on logout**

## 📱 Testing

### Development:
1. Add your email as test user in Google Console
2. Use `http://localhost:5500` URLs
3. Test both new user registration and existing user login

### Production:
1. Submit app for verification (if needed)
2. Test with real users
3. Monitor OAuth success/failure rates
4. Set up error tracking (Sentry, etc.)
