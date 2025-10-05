# 📚 CognitoLearn - Modern Learning Management Platform

A full-featured learning management system built with **Next.js 15**, featuring video course management with Google Drive integration and a professional PDF book reader with annotations, built on **Appwrite** for backend services.

## ✨ Features

### 🎥 Video Course Management

- **Multi-Source Support**: Upload local videos or connect Google Drive folders
- **Video Player**: Built-in player with progress tracking and resume capability
- **Auto Progress**: Tracks completed videos and overall course completion
- **Google Drive Integration**: Seamlessly fetch and stream videos from Google Drive
- **Course Dashboard**: Visual overview of all courses with completion stats
- **Sidebar Navigation**: Easy video switching with completion indicators

### 📖 Professional Book Reader (Powered by Appwrite)

- **PDF Upload**: Upload PDF books up to 20MB via Appwrite Storage
- **Advanced PDF Viewer**: Powered by `@react-pdf-viewer` with full controls:
  - Page navigation (Previous/Next/Jump to page)
  - Zoom controls with smooth transitions
  - Search within document
  - Download and print support
  - Multiple view modes (single page, scrolling, spread)
  - Keyboard shortcuts
- **Text Annotations**: Select text to create and save highlights
- **Bookmark System**: Manually bookmark your current page to remember where you stopped
- **Auto-Resume**: Automatically opens at your last read page
- **Progress Tracking**: Real-time progress bar and completion percentage
- **Annotations Panel**: View all your highlights with "Go to Page" functionality
- **Delete Annotations**: Remove highlights you no longer need with one click
- **Auto-Save**: Progress saves every 2 seconds automatically
- **Secure Storage**: Books and annotations stored in Appwrite Cloud

### 🔐 Secure Authentication

- **JWT Authentication**: Secure token-based auth with HTTP-only cookies
- **Password Hashing**: bcrypt encryption for secure password storage
- **Email-Based Reset**: Password reset via email with secure tokens
- **Session Management**: Automatic token validation and renewal
- **Route Protection**: Middleware guards all protected routes
- **MongoDB User Store**: Scalable user data management

### 📊 Comprehensive Dashboard

- **Statistics Overview**: Total courses, books, and completion rates
- **Quick Access**: Continue where you left off (courses & books)
- **Visual Progress**: Completion indicators and percentages
- **Recent Activity**: See your latest learning interactions

## 🏗️ Tech Stack

### Frontend

- **Next.js 15.5.4**: React framework with App Router
- **React 19.1.0**: Latest React with concurrent features
- **TypeScript**: Full type safety throughout the codebase
- **Tailwind CSS 4**: Modern utility-first styling
- **React Hot Toast**: Beautiful toast notifications
- **@react-pdf-viewer**: Professional PDF rendering
  - `@react-pdf-viewer/core` - Core PDF viewer engine
  - `@react-pdf-viewer/default-layout` - Full-featured layout plugin
  - `pdfjs-dist@3.11.174` - Stable PDF.js worker

### Backend & Services

- **Appwrite Cloud**: Backend-as-a-Service (BaaS)
  - **Database**: Book metadata and annotations storage
  - **Storage**: Secure PDF file hosting (20MB per file)
  - **Collections**: Books and Annotations with user isolation
  - **API**: RESTful endpoints with SDK
- **MongoDB Atlas**: User authentication and course data
- **Mongoose**: MongoDB ODM with schema validation
- **JWT (jose)**: Token generation and verification
- **bcryptjs**: Password hashing and verification
- **Nodemailer**: Email sending functionality

### Video & Media

- **Google Drive API**: Video storage and streaming
- **googleapis**: Google API client library
- **Local File Support**: Alternative to Google Drive

### Storage Architecture

- **Books**: Appwrite Storage (cloud-based, secure)
- **Videos**: Google Drive or local filesystem
- **User Data**: MongoDB Atlas
- **Session Data**: HTTP-only cookies

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB (local, Docker, or MongoDB Atlas)
- **Appwrite Cloud** account (or self-hosted Appwrite)
- Gmail account for email functionality (SMTP)
- Google Cloud Console account (optional, for Google Drive video integration)

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Khizarali07/CognitoLearn.git
cd CognitoLearn
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cognitolearn

# JWT Secret (use a strong random string - minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-32chars

# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-appwrite-project-id
NEXT_APPWRITE_KEY=your-appwrite-api-key

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=your-email@gmail.com

# Local media streaming (optional - for local video files)
# Windows example: LOCAL_MEDIA_ROOTS=C:\\Users\\YourName\\Videos
# Linux/Mac example: LOCAL_MEDIA_ROOTS=/home/yourname/Videos
LOCAL_MEDIA_ROOTS=

# Google Drive Configuration (OPTIONAL - for video courses only)
GOOGLE_DRIVE_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Key_Here\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
```

### 4. Appwrite Setup

#### Create Appwrite Account

1. Sign up at [Appwrite Cloud](https://cloud.appwrite.io) (recommended) or [self-host](https://appwrite.io/docs/advanced/self-hosting)

#### Create Project

1. Create a new project named **CognitoLearn**
2. Copy the **Project ID** and add to `.env.local` as `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
3. Note the **API Endpoint** (usually `https://fra.cloud.appwrite.io/v1` or your self-hosted URL)

#### Create API Key

1. Go to **Settings** → **API Keys**
2. Create a new API key with:
   - Name: `Server Key`
   - Scopes: Select **All** permissions
3. Copy the key and add to `.env.local` as `NEXT_APPWRITE_KEY`

#### Create Database

1. Go to **Databases** → Click **Create Database**
2. Database ID: `cognitolearn-db`
3. Database Name: `CognitoLearn Database`

#### Create Collections

**Collection 1: Books**

- Collection ID: `books`
- Collection Name: `Books`
- Permissions: Document-level (users can only access their own books)
- Attributes:
  - `userId` (String, 255 chars, required)
  - `title` (String, 255 chars, required)
  - `storageId` (String, 255 chars, required)
  - `currentPage` (Integer, default: 1, required)
  - `totalPages` (Integer, default: 0)
  - `progress` (Float, default: 0)

**Collection 2: Annotations**

- Collection ID: `annotations`
- Collection Name: `Annotations`
- Permissions: Document-level (users can only access their own annotations)
- Attributes:
  - `bookId` (String, 255 chars, required)
  - `userId` (String, 255 chars, required)
  - `pageNumber` (Integer, required)
  - `selectedText` (String, 2000 chars, required)
  - `color` (String, 50 chars, default: "yellow")

#### Create Storage Bucket

1. Go to **Storage** → Click **Create Bucket**
2. Bucket ID: `user_pdfs`
3. Bucket Name: `User PDFs`
4. Max File Size: `20971520` (20MB in bytes)
5. Allowed File Extensions: `pdf`
6. Enable **File Security** (users can only access their own files)
7. Permissions: Set to allow authenticated users to create/read/update/delete their own files

### 5. MongoDB Setup

#### Option A: MongoDB Atlas (Recommended)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (M0 Sandbox is free)
3. Create a database user with username/password
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and add it to `.env.local`

#### Option B: Local MongoDB

```bash
# Install MongoDB locally or use Docker
docker-compose up -d
```

### 6. Email Configuration

For password reset functionality, you need a Gmail app password:

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable 2-Factor Authentication
3. Generate an App Password for "Mail"
4. Use this password in `SMTP_PASS` in `.env.local`

### 7. Google Drive Setup (Optional - For Video Courses)

To use Google Drive for video storage:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Drive API
4. Create a Service Account
5. Generate and download JSON key
6. Share your Google Drive folder with the service account email
7. Add credentials to `.env.local`

**Important**: Google Drive integration is only for video courses. Books use Appwrite Storage.

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

### Build Statistics

- **Total Routes**: 16
- **Server Actions**: 8
- **Book Reader Bundle**: 164 KB
- **First Load JS**: ~102 KB (shared)
- **Build Time**: ~9 seconds

## 📁 Project Structure

```
CognitoLearn/
├── actions/              # Server actions
│   ├── auth.ts          # Authentication (login, signup, password reset)
│   ├── bookActions.ts   # Book management & annotations (Appwrite)
│   ├── course.ts        # Single course actions
│   └── courses.ts       # Courses list actions
├── app/                 # Next.js App Router
│   ├── (auth)/         # Authentication pages
│   │   ├── login/      # Login page
│   │   ├── signup/     # Registration page
│   │   ├── forgot-password/ # Password reset request
│   │   └── reset-password/  # Password reset form
│   ├── (main)/         # Main application pages
│   │   ├── dashboard/  # Dashboard overview with stats
│   │   ├── courses/    # Courses list
│   │   ├── course/[id]/ # Course video player with sidebar
│   │   ├── books/      # Books list
│   │   ├── book/[id]/  # Book PDF reader (Appwrite-powered)
│   │   └── create-course/ # Course creation form
│   ├── api/            # API routes
│   │   ├── health/     # Health check endpoint
│   │   └── local-media/ # Local video file streaming
│   ├── globals.css     # Global styles
│   └── layout.tsx      # Root layout with providers
├── components/          # React components
│   ├── AppSidebar.tsx  # Main navigation sidebar
│   ├── CourseCard.tsx  # Course display card
│   ├── DeleteConfirmModal.tsx # Deletion confirmation dialog
│   ├── FolderPicker.tsx # Google Drive folder picker
│   ├── ToastProvider.tsx # Toast notification provider
│   ├── VideoSidebar.tsx # Course video navigation
│   └── auth/           # Auth-related components
│       ├── LoginForm.tsx
│       ├── SignUpForm.tsx
│       ├── ForgotPasswordForm.tsx
│       └── ResetPasswordForm.tsx
├── lib/                # Utility libraries
│   ├── appwrite.ts     # Appwrite client configuration
│   ├── auth.ts         # JWT auth utilities
│   ├── email.ts        # Email sending utilities
│   ├── mongoose.ts     # MongoDB connection
│   ├── googleDrive.ts  # Google Drive API integration
│   └── google-drive-service.ts # Drive service layer
├── models/             # Mongoose database models
│   ├── User.ts         # User authentication model
│   ├── Course.ts       # Course metadata model
│   ├── Video.ts        # Video metadata model
│   ├── Book.ts         # Book metadata (minimal, Appwrite primary)
│   └── PasswordReset.ts # Password reset tokens
├── types/              # TypeScript type definitions
│   └── global.d.ts     # Global type declarations
├── middleware.ts       # Auth middleware for route protection
├── .env.local          # Environment variables (git-ignored)
├── next.config.ts      # Next.js configuration
├── tailwind.config.ts  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## 🎯 Usage Guide

### 1. Creating an Account

1. Navigate to `/signup`
2. Enter your name, email, and password (minimum 6 characters)
3. Click "Sign Up"
4. You'll be automatically logged in

### 2. Adding Video Courses

#### From Local Files:

1. Click "Create Course" in the sidebar
2. Select "Local Files"
3. Enter course title
4. Provide the absolute folder path containing video files (e.g., `C:\Videos\MyCourseName`)
5. Click "Create Course"

#### From Google Drive:

1. Click "Create Course" in the sidebar
2. Select "Google Drive"
3. Enter course title
4. Paste the Google Drive folder URL or folder ID
5. Click "Create Course"
6. Videos will be fetched and displayed automatically

### 3. Watching Video Courses

1. Go to "My Courses" from the dashboard
2. Click on a course card
3. Select a video from the left sidebar
4. Watch the video - progress is automatically tracked
5. Videos you've completed show a checkmark
6. Navigate between videos using the sidebar
7. Your progress saves automatically

### 4. Uploading Books

1. Go to "My Books" from the dashboard
2. Click the "Upload Book" button
3. Enter the book title
4. Click "Choose File" and select a PDF (max 20MB)
5. Click "Upload Book"
6. Wait for the upload to complete
7. Your book appears in the books list

### 5. Reading Books

**Opening a Book:**

1. Go to "My Books"
2. Click on a book card
3. The PDF reader opens with professional controls

**Reader Features:**

- **Navigate Pages**: Use Previous/Next buttons, or the page input box
- **Zoom**: Click +/- buttons or use the zoom slider
- **Search**: Use the search icon to find text in the document
- **Download**: Download the original PDF file
- **Print**: Print pages directly from the reader
- **View Modes**: Switch between single page, scrolling, or spread view

**Creating Annotations:**

1. Select text with your mouse
2. The highlighted text saves automatically
3. View all annotations in the right panel

**Using Annotations:**

- **Go to Page**: Click "Go to page" button next to an annotation to jump directly to that page
- **Delete Annotation**: Click the trash icon to remove a highlight
- **View All**: Scroll through all your annotations in the panel

**Bookmark Feature:**

1. Click the green bookmark button at the top while reading
2. Your current page is saved
3. Next time you open the book, it opens at your bookmarked page

**Auto-Save:**

- Progress saves automatically every 2 seconds
- Book remembers your last page
- Annotations sync instantly to Appwrite

## 🔧 Configuration

### Customizing Server Actions

Edit `next.config.ts` to adjust file upload limits:

```typescript
experimental: {
  serverActions: {
    bodySizeLimit: "25mb", // Increase if needed (default: 20mb)
  },
},
```

### PDF Worker Configuration

The PDF.js worker is loaded from CDN in `app/(main)/book/[id]/page.tsx`:

```typescript
<Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
```

To use a local worker, download and serve it from `/public/`.

### Allowed Video Formats

Supported formats for courses:

- MP4 (recommended)
- WebM
- OGG
- AVI
- MKV
- MOV
- M4V

### Book Limitations

- **Format**: PDF only
- **Maximum size**: 20MB per file
- **Storage**: Appwrite Cloud Storage
- **Annotations**: Unlimited per book
- **Worker**: pdfjs-dist@3.11.174 (stable)

### Security Features

- **JWT Tokens**: Stored in HTTP-only cookies (secure, httpOnly, sameSite)
- **Password Hashing**: bcrypt with 10 salt rounds
- **CSRF Protection**: Via middleware and cookie settings
- **Route Protection**: Middleware guards all `/dashboard`, `/courses`, `/books`, `/course/*`, `/book/*` routes
- **Input Validation**: Server-side validation in all actions
- **File Security**: Appwrite bucket with user-level permissions

### Environment Variables Reference

| Variable                          | Required | Description                           |
| --------------------------------- | -------- | ------------------------------------- |
| `MONGODB_URI`                     | Yes      | MongoDB connection string             |
| `JWT_SECRET`                      | Yes      | Secret for JWT signing (min 32 chars) |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT`   | Yes      | Appwrite API endpoint                 |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | Yes      | Appwrite project ID                   |
| `NEXT_APPWRITE_KEY`               | Yes      | Appwrite API key                      |
| `SMTP_HOST`                       | Optional | SMTP server (for password reset)      |
| `SMTP_PORT`                       | Optional | SMTP port (usually 587)               |
| `SMTP_USER`                       | Optional | Email address                         |
| `SMTP_PASS`                       | Optional | Email password/app password           |
| `SMTP_FROM`                       | Optional | From email address                    |
| `LOCAL_MEDIA_ROOTS`               | Optional | Path for local video files            |
| `GOOGLE_DRIVE_CLIENT_EMAIL`       | Optional | Google service account email          |
| `GOOGLE_DRIVE_PRIVATE_KEY`        | Optional | Google service account key            |
| `GOOGLE_DRIVE_FOLDER_ID`          | Optional | Default Google Drive folder           |

## 🐛 Troubleshooting

### PDF Reader Issues

**PDFs Not Loading:**

- Check Appwrite Storage bucket exists (`user_pdfs`)
- Verify file was uploaded successfully (check Appwrite dashboard)
- Check browser console for CORS errors
- Ensure `storageId` is valid in book record
- Try clearing browser cache

**Annotations Not Saving:**

- Verify Appwrite annotations collection exists
- Check user authentication (try logging out and in)
- Ensure collection permissions allow user to create documents
- Check browser console for API errors

**"Go to Page" Not Working:**

- This is now fixed using the `key` prop to force PDF re-render
- If still issues, try refreshing the page
- Check that `pageNumber` in annotation is valid

**Bookmark Not Saving:**

- Ensure you're authenticated
- Check Appwrite connection in browser console
- Verify book exists in Appwrite database

### Video Course Issues

**Videos Not Playing:**

- **Local Files**:
  - Check `LOCAL_MEDIA_ROOTS` path in `.env.local`
  - Ensure path is absolute (e.g., `C:\\Videos` on Windows)
  - Verify video files exist at the path
  - Check video format is supported
- **Google Drive**:
  - Verify service account credentials in `.env.local`
  - Check service account has access to the folder
  - Ensure files are video files (not shortcuts)
  - Try playing video directly in Google Drive

**Course Creation Fails:**

- Check MongoDB connection
- Verify user is authenticated
- For Google Drive: Check folder ID is correct
- For local: Verify folder path exists and contains videos

### Authentication Issues

**Can't Login:**

- Verify MongoDB is running and accessible
- Check `MONGODB_URI` in `.env.local`
- Try clearing browser cookies
- Check `JWT_SECRET` is set correctly
- Look for errors in server console

**Password Reset Not Working:**

- Verify email configuration in `.env.local`
- Check Gmail 2FA is enabled and app password is correct
- Check SMTP settings (host, port, user, pass)
- Look for errors in server logs
- Test with: `nodemailer.createTestAccount()` first

**Session Expires Immediately:**

- Check `JWT_SECRET` matches between requests
- Verify cookies are being set (check browser DevTools → Application → Cookies)
- Ensure middleware is not blocking auth routes
- Check `sameSite` cookie setting

### Appwrite Connection Issues

**"Invalid API Key" Error:**

- Verify `NEXT_APPWRITE_KEY` in `.env.local`
- Check API key in Appwrite dashboard hasn't been revoked
- Ensure key has all required permissions

**"Collection Not Found" Error:**

- Verify collection IDs match: `books` and `annotations`
- Check database ID is `cognitolearn-db`
- Ensure collections have correct attributes

**"Bucket Not Found" Error:**

- Verify bucket ID is `user_pdfs`
- Check bucket exists in Appwrite dashboard
- Ensure bucket file security is enabled

### Build Issues

**TypeScript Errors:**

- Run `npm run build` to see all errors
- Check for missing type definitions
- Ensure all `params` in Next.js 15 are typed as `Promise<{ id: string }>`

**Module Not Found:**

- Run `npm install` to ensure all dependencies are installed
- Clear Next.js cache: `rm -rf .next` or `rmdir /s .next` (Windows)
- Check import paths are correct

**Large Bundle Size:**

- Current book reader: 164 KB (acceptable)
- Use `npm run build` to see bundle analysis
- Consider code splitting for large pages

### General Debugging

**Enable Verbose Logging:**

```bash
# In terminal when running dev server
DEBUG=* npm run dev
```

**Check Server Logs:**

- Look at terminal where `npm run dev` is running
- Server actions log to console
- Appwrite errors show in browser console

**Clear Everything:**

```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules and reinstall
rm -rf node_modules
npm install

# Clear browser data
# DevTools → Application → Clear storage
```

## 📊 Database Schema

### MongoDB Collections

#### User Model (MongoDB)

```typescript
{
  name: string
  email: string (unique, indexed)
  password: string (bcrypt hashed)
  courses: ObjectId[] (ref: Course)
  createdAt: Date
  updatedAt: Date
}
```

#### Course Model (MongoDB)

```typescript
{
  title: string
  ownerId: ObjectId (ref: User)
  sourceType: 'local' | 'google-drive'
  sourcePathOrLink: string
  videos: ObjectId[] (ref: Video)
  totalVideos: number
  completedVideos: number
  createdAt: Date
  updatedAt: Date
}
```

#### Video Model (MongoDB)

```typescript
{
  title: string
  courseId: ObjectId (ref: Course)
  videoUrl: string
  duration: number
  order: number
  isCompleted: boolean
  watchedDuration: number
  lastWatchedAt: Date
}
```

#### Book Model (MongoDB - Minimal)

```typescript
{
  title: string
  ownerId: ObjectId (ref: User)
  // Note: Main book data stored in Appwrite
}
```

### Appwrite Collections

#### Books Collection (Appwrite)

```typescript
{
  $id: string (auto-generated)
  userId: string (matches MongoDB User._id)
  title: string
  storageId: string (Appwrite Storage file ID)
  currentPage: number (default: 1)
  totalPages: number (default: 0)
  progress: number (0-100, default: 0)
  $createdAt: string (ISO date)
  $updatedAt: string (ISO date)
}
```

#### Annotations Collection (Appwrite)

```typescript
{
  $id: string (auto-generated)
  bookId: string (ref: Books.$id)
  userId: string (matches MongoDB User._id)
  pageNumber: number
  selectedText: string (2000 char limit)
  color: string (default: "yellow")
  $createdAt: string (ISO date)
  $updatedAt: string (ISO date)
}
```

### Appwrite Storage

#### user_pdfs Bucket

- **Bucket ID**: `user_pdfs`
- **Max File Size**: 20MB (20971520 bytes)
- **Allowed Extensions**: `pdf`
- **File Security**: Enabled (user-level access)
- **Compression**: Disabled
- **Encryption**: Enabled by Appwrite

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/cognitolearn.git
   git push -u origin main
   ```

2. **Connect to Vercel**:

   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel auto-detects Next.js

3. **Add Environment Variables**:

   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all variables from your `.env.local`:
     - `MONGODB_URI`
     - `JWT_SECRET`
     - `NEXT_PUBLIC_APPWRITE_ENDPOINT`
     - `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
     - `NEXT_APPWRITE_KEY`
     - Plus any optional variables (SMTP, Google Drive)

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Your app is live!

### Deploy to Other Platforms

#### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and init
railway login
railway init
railway up
```

#### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

#### Self-Hosted (Docker)

```bash
# Build production image
docker build -t cognitolearn .

# Run container
docker run -p 3000:3000 --env-file .env.local cognitolearn
```

### Production Checklist

- [ ] Set strong `JWT_SECRET` (min 32 characters)
- [ ] Use MongoDB Atlas production cluster
- [ ] Configure Appwrite for production
- [ ] Add production domain to Appwrite allowed origins
- [ ] Enable email for password reset (SMTP configured)
- [ ] Set secure cookie settings in production
- [ ] Test all features in production
- [ ] Monitor error logs
- [ ] Set up backups for MongoDB
- [ ] Configure CDN for static assets (optional)

## 📦 Dependencies

### Core Dependencies

```json
{
  "next": "15.5.4",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "appwrite": "^21.0.0",
  "node-appwrite": "^20.0.0",
  "@react-pdf-viewer/core": "^3.x",
  "@react-pdf-viewer/default-layout": "^3.x",
  "pdfjs-dist": "3.11.174",
  "mongodb": "^6.20.0",
  "mongoose": "^8.18.2",
  "jose": "^6.1.0",
  "bcryptjs": "^3.0.2",
  "googleapis": "^105.0.0",
  "react-hot-toast": "^2.6.0",
  "nodemailer": "^6.9.0"
}
```

### Dev Dependencies

```json
{
  "typescript": "^5.x",
  "@types/node": "^22.x",
  "@types/react": "^19.x",
  "@types/react-dom": "^19.x",
  "@types/bcryptjs": "^2.4.6",
  "@types/nodemailer": "^6.4.0",
  "tailwindcss": "^4.0.0",
  "eslint": "^9.x",
  "eslint-config-next": "15.5.4",
  "postcss": "^9.x"
}
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the Repository**
2. **Create a Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commit Changes**: `git commit -m 'Add amazing feature'`
4. **Push to Branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript strict mode
- Use ESLint rules provided
- Write meaningful commit messages
- Test features before submitting PR
- Update documentation if needed

## 📝 License

This project is licensed under the MIT License. See LICENSE file for details.

## 👤 Author

**Khizar Ali**

- GitHub: [@Khizarali07](https://github.com/Khizarali07)
- Repository: [CognitoLearn](https://github.com/Khizarali07/CognitoLearn)
- LinkedIn: [Connect with me](https://linkedin.com/in/khizarali07)

## 🙏 Acknowledgments

- **Next.js Team** - For the incredible React framework
- **Appwrite Team** - For the excellent BaaS platform
- **@react-pdf-viewer** - For the professional PDF viewer components
- **MongoDB** - For the robust database solution
- **Google** - For Drive API integration
- **Vercel** - For seamless deployment platform
- **All Open-Source Contributors** - For making development easier

## 🔮 Future Enhancements

- [ ] Book collections/categories
- [ ] Collaborative annotations (share notes with friends)
- [ ] Video playlists and custom ordering
- [ ] Quiz system for courses with scoring
- [ ] Dark mode toggle
- [ ] Mobile app (React Native version)
- [ ] Export annotations as PDF/Markdown
- [ ] Book recommendation system based on reading history
- [ ] Discussion forums per course
- [ ] Live streaming integration
- [ ] Certificate generation on course completion
- [ ] Social features (follow users, share progress)
- [ ] Advanced search across books and courses
- [ ] Offline reading mode (PWA)
- [ ] Multi-language support (i18n)

## 📞 Support

If you encounter any issues or have questions:

1. **Check Documentation**: Read through this README thoroughly
2. **Search Issues**: Look for similar issues on GitHub
3. **Troubleshooting**: Check the [Troubleshooting](#-troubleshooting) section
4. **Open Issue**: [Create a new issue](https://github.com/Khizarali07/CognitoLearn/issues) with details
5. **Community**: Join discussions in GitHub Discussions

### Reporting Bugs

When reporting bugs, please include:

- Operating System and version
- Node.js version (`node --version`)
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Console errors

### Feature Requests

To request a feature:

- Open a GitHub issue with `[Feature Request]` prefix
- Describe the feature clearly
- Explain the use case
- Provide mockups if applicable

## 📈 Project Statistics

- **Total Routes**: 16 (11 static, 5 dynamic)
- **Build Time**: ~9 seconds
- **Largest Bundle**: 164 KB (book reader)
- **First Load JS**: ~102 KB (shared chunks)
- **Database Models**: 5 (3 MongoDB, 2 Appwrite)
- **Components**: 10+
- **Server Actions**: 8
- **API Routes**: 3

## 🔒 Security

### Reporting Security Issues

If you discover a security vulnerability, please:

- **DO NOT** open a public issue
- Email directly: security@yourproject.com (or create private security advisory)
- Provide detailed description
- Allow time for fix before disclosure

### Security Best Practices

This project implements:

- ✅ JWT tokens in HTTP-only cookies
- ✅ Password hashing with bcrypt
- ✅ CSRF protection
- ✅ Input validation
- ✅ SQL injection prevention (Mongoose ODM)
- ✅ XSS protection (React escaping)
- ✅ Secure file uploads with size limits
- ✅ User-level data isolation
- ✅ Environment variable management

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Appwrite Documentation](https://appwrite.io/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [React PDF Viewer Docs](https://react-pdf-viewer.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Built with ❤️ using Next.js 15, Appwrite, and @react-pdf-viewer**

**Last Updated**: January 2025  
**Version**: 2.0.0  
**Status**: ✅ Production Ready
