# 📚 Application Guide

## 🚀 Features

### 📖 PDF Reader
- **Navigation**: Use the toolbar or keyboard arrows to navigate.
- **Bookmark**: Your progress is **automatically saved** every 2 seconds and when you leave the page.
- **Go To Page**: Click "Go to page" on any annotation to jump instantly.
- **Zoom**: Use +/- buttons to adjust readability.

### ✨ Annotations & AI
- **Highlight**: Select any text to automatically save it as a note.
- **Explain with AI**: Click the **✨ Explain with AI** button on any note or selected text to get a clear definition using Google Gemini Pro.
- **Manage**: Delete notes or jump to their location easily.

## 🛠️ Setup for AI
To use the AI features, you must have a valid Google Gemini API Key.

1.  Get your key from [Google AI Studio](https://makersuite.google.com/app/apikey).
2.  Add it to your `.env.local` file:
    ```env
    GOOGLE_API_KEY=your_api_key_here
    ```

## 🐞 Troubleshooting
- **Refreshed to Page 1?**
    - Ensure you waited at least 2 seconds before refreshing.
    - If it persists, the "Resume" feature attempts to jump you back automatically.
- **AI Not Working?**
    - Check your internet connection.
    - Verify your API Key in `.env.local`.
