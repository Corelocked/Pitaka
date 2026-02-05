# Firebase Setup Guide for Budget Book

## 🚀 Setting up Firebase for your Budget Book

Follow these steps to connect your budget book to Firebase:

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" (or select existing project)
3. Enter your project name (e.g., "budget-book-app")
4. Enable Google Analytics if desired
5. Click "Create project"

### 2. Enable Firestore Database

1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location for your database
5. Click "Done"

### 3. Enable Authentication (Optional but Recommended)

1. Go to "Authentication" in the Firebase Console
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Anonymous" sign-in (for demo purposes)
5. You can add other providers later (Google, Email/Password, etc.)

### 4. Get Your Firebase Configuration

1. Click the gear icon ⚙️ → "Project settings"
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app (</>) icon
4. Register your app with a nickname
5. Copy the Firebase configuration object

### 5. Update Your Configuration

1. Open `src/firebase.js` in your project
2. Replace the placeholder config with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id"
}
```

### 6. Security Rules (Important!)

For production, update your Firestore security rules:

1. Go to Firestore Database → Rules
2. Replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /incomes/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /expenses/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### 7. Test Your Setup

1. Run your app: `npm run dev`
2. Add some income/expense entries
3. Refresh the page - your data should persist in Firebase!
4. Open Firebase Console → Firestore Database to see your data

## 🔧 Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/invalid-api-key)"**
   - Check that your API key is correct in `firebase.js`

2. **"Missing or insufficient permissions"**
   - Make sure Firestore security rules allow your operations
   - For development, you can use "test mode" which allows all operations

3. **Data not loading**
   - Check browser console for errors
   - Verify Firebase config is correct
   - Make sure Firestore is enabled

4. **Anonymous auth not working**
   - Go to Authentication → Sign-in method
   - Enable Anonymous provider

## 📱 Features Added

- ✅ Real-time data synchronization
- ✅ User-specific data (each user sees only their data)
- ✅ Offline support (Firebase handles offline/online sync)
- ✅ Automatic data persistence
- ✅ Loading states and error handling
- ✅ Scalable database structure

## 🔒 Security Notes

- Currently using anonymous authentication for simplicity
- In production, implement proper user authentication
- Update Firestore security rules for production use
- Consider implementing data validation and sanitization

## 🎯 Next Steps

After setup, you can:
- Add user authentication (Google, Email/Password)
- Implement data backup/export features
- Add data analytics and insights
- Create user profiles and settings
- Add collaborative features (shared budgets)

Happy budgeting with Firebase! 🎉