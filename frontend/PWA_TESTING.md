# PWA Testing Guide

This document provides instructions for testing Progressive Web App (PWA) features of RunCrew.

## Prerequisites

- Modern browser (Chrome, Edge, Safari, or Firefox)
- HTTPS connection (required for service workers)
- Mobile device or browser DevTools for mobile simulation

## Testing Checklist

### 1. Service Worker Registration

**Desktop Testing:**
1. Open the app in Chrome
2. Open DevTools (F12)
3. Go to Application tab → Service Workers
4. Verify that a service worker is registered
5. Check that the status shows "activated and is running"

**Expected Result:** Service worker should be registered and active

### 2. Offline Functionality

**Steps:**
1. Load the application while online
2. Open DevTools → Network tab
3. Check "Offline" checkbox to simulate offline mode
4. Navigate through the app
5. Try to access previously visited pages

**Expected Result:** 
- Previously cached pages should load
- Static assets (CSS, JS, images) should be available
- API calls should fail gracefully with appropriate error messages

### 3. Add to Home Screen (Desktop)

**Chrome/Edge:**
1. Open the app
2. Look for the install icon in the address bar (⊕ or install icon)
3. Click the install button
4. Confirm installation

**Expected Result:** 
- App should be installable
- Installed app should open in standalone window
- App icon should appear in applications menu

### 4. Add to Home Screen (iOS Safari)

**Steps:**
1. Open the app in Safari on iOS
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm

**Expected Result:**
- App icon should appear on home screen
- Opening from home screen should launch in standalone mode
- Status bar should match theme color (#1976d2)

### 5. Add to Home Screen (Android Chrome)

**Steps:**
1. Open the app in Chrome on Android
2. Tap the menu (three dots)
3. Tap "Add to Home screen" or "Install app"
4. Confirm installation

**Expected Result:**
- App should be installable
- App icon should appear on home screen
- Opening from home screen should launch in standalone mode

### 6. Update Notification

**Steps:**
1. Make a change to the app code
2. Build and deploy the new version
3. Open the app (old version)
4. Wait for service worker to detect update

**Expected Result:**
- Update notification should appear at bottom of screen
- Clicking "更新" should reload the app with new version
- App should update without losing user state

### 7. Manifest Validation

**Steps:**
1. Open DevTools → Application tab
2. Click on "Manifest" in the left sidebar
3. Review manifest properties

**Expected Result:**
- Name: "RunCrew"
- Short name: "RunCrew"
- Theme color: #1976d2
- Display: standalone
- Icons: 192x192 and 512x512 present

### 8. Responsive Design Testing

**Mobile (320px - 767px):**
- [ ] All text is readable
- [ ] Buttons are touch-friendly (min 44px)
- [ ] No horizontal scrolling
- [ ] Navigation is accessible
- [ ] Forms are usable

**Tablet (768px - 1023px):**
- [ ] Layout adapts appropriately
- [ ] Content is well-spaced
- [ ] Images scale correctly

**Desktop (1024px+):**
- [ ] Full features are accessible
- [ ] Layout uses available space efficiently
- [ ] Multi-column layouts work correctly

### 9. Performance Testing

**Lighthouse Audit:**
1. Open DevTools → Lighthouse tab
2. Select "Progressive Web App" category
3. Run audit

**Expected Scores:**
- PWA: 90+
- Performance: 80+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

### 10. Network Conditions Testing

**Steps:**
1. Open DevTools → Network tab
2. Select different network throttling options:
   - Fast 3G
   - Slow 3G
   - Offline
3. Test app functionality under each condition

**Expected Result:**
- App should remain usable on slow connections
- Loading states should be visible
- Cached content should load quickly

## Common Issues and Solutions

### Service Worker Not Registering
- Ensure app is served over HTTPS
- Check browser console for errors
- Verify vite-plugin-pwa is properly configured

### Install Prompt Not Showing
- Ensure manifest.json is valid
- Check that all required icons are present
- Verify app meets PWA criteria (HTTPS, service worker, manifest)

### Offline Mode Not Working
- Check service worker caching strategy
- Verify network requests are being intercepted
- Review workbox configuration in vite.config.ts

### iOS Safari Issues
- Ensure apple-touch-icon is specified
- Check viewport meta tag
- Verify standalone mode is working

## Automated Testing

Run the test suite:
```bash
npm test
```

Run specific PWA tests:
```bash
npm test -- PWAUpdatePrompt
npm test -- useOnlineStatus
```

## Browser Compatibility

| Feature | Chrome | Edge | Safari | Firefox |
|---------|--------|------|--------|---------|
| Service Workers | ✅ | ✅ | ✅ | ✅ |
| Add to Home Screen | ✅ | ✅ | ✅ | ⚠️ |
| Offline Support | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ | ❌ | ✅ |

✅ Fully supported
⚠️ Partially supported
❌ Not supported

## Additional Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
