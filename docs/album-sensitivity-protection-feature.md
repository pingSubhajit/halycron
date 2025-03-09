# Album Sensitivity and Protection Features Implementation Plan

## Overview

This document outlines the implementation plan for two album security features:

1. **Sensitive Albums**: Albums containing content that should be hidden from casual browsing
2. **Protected Albums**: Albums that require a PIN code to access

These features enhance privacy and security for users while maintaining a seamless user experience.

## Current State

The database schema already includes fields for these features:
- `isSensitive` (boolean) - Flag for sensitive content albums
- `isProtected` (boolean) - Flag for PIN-protected albums
- `pinHash` (text) - Store for the hashed PIN

However, the complete implementation of these features in both the frontend and backend is not yet in place.

## Implementation Plan

### 1. Backend Implementation

#### 1.1 Complete the PIN Hashing Functionality
- Create a utility function in `apps/web/lib/auth/password.ts` to:
  - Hash PINs securely before storing them
  - Verify PINs against the stored hash
- Use a secure hashing algorithm with appropriate salt

#### 1.2 Add PIN Verification Endpoint
- Create a new endpoint at `apps/web/app/api/albums/[id]/verify-pin/route.ts`
- Implement PIN verification logic:
  - Accept a PIN submission
  - Compare with stored hash
  - Return a verification token or error
- Handle rate limiting to prevent brute-force attacks

#### 1.3 Update Album Access Control
- Modify album photo retrieval in `apps/web/app/api/albums/[id]/photos/route.ts`:
  - Check for protected status
  - Require PIN verification before access
  - Return appropriate error codes when access is denied
- Update album creation/update endpoints to properly handle PIN setting and changing

### 2. Frontend Implementation

#### 2.1 Update Album Creation/Edit Forms
- Modify `CreateAlbumForm` and update forms to include:
  - Toggle switch for "Sensitive Content"
  - Toggle switch for "PIN Protection"
  - PIN input field (appears conditionally when protection is enabled)
  - PIN confirmation field and validation
  - Clear UI indication of these security features

#### 2.2 Update Album Card Component
- Modify `AlbumCard` in `apps/web/components/album-card.tsx`:
  - Add visual indicators for sensitive and protected albums (icons)
  - Implement blur/hide functionality for sensitive album thumbnails
  - Add a lock icon for protected albums
  - Update hover states to indicate security status

#### 2.3 Implement PIN Verification Dialog
- Create a new component `PinVerificationDialog`:
  - Modal dialog for entering PINs
  - Numeric keypad for PIN entry
  - Error handling and feedback
  - Remember verification status for the session

#### 2.4 Update Album View Component
- Modify `SingleAlbumView` in `apps/web/app/app/albums/[id]/single-album-view.tsx`:
  - Add protection handling to block access until PIN is verified
  - Implement blur/warning for sensitive albums
  - Add clear indication of album security status

### 3. Mobile App Considerations

#### 3.1 API Design
- Ensure all album functionality is exposed through RESTful APIs:
  - `GET /api/albums` - List albums with security status (but blurred/hidden previews)
  - `POST /api/albums` - Create album with security options
  - `PUT /api/albums/[id]` - Update album security settings
  - `POST /api/albums/[id]/verify-pin` - Verify PIN and get access
  - `GET /api/albums/[id]/photos` - Get photos (requires verification for protected albums)
- Document API thoroughly for mobile developers
- Avoid server actions; use pure API endpoints

#### 3.2 Authentication & Security
- Ensure PIN verification happens server-side only
- Implement proper session handling for verified PINs
- Use token-based approach for maintaining verified status
- Set appropriate expiration for verification tokens

## Technical Requirements

1. **PIN Requirements**:
   - Must be exactly 4 digits
   - Must be hashed before storage
   - Should not be recoverable (use one-way hashing)

2. **UX Considerations**:
   - Sensitive albums should have visual indication but blurred thumbnails
   - Protected albums should clearly indicate they require a PIN
   - PIN verification should be intuitive and secure

3. **Security Measures**:
   - PIN attempts should be rate-limited
   - PIN verification should be time-bound
   - No references to PIN should appear in logs or client-side code

## Implementation Timeline

1. Backend PIN hashing and verification
2. Album API endpoint updates
3. Frontend form updates
4. PIN verification dialog
5. Album card and view component updates
6. Testing and refinement
7. Documentation for mobile developers

## Future Enhancements

- Biometric authentication option for protected albums (for mobile)
- Custom visibility settings (whitelist specific users)
- Encryption of album metadata for sensitive albums
- Auto-locking of protected albums after period of inactivity 