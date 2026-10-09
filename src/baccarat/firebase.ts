import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDqZsg2PESBKq-y3RMnfYohNd5_YuGRPxU',
  authDomain: 'watasigamawasimasu.firebaseapp.com',
  projectId: 'watasigamawasimasu',
  storageBucket: 'watasigamawasimasu.firebasestorage.app',
  messagingSenderId: '716794960809',
  appId: '1:716794960809:web:30a3c078ddc89b9cc282b8',
  measurementId: 'G-Q75W69KJ20',
};

const app = initializeApp(firebaseConfig);

// undefined値のフィールド（memoなど）をそのまま書き込めるようにする
// （デフォルトだとFirestoreはundefinedを含むドキュメントの書き込みを拒否する）。
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });

export const auth = getAuth(app);
void setPersistence(auth, browserLocalPersistence);
