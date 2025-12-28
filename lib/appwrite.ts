// Appwrite Client SDK configuration (for client-side operations)
import { Client, Account, Databases, Storage } from "appwrite";

// Appwrite Server SDK configuration (for server-side operations)
import {
  Client as ServerClient,
  Databases as ServerDatabases,
  Storage as ServerStorage,
  Users,
} from "node-appwrite";

// Appwrite IDs - These should match your Appwrite project setup
export const APPWRITE_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  apiKey: process.env.NEXT_APPWRITE_KEY!,
  databaseId: "cognitolearn-db",
  booksCollectionId: "books",
  annotationsCollectionId: "annotations",
  messagesCollectionId: "messages",
  booksBucketId: "user_pdfs",
};

// Client-side Appwrite instances (for browser)
let client: Client;
let account: Account;
let databases: Databases;
let storage: Storage;

export function getAppwriteClient() {
  if (!client) {
    client = new Client()
      .setEndpoint(APPWRITE_CONFIG.endpoint)
      .setProject(APPWRITE_CONFIG.projectId);
  }
  return client;
}

export function getAccount() {
  if (!account) {
    account = new Account(getAppwriteClient());
  }
  return account;
}

export function getDatabases() {
  if (!databases) {
    databases = new Databases(getAppwriteClient());
  }
  return databases;
}

export function getStorage() {
  if (!storage) {
    storage = new Storage(getAppwriteClient());
  }
  return storage;
}

// Server-side Appwrite instances (for Next.js Server Actions)
let serverClient: ServerClient;
let serverDatabases: ServerDatabases;
let serverStorage: ServerStorage;
let serverUsers: Users;

export function getServerClient() {
  if (!serverClient) {
    serverClient = new ServerClient()
      .setEndpoint(APPWRITE_CONFIG.endpoint)
      .setProject(APPWRITE_CONFIG.projectId)
      .setKey(APPWRITE_CONFIG.apiKey);
  }
  return serverClient;
}

export function getServerDatabases() {
  if (!serverDatabases) {
    serverDatabases = new ServerDatabases(getServerClient());
  }
  return serverDatabases;
}

export function getServerStorage() {
  if (!serverStorage) {
    serverStorage = new ServerStorage(getServerClient());
  }
  return serverStorage;
}

export function getServerUsers() {
  if (!serverUsers) {
    serverUsers = new Users(getServerClient());
  }
  return serverUsers;
}
