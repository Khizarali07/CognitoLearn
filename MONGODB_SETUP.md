# MongoDB Setup Instructions

## Option 1: MongoDB Atlas (Recommended - Cloud Database)

### Step 1: Create a MongoDB Atlas Account

1. Go to https://www.mongodb.com/atlas
2. Click "Try Free" and create an account
3. Create a new project
4. Build a database (choose the FREE M0 Sandbox)

### Step 2: Setup Database Access

1. In Database Access, create a new user:
   - Username: `courseapp`
   - Password: Generate a secure password
   - Database User Privileges: Read and write to any database

### Step 3: Setup Network Access

1. In Network Access, add IP Address:
   - Add IP Address: `0.0.0.0/0` (Allow access from anywhere)
   - Or add your current IP address for better security

### Step 4: Get Connection String

1. Go to Database → Connect → Drivers
2. Choose Node.js and copy the connection string
3. Replace `<username>`, `<password>`, and `<database>` with your values

Example connection string:

```
mongodb+srv://courseapp:<password>@cluster0.xxxxx.mongodb.net/course-platform?retryWrites=true&w=majority
```

### Step 5: Update .env.local

Replace the MONGODB_URI in your .env.local file with the Atlas connection string.

---

## Option 2: Install MongoDB Locally (Alternative)

### For Windows:

1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Install with default settings
3. Start MongoDB service:
   - Open Services (services.msc)
   - Find "MongoDB" service and start it
   - Or run: `net start MongoDB`

### For macOS:

```bash
# Install via Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### For Linux (Ubuntu):

```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

---

## Verification

After setting up MongoDB (either Atlas or local), test the connection:

1. Restart your Next.js development server
2. Try to sign up or log in
3. Check if the database operations work without connection errors
