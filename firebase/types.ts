// Firestore에 저장되는 공유 가계부 타입

export interface SharedBudget {
  id: string;
  money: number;          // 양수 = 수입, 음수 = 지출
  date: string;           // "YYYY-MM-DD"
  account: string;        // 통장명
  category: string;       // 카테고리
  memo: string;           // 메모 (제목)
  author: string;         // 작성자 uid
  authorName: string;     // 작성자 표시 이름
  createdAt: number;      // timestamp
  updatedAt: number;      // timestamp
}

// Firestore에 저장되는 공유 할 일 타입
export type SharedTodoType = 'RECURRING' | 'MONTHLY_RECURRING' | 'DEADLINE' | 'SPECIFIC' | 'DATE_RANGE';

export interface SharedTodo {
  id: string;
  title: string;                    // 일정
  type: SharedTodoType;             // 유형
  completed: boolean;

  // 날짜 관련 필드 (유형에 따라 사용)
  recurringDay?: string;            // 요일 반복 (월, 화, 수...)
  monthlyRecurringDay?: number;     // 월 반복 (1~31)
  deadline?: string;                // 마감일 "YYYY-MM-DD"
  specificDate?: string;            // 특정 날짜 "YYYY-MM-DD"
  dateRangeStart?: string;          // 기간 시작 "YYYY-MM-DD"
  dateRangeEnd?: string;            // 기간 종료 "YYYY-MM-DD"

  // 공유 관련 필드
  author: string;                   // 작성자 uid
  authorName: string;               // 작성자 표시 이름
  createdAt: number;                // timestamp
  updatedAt: number;                // timestamp
}

export interface Group {
  code: string;
  name?: string;          // 그룹 이름 (선택)
  members: string[];      // uid 배열
  memberNames: {          // uid -> 표시 이름 매핑
    [uid: string]: string;
  };
  createdAt: number;
}

export interface GroupMember {
  uid: string;
  name: string;
}
