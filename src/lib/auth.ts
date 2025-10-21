import { getFirebase } from "./firebase";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, type Auth, type User } from "firebase/auth";

export function getAuthClient(): Auth | null {
  const { app, isConfigured } = getFirebase();
  if (!app || !isConfigured) return null;
  return getAuth(app);
}

export function watchAuth(callback: (user: User | null) => void) {
  const auth = getAuthClient();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function signInEmailPassword(email: string, password: string) {
  const auth = getAuthClient();
  if (!auth) throw new Error("Firebase não configurado");
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function signUpEmailPassword(email: string, password: string) {
  const auth = getAuthClient();
  if (!auth) throw new Error("Firebase não configurado");
  return await createUserWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  const auth = getAuthClient();
  if (!auth) return;
  await signOut(auth);
}