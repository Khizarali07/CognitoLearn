# Video Course Platform

A full-stack Next.js application for managing and consuming video courses with support for local files and Google Drive integration.

## Features

- **User Authentication**: Secure signup/login system with password hashing
- **Course Management**: Create courses from local video folders or Google Drive links
- **Video Player**: Responsive video player with progress tracking
- **Progress Tracking**: Mark videos as complete and track course progress
- **Beautiful UI**: Modern design with Tailwind CSS
- **Database**: MongoDB with Mongoose for data persistence

## Technology Stack

- **Frontend**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Custom authentication with bcryptjs
- **TypeScript**: Full TypeScript support

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local, Docker, or cloud instance)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up MongoDB (Choose one option):

   **Option A: MongoDB Atlas (Recommended)**

   - Free cloud database, no local installation required
   - Follow instructions in `MONGODB_SETUP.md`
   - Or use the setup helper: `node setup-mongodb.js`

   **Option B: Docker (Easiest local setup)**

   ```bash
   docker-compose up -d
   ```

   This starts MongoDB and Mongo Express UI at http://localhost:8081

   **Option C: Local MongoDB Installation**

   - Install MongoDB Community Server
   - Start MongoDB service
   - Use connection string: `mongodb://localhost:27017/course-platform`

4. Set up environment variables:
   Copy `.env.local.example` to `.env.local` and update the MongoDB URI:

   ```env
   # Choose the appropriate connection string based on your MongoDB setup
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/course-platform
   JWT_SECRET=your-super-secret-jwt-key
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-key-here

   # Email configuration for password reset
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=your-email@gmail.com
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── login/             # Login page
│   ├── signup/            # Registration page
│   ├── dashboard/         # User dashboard
│   ├── create-course/     # Course creation
│   └── course/[id]/       # Course viewer
├── actions/               # Server actions
│   ├── auth.ts           # Authentication actions
│   └── course.ts         # Course management actions
├── components/            # Reusable components
│   ├── CourseCard.tsx    # Course display card
│   └── VideoSidebar.tsx  # Video navigation sidebar
├── lib/                   # Utility libraries
│   ├── mongoose.ts       # Database connection
│   ├── auth.ts           # Authentication helpers
│   └── google-drive-service.ts # Google Drive integration
├── models/                # Mongoose schemas
│   ├── User.ts           # User model
│   ├── Course.ts         # Course model
│   └── Video.ts          # Video model
└── types/                 # TypeScript type definitions
```

## Usage

### Creating an Account

1. Visit the signup page
2. Enter your name, email, and password
3. Click "Create Account"

### Creating a Course

1. Log in to your account
2. Click "Create New Course" from the dashboard
3. Enter a course title
4. Choose your video source:
   - **Local Folder**: Enter the absolute path to your video folder
   - **Google Drive**: Paste a shareable Google Drive folder link
5. Click "Create Course"

### Watching Videos

1. Click on a course from your dashboard
2. Select a video from the sidebar
3. Use the video player controls
4. Mark videos as complete when finished

## Important Notes

### Local Video Files

- Local video files require the exact folder path to remain unchanged
- Videos are only accessible on the device where the path exists
- Consider using Google Drive for better accessibility

### Google Drive Integration

- Currently uses placeholder implementation
- In production, implement Google Drive API integration
- Ensure proper authentication and permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue on the GitHub repository.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
