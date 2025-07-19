# Catálogo Feminino

## Overview

This is a full-stack product catalog web application built with a modern TypeScript stack. The application features a public interface for browsing products organized in "stacks" (curated collections) and an administrative interface for content management. The system supports product search, pagination, theme switching, and comprehensive admin functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack Query for server state management
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **Theme System**: Custom theme provider with light/dark mode support and localStorage persistence

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Session Management**: Token-based admin authentication

### Project Structure
```
├── client/          # Frontend React application
├── server/          # Backend Express API
├── shared/          # Shared TypeScript schemas and types
├── migrations/      # Database migration files
└── attached_assets/ # Product requirements and documentation
```

## Key Components

### Frontend Components
- **Header**: Navigation with theme toggle and admin login
- **Product Cards**: Reusable product display components with hover effects
- **Product Modal**: Detailed product view with image gallery
- **Pagination**: Server-side pagination with configurable page sizes
- **Theme Provider**: Dark/light mode with localStorage persistence
- **Admin Dashboard**: Full CRUD interface for products and stacks

### Backend Services
- **Storage Layer**: Database abstraction with interface for easy testing
- **Route Handlers**: RESTful API endpoints for public and admin operations
- **Database Schema**: Strongly typed schema definitions with Drizzle

### Database Schema
- **Products**: Core product data with pricing, images, and metadata
- **Stacks**: Product collections with ordering and visibility controls
- **Stack Products**: Many-to-many relationship with custom ordering
- **Site Configuration**: Key-value store for application settings
- **Admin Sessions**: Token-based authentication for administrative access

## Data Flow

### Public Interface
1. **Homepage**: Displays featured stacks with ordered products
2. **Search Page**: Paginated product listing with search functionality
3. **Product Details**: Modal-based detailed product view

### Admin Interface
1. **Authentication**: Code-based login with token generation
2. **Product Management**: Full CRUD operations with form validation
3. **Stack Management**: Create and organize product collections
4. **Stack-Product Relations**: Drag-and-drop ordering within stacks

### API Structure
- **Public Endpoints**: `/api/produtos`, `/api/stacks` for product browsing
- **Admin Endpoints**: `/api/admin/*` with authentication middleware
- **Authentication**: Bearer token validation for admin operations

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **ORM**: Drizzle ORM with PostgreSQL driver
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **State Management**: TanStack Query for caching and synchronization
- **Validation**: Zod for runtime type validation
- **Styling**: Tailwind CSS with custom design system

### Development Tools
- **TypeScript**: Strict type checking across the entire stack
- **Vite**: Fast development server with HMR
- **ESBuild**: Production bundling for server code

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle Kit handles schema migrations

### Production Configuration
- **Environment Variables**: DATABASE_URL for database connection
- **Startup**: Node.js serves both API and static assets
- **Database**: Neon serverless PostgreSQL with connection pooling

### Development Workflow
- **Hot Reload**: Vite dev server with proxy to Express backend
- **Type Safety**: Shared schema ensures consistency between frontend and backend
- **Database Sync**: `npm run db:push` applies schema changes during development

## Notable Design Decisions

1. **Monorepo Structure**: Shared types between client and server reduce duplication and improve type safety
2. **Serverless Database**: Neon PostgreSQL chosen for automatic scaling and zero-maintenance
3. **Component Library**: shadcn/ui provides consistent, accessible components while remaining customizable
4. **State Management**: TanStack Query handles server state, eliminating need for complex client state management
5. **Authentication**: Simple token-based admin auth suitable for single-admin scenarios
6. **Theme System**: CSS variables with class-based switching provides smooth transitions and persistence