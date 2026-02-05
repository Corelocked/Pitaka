// Firebase configuration and initialization
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getAnalytics } from "firebase/analytics";

// Firebase configuration - Replace with your actual config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBpi8nmC4BhYYNkQl3cWnaJsaFDIrx-DFA",
  authDomain: "budgetbook-5b9c3.firebaseapp.com",
  projectId: "budgetbook-5b9c3",
  storageBucket: "budgetbook-5b9c3.firebasestorage.app",
  messagingSenderId: "481451551366",
  appId: "1:481451551366:web:d2744036a9133ababfbf07",
  measurementId: "G-0KXJQVMW7Q"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const db = getFirestore(app)
export const auth = getAuth(app)

export default app