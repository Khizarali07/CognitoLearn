# CognitoLearn - Video Course & Book Management Platform

A comprehensive learning management system built with Next.js 15, featuring video course management with Google Drive integration and PDF book reader with progress tracking.

## 🚀 Features

### 📚 Course Management

- **Create Courses**: Add courses from local video files or Google Drive folders
- **Video Player**: Built-in video player with progress tracking
- **Progress Tracking**: Automatically tracks completed videos and course progress
- **Google Drive Integration**: Seamlessly fetch and play videos from Google Drive
- **Course Dashboard**: View all courses with completion statistics

### 📖 Book Management

- **PDF Upload**: Upload and manage PDF books (up to 20MB)
- **PDF Reader**: Built-in PDF reader with zoom controls
- **Reading Progress**: Track reading progress per book (page number and percentage)
- **Text Highlighting**: Mark and save important text while reading
- **Resume Reading**: Automatically resume from where you left off
- **Local Storage**: Books are stored locally in `/public/uploads/books/`

### 🔐 Authentication

- **Secure Authentication**: JWT-based authentication with HTTP-only cookies
- **User Registration**: Email-based registration with password hashing (bcrypt)
- **Login System**: Secure login with session management
- **Password Reset**: Email-based password reset functionality
- **Protected Routes**: Middleware protection for authenticated routes

### 📊 Dashboard

- **Overview Stats**: View total courses, books, and completion statistics
- **Quick Access**: Quick links to continue courses and books
- **Progress Visualization**: See completion progress at a glance

## 🛠️ Tech Stack

### Frontend

- **Next.js 15**: React framework with App Router
- **React 19**: Latest React features
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Modern utility-first CSS framework
- **React Hot Toast**: Beautiful toast notifications
- **React PDF**: PDF rendering library

### Backend

- **Next.js Server Actions**: Server-side logic without API routes
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT (jose)**: Secure token-based authentication
- **bcryptjs**: Password hashing
- **Nodemailer**: Email sending functionality
- **Google APIs**: Google Drive integration for videos

### Storage

- **Local File Storage**: Books stored in `/public/uploads/books/`
- **Google Drive**: Video files from Google Drive folders
- **MongoDB**: User data, course metadata, and progress tracking

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB (local, Docker, or MongoDB Atlas)
- Gmail account for email functionality (SMTP)
- Google Cloud Console account (for Google Drive integration - optional for videos only)

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
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/course-platform

# JWT Secret (use a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=your-email@gmail.com

# Local media streaming (for local video files)
# Windows example: LOCAL_MEDIA_ROOTS=C:\\Users\\YourName\\Videos
# Linux/Mac example: LOCAL_MEDIA_ROOTS=/home/yourname/Videos
LOCAL_MEDIA_ROOTS=

# Google Drive Configuration (OPTIONAL - for video courses only)
GOOGLE_DRIVE_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Key_Here\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
```

### 4. MongoDB Setup

#### Option A: MongoDB Atlas (Recommended)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string and add it to `.env.local`

#### Option B: Local MongoDB

```bash
# Install MongoDB locally or use Docker
docker-compose up -d
```

### 5. Email Configuration

For password reset functionality, you need a Gmail app password:

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable 2-Factor Authentication
3. Generate an App Password for "Mail"
4. Use this password in `SMTP_PASS` in `.env.local`

### 6. Google Drive Setup (Optional - For Video Courses)

To use Google Drive for video storage:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Drive API
4. Create a Service Account
5. Generate and download JSON key
6. Share your Google Drive folder with the service account email
7. Add credentials to `.env.local`

**Note**: Google Drive integration is only for video courses. Books use local storage.

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

## 📁 Project Structure

```
Course-app/
├── actions/              # Server actions
│   ├── auth.ts          # Authentication actions
│   ├── books.ts         # Book management actions
│   ├── course.ts        # Single course actions
│   └── courses.ts       # Courses list actions
├── app/                 # Next.js App Router
│   ├── (auth)/         # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (main)/         # Main application pages
│   │   ├── dashboard/  # Dashboard overview
│   │   ├── courses/    # Courses list
│   │   ├── course/[id]/ # Course video player
│   │   ├── books/      # Books list
│   │   ├── books/[id]/ # Book PDF reader
│   │   └── create-course/
│   ├── api/            # API routes
│   │   ├── health/     # Health check
│   │   └── uploads/    # File serving
│   ├── actions/        # Client-side actions
│   ├── globals.css     # Global styles
│   └── layout.tsx      # Root layout
├── components/          # React components
│   ├── AppSidebar.tsx
│   ├── CourseCard.tsx
│   ├── DeleteConfirmModal.tsx
│   ├── FolderPicker.tsx
│   ├── ToastProvider.tsx
│   ├── VideoSidebar.tsx
│   └── auth/           # Auth components
├── lib/                # Utilities
│   ├── auth.ts         # Auth utilities
│   ├── email.ts        # Email utilities
│   ├── mongoose.ts     # MongoDB connection
│   ├── googleDrive.ts  # Google Drive utilities
│   └── google-drive-service.ts
├── models/             # Mongoose models
│   ├── User.ts
│   ├── Course.ts
│   ├── Video.ts
│   ├── Book.ts
│   └── PasswordReset.ts
├── middleware.ts       # Auth middleware
├── public/
│   └── uploads/
│       └── books/      # Uploaded PDF books
└── package.json

```

## 🎯 Usage Guide

### 1. Creating an Account

1. Navigate to `/signup`
2. Enter your name, email, and password
3. Check your email for verification (if email is configured)
4. Login with your credentials

### 2. Adding a Course

#### From Local Files:

1. Click "Create Course" in the sidebar
2. Select "Local Files"
3. Enter course title
4. Provide the folder path containing video files
5. Click "Create Course"

#### From Google Drive:

1. Click "Create Course" in the sidebar
2. Select "Google Drive"
3. Enter course title
4. Paste the Google Drive folder URL
5. Click "Create Course"

### 3. Watching Videos

1. Go to "My Courses"
2. Click on a course card
3. Select a video from the sidebar
4. Watch the video - progress is automatically saved
5. Navigate between videos using the sidebar

### 4. Adding Books

1. Go to "My Books"
2. Click "Upload Book"
3. Enter book title
4. Select a PDF file (max 20MB)
5. Click "Upload"

### 5. Reading Books

1. Go to "My Books"
2. Click on a book card
3. Use zoom controls to adjust view
4. Navigate with Previous/Next buttons
5. Select text to highlight important passages
6. Your progress is automatically saved

## 🔧 Configuration

### Allowed Video Formats

- MP4
- WebM
- OGG
- AVI
- MKV
- MOV

### Book Limitations

- Format: PDF only
- Maximum size: 20MB per file
- Storage: Local filesystem

### Security Features

- JWT tokens stored in HTTP-only cookies
- Password hashing with bcrypt (10 rounds)
- CSRF protection via middleware
- Protected API routes
- Input validation and sanitization

## 🐛 Troubleshooting

### Videos Not Playing

- Check `LOCAL_MEDIA_ROOTS` path in `.env.local`
- Ensure video files are in supported formats
- For Google Drive: Verify service account permissions

### Books Not Uploading

- Check file size (max 20MB)
- Ensure file is a valid PDF
- Verify `public/uploads/books/` directory exists and is writable

### Authentication Issues

- Clear browser cookies
- Check `JWT_SECRET` in `.env.local`
- Verify MongoDB connection

### Email Not Sending

- Verify Gmail app password
- Check SMTP settings in `.env.local`
- Ensure 2FA is enabled on Gmail account

## 📊 Database Schema

### User Model

```typescript
{
  name: string
  email: string (unique)
  password: string (hashed)
  courses: ObjectId[] (ref: Course)
  books: ObjectId[] (ref: Book)
  createdAt: Date
  updatedAt: Date
}
```

### Course Model

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

### Video Model

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

### Book Model

```typescript
{
  title: string
  ownerId: ObjectId (ref: User)
  fileName: string
  fileUrl: string
  fileSize: number
  totalPages: number
  currentPage: number
  lastReadPosition: {
    page: number
    scrollTop: number
    highlightedText: string
  }
  progress: number (0-100)
  isCompleted: boolean
  createdAt: Date
  updatedAt: Date
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

**Khizar Ali**

- GitHub: [@Khizarali07](https://github.com/Khizarali07)
- Repository: [CognitoLearn](https://github.com/Khizarali07/CognitoLearn)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- MongoDB for the database
- Google for Drive API
- React PDF for PDF rendering
- All open-source contributors

## 📞 Support

For issues and questions:

- Open an issue on [GitHub](https://github.com/Khizarali07/CognitoLearn/issues)
- Check existing documentation in the repository

---

**Note**: This is an educational project. Please ensure you have proper permissions for any content you upload or share through this platform.
