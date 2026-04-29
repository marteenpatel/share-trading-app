import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCIzTdBPg4Jc_sZepv-1S5hy1umrA1iMS0",
  authDomain: "sharetradingapp-cbfe3.firebaseapp.com",
  projectId: "sharetradingapp-cbfe3",
  storageBucket: "sharetradingapp-cbfe3.firebasestorage.app",
  messagingSenderId: "154457180518",
  appId: "1:154457180518:web:aaf8e5cb11280802ca60a7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
