import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
import { getCurrentGroupCode } from './groupService';

export interface SharedCategories {
  categories: string[];
  fixedCategories: string[];
  updatedAt: number;
}

// 카테고리 정보 저장
export async function saveSharedCategories(
  categories: string[],
  fixedCategories: string[]
): Promise<boolean> {
  const groupCode = await getCurrentGroupCode();

  if (!groupCode) {
    return false;
  }

  const docRef = doc(db, 'groups', groupCode, 'settings', 'categories');

  await setDoc(docRef, {
    categories,
    fixedCategories,
    updatedAt: Date.now()
  });

  return true;
}

// 카테고리 정보 가져오기
export async function getSharedCategories(): Promise<SharedCategories | null> {
  const groupCode = await getCurrentGroupCode();

  if (!groupCode) {
    return null;
  }

  const docRef = doc(db, 'groups', groupCode, 'settings', 'categories');
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as SharedCategories;
}

// 실시간 카테고리 구독
export async function subscribeToSharedCategoriesAsync(
  onUpdate: (data: SharedCategories) => void,
  onError?: (error: Error) => void
): Promise<Unsubscribe | null> {
  const groupCode = await getCurrentGroupCode();

  if (!groupCode) {
    return null;
  }

  const docRef = doc(db, 'groups', groupCode, 'settings', 'categories');

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as SharedCategories);
      }
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );

  return unsubscribe;
}

// 기존 로컬 카테고리 데이터 업로드
export async function uploadLocalCategories(
  categories: string[],
  fixedCategories: string[]
): Promise<boolean> {
  return await saveSharedCategories(categories, fixedCategories);
}
