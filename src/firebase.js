import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAQ710DPoSzKBKysz9f67P8oIYUZzt1JU8",
  authDomain: "squad-up-4fe79.firebaseapp.com",
  projectId: "squad-up-4fe79",
  storageBucket: "squad-up-4fe79.firebasestorage.app",
  messagingSenderId: "491821627474",
  appId: "1:491821627474:web:100e47a7bdb777d823878b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);