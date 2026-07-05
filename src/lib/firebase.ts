import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAQpqFTVCe-OgrSIvxaGQr6N3Sao2zHRzU",
  authDomain: "argon-ocean-wk7s0.firebaseapp.com",
  projectId: "argon-ocean-wk7s0",
  storageBucket: "argon-ocean-wk7s0.firebasestorage.app",
  messagingSenderId: "635075609514",
  appId: "1:635075609514:web:2460c1acb5a82132afe1d3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const storage = getStorage(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, "ai-studio-modeconnecteshop-5b238d48-6210-43f9-b803-11f83f8f3fc0");
