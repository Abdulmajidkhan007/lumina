/**
 * `contactMessages` — the landing page's contact form. Anyone may send one
 * (visitors are usually signed out); only the admin reads them in
 * Admin → Messages. Shape and size caps are enforced in firestore.rules.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'new' | 'read';
  uid: string | null;
  lang: string | null;
  /** ISO 8601; null while the server timestamp is still pending. */
  createdAt: string | null;
}

export interface ContactInput {
  name: string;
  email: string;
  message: string;
  lang?: string;
}

const messagesCollection = () => collection(db, 'contactMessages');

export async function sendContactMessage(input: ContactInput): Promise<void> {
  const uid = auth.currentUser?.uid;
  await addDoc(messagesCollection(), {
    name: input.name.trim().slice(0, 80),
    email: input.email.trim().slice(0, 120),
    message: input.message.trim().slice(0, 2000),
    status: 'new',
    ...(uid ? { uid } : {}),
    ...(input.lang ? { lang: input.lang } : {}),
    createdAt: serverTimestamp(),
  });
}

export async function fetchContactMessages(): Promise<ContactMessage[]> {
  const snap = await getDocs(query(messagesCollection(), orderBy('createdAt', 'desc'), limit(200)));
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    const created = data.createdAt as Timestamp | null | undefined;
    return {
      id: d.id,
      name: (data.name as string) ?? '',
      email: (data.email as string) ?? '',
      message: (data.message as string) ?? '',
      status: data.status === 'read' ? 'read' : 'new',
      uid: (data.uid as string | undefined) ?? null,
      lang: (data.lang as string | undefined) ?? null,
      createdAt: created ? created.toDate().toISOString() : null,
    };
  });
}

export async function markContactMessage(id: string, status: 'new' | 'read'): Promise<void> {
  await updateDoc(doc(db, 'contactMessages', id), { status });
}

export async function deleteContactMessage(id: string): Promise<void> {
  await deleteDoc(doc(db, 'contactMessages', id));
}
