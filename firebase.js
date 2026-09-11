import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCz6mf9JczMehau6yHJ_uxZFzLxl1hNdso",
  authDomain: "site-do-funil-de-vendas.firebaseapp.com",
  projectId: "site-do-funil-de-vendas",
  storageBucket: "site-do-funil-de-vendas.firebasestorage.app",
  messagingSenderId: "240502835468",
  appId: "1:240502835468:web:dd392e3f420ec3792d2129"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
