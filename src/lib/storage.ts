import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { initializeApp, getApps } from "firebase/app";
import { getStorage } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const storage = getStorage(app);

export async function uploadFile(file: File, projectId: string): Promise<string> {
  const fileExtension = file.name.split(".").pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const storageRef = ref(storage, `projects/${projectId}/${fileName}`);
  
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  
  return downloadURL;
}

export async function uploadMultipleFiles(files: File[], projectId: string): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadFile(file, projectId);
    urls.push(url);
  }
  return urls;
}

export async function deleteFile(fileUrl: string): Promise<void> {
  const fileRef = ref(storage, fileUrl);
  await deleteObject(fileRef);
}
