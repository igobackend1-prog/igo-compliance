# Local Testing Guide - IGO Payment Approval Application

## ⏱️ Time Required: 10 Minutes

This guide walks you through testing the IGO Payment Approval application on your local machine.

---

## 📋 Prerequisites

Before you start, ensure you have installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Terminal/Command Prompt** - Built into your OS

### Verify Installation

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 8.x.x or higher
git --version     # Should show git version 2.x.x or higher
```

---

## 🚀 Step-by-Step Instructions

### Step 1: Clone the Repository (2 minutes)

Open your terminal/command prompt and run:

```bash
git clone https://github.com/igobackend1-prog/igo-approvals.git
cd igo-approvals
```

**Expected Output:**
```
Cloning into 'igo-approvals'...
remote: Enumerating objects: 16, done.
remote: Counting objects: 100% (16/16), done.
remote: Compressing objects: 100% (10/10), done.
remote: Receiving objects: 100% (16/16), 12.34 KiB | 3.09 MiB/s, done.
resolving deltas: 100% (1/1), done.
```

✅ **Verification:** You should see a folder named `igo-approvals` created

---

### Step 2: Install Dependencies (3-4 minutes)

Inside the `igo-approvals` folder, run:

```bash
npm install
```

**What This Does:**
- Downloads all required packages
- Installs React, Express, and other dependencies
- Creates a `node_modules` folder (~500MB)

**Expected Output (last few lines):**
```
added 1,234 packages in 3m 45s
```

**⏳ Wait:** This step takes 3-4 minutes. Be patient!

✅ **Verification:** You should see `node_modules` folder created

---

### Step 3: Setup Environment Variables (1 minute)

Copy the environment template:

```bash
cp .env.example .env.local
```

**Optional - Edit Configuration:**

```bash
# Windows (Notepad)
start .env.local

# macOS/Linux (nano editor)
nano .env.local
```

**Default values should work for local testing.**

✅ **Verification:** `.env.local` file should exist

---

### Step 4: Start the Development Server (1 minute)

Run the development server:

```bash
npm run dev
```

**Expected Output:**
```
  VITE v5.0.0  ready in 456 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

✅ **Verification:** Server is running when you see the "Local" URL

---

### Step 5: Open the Application (1 minute)

#### Option A: Using Browser
1. Open your web browser (Chrome, Firefox, Safari, Edge)
2. Go to: **http://localhost:5173**
3. The application should load

#### Option B: Direct Link from Terminal
- Click the URL in terminal while holding `Ctrl` (Windows/Linux) or `Cmd` (Mac)
- Or manually type the URL in your browser

**Expected Appearance:**
- Clean, professional interface
- IGO Payment Approval Dashboard visible
- No red error messages (yellow warnings are okay)

---

## 🧪 Testing the Application

### Test 1: Frontend Loads Successfully

**Steps:**
1. Page loads without errors
2. Buttons are clickable
3. Forms display properly

**Expected Result:** ✅ Application UI renders cleanly

### Test 2: Check Browser Console

**Steps:**
1. Press `F12` to open Developer Tools
2. Click the "Console" tab
3. Look for any red error messages

**Expected Result:** ✅ No red error messages (some info/warn messages are fine)

### Test 3: Test Navigation

**Steps:**
1. Click different menu items/buttons
2. Try filling out a form
3. Click submit buttons

**Expected Result:** ✅ UI responds to clicks

### Test 4: Check API Connectivity (if backend is running)

**Steps:**
1. Open browser console (F12)
2. Watch for network requests in "Network" tab
3. Check if API calls show 200 status

**Expected Result:** ✅ API requests complete without 404/500 errors

---

## 🛑 Stopping the Server

When you're done testing:

```bash
Ctrl + C
```

(Hold Ctrl and press C in the terminal)

**Expected Output:**
```
^C
```

✅ **Verification:** Terminal returns to normal prompt

---

## ❌ Troubleshooting

### Issue 1: "npm: command not found"

**Solution:**
- Node.js not installed
- Run: Download and install Node.js from https://nodejs.org/
- Restart terminal after installation

### Issue 2: Port 5173 Already in Use

**Solution:**
```bash
# Kill the process using port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID [PID_NUMBER] /F

# macOS/Linux
lsof -i :5173
kill -9 [PID]

# Or use a different port
npm run dev -- --port 5174
```

### Issue 3: "EACCES: permission denied"

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue 4: Blank Page or Errors on Load

**Solution:**
1. Check browser console (F12 → Console tab)
2. Read error message carefully
3. Clear browser cache (Ctrl + Shift + Del)
4. Hard refresh: Ctrl + Shift + R
5. Try a different browser

### Issue 5: Can't Connect to Firestore

**Solution:**
- This is normal for local testing
- API calls might fail if backend isn't properly configured
- Check `.env.local` has correct credentials
- Ensure Google Cloud credentials are set up

---

## 📊 What to Look For

### ✅ Signs Everything is Working

- [ ] Terminal shows "ready in XXX ms"
- [ ] Browser shows application UI
- [ ] No red errors in console
- [ ] Buttons respond to clicks
- [ ] Page reloads when you edit code (hot reload)

### ❌ Signs Something Needs Fixing

- [ ] Port error (use different port)
- [ ] Module not found (run `npm install` again)
- [ ] API 404 errors (check backend configuration)
- [ ] Blank white page (check browser console)

---

## 🔄 Hot Reload Feature

**Great News:** The development server supports hot reloading!

**How it works:**
1. Save any file in the project
2. Application automatically reloads
3. Your changes appear instantly

**Try it:**
1. Open `src/App.tsx`
2. Change some text
3. Save (Ctrl + S)
4. See changes in browser instantly!

---

## 📁 Project Structure While Running

```
igo-approvals/
├── src/
│   ├── components/     # React components
│   ├── views/          # Page views
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static files
├── node_modules/       # Dependencies (created by npm install)
├── .env.local          # Your environment config
├── package.json        # Project dependencies
├── vite.config.ts      # Vite configuration
└── index.html          # HTML entry point
```

---

## 🎯 Next Steps After Successful Testing

1. **Verify all components load:**
   - Dashboard
   - Forms
   - Approval list
   - Status tracker

2. **Test user interactions:**
   - Click buttons
   - Fill forms
   - Submit data

3. **Check browser console:**
   - Ensure no red errors
   - Monitor API calls

4. **Prepare for deployment:**
   - Follow `DEPLOYMENT.md` for Cloud Run deployment
   - Test Docker build
   - Verify production configuration

---

## 📞 Common Commands Reference

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run linter (check code quality)
npm run lint

# Stop server
Ctrl + C
```

---

## ✨ Features You Can Test Locally

- ✅ Payment approval dashboard
- ✅ Form submissions
- ✅ Status tracking
- ✅ Responsive design (resize browser)
- ✅ Dark/Light mode (if implemented)
- ✅ Navigation between pages
- ✅ User interface responsiveness

---

## 🕐 Typical Timeline

| Step | Time | Status |
|------|------|--------|
| Clone Repository | 2 min | ✅ Quick |
| Install Deps | 3-4 min | ⏳ Wait |
| Setup Env | 1 min | ✅ Quick |
| Start Server | 1 min | ✅ Quick |
| Open in Browser | 1 min | ✅ Quick |
| **Total** | **10 min** | **✅ Done** |

---

## 🎓 Learning Notes

### What is npm install?
- Downloads all project dependencies
- Creates node_modules folder
- Reads from package.json
- Similar to pip install, yarn install, etc.

### What is .env.local?
- Stores sensitive configuration
- Not committed to Git (for security)
- Contains API keys, database URLs, etc.
- Never share this file publicly!

### What is npm run dev?
- Starts development server
- Enables hot reloading
- Creates local URL (localhost:5173)
- Used for development only

### What is hot reload?
- Automatic page refresh when code changes
- Preserves application state
- Makes development faster
- Standard in modern frameworks

---

## ✅ Success Checklist

- [ ] Node.js and npm installed
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] .env.local created
- [ ] Development server started
- [ ] Application opens in browser
- [ ] No red console errors
- [ ] UI is interactive
- [ ] Hot reload works

---

**Congratulations!** Your application is now running locally and ready for further development or deployment.

For production deployment, see `DEPLOYMENT-STATUS.md`

*Last Updated: December 20, 2025*
