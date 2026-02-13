import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
import { getCurrentGroupCode } from './groupService';
import { FixedExpense } from '../types/fixedExpense';

export interface SharedFixedExpenses {
  expenses: FixedExpense[];
  updatedAt: number;
}

// 고정지출 스케줄 저장
export async function saveSharedFixedExpenses(
  expenses: FixedExpense[]
): Promise<boolean> {
  const groupCode = await getCurrentGroupCode();

  if (!groupCode) {
    return false;
  }

  const docRef = doc(db, 'groups', groupCode, 'settings', 'fixedExpenses');

  await setDoc(docRef, {
    expenses,
    updatedAt: Date.now()
  });

  return true;
}

// 고정지출 스케줄 가져오기
export async function getSharedFixedExpenses(): Promise<SharedFixedExpenses | null> {
  const groupCode = await getCurrentGroupCode();

  if (!groupCode) {
    return null;
  }

  const docRef = doc(db, 'groups', groupCode, 'settings', 'fixedExpenses');
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as SharedFixedExpenses;
}

// 실시간 고정지출 구독
export async function subscribeToSharedFixedExpensesAsync(
  onUpdate: (data: SharedFixedExpenses) => void,
  onError?: (error: Error) => void
): Promise<Unsubscribe | null> {
  const groupCode = await getCurrentGroupCode();

  if (!groupCode) {
    return null;
  }

  const docRef = doc(db, 'groups', groupCode, 'settings', 'fixedExpenses');

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as SharedFixedExpenses);
      } else {
        onUpdate({ expenses: [], updatedAt: 0 });
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

// 기존 로컬 고정지출 데이터 업로드
export async function uploadLocalFixedExpenses(
  expenses: FixedExpense[]
): Promise<boolean> {
  return await saveSharedFixedExpenses(expenses);
}
