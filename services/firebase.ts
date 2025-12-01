import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: WKLEJ TUTAJ SWOJE DANE Z KONSOLI FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyANLS9_P9Cke-i3LbGYyBz-tUmSki7M5Eo",
  authDomain: "iqfm-content.firebaseapp.com",
  projectId: "iqfm-content",
  storageBucket: "iqfm-content.firebasestorage.app",
  messagingSenderId: "444247771886",
  appId: "1:444247771886:web:4f65321170ac1cf286c1ff",
  measurementId: "G-T6W3XCRLTH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);