import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Real Firebase config from Google Cloud
const firebaseConfig = {
  apiKey: "AIzaSyBbqhSiAf4Pqp38_43XVI-MGyaLn4IPP4A",
  authDomain: "zenrevo-450f8.firebaseapp.com",
  projectId: "zenrevo-450f8",
  storageBucket: "zenrevo-450f8.firebasestorage.app",
  messagingSenderId: "181076789305",
  appId: "1:181076789305:web:a76ff5b94848d65876e5e8",
  measurementId: "G-WLCBPRLSLQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
