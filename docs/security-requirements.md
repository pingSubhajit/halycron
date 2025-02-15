# Security Requirements

Halyon is a service that will let me and other users have a private photo vault that would be stored in my S3 or if someone wants to store in their own S3 bucket that will be possible as well. UI functionality wise it would be much like Google photos but would be highly security focused. So much so that it has to be near impossible to unwanted people to get hold of the photos even when they are loaded in the UI. The service will have a companion mobile app and a web app that will let users upload, batch upload, tag, organize, view, delete, download and manage their photos.

### 1 Authentication & Authorization

- Multi-factor authentication (MFA) required for all accounts
- Password requirements:
    - Minimum 12 characters
    - Must contain uppercase, lowercase, numbers, and special characters
    - Password history enforcement (prevent reuse of last 5 passwords)
    - Maximum password age: 90 days
- Session management:
    - JWT tokens with 15-minute expiration
    - Refresh tokens with 7-day expiration
    - Automatic logout after 30 minutes of inactivity
    - Maximum of 5 concurrent sessions per user

### 2 Encryption Requirements

- File Encryption:
    - AES-256-GCM for file content encryption
    - Unique encryption key per file
    - IV (Initialization Vector) must be randomly generated for each encryption operation
- Key Management:
    - RSA-4096 for key exchange
    - User master key derived using Argon2id with high-security parameters
    - All encryption keys must be encrypted before storage
    - Key rotation required every 90 days
    - Secure key deletion upon file deletion

### 3 API Security

- Rate Limiting:
    - 100 requests per minute per user for standard operations
    - 10 requests per minute for login attempts
    - 2 requests per minute for password reset
- Request Validation:
    - Strict input validation for all endpoints
    - Content-Type enforcement
    - Maximum file size: 50MB per file
    - Allowed file types: jpg, jpeg, png, heic, raw
- Headers:
    - Strict-Transport-Security
    - Content-Security-Policy
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - X-XSS-Protection: 1; mode=block

### 4 Storage Security

- S3 Configuration:
    - Server-side encryption with AES-256
    - Versioning enabled for accidental deletion protection
    - Lifecycle policies for version management
    - Access logging enabled
    - Public access blocked
    - Bucket policies restricted to application role
- Database Security:
    - TLS encryption for all connections
    - Encrypted at rest
    - Regular backup schedule
    - Point-in-time recovery enabled

### 5 Audit & Monitoring

- Logging Requirements:
    - All authentication attempts
    - File access operations
    - Administrative actions
    - Encryption operations
    - API errors
- Log Retention:
    - Security logs: 1 year
    - Access logs: 90 days
    - Error logs: 30 days