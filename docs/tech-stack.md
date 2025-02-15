# Tech Stack

Halyon is a service that will let me and other users have a private photo vault that would be stored in my S3 or if someone wants to store in their own S3 bucket that will be possible as well. UI functionality wise it would be much like Google photos but would be highly security focused. So much so that it has to be near impossible to unwanted people to get hold of the photos even when they are loaded in the UI. The service will have a companion mobile app and a web app that will let users upload, batch upload, tag, organize, view, delete, download and manage their photos.

## 1. Core Technologies

### 1.1 Frontend (Web)

- **Framework**: Next.js 15
- **Language**: TypeScript 5.x
- **State Management**:
    - TanStack Query (React Query) v5
    - Zustand v4
- **Form Handling**:
    - React Hook Form v7
    - Zod for schema validation
- **Styling**:
    - Tailwind CSS v3
    - shadcn/ui for component library
    - CSS Modules for component-specific styles
- **Image Handling**:
    - Sharp for image processing
    - next/image for optimized image loading

### 1.2 Mobile Application

- **Framework**: Expo v50
- **Core**: React Native v0.73
- **Language**: TypeScript 5.x
- **Navigation**:
    - React Navigation v6
    - Expo Router v2
- **State Management**:
    - TanStack Query (React Query) v5
    - Zustand v4
- **Image Handling**:
    - expo-image-manipulator
    - expo-image-picker
- **Storage**:
    - expo-secure-store
    - expo-file-system

### 1.3 Backend

- **Framework**: Next.js 15 API Routes
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15
- **ORM**: Drizzle ORM
- **File Storage**: AWS S3
- **Caching**: Redis 7.x

## 2. Security & Authentication

### 2.1 Authentication

- **Framework**: BetterAuth
- **MFA**:
    - `@epic-web/totp` for TOTP implementation
    - QR code generation with `qrcode`
- **Password Security**:
    - Argon2 for password hashing
    - `zxcvbn` for password strength estimation

### 2.2 Encryption

- **Libraries**:
    - `node:crypto` for core encryption
    - `tweetnacl-js` for public-key encryption
    - `@aws-sdk/client-kms` for key management
- **Algorithms**:
    - AES-256-GCM for file encryption
    - RSA-4096 for key exchange
    - Argon2id for key derivation

## 3. Development & Testing Tools

### 3.1 Development Tools

- **Package Manager**: Bun
- **Version Control**: Git
- **Code Quality**:
    - ESLint with security plugins
    - TypeScript strict mode
- **API Development**:
    - Swagger/OpenAPI for documentation
    - Postman for API testing

### 3.2 Testing Stack

- **Unit Testing**:
    - Vitest
    - React Testing Library
- **E2E Testing**:
    - Playwright
- **Mobile Testing**:
    - Jest
    - React Native Testing Library
- **API Testing**:
    - Supertest
    - Mock Service Worker (MSW)

### 3.3 Security Testing

- **Static Analysis**:
    - SonarQube
    - bun audit
    - OWASP Dependency-Check
- **Dynamic Testing**:
    - OWASP ZAP
    - Burp Suite Community Edition

## 4. DevOps & Infrastructure

### 4.1 Cloud Services (AWS)

- **Compute**:
    - Vercel for Next.js deployment
    - ECS for background jobs
- **Storage**:
    - S3 for file storage
    - RDS for PostgreSQL
    - ElastiCache for Redis
- **Security**:
    - AWS KMS for key management
    - AWS WAF for web application firewall
    - AWS Shield for DDoS protection

### 4.2 Monitoring & Logging

- **Application Monitoring**:
    - Sentry for error tracking
    - OpenTelemetry for tracing
    - Prometheus for metrics
- **Logging**:
    - Winston for application logs
    - CloudWatch Logs
    - ELK Stack for log analysis

### 4.3 CI/CD

- **Pipeline**: GitHub Actions
- **Quality Gates**:
    - Unit test coverage (>90%)
    - Integration test success
    - Security scan passes
    - TypeScript compilation
    - Lint checks

### 5. Production Environment Additional Requirements

- SSL/TLS certificates
- Domain configuration
- CDN setup
- Load balancer configuration
- Backup strategy
- Monitoring setup
- Security group configurations
- VPC setup

Key changes made:

1. Replaced NextAuth with BetterAuth throughout the document
2. Updated package manager from pnpm to Bun
3. Removed Prettier from development tools
4. Updated Next.js version from 14 to 15
5. Updated environment variables to use BetterAuth instead of NextAuth
6. Updated package audit command to use Bun instead of npm

Would you like me to:

1. Add any specific BetterAuth configuration details?
2. Include Bun-specific optimization settings?
3. Add more detail about any particular section?