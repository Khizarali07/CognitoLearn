# 🎓 CognitoLearn - AI-Powered Learning Management Platform

![Project Banner](public/banner.png) > *Note: Add a banner image here for visual appeal*

**CognitoLearn** is a sophisticated, next-generation Learning Management System (LMS) designed to revolutionize the way users interact with educational content. Built with the cutting-edge **Next.js 15 App Router**, it seamlessly integrates video coursework, interactive PDF reading, and AI-powered assistance into a unified, premium interface.

This platform bridges the gap between static content and interactive learning by combining a robust video player (supporting Google Drive & Local storage) with an advanced PDF reader that features inline AI explanations, smart bookmarks, and a conversational AI assistant that "reads" the book with you.

---

## ✨ Key Features & Highlights

### 🧠 AI-Powered Learning Assistant (Powered by Google Gemini)
*   **Chat with Your Book**: Engage in a natural conversation with an AI that understands the context of the book you're reading. Ask summaries, clarifications, or deep-dive questions.
*   **Smart "Quick Explain"**: Select any complex text within a PDF and get an instant, simplified explanation without leaving the page.
*   **Context-Aware**: The AI knows exactly which book and page you are on, providing highly relevant answers.

### 📖 Professional PDF Book Reader
*   **Advanced Rendering Engine**: Built on `@react-pdf-viewer` for pixel-perfect rendering of complex PDFs.
*   **Interactive Annotations**: Highlight important text, save notes, and manage them in a dedicated sidebar.
*   **Smart Bookmarking**: "Resume where you left off" functionality that tracks your exact page across devices.
*   **Premium Controls**: 
    *   Smooth Zoom & Pan
    *   Full-Screen "Focus Mode"
    *   Dual-Page & Scroll Views
    *   "Go to Page" Navigation
*   **Cloud Storage**: Securely hosts PDFs up to 20MB using Appwrite Cloud Storage.

### 🎥 Modern Video Course Platform
*   **Hybrid Content Source**: Stream videos directly from **Google Drive** or your local high-performance storage.
*   **Premium Video Player**: Custom-built player interface with theater mode and distraction-free viewing.
*   **Progress Tracking**: Automatically tracks watched duration and marks videos as "Completed."
*   **Course Progress Dashboard**: Visual progress bars and percentage completion stats for every course.
*   **Smart Sidebar**: Interactive video list that shows your progress at a glance.

### 📊 Comprehensive Dashboard & UI
*   **Premium Aesthetic**: A completely redesigned "Glassmorphism" inspired UI with Tailwind CSS 4.
*   **Responsive Design**: Fully optimized for Desktop, Tablet, and Mobile experiences.
*   **Unified Dashboard**: Central hub for "My Courses," "My Books," and "Recent Activity."
*   **Real-time Stats**: Track your total learning hours, books read, and courses completed.

### 🔐 Enterprise-Grade Security
*   **Secure Authentication**: JWT-based stateless authentication with HTTP-Only cookies.
*   **Protected Routes**: Middleware-guarded routes ensure unauthorized access is impossible.
*   **Data Isolation**: User data (books, notes, progress) is strictly siloed and private.

---

## 🏗️ Technical Architecture & Modules

This project is built using a modern, scalable tech stack, ensuring high performance and developer productivity.

### Core Framework (Frontend)
*   **Next.js 15.5.4 (App Router)**: The react framework for production. content streaming, server components, and optimized routing.
*   **React 19.1.0**: Leveraging the latest concurrent features and server actions.
*   **TypeScript**: 100% type-safe codebase for robust development.
*   **Tailwind CSS 4**: Next-gen utility-first CSS for rapid, beautiful UI design.
*   **Framer Motion**: For buttery-smooth animations and transitions.

### Backend & Services (BaaS)
*   **Appwrite Cloud**: A powerhouse for backend services.
    *   **Storage**: Secure hosting for user-uploaded PDF books.
    *   **Database**: Stores book metadata, annotations, and reading progress.
*   **MongoDB Atlas**: The primary database for user profiles, authentication data, and course structures.
*   **Mongoose**: Elegant object modeling for standardizing database interactions.
*   **Google Gemini AI**: The engine behind the "Chat with Book" and "Explain This" features.

### Authentication & Security
*   **JWT (JSON Web Tokens)**: Secure, stateless session management.
*   **Bcrypt.js**: Industry-standard password hashing.
*   **Next.js Middleware**: Edge-compatible route protection.
*   **Nodemailer**: For secure email-based password resets.

### Specialized Modules
*   **@react-pdf-viewer**: The core engine for the PDF reading experience.
*   **Google Drive API**: Seamless integration for fetching private video content.
*   **React Hot Toast**: Beautiful, non-intrusive notifications.
*   **React Markdown**: For rendering rich text in AI chat responses.

---

## 🛠️ Installation & Setup Guide

Follow these steps to deploy your own instance of CognitoLearn.

### 1. Prerequisites
*   Node.js 18+ installed.
*   A **MongoDB Atlas** account (or local MongoDB).
*   An **Appwrite Cloud** account.
*   (Optional) A **Google Cloud** project for Drive integration.
*   (Optional) A **Gemini API Key** from Google AI Studio.

### 2. Clone the Repository
```bash
git clone https://github.com/Khizarali07/CognitoLearn.git
cd CognitoLearn
```

### 3. Install Dependencies
```bash
npm install
# or
yarn install
```

### 4. Configure Environment Variables
Create a `.env.local` file in the root directory and populate it with your keys:

```env
# --- Database ---
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/your-db?retryWrites=true&w=majority

# --- Security ---
JWT_SECRET=your_super_secure_random_string_32_chars+

# --- Appwrite Configuration ---
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_appwrite_project_id
NEXT_APPWRITE_KEY=your_appwrite_api_key

# --- AI (Google Gemini) ---
GOOGLE_API_KEY=your_gemini_api_key

# --- Email (SMTP for Password Reset) ---
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@cognitolearn.com

# --- Optional: Google Drive Video Source ---
GOOGLE_DRIVE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=your_root_folder_id

# --- Optional: Local Video Source ---
LOCAL_MEDIA_ROOTS=C:\Path\To\Your\Videos
```

### 5. Run the Application

**Development Mode:**
```bash
npm run dev
```
Visit `http://localhost:3000` to see your app live.

**Production Build:**
```bash
npm run build
npm start
```

---

## 🚀 Deployment

This project is optimized for deployment on **Vercel**, the creators of Next.js.

1.  Push your code to a GitHub repository.
2.  Import the project into Vercel.
3.  Add all the Environment Variables from your `.env.local` to Vercel's settings.
4.  Hit **Deploy**.

---

## 📂 Project Structure Overview

```
CognitoLearn/
├── actions/              # Server Actions (Backend Logic)
│   ├── aiActions.ts     # Google Gemini integration
│   ├── auth.ts          # Login/Signup logic
│   ├── bookActions.ts   # Book & Annotation management
│   └── courses.ts       # Course & Video logic
├── app/                  # Next.js 15 App Router
│   ├── (auth)/          # Authentication pages (Login/Signup)
│   ├── (main)/          # Main app pages (Dashboard, Courses, Books)
│   │   ├── book/[id]/   # The PDF Reader Page
│   │   └── course/[id]/ # The Video Player Page
│   └── api/             # API Routes (for external webhooks/streaming)
├── components/           # Reusable UI Components
│   ├── CourseCard.tsx   # Premium Course UI Card
│   ├── EditModal.tsx    # Universal Edit Modal
│   └── VideoSidebar.tsx # Video Playlist & Progress
├── lib/                  # Utilities & Helpers
│   ├── appwrite.ts      # Appwrite SDK Init
│   └── mongoose.ts      # DB Connection Singleton
├── models/               # Mongoose Schemas (User, Course, Video)
└── public/               # Static assets & images
```

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve CognitoLearn:

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details.

---

<div align="center">
  <p>Built with ❤️ by <b>Khizar Ali</b></p>
  <p>
    <a href="https://nextjs.org">Next.js 15</a> • 
    <a href="https://appwrite.io">Appwrite</a> • 
    <a href="https://mongodb.com">MongoDB</a> • 
    <a href="https://ai.google.dev">Gemini AI</a>
  </p>
</div>
