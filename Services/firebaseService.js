// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
require("dotenv").config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  appId: process.env.APP_ID,
};

const app = initializeApp(firebaseConfig);

module.exports = app;
