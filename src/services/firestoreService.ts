import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';
import { Student } from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

const COLLECTION_NAME = 'middle_school_students';

/**
 * Saves all student records to Firebase Firestore in real-time.
 */
export async function saveStudentsToFirestore(students: Student[]): Promise<void> {
  for (const s of students) {
    const studentRef = doc(db, COLLECTION_NAME, s.id);
    await setDoc(studentRef, s);
  }
}

/**
 * Loads all student records from Firebase Firestore.
 */
export async function loadStudentsFromFirestore(): Promise<Student[]> {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  const students: Student[] = [];
  querySnapshot.forEach((docSnap) => {
    students.push(docSnap.data() as Student);
  });
  return students;
}
