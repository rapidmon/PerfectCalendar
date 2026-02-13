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
import { SharedTodo, SharedTodoType } from './types';
import { getCurrentGroupCode, getCurrentUserName, getCurrentUid } from './groupService';

// 할 일 추가
export async function addSharedTodo(
  todo: Omit<SharedTodo, 'id' | 'author' | 'authorName' | 'createdAt' | 'updatedAt'>
): Promise<string | null> {
  const groupCode = await getCurrentGroupCode();
  const userName = await getCurrentUserName();
  const uid = getCurrentUid();

  if (!groupCode || !userName || !uid) {
    return null; // 그룹 미연결
  }

  const todosRef = collection(db, 'groups', groupCode, 'todos');

  const newTodo = {
    ...todo,
    author: uid,
    authorName: userName,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const docRef = await addDoc(todosRef, newTodo);
  return docRef.id;
}

// 할 일 수정
export async function updateSharedTodo(
  todoId: string,
  updates: Partial<Omit<SharedTodo, 'id' | 'author' | 'authorName' | 'createdAt'>>
): Promise<boolean> {
  const groupCode = await getCurrentGroupCode();

  if (!groupCode) {
    return false;
  }

  const docRef = doc(db, 'groups', groupCode, 'todos', todoId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: Date.now()
  });

  return true;
}

// 할 일 삭제
export async function deleteSharedTodo(todoId: string): Promise<boolean> {
  const groupCode = await getCurrentGroupCode();

  if (!groupCode) {
    return false;
  }

  const docRef = doc(db, 'groups', groupCode, 'todos', todoId);
  await deleteDoc(docRef);

  return true;
}

// 할 일 완료 상태 토글
export async function toggleSharedTodoComplete(todoId: string, completed: boolean): Promise<boolean> {
  return await updateSharedTodo(todoId, { completed });
}

// 실시간 할 일 구독 (비동기 초기화)
export async function subscribeToSharedTodosAsync(
  onUpdate: (todos: SharedTodo[]) => void,
  onError?: (error: Error) => void
): Promise<Unsubscribe | null> {
  const groupCode = await getCurrentGroupCode();

  if (!groupCode) {
    return null;
  }

  const todosRef = collection(db, 'groups', groupCode, 'todos');
  const q = query(todosRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const todos: SharedTodo[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as SharedTodo));
      onUpdate(todos);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );

  return unsubscribe;
}

// 로컬 Todo를 SharedTodo 형식으로 변환
export function convertToSharedTodo(
  localTodo: {
    title: string;
    type: SharedTodoType;
    completed: boolean;
    recurringDay?: string;
    monthlyRecurringDay?: number;
    deadline?: string;
    specificDate?: string;
    dateRangeStart?: string;
    dateRangeEnd?: string;
  }
): Omit<SharedTodo, 'id' | 'author' | 'authorName' | 'createdAt' | 'updatedAt'> {
  return {
    title: localTodo.title,
    type: localTodo.type,
    completed: localTodo.completed,
    recurringDay: localTodo.recurringDay,
    monthlyRecurringDay: localTodo.monthlyRecurringDay,
    deadline: localTodo.deadline,
    specificDate: localTodo.specificDate,
    dateRangeStart: localTodo.dateRangeStart,
    dateRangeEnd: localTodo.dateRangeEnd
  };
}

// SharedTodo를 로컬 Todo 형식으로 변환
export function convertToLocalTodo(
  sharedTodo: SharedTodo
): {
  id: string;
  title: string;
  type: SharedTodoType;
  completed: boolean;
  recurringDay?: string;
  monthlyRecurringDay?: number;
  deadline?: string;
  specificDate?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  createdAt?: string;
} {
  return {
    id: sharedTodo.id,
    title: sharedTodo.title,
    type: sharedTodo.type,
    completed: sharedTodo.completed,
    recurringDay: sharedTodo.recurringDay,
    monthlyRecurringDay: sharedTodo.monthlyRecurringDay,
    deadline: sharedTodo.deadline,
    specificDate: sharedTodo.specificDate,
    dateRangeStart: sharedTodo.dateRangeStart,
    dateRangeEnd: sharedTodo.dateRangeEnd,
    createdAt: new Date(sharedTodo.createdAt).toISOString()
  };
}

// 기존 로컬 할 일 데이터 일괄 업로드 (배치 쓰기)
export async function uploadLocalTodos(
  todos: Array<{
    title: string;
    type: SharedTodoType;
    completed: boolean;
    recurringDay?: string;
    monthlyRecurringDay?: number;
    deadline?: string;
    specificDate?: string;
    dateRangeStart?: string;
    dateRangeEnd?: string;
  }>
): Promise<number> {
  const groupCode = await getCurrentGroupCode();
  const userName = await getCurrentUserName();
  const uid = getCurrentUid();
  if (!groupCode || !userName || !uid) return 0;

  const todosRef = collection(db, 'groups', groupCode, 'todos');
  let uploadedCount = 0;

  for (let i = 0; i < todos.length; i += 500) {
    const chunk = todos.slice(i, i + 500);
    const batch = writeBatch(db);

    for (const todo of chunk) {
      const sharedTodo = convertToSharedTodo(todo);
      const newDocRef = doc(todosRef);
      batch.set(newDocRef, {
        ...sharedTodo,
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

// 할 일 일괄 삭제 (배치)
export async function deleteSharedTodosBatch(todoIds: string[]): Promise<void> {
  const groupCode = await getCurrentGroupCode();
  if (!groupCode || todoIds.length === 0) return;

  for (let i = 0; i < todoIds.length; i += 500) {
    const chunk = todoIds.slice(i, i + 500);
    const batch = writeBatch(db);
    for (const id of chunk) {
      batch.delete(doc(db, 'groups', groupCode, 'todos', id));
    }
    await batch.commit();
  }
}

// 내가 작성한 할 일 데이터만 가져오기
export async function fetchMyTodos(groupCode: string): Promise<SharedTodo[]> {
  const uid = getCurrentUid();

  if (!uid || !groupCode) {
    return [];
  }

  try {
    const todosRef = collection(db, 'groups', groupCode, 'todos');
    const q = query(todosRef, where('author', '==', uid));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    } as SharedTodo));
  } catch (error) {
    console.error('내 할 일 가져오기 실패:', error);
    return [];
  }
}
