import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
import { getCurrentGroupCode, getCurrentUid } from './groupService';
import { AccountBalances } from '../types/budget';

// 통장 소유자 정보
export interface AccountOwnership {
  [accountName: string]: string;  // accountName -> owner uid
}

export interface SharedAccounts {
  accounts: string[];
  balances: AccountBalances;
  owners: AccountOwnership;  // 각 통장의 소유자
  updatedAt: number;
}

// 통장 정보 저장
export async function saveSharedAccounts(
  accounts: string[],
  balances: AccountBalances,
  owners?: AccountOwnership
): Promise<boolean> {
  const groupCode = await getCurrentGroupCode();

  if (!groupCode) {
    return false;
  }

  const docRef = doc(db, 'groups', groupCode, 'settings', 'accounts');

  // 기존 데이터 가져오기 (owners 병합용)
  const existingDoc = await getDoc(docRef);
  const existingOwners: AccountOwnership = existingDoc.exists()
    ? (existingDoc.data().owners || {})
    : {};

  // 새 owners와 기존 owners 병합
  const mergedOwners = { ...existingOwners, ...owners };

  // 삭제된 통장의 owners 제거
  const finalOwners: AccountOwnership = {};
  for (const acc of accounts) {
    if (mergedOwners[acc]) {
      finalOwners[acc] = mergedOwners[acc];
    }
  }

  await setDoc(docRef, {
    accounts,
    balances,
    owners: finalOwners,
    updatedAt: Date.now()
  });

  return true;
}

// 통장 정보 가져오기
export async function getSharedAccounts(): Promise<SharedAccounts | null> {
  const groupCode = await getCurrentGroupCode();

  if (!groupCode) {
    return null;
  }

  const docRef = doc(db, 'groups', groupCode, 'settings', 'accounts');
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as SharedAccounts;
}

// 실시간 통장 구독
export async function subscribeToSharedAccountsAsync(
  onUpdate: (data: SharedAccounts) => void,
  onError?: (error: Error) => void
): Promise<Unsubscribe | null> {
  const groupCode = await getCurrentGroupCode();

  if (!groupCode) {
    return null;
  }

  const docRef = doc(db, 'groups', groupCode, 'settings', 'accounts');

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as SharedAccounts);
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

// 기존 로컬 통장 데이터 업로드 (현재 사용자를 소유자로 설정)
export async function uploadLocalAccounts(
  accounts: string[],
  balances: AccountBalances
): Promise<boolean> {
  const uid = getCurrentUid();
  if (!uid) return false;

  // 모든 통장의 소유자를 현재 사용자로 설정
  const owners: AccountOwnership = {};
  for (const acc of accounts) {
    owners[acc] = uid;
  }

  return await saveSharedAccounts(accounts, balances, owners);
}

// 새 통장 추가 시 소유자 설정
export async function addSharedAccount(
  accountName: string,
  initialBalance: number = 0
): Promise<boolean> {
  const uid = getCurrentUid();
  const groupCode = await getCurrentGroupCode();

  if (!uid || !groupCode) return false;

  // 기존 데이터 가져오기
  const existing = await getSharedAccounts();
  const accounts = existing?.accounts || [];
  const balances = existing?.balances || {};
  const owners = existing?.owners || {};

  // 이미 존재하는 통장인지 확인
  if (accounts.includes(accountName)) {
    return false;
  }

  // 새 통장 추가
  accounts.push(accountName);
  balances[accountName] = initialBalance;
  owners[accountName] = uid;

  return await saveSharedAccounts(accounts, balances, owners);
}
