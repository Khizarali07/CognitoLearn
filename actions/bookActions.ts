"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import fs from "fs/promises";
import path from "path";
import { connectToDB } from "@/lib/mongoose";
import Book from "@/models/Book";
import Annotation from "@/models/Annotation";
import mongoose from "mongoose";

// Helper function to get current user ID from JWT
export async function getCurrentUserId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    throw new Error("Unauthorized: No token found");
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    if (!payload || !payload.userId) {
      throw new Error("Unauthorized: Invalid token");
    }

    return payload.userId as string;
  } catch (error) {
    throw new Error("Unauthorized: Token verification failed");
  }
}

/**
 * Upload a PDF book to Local Filesystem and create database entry
 */
export async function uploadBookPDF(formData: FormData) {
  try {
    await connectToDB();
    const userId = await getCurrentUserId();

    // Extract form data
    const pdfFile = formData.get("pdfFile") as File;
    const bookTitle = formData.get("bookTitle") as string;

    if (!pdfFile || !bookTitle) {
      return { success: false, error: "Missing required fields" };
    }

    // Validate file type
    if (pdfFile.type !== "application/pdf") {
      return { success: false, error: "Only PDF files are allowed" };
    }

    // Validate file size (20MB max)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (pdfFile.size > maxSize) {
      return { success: false, error: "File size must be less than 20MB" };
    }

    console.log("📤 Uploading to Local Storage:", bookTitle);

    // Determine upload directory based on environment
    // On Vercel (production), we can only write to /tmp, but those files are ephemeral.
    // For a persistent solution on Vercel, you MUST use Vercel Blob or S3.
    // However, to fix the "ENOENT" error for now, we will use /tmp if public/uploads fails.
    
    let uploadDir = path.join(process.cwd(), "public", "uploads", "books");
    let isTmp = false;

    try {
      await fs.access(uploadDir);
    } catch {
      try {
        await fs.mkdir(uploadDir, { recursive: true });
      } catch (err) {
        // Fallback to /tmp for Vercel (Note: Files will be lost on redeploy/cold start)
        console.warn("⚠️ Could not create public/uploads, falling back to /tmp");
        uploadDir = path.join("/tmp", "uploads", "books");
        await fs.mkdir(uploadDir, { recursive: true });
        isTmp = true;
      }
    }

    // Generate unique filename
    const fileId = new mongoose.Types.ObjectId().toString();
    const fileName = `${fileId}-${pdfFile.name.replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    )}`;
    const filePath = path.join(uploadDir, fileName);
    
    // If using /tmp, we need a way to serve it. 
    // Since Next.js can't serve static files from /tmp easily without a custom route,
    // we will store the absolute path and create a route to read it.
    const fileUrl = isTmp 
        ? `/api/local-media?path=${encodeURIComponent(filePath)}` 
        : `/uploads/books/${fileName}`;

    // Write file to disk
    const buffer = Buffer.from(await pdfFile.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    console.log("✅ File saved to:", filePath);

    // Create database entry
    const newBook = await Book.create({
      title: bookTitle,
      ownerId: userId,
      fileName: fileName,
      fileUrl: fileUrl,
      storagePath: filePath,
      fileSize: pdfFile.size,
      totalPages: 0, // Will be updated by client or worker
      currentPage: 1,
      uploadedAt: new Date(),
      lastAccessedAt: new Date(),
    });

    console.log("✅ Book document created:", newBook._id);

    return {
      success: true,
      bookId: newBook._id.toString(),
      title: newBook.title,
    };
  } catch (error: any) {
    console.error("Upload book error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload book",
    };
  }
}

/**
 * Get all books for the current user
 */
export async function getUserBooks() {
  try {
    await connectToDB();
    const userId = await getCurrentUserId();

    const books = await Book.find({ ownerId: userId }).sort({ createdAt: -1 });

    return {
      success: true,
      books: books.map((doc) => ({
        id: doc._id.toString(),
        title: doc.title,
        storageId: doc.fileName, // Using fileName as storageId for compatibility
        currentPage: doc.currentPage || 1,
        createdAt: doc.createdAt?.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("Get books error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch books",
      books: [],
    };
  }
}

/**
 * Get a single book by ID
 */
export async function getBookById(bookId: string) {
  try {
    await connectToDB();
    const userId = await getCurrentUserId();

    const book = await Book.findById(bookId);

    if (!book) {
      return { success: false, error: "Book not found" };
    }

    // Verify the book belongs to the current user
    if (book.ownerId.toString() !== userId) {
      return {
        success: false,
        error: "Unauthorized: This book does not belong to you",
      };
    }

    return {
      success: true,
      book: {
        id: book._id.toString(),
        title: book.title,
        storageId: book.fileName,
        currentPage: book.currentPage || 1,
        createdAt: book.createdAt?.toISOString(),
        fileUrl: book.fileUrl, // Return the URL for the frontend
      },
    };
  } catch (error: any) {
    console.error("Get book error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch book",
    };
  }
}

/**
 * Update reading progress for a book
 */
export async function updateReadingProgress(
  bookId: string,
  pageNumber: number
) {
  try {
    await connectToDB();
    const userId = await getCurrentUserId();

    const book = await Book.findOne({ _id: bookId, ownerId: userId });

    if (!book) {
      return { success: false, error: "Unauthorized or Book not found" };
    }

    book.currentPage = pageNumber;
    book.lastAccessedAt = new Date();
    await book.save();

    return { success: true };
  } catch (error: any) {
    console.error("Update progress error:", error);
    return {
      success: false,
      error: error.message || "Failed to update progress",
    };
  }
}

/**
 * Create an annotation (highlight) for a book
 */
export async function createAnnotation(
  bookId: string,
  pageNumber: number,
  selectedText: string
) {
  try {
    await connectToDB();
    const userId = await getCurrentUserId();

    const book = await Book.findOne({ _id: bookId, ownerId: userId });

    if (!book) {
      return { success: false, error: "Unauthorized or Book not found" };
    }

    const annotation = await Annotation.create({
      bookId,
      userId,
      pageNumber,
      selectedText,
      color: "yellow",
    });

    return {
      success: true,
      annotation: {
        id: annotation._id.toString(),
        pageNumber: annotation.pageNumber,
        selectedText: annotation.selectedText,
        color: annotation.color,
        createdAt: annotation.createdAt?.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Create annotation error:", error);
    return {
      success: false,
      error: error.message || "Failed to create annotation",
    };
  }
}

/**
 * Get all annotations for a book
 */
export async function getBookAnnotations(bookId: string) {
  try {
    await connectToDB();
    const userId = await getCurrentUserId();

    const annotations = await Annotation.find({
      bookId,
      userId,
    }).sort({ pageNumber: 1 });

    return {
      success: true,
      annotations: annotations.map((doc) => ({
        id: doc._id.toString(),
        pageNumber: doc.pageNumber,
        selectedText: doc.selectedText,
        color: doc.color,
        explanation: (doc as any).explanation, // Cast if explanation is not in interface yet
        createdAt: doc.createdAt?.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("Get annotations error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch annotations",
      annotations: [],
    };
  }
}

/**
 * Delete an annotation
 */
export async function deleteAnnotation(annotationId: string) {
  try {
    await connectToDB();
    const userId = await getCurrentUserId();

    const annotation = await Annotation.findOne({
      _id: annotationId,
      userId,
    });

    if (!annotation) {
      return { success: false, error: "Unauthorized or Annotation not found" };
    }

    await Annotation.deleteOne({ _id: annotationId });

    return { success: true };
  } catch (error: any) {
    console.error("Delete annotation error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete annotation",
    };
  }
}

/**
 * Save AI explanation for an annotation
 */
export async function saveAnnotationExplanation(
  annotationId: string,
  explanation: string
) {
  try {
    await connectToDB();
    const userId = await getCurrentUserId();

    const annotation = await Annotation.findOne({
      _id: annotationId,
      userId,
    });

    if (!annotation) {
      return { success: false, error: "Unauthorized or Annotation not found" };
    }

    // Using any to bypass TS check if interface is missing it
    (annotation as any).explanation = explanation;
    await annotation.save();

    return { success: true };
  } catch (error: any) {
    console.error("Save explanation error:", error);
    return {
      success: false,
      error: error.message || "Failed to save explanation",
    };
  }
}

/**
 * Delete a book and its associated file
 */
export async function deleteBook(bookId: string) {
  try {
    await connectToDB();
    const userId = await getCurrentUserId();

    const book = await Book.findOne({ _id: bookId, ownerId: userId });

    if (!book) {
      return { success: false, error: "Unauthorized or Book not found" };
    }

    // Delete file from storage
    if (book.storagePath) {
      try {
        await fs.unlink(book.storagePath);
      } catch (error) {
        console.error("Failed to delete file from disk:", error);
      }
    }

    // Delete all annotations for this book
    await Annotation.deleteMany({ bookId });

    // Delete book document
    await Book.deleteOne({ _id: bookId });

    return { success: true };
  } catch (error: any) {
    console.error("Delete book error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete book",
    };
  }
}

/**
 * Update a book's title
 */
export async function updateBook(bookId: string, newTitle: string) {
  try {
    await connectToDB();
    const userId = await getCurrentUserId();

    const book = await Book.findOne({ _id: bookId, ownerId: userId });

    if (!book) {
      return { success: false, error: "Unauthorized or Book not found" };
    }

    book.title = newTitle;
    await book.save();

    return { success: true };
  } catch (error: any) {
    console.error("Update book error:", error);
    return {
      success: false,
      error: error.message || "Failed to update book",
    };
  }
}
