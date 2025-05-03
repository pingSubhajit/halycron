# Contributing to Halycron

Thank you for your interest in contributing to Halycron! We're excited to have you join our community in building a secure and private photo vault service. This document provides guidelines and instructions for contributing to the project.

## 🎯 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct (to be added). We expect all contributors to be respectful, inclusive, and professional in all interactions.

## 🔄 Development Workflow

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/halycron.git
   cd halycron
   bun install
   ```

2. **Branch Naming Convention**
   - `feature/*` - For new features
   - `fix/*` - For bug fixes
   - `docs/*` - For documentation changes
   - `security/*` - For security-related changes
   - `perf/*` - For performance improvements

3. **Commit Message Guidelines**
   ```
   <type>(<scope>): <subject>

   <body>

   <footer>
   ```
   Types: feat, fix, docs, style, refactor, test, chore
   Example: `feat(web): add photo batch upload component`

## 🛠️ Development Setup

### Prerequisites
- Node.js >= 22
- Bun >= 1.1.42
- PostgreSQL 15
- Redis 7.x
- AWS Account (for S3 and KMS)

### Local Development
1. Copy environment variables:
   ```bash
   cp ./apps/web/.env.example ./apps/web/.env
   ```

2. Set up the database:
   ```bash
   bunx drizzle-kit migrate
   ```

3. Start development servers:
   ```bash
   bun turbo run dev
   ```

## 🧪 Testing Guidelines

- Maintain minimum 90% test coverage
- Write unit tests for all new features
- Include integration tests for API endpoints
- Add E2E tests for critical user flows

### Running Tests
```bash
bun test        # Run unit tests
bun test:e2e    # Run E2E tests
bun test:coverage # Generate coverage report
```

## 🔒 Security Guidelines

1. **Code Security**
   - Never commit sensitive information
   - Use environment variables for secrets
   - Follow the principle of least privilege
   - Implement proper input validation
   - Use parameterized queries

2. **Encryption Requirements**
   - Use AES-256-GCM for file encryption
   - Implement proper key management
   - Follow zero-knowledge architecture principles

3. **Authentication & Authorization**
   - Implement MFA where required
   - Use proper session management
   - Follow JWT best practices

## 📝 Documentation Guidelines

1. **Code Documentation**
   - Add JSDoc comments for functions
   - Document complex algorithms
   - Include usage examples
   - Update README for new features

2. **API Documentation**
   - Document all API endpoints
   - Include request/response examples
   - Note security requirements
   - Update OpenAPI specs

## 🎨 Style Guide

- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Follow component structure guidelines
- Use shadcn/ui components where applicable

### Code Style
```typescript
// Example component structure
import { type FC } from 'react'
import {utils} from '@/lib/utils'

interface ComponentProps {
  // Props interface
}

export const Component: FC<ComponentProps> = ({
  // Destructured props
}) => {
  return (
    // JSX
  )
}
```

## 🚀 Pull Request Process

1. **Before Submitting**
   - Update documentation
   - Add/update tests
   - Run linting and tests
   - Ensure CI passes

2. **PR Template**
   - Description of changes
   - Related issue(s)
   - Testing steps
   - Screenshots (if applicable)
   - Checklist of completed items

3. **Review Process**
   - Two approvals required
   - Address review comments
   - Maintain clean commit history
   - Update based on feedback

## 🐛 Bug Reports

When filing a bug report, include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots/logs if applicable

## 💡 Feature Requests

When proposing features:
- Describe the problem it solves
- Explain proposed solution
- Consider security implications
- Discuss alternatives considered
- Provide implementation details

## 📦 Release Process

1. Version bump following semver
2. Update CHANGELOG.md
3. Create release PR
4. Deploy to staging
5. Test thoroughly
6. Deploy to production

## 🆘 Getting Help

- Check existing issues
- Review documentation
- Ask in discussions
- Tag maintainers if urgent

## 🙏 Recognition

Contributors will be:
- Added to CONTRIBUTORS.md
- Mentioned in release notes
- Recognized in project documentation

Thank you for contributing to Halycron! Together, we're building a more secure and private photo management solution. 
