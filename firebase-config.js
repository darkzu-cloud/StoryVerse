// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVXMtwqKofge0x2iMECY5wv7Y3gL0kpZ4",
  authDomain: "storyverse-d4c86.firebaseapp.com",
  projectId: "storyverse-d4c86",
  storageBucket: "storyverse-d4c86.firebasestorage.app",
  messagingSenderId: "331288557238",
  appId: "1:331288557238:web:be9297c70e9b1f8dd3d817",
  measurementId: "G-CXJ163KVMS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
