import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from './config';
import { Group } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GROUP_CODE_KEY = '@group_code';
const USER_NAME_KEY = '@user_name';

// 6자리 랜덤 코드 생성
function generateGroupCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동되는 문자 제외 (0,O,1,I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 익명 로그인 (자동)
export async function ensureAuthenticated(): Promise<string> {
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }

  const result = await signInAnonymously(auth);
  return result.user.uid;
}

// 현재 사용자 UID 가져오기
export function getCurrentUid(): string | null {
  return auth.currentUser?.uid || null;
}

// 그룹 생성
export async function createGroup(userName: string, groupName?: string): Promise<string> {
  const uid = await ensureAuthenticated();

  // 유니크한 코드 생성 (충돌 체크)
  let code = generateGroupCode();
  let attempts = 0;
  while (attempts < 10) {
    const docRef = doc(db, 'groups', code);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) break;
    code = generateGroupCode();
    attempts++;
  }

  const group: Omit<Group, 'code'> = {
    name: groupName || undefined,
    members: [uid],
    memberNames: { [uid]: userName },
    createdAt: Date.now()
  };

  await setDoc(doc(db, 'groups', code), group);

  // 로컬에 저장
  await AsyncStorage.setItem(GROUP_CODE_KEY, code);
  await AsyncStorage.setItem(USER_NAME_KEY, userName);

  return code;
}

// 그룹 참여
export async function joinGroup(code: string, userName: string): Promise<boolean> {
  const uid = await ensureAuthenticated();

  const docRef = doc(db, 'groups', code.toUpperCase());
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return false; // 그룹 없음
  }

  // 멤버 추가
  await updateDoc(docRef, {
    members: arrayUnion(uid),
    [`memberNames.${uid}`]: userName
  });

  // 로컬에 저장
  await AsyncStorage.setItem(GROUP_CODE_KEY, code.toUpperCase());
  await AsyncStorage.setItem(USER_NAME_KEY, userName);

  return true;
}

// 현재 그룹 코드 가져오기
export async function getCurrentGroupCode(): Promise<string | null> {
  return await AsyncStorage.getItem(GROUP_CODE_KEY);
}

// 현재 사용자 이름 가져오기
export async function getCurrentUserName(): Promise<string | null> {
  return await AsyncStorage.getItem(USER_NAME_KEY);
}

// 그룹 정보 가져오기
export async function getGroupInfo(code: string): Promise<Group | null> {
  const docRef = doc(db, 'groups', code);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { code, ...docSnap.data() } as Group;
}

// 그룹 나가기 (로컬 정보만 삭제)
export async function leaveGroup(): Promise<void> {
  await AsyncStorage.removeItem(GROUP_CODE_KEY);
  await AsyncStorage.removeItem(USER_NAME_KEY);
}

// 그룹 연결 여부 확인
export async function isGroupConnected(): Promise<boolean> {
  const code = await getCurrentGroupCode();
  return code !== null;
}
