#!/usr/bin/env node

/**
 * MongoDB Atlas Setup Helper
 *
 * This script helps configure MongoDB Atlas for the Course Platform
 * Run with: node setup-mongodb.js
 */

const readline = require("readline");
const fs = require("fs");
const path = require("path");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function setupMongoDB() {
  console.log("🚀 MongoDB Atlas Setup Helper\n");

  console.log("Please follow these steps to set up MongoDB Atlas:\n");
  console.log("1. Go to https://www.mongodb.com/atlas");
  console.log("2. Create a free account and new project");
  console.log("3. Create a free M0 cluster");
  console.log("4. Create a database user");
  console.log(
    "5. Add your IP address to Network Access (or 0.0.0.0/0 for development)"
  );
  console.log(
    "6. Get your connection string from Database → Connect → Drivers\n"
  );

  const connectionString = await question(
    "Enter your MongoDB Atlas connection string: "
  );

  if (!connectionString || !connectionString.includes("mongodb+srv://")) {
    console.log(
      "❌ Invalid connection string. Please make sure it starts with mongodb+srv://"
    );
    process.exit(1);
  }

  // Read current .env.local file
  const envPath = path.join(__dirname, ".env.local");
  let envContent = "";

  try {
    envContent = fs.readFileSync(envPath, "utf8");
  } catch (error) {
    console.log("⚠️  .env.local file not found, creating new one...");
  }

  // Update or add MONGODB_URI
  const lines = envContent.split("\n");
  let found = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("MONGODB_URI=")) {
      lines[i] = `MONGODB_URI=${connectionString}`;
      found = true;
      break;
    }
  }

  if (!found) {
    lines.push(`MONGODB_URI=${connectionString}`);
  }

  // Write updated .env.local
  fs.writeFileSync(envPath, lines.join("\n"));

  console.log("\n✅ MongoDB connection string updated in .env.local");
  console.log("🔄 Please restart your development server to apply changes");
  console.log("\nTest your setup by:");
  console.log("1. npm run dev");
  console.log("2. Go to http://localhost:3000/signup");
  console.log("3. Create a test account\n");

  rl.close();
}

setupMongoDB().catch((error) => {
  console.error("❌ Setup failed:", error);
  process.exit(1);
});
