import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getStorage } from 'firebase/storage'

// Web app config mirrored from the Flutter repo's lib/firebase_options.dart
// (FirebaseOptions web). Not secrets — security comes from Auth + rules.
const firebaseConfig = {
  apiKey: 'AIzaSyDfXAghbQ6v_Qn7FPgniqTnrSUjNAucLCs',
  appId: '1:807555999630:web:48f03abe841f20635ca6df',
  messagingSenderId: '807555999630',
  projectId: 'streamora-e457f',
  authDomain: 'streamora-e457f.firebaseapp.com',
  storageBucket: 'streamora-e457f.firebasestorage.app',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app)
// Storage isn't provisioned on the project yet (Blaze required); exported so
// upload widgets can plug in without touching the init module.
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()
