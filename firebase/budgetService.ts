import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  getDocs,
  onSnapshot,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
import { SharedBudget } from './types';
import { getCurrentGroupCode, getCurrentUserName, getCurrentUid } from './groupService';

// 가계부 추가
export async function addSharedBudget(
  budget: Omit<SharedBudget, 'id' | 'author' | 'authorName' | 'createdAt' | 'updatedAt'>
): Promise<string | null> {
  const groupCode = await getCurrentGroupCode();
  const userName = await getCurrentUserName();
  const uid = getCurrentUid();

  if (!groupCode || !userName || !uid) {
    return null; // 그룹 미연결
  }

  const budgetsRef = collection(db, 'groups', groupCode, 'budgets');

  const newBudget = {
    ...budget,
    author: uid,
    authorName: userName,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const docRef = await addDoc(budgetsRef, newBudget);
  return docRef.id;
}

// 가계부 수정
export async function updateSharedBudget(
  budgetId: string,
  updates: Partial<Omit<SharedBudget, 'id' | 'author' | 'authorName' | 'createdAt'>>
): Promise<boolean> {
  const groupCode = await getCurrentGroupCode();

  if (!groupCode) {
    return false;
  }

  const docRef = doc(db, 'groups', groupCode, 'budgets', budgetId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: Date.now()
  });

  return true;
}

// 가계부 삭제
export async function deleteSharedBudget(budgetId: string): Promise<boolean> {
  const groupCode = await getCurrentGroupCode();

  if (!groupCode) {
    return false;
  }

  const docRef = doc(db, 'groups', groupCode, 'budgets', budgetId);
  await deleteDoc(docRef);

  return true;
}

// 실시간 가계부 구독
export function subscribeToSharedBudgets(
  onUpdate: (budgets: SharedBudget[]) => void,
  onError?: (error: Error) => void
): Unsubscribe | null {
  // 동기적으로 그룹 코드를 가져올 수 없으므로 비동기 버전 사용 필요
  // 이 함수는 그룹 코드가 이미 있을 때만 호출해야 함
  return null;
}

// 실시간 가계부 구독 (비동기 초기화)
export async function subscribeToSharedBudgetsAsync(
  onUpdate: (budgets: SharedBudget[]) => void,
  onError?: (error: Error) => void
): Promise<Unsubscribe | null> {
  const groupCode = await getCurrentGroupCode();

  if (!groupCode) {
    return null;
  }

  const budgetsRef = collection(db, 'groups', groupCode, 'budgets');
  const q = query(budgetsRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const budgets: SharedBudget[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as SharedBudget));
      onUpdate(budgets);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );

  return unsubscribe;
}

// 로컬 Budget을 SharedBudget 형식으로 변환
export function convertToSharedBudget(
  localBudget: { money: number; date: string; type: 'INCOME' | 'EXPENSE'; category: string; account?: string; title?: string }
): Omit<SharedBudget, 'id' | 'author' | 'authorName' | 'createdAt' | 'updatedAt'> {
  return {
    money: localBudget.type === 'EXPENSE' ? -Math.abs(localBudget.money) : Math.abs(localBudget.money),
    date: localBudget.date,
    account: localBudget.account || '',
    category: localBudget.category,
    memo: localBudget.title || '',
  };
}

// SharedBudget을 로컬 Budget 형식으로 변환
export function convertToLocalBudget(
  sharedBudget: SharedBudget
): { id: string; money: number; date: string; type: 'INCOME' | 'EXPENSE'; category: string; account: string; title: string; authorUid: string; authorName: string } {
  return {
    id: sharedBudget.id,
    money: Math.abs(sharedBudget.money),
    date: sharedBudget.date,
    type: sharedBudget.money >= 0 ? 'INCOME' : 'EXPENSE',
    category: sharedBudget.category,
    account: sharedBudget.account,
    title: sharedBudget.memo || '',
    authorUid: sharedBudget.author,
    authorName: sharedBudget.authorName,
  };
}

// 기존 로컬 가계부 데이터 일괄 업로드 (배치 쓰기)
export async function uploadLocalBudgets(
  budgets: Array<{ money: number; date: string; type: 'INCOME' | 'EXPENSE'; category: string; account?: string; title?: string }>
): Promise<number> {
  const groupCode = await getCurrentGroupCode();
  const userName = await getCurrentUserName();
  const uid = getCurrentUid();
  if (!groupCode || !userName || !uid) return 0;

  const budgetsRef = collection(db, 'groups', groupCode, 'budgets');
  let uploadedCount = 0;

  // Firestore 배치는 최대 500개
  for (let i = 0; i < budgets.length; i += 500) {
    const chunk = budgets.slice(i, i + 500);
    const batch = writeBatch(db);

    for (const budget of chunk) {
      const sharedBudget = convertToSharedBudget(budget);
      const newDocRef = doc(budgetsRef);
      batch.set(newDocRef, {
        ...sharedBudget,
        author: uid,
        authorName: userName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      uploadedCount++;
    }

    await batch.commit();
  }

  return uploadedCount;
}

// 가계부 일괄 삭제 (배치)
export async function deleteSharedBudgetsBatch(budgetIds: string[]): Promise<void> {
  const groupCode = await getCurrentGroupCode();
  if (!groupCode || budgetIds.length === 0) return;

  for (let i = 0; i < budgetIds.length; i += 500) {
    const chunk = budgetIds.slice(i, i + 500);
    const batch = writeBatch(db);
    for (const id of chunk) {
      batch.delete(doc(db, 'groups', groupCode, 'budgets', id));
    }
    await batch.commit();
  }
}

// 가계부 일괄 추가 (배치)
export async function addSharedBudgetsBatch(
  budgets: Array<Omit<SharedBudget, 'id' | 'author' | 'authorName' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const groupCode = await getCurrentGroupCode();
  const userName = await getCurrentUserName();
  const uid = getCurrentUid();
  if (!groupCode || !userName || !uid || budgets.length === 0) return;

  const budgetsRef = collection(db, 'groups', groupCode, 'budgets');

  for (let i = 0; i < budgets.length; i += 500) {
    const chunk = budgets.slice(i, i + 500);
    const batch = writeBatch(db);
    for (const budget of chunk) {
      const newDocRef = doc(budgetsRef);
      batch.set(newDocRef, {
        ...budget,
        author: uid,
        authorName: userName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    await batch.commit();
  }
}

// 내가 작성한 가계부 데이터만 가져오기
export async function fetchMyBudgets(groupCode: string): Promise<SharedBudget[]> {
  const uid = getCurrentUid();

  if (!uid || !groupCode) {
    return [];
  }

  try {
    const budgetsRef = collection(db, 'groups', groupCode, 'budgets');
    const q = query(budgetsRef, where('author', '==', uid));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    } as SharedBudget));
  } catch (error) {
    console.error('내 가계부 가져오기 실패:', error);
    return [];
  }
}
