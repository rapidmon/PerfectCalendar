// Firebase 설정
export { auth, db } from './config';

// 타입
export type { SharedBudget, SharedTodo, SharedTodoType, Group, GroupMember } from './types';

// 그룹 서비스
export {
  ensureAuthenticated,
  getCurrentUid,
  createGroup,
  joinGroup,
  getCurrentGroupCode,
  getCurrentUserName,
  getGroupInfo,
  leaveGroup,
  isGroupConnected,
  subscribeToGroupAsync,
  saveMemberColor
} from './groupService';

// 가계부 서비스
export {
  addSharedBudget,
  updateSharedBudget,
  deleteSharedBudget,
  subscribeToSharedBudgetsAsync,
  convertToSharedBudget,
  convertToLocalBudget,
  uploadLocalBudgets,
  fetchMyBudgets
} from './budgetService';

// 할 일 서비스
export {
  addSharedTodo,
  updateSharedTodo,
  deleteSharedTodo,
  toggleSharedTodoComplete,
  subscribeToSharedTodosAsync,
  convertToSharedTodo,
  convertToLocalTodo,
  uploadLocalTodos,
  fetchMyTodos
} from './todoService';

// 통장 서비스
export {
  saveSharedAccounts,
  getSharedAccounts,
  subscribeToSharedAccountsAsync,
  uploadLocalAccounts,
  addSharedAccount
} from './accountService';
export type { SharedAccounts, AccountOwnership } from './accountService';

// 카테고리 서비스
export {
  saveSharedCategories,
  getSharedCategories,
  subscribeToSharedCategoriesAsync,
  uploadLocalCategories
} from './categoryService';
export type { SharedCategories } from './categoryService';
