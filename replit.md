# CivicTrack

## Overview

CivicTrack is a community-driven civic engagement platform that empowers citizens to report local infrastructure issues like road damage, lighting problems, water leaks, and cleanliness concerns. The application provides a comprehensive solution for issue tracking, featuring geo-location-based reporting, photo uploads, community voting, and administrative oversight. Built as a full-stack TypeScript application, it combines modern web technologies to create an intuitive platform that bridges the gap between citizens and local government services.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, utilizing Vite as the build tool and development server
- **Styling**: Tailwind CSS with a custom design system featuring civic-themed color variables
- **UI Components**: shadcn/ui component library built on Radix UI primitives for accessibility and consistency
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Maps**: Custom map implementation for visualizing issue locations with status-based markers

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth integration using OpenID Connect with session-based authentication
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **File Uploads**: Multer middleware for handling photo uploads with size and type restrictions
- **API Design**: RESTful endpoints with proper error handling and request logging middleware

### Database Design
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon serverless driver
- **Schema**: Relational design with tables for users, issues, votes, flags, and status logs
- **Geospatial**: Decimal precision coordinates for location tracking
- **Indexing**: Optimized queries for location-based searches and session management

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect protocol
- **Session Management**: Secure HTTP-only cookies with PostgreSQL session store
- **Role-Based Access**: Admin privileges for issue management and analytics
- **Security**: CSRF protection, secure session configuration, and input validation

### File Management
- **Upload Handling**: Multi-part form data processing with file type validation
- **Storage**: Local file system storage with configurable upload limits
- **Image Processing**: Client-side preview generation and server-side validation

### Development Tools
- **Type Safety**: Shared TypeScript schemas between client and server
- **Validation**: Zod schemas for runtime type checking and form validation
- **Development Experience**: Hot module replacement, error overlays, and TypeScript checking
- **Code Organization**: Monorepo structure with shared types and utilities

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **WebSocket Support**: Real-time database connections via WebSocket constructor

### Authentication Services
- **Replit Auth**: OpenID Connect authentication provider
- **Session Management**: PostgreSQL-backed session storage for scalability

### Development & Deployment
- **Replit Platform**: Integrated development environment with deployment capabilities
- **Vite Plugins**: Runtime error overlays and development tooling integration

### UI & Styling
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide Icons**: Consistent icon library for user interface elements

### Form & Data Handling
- **React Hook Form**: Performant form management with validation
- **TanStack Query**: Server state management with caching and synchronization
- **Zod**: Schema validation for type safety across the application

### File Processing
- **Multer**: Middleware for handling multipart/form-data file uploads
- **File System**: Node.js built-in modules for file operations and storage