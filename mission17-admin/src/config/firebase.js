import { initializeApp } from "firebase/app";
import { initializeAuth, browserLocalPersistence } from "firebase/auth";

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

// Use localStorage persistence explicitly. Firebase's default browser setup
// prefers IndexedDB, which can reject auth cleanup when the database is
// closing or the browser has hidden/suspended the page.
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});
