import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAA076biNi6TtaxdwGhfkbun73mavXh0hw",
  authDomain: "ciodashboard-c3f58.firebaseapp.com",
  projectId: "ciodashboard-c3f58",
  storageBucket: "ciodashboard-c3f58.firebasestorage.app",
  messagingSenderId: "173882967485",
  appId: "1:173882967485:web:987d8852f2d4d40e14bed4",
  measurementId: "G-CBFP2F7X68"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore DB instance
export const db = getFirestore(app);
