import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEC4lTnhqgzKuskhjScmU3vkt_VN-hQEg",
  authDomain: "mission17-56ab6.firebaseapp.com",
  projectId: "mission17-56ab6",
  storageBucket: "mission17-56ab6.firebasestorage.app",
  messagingSenderId: "794077370760",
  appId: "1:794077370760:web:356902d014ad724f8ec23d",
  measurementId: "G-JMBRRTD4RW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
