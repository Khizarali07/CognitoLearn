// MongoDB initialization script for Docker
db = db.getSiblingDB("course-platform");

// Create a user for the application
db.createUser({
  user: "courseapp",
  pwd: "courseapp123",
  roles: [
    {
      role: "readWrite",
      db: "course-platform",
    },
  ],
});

// Create initial collections (optional)
db.createCollection("users");
db.createCollection("courses");
db.createCollection("videos");
db.createCollection("passwordresets");

print("Database initialized successfully!");
