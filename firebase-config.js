// Firebase Configuration
// Replace with your Firebase project credentials

const firebaseConfig = {
  apiKey: "AIzaSyBrYsSzPyJCWyvzMCdsL0B_ewmN6-3PLNQ",
  authDomain: "bayt-al-falafel.firebaseapp.com",
  projectId: "bayt-al-falafel",
  storageBucket: "bayt-al-falafel.firebasestorage.app",
  messagingSenderId: "838682428236",
  appId: "1:838682428236:web:245da171b7115bdfcb05e9",
  measurementId: "G-G5D89R4BKC"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const db = firebase.firestore();
const auth = firebase.auth();
