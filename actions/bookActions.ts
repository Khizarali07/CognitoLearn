"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import {
  getServerDatabases,
  getServerStorage,
  APPWRITE_CONFIG,
} from "@/lib/appwrite";
import { ID, Query } from "node-appwrite";

// Helper function to get current user ID from JWT
async function getCurrentUserId(): Promise<string> {
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
 * Upload a PDF book to Appwrite Storage and create database entry
 */
export async function uploadBookPDF(formData: FormData) {
  try {
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

    console.log("📤 Uploading to Appwrite Storage:", bookTitle);

    // Upload file to Appwrite Storage
    const storage = getServerStorage();
    const fileId = ID.unique();

    const uploadedFile = await storage.createFile(
      APPWRITE_CONFIG.booksBucketId,
      fileId,
      pdfFile
    );

    console.log("✅ File uploaded to Appwrite:", uploadedFile.$id);

    // Create database entry
    const databases = getServerDatabases();
    const bookDocument = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.booksCollectionId,
      ID.unique(),
      {
        userId,
        title: bookTitle,
        storageId: uploadedFile.$id,
        currentPage: 1,
      }
    );

    console.log("✅ Book document created:", bookDocument.$id);

    return {
      success: true,
      bookId: bookDocument.$id,
      title: bookDocument.title,
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
    const userId = await getCurrentUserId();
    const databases = getServerDatabases();

    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.booksCollectionId,
      [Query.equal("userId", userId), Query.orderDesc("$createdAt")]
    );

    return {
      success: true,
      books: response.documents.map((doc) => ({
        id: doc.$id,
        title: doc.title,
        storageId: doc.storageId,
        currentPage: doc.currentPage || 1,
        createdAt: doc.$createdAt, // Use Appwrite's built-in timestamp
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
    const userId = await getCurrentUserId();
    const databases = getServerDatabases();

    const book = await databases.getDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.booksCollectionId,
      bookId
    );

    // Verify the book belongs to the current user
    if (book.userId !== userId) {
      return {
        success: false,
        error: "Unauthorized: This book does not belong to you",
      };
    }

    return {
      success: true,
      book: {
        id: book.$id,
        title: book.title,
        storageId: book.storageId,
        currentPage: book.currentPage || 1,
        createdAt: book.$createdAt, // Use Appwrite's built-in timestamp
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
    const userId = await getCurrentUserId();
    const databases = getServerDatabases();

    // Verify ownership
    const book = await databases.getDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.booksCollectionId,
      bookId
    );

    if (book.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Update current page
    await databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.booksCollectionId,
      bookId,
      {
        currentPage: pageNumber,
      }
    );

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
    const userId = await getCurrentUserId();
    const databases = getServerDatabases();

    // Verify book ownership
    const book = await databases.getDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.booksCollectionId,
      bookId
    );

    if (book.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Create annotation
    const annotation = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.annotationsCollectionId,
      ID.unique(),
      {
        bookId,
        userId,
        pageNumber,
        selectedText,
        color: "yellow",
      }
    );

    return {
      success: true,
      annotation: {
        id: annotation.$id,
        pageNumber: annotation.pageNumber,
        selectedText: annotation.selectedText,
        color: annotation.color,
        createdAt: annotation.$createdAt, // Use Appwrite's built-in timestamp
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
    const userId = await getCurrentUserId();
    const databases = getServerDatabases();

    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.annotationsCollectionId,
      [
        Query.equal("bookId", bookId),
        Query.equal("userId", userId),
        Query.orderAsc("pageNumber"),
      ]
    );

    return {
      success: true,
      annotations: response.documents.map((doc) => ({
        id: doc.$id,
        pageNumber: doc.pageNumber,
        selectedText: doc.selectedText,
        color: doc.color,
        createdAt: doc.$createdAt, // Use Appwrite's built-in timestamp
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
    const userId = await getCurrentUserId();
    const databases = getServerDatabases();

    // Get annotation to verify ownership
    const annotation = await databases.getDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.annotationsCollectionId,
      annotationId
    );

    if (annotation.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Delete annotation
    await databases.deleteDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.annotationsCollectionId,
      annotationId
    );

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
 * Delete a book and its associated file
 */
export async function deleteBook(bookId: string) {
  try {
    const userId = await getCurrentUserId();
    const databases = getServerDatabases();
    const storage = getServerStorage();

    // Get book to verify ownership and get storageId
    const book = await databases.getDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.booksCollectionId,
      bookId
    );

    if (book.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Delete file from storage
    if (book.storageId) {
      try {
        await storage.deleteFile(APPWRITE_CONFIG.booksBucketId, book.storageId);
      } catch (error) {
        console.error("Failed to delete file from storage:", error);
      }
    }

    // Delete all annotations for this book
    try {
      const annotations = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.annotationsCollectionId,
        [Query.equal("bookId", bookId)]
      );

      for (const annotation of annotations.documents) {
        await databases.deleteDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.annotationsCollectionId,
          annotation.$id
        );
      }
    } catch (error) {
      console.error("Failed to delete annotations:", error);
    }

    // Delete book document
    await databases.deleteDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.booksCollectionId,
      bookId
    );

    return { success: true };
  } catch (error: any) {
    console.error("Delete book error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete book",
    };
  }
}
