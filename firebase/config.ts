import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
// @ts-ignore - React Native persistence
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBB4UjfNXEiipnJ3F_inAwo6n7tRyU5W7w",
  authDomain: "groupfinsched.firebaseapp.com",
  projectId: "groupfinsched",
  storageBucket: "groupfinsched.firebasestorage.app",
  messagingSenderId: "977570751293",
  appId: "1:977570751293:web:ecf0a104e47bc4cabf1b54",
  measurementId: "G-Z54TQWRX57"
};

const app = initializeApp(firebaseConfig);

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // Auth already initialized
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);

export default app;
