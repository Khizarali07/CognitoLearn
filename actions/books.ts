"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/mongoose";
import Book from "@/models/Book";
import User from "@/models/User";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

interface DecodedToken {
  userId: string;
  email: string;
  name: string;
}

async function getUserFromToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");

  if (!token) {
    throw new Error("Not authenticated");
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  const { payload } = await jwtVerify(token.value, secret);

  return (payload as unknown as DecodedToken).userId;
}

export async function uploadBook(formData: FormData) {
  try {
    const userId = await getUserFromToken();
    await dbConnect();

    const file = formData.get("file") as File;
    const title = formData.get("title") as string;

    if (!file || !title) {
      return { error: "Title and file are required" };
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return { error: "Only PDF files are supported" };
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "books");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${userId}-${timestamp}-${file.name.replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    )}`;
    const filePath = join(uploadsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create book record
    const book = await Book.create({
      title,
      ownerId: userId,
      fileName: file.name,
      fileUrl: `/uploads/books/${fileName}`,
      fileSize: file.size,
      totalPages: 0, // Will be updated when PDF is loaded
      currentPage: 1,
      lastReadPosition: {
        page: 1,
        scrollTop: 0,
      },
      progress: 0,
      isCompleted: false,
    });

    // Add book to user's books array
    await User.findByIdAndUpdate(userId, {
      $push: { books: book._id },
    });

    return { success: true, bookId: book._id.toString() };
  } catch (error) {
    console.error("Upload book error:", error);
    return { error: "Failed to upload book" };
  }
}

export async function getUserBooks() {
  try {
    const userId = await getUserFromToken();
    await dbConnect();

    const books = await Book.find({ ownerId: userId })
      .sort({ lastAccessedAt: -1 })
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return books.map((book: any) => ({
      _id: book._id.toString(),
      title: book.title,
      fileName: book.fileName,
      fileUrl: book.fileUrl,
      fileSize: book.fileSize,
      totalPages: book.totalPages,
      currentPage: book.currentPage,
      progress: book.progress,
      isCompleted: book.isCompleted,
      lastAccessedAt: book.lastAccessedAt,
      createdAt: book.createdAt,
    }));
  } catch (error) {
    console.error("Get user books error:", error);
    return [];
  }
}

export async function getBookById(bookId: string) {
  try {
    const userId = await getUserFromToken();
    await dbConnect();

    const book = await Book.findOne({
      _id: bookId,
      ownerId: userId,
    }).lean();

    if (!book) {
      throw new Error("Book not found");
    }

    // Update last accessed time
    await Book.findByIdAndUpdate(bookId, {
      lastAccessedAt: new Date(),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedBook = book as any;

    return {
      _id: typedBook._id.toString(),
      title: typedBook.title,
      fileUrl: typedBook.fileUrl,
      totalPages: typedBook.totalPages,
      currentPage: typedBook.currentPage,
      lastReadPosition: typedBook.lastReadPosition,
      progress: typedBook.progress,
      isCompleted: typedBook.isCompleted,
    };
  } catch (error) {
    console.error("Get book error:", error);
    throw new Error("Failed to load book");
  }
}

export async function updateBookProgress(
  bookId: string,
  data: {
    currentPage: number;
    totalPages?: number;
    scrollTop?: number;
    highlightedText?: string;
  }
) {
  try {
    const userId = await getUserFromToken();
    await dbConnect();

    const updateData: Record<string, unknown> = {
      currentPage: data.currentPage,
      lastAccessedAt: new Date(),
      "lastReadPosition.page": data.currentPage,
    };

    if (data.totalPages) {
      updateData.totalPages = data.totalPages;
      // Calculate progress
      const progress = Math.round((data.currentPage / data.totalPages) * 100);
      updateData.progress = progress;
      updateData.isCompleted = progress >= 95; // Consider 95%+ as completed
    }

    if (data.scrollTop !== undefined) {
      updateData["lastReadPosition.scrollTop"] = data.scrollTop;
    }

    if (data.highlightedText) {
      updateData["lastReadPosition.highlightedText"] = data.highlightedText;
    }

    await Book.findOneAndUpdate(
      { _id: bookId, ownerId: userId },
      { $set: updateData }
    );

    return { success: true };
  } catch (error) {
    console.error("Update book progress error:", error);
    return { error: "Failed to update progress" };
  }
}

export async function deleteBook(bookId: string) {
  try {
    const userId = await getUserFromToken();
    await dbConnect();

    const book = await Book.findOneAndDelete({
      _id: bookId,
      ownerId: userId,
    });

    if (!book) {
      return { error: "Book not found" };
    }

    // Remove book from user's books array
    await User.findByIdAndUpdate(userId, {
      $pull: { books: bookId },
    });

    // TODO: Delete file from filesystem
    // const filePath = join(process.cwd(), "public", book.fileUrl);
    // if (existsSync(filePath)) {
    //   await unlink(filePath);
    // }

    return { success: true };
  } catch (error) {
    console.error("Delete book error:", error);
    return { error: "Failed to delete book" };
  }
}

export async function getBooksStats() {
  try {
    const userId = await getUserFromToken();
    await dbConnect();

    const books = await Book.find({ ownerId: userId }).lean();

    const totalBooks = books.length;
    const completedBooks = books.filter((b) => b.isCompleted).length;
    const totalPages = books.reduce((sum, b) => sum + b.totalPages, 0);
    const readPages = books.reduce(
      (sum, b) => sum + Math.floor((b.progress / 100) * b.totalPages),
      0
    );

    return {
      totalBooks,
      completedBooks,
      inProgress: totalBooks - completedBooks,
      totalPages,
      readPages,
      averageProgress:
        totalBooks > 0
          ? Math.round(
              books.reduce((sum, b) => sum + b.progress, 0) / totalBooks
            )
          : 0,
    };
  } catch (error) {
    console.error("Get books stats error:", error);
    return {
      totalBooks: 0,
      completedBooks: 0,
      inProgress: 0,
      totalPages: 0,
      readPages: 0,
      averageProgress: 0,
    };
  }
}
