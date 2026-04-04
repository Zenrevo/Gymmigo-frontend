import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Real Firebase config from Google Cloud
const firebaseConfig = {
  apiKey: "AIzaSyCX8Z_k4m48yR_V5c5B0a8d7a1e2f3g4h",
  authDomain: "zenrevo-450f8.firebaseapp.com",
  projectId: "zenrevo-450f8",
  storageBucket: "zenrevo-450f8.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:a1b2c3d4e5f6g7h8i9j0k"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
