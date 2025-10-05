<!-- CognitoLearn - Project Instructions -->

# CognitoLearn - Video Course & Book Management Platform

## Project Overview

A full-featured learning management system built with Next.js 15, featuring:

- Video course management with Google Drive integration
- PDF book reader with progress tracking and text highlighting
- JWT-based authentication with password reset
- MongoDB database with Mongoose ODM
- Responsive UI with Tailwind CSS 4

## Key Technologies

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jose) + bcryptjs
- **Styling**: Tailwind CSS 4
- **PDF Rendering**: react-pdf (pdfjs-dist)
- **Video Storage**: Google Drive API (optional) or local files
- **Book Storage**: Local filesystem only

## Important Notes

### Books Feature

- Books are stored ONLY in local filesystem (`/public/uploads/books/`)
- No Google Drive or Google Cloud Storage for books
- Maximum file size: 20MB
- Supported format: PDF only
- Progress tracking includes: page number, scroll position, highlighted text

### Videos Feature

- Videos support both local files and Google Drive
- Google Drive integration works well for videos
- Local video files require `LOCAL_MEDIA_ROOTS` configuration
- Progress tracking: watched duration, completion status

### Code Quality

- TypeScript strict mode enabled
- ESLint configured for Next.js
- Server actions for data mutations
- HTTP-only cookies for authentication
- All routes protected by middleware

## Development Guidelines

1. Use server actions for data operations
2. Keep authentication logic in `/lib/auth.ts`
3. Models in `/models/` directory
4. Components in `/components/` directory
5. Pages use App Router structure in `/app/`
6. Never store sensitive data in client components

## Recent Changes

- ✅ Removed Google Drive/GCS logic from books module
- ✅ Simplified books to use local storage only
- ✅ Cleaned up unused .md documentation files
- ✅ Updated README.md with comprehensive project documentation
- ✅ Removed test files and unused scripts
- ✅ Books model cleaned (removed gcsPath, googleDriveFileId fields)

## Project Status

✅ **Production Ready** - All core features implemented and tested
