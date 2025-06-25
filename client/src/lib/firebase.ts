import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBIFamaMJOk4UjWBPTMVXM5sXKJRCF9wJs",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "interview-preparation-ap-aa6d6"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "interview-preparation-ap-aa6d6",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "interview-preparation-ap-aa6d6"}.firebasestorage.app`,
  messagingSenderId: "630863414235",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:630863414235:web:762536b6a1f99c6ba0ddfe"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export type { User };
