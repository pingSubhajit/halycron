# Halycon

A highly secure, private photo vault service that allows users to store and manage their photos with end-to-end encryption. Similar to Google Photos in functionality but with a primary focus on security and privacy. Users can store photos in their own S3 bucket or use the provided storage solution.

## 🌟 Features

- **Secure Photo Storage**: End-to-end encryption for all photos with client-side encryption
- **Multi-Platform Support**: 
  - Web application built with Next.js 15
  - Mobile application using Expo v50 and React Native
- **Advanced Security**:
  - Multi-factor authentication
  - Zero-knowledge architecture
  - AES-256-GCM encryption for files
  - RSA-4096 for key exchange
- **Photo Management**:
  - Upload and batch upload support
  - Photo tagging and organization
  - Album creation and management
  - Secure thumbnail generation
- **User Control**:
  - Custom S3 bucket support
  - Encrypted metadata storage
  - Secure sharing capabilities
- **Modern Development**:
  - Full TypeScript support
  - Built with Bun and Turborepo
  - Comprehensive security measures

## 📦 Project Structure

```
halycon/
├── apps/
│   ├── web/          # Next.js 15 web application
│   └── mobile/       # Expo v50 React Native application
├── packages/
│   ├── ui/           # Shared UI components (shadcn/ui)
│   ├── eslint-config/# Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
├── docs/             # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 22
- Bun >= 1.1.42
- PostgreSQL 15
- Redis 7.x
- AWS Account (for S3 and KMS)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/halycon.git
cd halycon
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp ./apps/web/.env.example ./apps/web/.env
```

4. Set up the database:
```bash
bunx drizzle-kit migrate
```

5. Start development servers:
```bash
bun turbo tun dev
```

### Environment Variables

Create a `.env` files in the apps directories with the help of the respective .env.example:

## 🛠️ Development

### Tech Stack

#### Frontend (Web)
- Next.js 15
- TypeScript 5.x
- TanStack Query v5
- Zustand v4
- Tailwind CSS
- shadcn/ui

#### Mobile
- Expo v53
- React Native v0.78
- Expo Router
- TanStack Query v5
- Nativewind v4

#### Backend
- Next.js 15 API Routes
- PostgreSQL 15 with Drizzle ORM
- Upstash Redis
- AWS S3

### Available Scripts

- `bun dev` - Start all applications in development mode
- `bun build` - Build all applications and packages
- `bun lint` - Run ESLint across the project
- `bun lint:fix` - Run ESLint across the project with auto-fixing
- `bun format` - Run Prettier across the project

### Security Considerations

- All API endpoints except authentication require JWT tokens
- Files are encrypted using AES-256-GCM before upload
- Each user has a unique master key for encryption
- MFA is required for all accounts
- Rate limiting is enabled on all endpoints
- Regular security audits are performed

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Maintain 90%+ test coverage
- Follow security best practices
- Update documentation for significant changes
- Add appropriate logging for security events

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Turborepo](https://turbo.build/repo)
- [shadcn/ui](https://ui.shadcn.com/)
- [Next.js](https://nextjs.org/)
- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [BetterAuth](https://better-auth.com)
