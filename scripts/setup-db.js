const { Client, Databases, Permission, Role } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.NEXT_APPWRITE_KEY);

const databases = new Databases(client);

const DATABASE_ID = "cognitolearn-db";
const ANNOTATIONS_COLLECTION_ID = "annotations";
const MESSAGES_COLLECTION_ID = "messages";

async function setupDatabase() {
    console.log("Starting Database Setup...");

    // 1. Add 'explanation' to 'annotations'
    try {
        console.log("Checking 'annotations' collection...");
        // Try to add attribute. If it exists, it throws (which is fine).
        // 10000 chars for explanation
        await databases.createStringAttribute(DATABASE_ID, ANNOTATIONS_COLLECTION_ID, 'explanation', 10000, false);
        console.log("✅ Added 'explanation' attribute to annotations.");
    } catch (error) {
        if (error.code === 409) {
            console.log("ℹ️ 'explanation' attribute already exists in annotations.");
        } else {
            console.error("❌ Failed to update annotations:", error.message);
        }
    }

    // 2. Create 'messages' collection
    try {
        console.log("Checking 'messages' collection...");
        try {
            await databases.getCollection(DATABASE_ID, MESSAGES_COLLECTION_ID);
            console.log("ℹ️ 'messages' collection already exists.");
        } catch (e) {
            if (e.code === 404) {
                 console.log("Creating 'messages' collection...");
                 await databases.createCollection(DATABASE_ID, MESSAGES_COLLECTION_ID, "Messages", [
                    Permission.read(Role.any()), // Adjust permissions as needed
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users()),
                 ]);
                 console.log("✅ Created 'messages' collection.");
            } else {
                throw e;
            }
        }

        // 3. Add attributes to 'messages'
        const attributes = [
            { key: 'bookId', size: 50, required: true },
            { key: 'userId', size: 50, required: true },
            { key: 'role', size: 20, required: true }, // 'user' or 'ai'
            { key: 'content', size: 10000, required: true },
            { key: 'annotationId', size: 50, required: false },
        ];

        for (const attr of attributes) {
            try {
                await databases.createStringAttribute(DATABASE_ID, MESSAGES_COLLECTION_ID, attr.key, attr.size, attr.required);
                console.log(`✅ Added '${attr.key}' to messages.`);
            } catch (error) {
                 if (error.code === 409) {
                    console.log(`ℹ️ '${attr.key}' already exists in messages.`);
                } else {
                    console.error(`❌ Failed to add '${attr.key}' to messages:`, error.message);
                }
            }
        }
        
    } catch (error) {
        console.error("❌ Error setting up messages:", error.message);
    }
    
    // Wait a moment for attributes to settle (status: processing -> available)
    console.log("Waiting for attributes to index...");
    await new Promise(r => setTimeout(r, 2000));
    console.log("🎉 Database Setup Complete!");
}

setupDatabase();
