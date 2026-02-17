# PerfectCalendar 기능 사양서

## 앱 개요

PerfectCalendar는 React Native(Expo) + TypeScript 기반 모바일 앱으로, 캘린더 / 할 일 관리 / 가계부 / 투자 추적을 통합한 개인 및 가족 재무·일정 관리 플랫폼입니다. 로컬 저장(AsyncStorage)과 Firebase 클라우드 실시간 동기화를 지원합니다.

---

## 1. 앱 구조 및 네비게이션

### 1.1 탭 바 (하단 5개 탭)

| 탭 | 아이콘 | 화면 | 설명 |
|----|--------|------|------|
| 투자 | 📈 | InvestmentScreen | 주식 포트폴리오 및 적금/예금 관리 |
| 할 일 | ✅ | TodoFullList | 전체 할 일 목록 (풀스크린) |
| 홈 | 🏠 | CalendarView + TodoList + BudgetList | 캘린더 + 일일 할 일 + 일일 가계부 |
| 가계부 | 💰 | BudgetFullList | 월간 통계 및 상세 분석 |
| 함께해요 | 👨‍👩‍👧 | TogetherScreen | 그룹 공유 모드 |

### 1.2 화면 계층 구조

```
App.tsx
├─ OnboardingScreen (최초 실행 시 초기 설정)
└─ AppContent
   ├─ InvestmentScreen (투자 탭)
   ├─ TodoFullList (할 일 탭)
   ├─ Home (홈 탭)
   │  ├─ CalendarView (달력)
   │  ├─ TodoList (선택 날짜의 할 일)
   │  └─ BudgetList (선택 날짜의 가계부)
   ├─ BudgetFullList (가계부 탭)
   └─ TogetherScreen (함께해요 탭)
```

---

## 2. 온보딩

### 2.1 OnboardingScreen (최초 실행 시 2페이지)

**페이지 1 — 앱 소개**
- 앱 로고 및 소개 문구
- 5가지 주요 기능 카드 표시
- "다음" 버튼

**페이지 2 — 초기 설정**
- 통장 관리: 기본값 '기본' 포함, 추가/삭제
- 지출 카테고리 관리: 기본값 '식비', '저축' 포함, 칩 형태
- "시작하기" 버튼으로 완료

**저장**: `@onboarding_complete` 플래그, 통장·카테고리를 AsyncStorage에 저장

---

## 3. 캘린더 (홈 탭 상단)

### 3.1 CalendarView

- 월간 달력 그리드 (일~토)
- 요일별 색상: 일요일(빨강), 토요일(파랑), 평일(검정)
- 오늘 날짜 강조 (파란 텍스트)
- 선택 날짜 파란 배경 원형 강조

**네비게이션**
- ◀/▶ 화살표: 이전/다음 월
- 연도/월 텍스트 클릭: 연도(100년 범위) 및 월 선택 모달
- 날짜 클릭: `selectedDate` 업데이트 → 하단 TodoList/BudgetList에 전파

---

## 4. 할 일 시스템

### 4.1 할 일 타입 (5종)

| 타입 | 설명 | 필터링 기준 | 표시 예시 |
|------|------|-----------|----------|
| RECURRING | 매주 반복 | 선택 날짜의 요일 = recurringDay | "매주 월요일" |
| MONTHLY_RECURRING | 매달 반복 | 선택 날짜의 일자 = monthlyRecurringDay | "매달 15일" |
| DEADLINE | 기한 | 선택 날짜 ≤ deadline | "D-3", "D-DAY" |
| SPECIFIC | 특정일 | 선택 날짜 = specificDate | (표시 없음) |
| DATE_RANGE | 연속 일정 | start ≤ 선택 날짜 ≤ end | "1/15 ~ 1/20" |

### 4.2 TodoList (홈 탭, 일일 보기)

- 선택 날짜에 해당하는 할 일만 필터링
- 제목: "{날짜} 할 일" (예: "2024년 1월 15일 월요일 할 일")
- "+" 버튼으로 새 할 일 추가
- 항목 클릭 → 편집/삭제 모달
- 체크박스 클릭 → 완료 토글 (취소선 + 회색 처리)
- **그룹 모드**: 작성자별 색상 도트 표시

### 4.3 TodoFullList (할 일 탭, 전체 보기)

3개 섹션으로 분류:
1. **활성**: 진행 중이고 기한 미경과
2. **기한 지남**: 마감일/종료일이 지난 항목 (배경 연빨강)
3. **완료**: 완료된 항목 (배경 연초록)

각 섹션 내에서 날짜순 정렬. 날짜 헤더로 그룹화.
각 항목: 체크박스 + 작성자 도트(그룹) + 제목 + 타입 태그(주간/월간/기한/특정일/범위)

### 4.4 AddTodoModal (생성/편집)

- 제목 입력 (필수)
- 타입 선택 (라디오 버튼 5개)
- 타입별 추가 필드:
  - RECURRING: 요일 드롭다운
  - MONTHLY_RECURRING: 일자 드롭다운 (1-31)
  - DEADLINE/SPECIFIC: 날짜 선택 (+/- 버튼)
  - DATE_RANGE: 시작일 + 종료일
- 편집 모드: 기존 값 프리필

### 4.5 TodoActionModal

- "편집" 버튼 → AddTodoModal(편집 모드)
- "삭제" 버튼 → 확인 다이얼로그 후 삭제

---

## 5. 가계부 시스템

### 5.1 가계부 데이터 구조

| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 타임스탬프 기반 ID |
| title | string | 항목명 (예: 월급, 카페) |
| money | number | 금액 (양수) |
| date | string | YYYY-MM-DD |
| type | 'INCOME' \| 'EXPENSE' | 수입/지출 |
| category | string | 카테고리 (예: 급여, 식비) |
| account | string | 통장명 (선택) |
| authorUid | string | 그룹 모드 작성자 UID |
| authorName | string | 그룹 모드 작성자 이름 |
| savingsId | string | 적금 자동납입 연결 시 |

### 5.2 BudgetList (홈 탭, 일일 보기)

- 선택 날짜의 지출/수입만 표시
- 제목: "{날짜} 가계부"
- "+" 버튼으로 추가
- 항목: 제목 + 금액(수입 초록/지출 빨강) + 카테고리 + 통장번호 칩
- **그룹 모드**: 작성자 색상 도트

### 5.3 BudgetFullList (가계부 탭, 월간 분석)

**월 네비게이터**: ◀ 2024년 1월 ▶ + "전체" 버튼 + ⚙ 설정

**설정 메뉴 (3가지)**:
1. 지출 목표 설정
2. 카테고리 관리
3. 통장 관리

**하위 컴포넌트**:
- MonthlySummaryCard (월간 통계)
- MonthlyChartCard (6개월 비교 차트)

### 5.4 MonthlySummaryCard (월간 통계)

**통장별 잔액**
- 각 통장명 + 잔액 (파랑/빨강)
- 그룹 모드: 소유자 색상 바 표시

**이번 달 지출 목표** (설정 시)
- 목표 금액 표시

**월간 통계 그리드 (2×4)**

| 항목 | 색상 | 설명 |
|------|------|------|
| 수입 | 초록 | 총 INCOME 합계 |
| 수입 대비 지출 | — | (총 지출 ÷ 수입) × 100% |
| 저축 | 파랑 | category='저축' 수입(INCOME) 합계 |
| 고정지출 | 주황 | 고정 카테고리 지출 합계 |
| 총 지출 ▼ | 빨강 | 저축 제외 모든 지출 (클릭 시 카테고리별 펼침) |
| 전년 대비 고정지출 | 증가빨강/감소초록 | YoY 성장률 |
| 전년 대비 지출 | 증가빨강/감소초록 | YoY 성장률 |
| 목표 잔여 | 초록/빨강 | 목표 − (총 지출 − 고정지출) |

**카테고리별 지출** (총 지출 클릭 시 토글)
- 카테고리명 + 금액 + 비율(%)

### 5.5 MonthlyChartCard (6개월 비교 차트)

- 선택 월 기준 과거 6개월 데이터
- 막대: 수입 / 저축 / 고정지출 / 총 지출
- 라인: 수입 대비 지출 비율 (우측 Y축)

### 5.6 AddBudgetModal (생성/편집)

- 항목명 (필수)
- 금액 (필수, 양수 입력)
- 타입: INCOME / EXPENSE 토글
- 카테고리 드롭다운 (+ 새 카테고리 즉석 추가)
- 통장 드롭다운 (+ 새 통장 즉석 추가)

### 5.7 SetGoalModal (월별 목표)

- 현재 월의 지출 목표 금액 입력
- 저장/삭제 버튼
- 삭제 시 해당 월 목표 해제

### 5.8 CategoryManageModal (카테고리 관리)

- 일반 카테고리 목록 (칩 형태, ✕로 삭제)
- 고정지출 카테고리 체크박스 선택
- 새 카테고리 추가 입력

### 5.9 AccountManageModal (통장 관리)

- 통장 목록 (▲▼ 버튼으로 순서 변경)
- 통장명 편집 (✎ 클릭)
- 통장 삭제
- **그룹 모드**: 소유자 변경 (멤버 드롭다운, 색상 도트)

### 5.10 OverallStatsModal (전체 통계)

- "전체" 버튼 클릭 시 표시
- 전체 기간: 총 수입, 총 지출
- 카테고리별 지출 금액 + 비율(%)

### 5.11 BudgetTutorial (가계부 온보딩)

가계부 탭 최초 방문 시 4단계 튜토리얼:
0. ⚙ 설정 버튼 소개
1. 지출 목표 설정 하이라이트
2. 카테고리 관리 하이라이트
3. 통장 관리 하이라이트

"다음" / "건너뛰기" 선택. 완료 후 `@budget_tutorial_complete` 저장.

---

## 6. 투자 시스템

### 6.1 InvestmentScreen (투자 탭)

**헤더**: "저축/투자" + 새로고침 버튼 + Pull-to-refresh

**3개 섹션**:

1. **InvestmentSummaryCard** — 자산 요약
   - 한국 주식 총 평가액 (원)
   - 미국 주식 총 평가액 (USD)
   - 총 평가 손익

2. **InvestmentList** — 투자 목록
   - 한국/미국 구분
   - 각 항목: 종목명 + 보유수 + 평균가 + 현재가 + 손익

3. **SavingsList** — 적금/예금 목록 (아래 7장 참조)

### 6.2 AddInvestmentModal (종목 추가/편집)

- 종목 검색 (인라인, 0.4초 디바운스)
- 검색 결과: 종목코드 + 종목명 + 시장(KOSPI/KOSDAQ/NYSE/NASDAQ)
- 종목 선택 후: 보유 수량 + 평균 매입가 입력
- 편집 모드: 기존 값 프리필

### 6.3 InvestmentActionModal (상세/편집/삭제)

- 종목명 + 시장
- 보유수, 평균가, 현재가, 평가손익
- "편집" / "삭제" 버튼

### 6.4 주가 조회

`services/stockService.ts`:
- `searchStocks(query)`: KRX/NASDAQ 종목 검색
- `getMultipleStockPrices(stocks)`: 현재가·전일대비·변동률 조회

---

## 7. 적금/예금 시스템

### 7.1 적금 타입 (3종)

| 타입 | 설명 | 고유 필드 |
|------|------|----------|
| FIXED_DEPOSIT | 정기예금 | principal (원금) |
| INSTALLMENT_SAVINGS | 정기적금 | monthlyAmount (월 납입금), paymentDay (납입일) |
| FREE_SAVINGS | 자유적금 | minMonthlyAmount, maxMonthlyAmount |

### 7.2 AddSavingsModal (생성/편집)

- 적금 타입 선택 (라디오)
- 상품명, 은행명 (드롭다운: 국민/신한/우리/하나/NH/카카오/토스/SC/기업/새마을/기타)
- 금리(%), 시작일, 만기일 (DateTimePicker)
- 타입별 추가 필드
**연결 통장**: 저장 시 `[은행명] 상품명` 형식으로 자동 생성

### 7.3 SavingsList

- 현재 총액 (`getTotalSavingsValue`)
- 예상 만기액 (`getTotalExpectedMaturity`)
- 각 상품: 상품명 + 은행 + 만기일 + 현재액

### 7.4 자동 납입

- 정기적금(`INSTALLMENT_SAVINGS`) 생성 시, 누락된 납입 기록을 가계부(`Budget`)에 자동 생성
- `savingsId`와 `savingsPaymentDate`로 연결
- 타입: `INCOME` (적금 연결 통장으로 돈이 들어가는 개념)
- 통장: 해당 적금의 `linkedAccountName` (예: `[국민] 적금상품명`)
- 카테고리: '저축'

### 7.5 이자 계산 로직

| 타입 | 공식 |
|------|------|
| 정기예금 | 원금 × (1 + 금리/100 × 일수/365) |
| 정기적금 | 월납입 × ((1 + r/12)^월수 − 1) / (r/12) |
| 자유적금 | 초기잔액 기준 + 추정 이자 |

---

## 8. 그룹 공유 모드 (함께해요)

### 8.1 화면 상태 (3가지)

**미연결 (not_connected)**
- "함께해요" 헤더 + 설명
- "공유 코드 만들기" 버튼 (파랑)
- "코드로 참여하기" 버튼 (회색)
- "이렇게 사용해요" 3단계 안내 카드

**그룹 생성 입력**
- 그룹 이름 (선택, 예: "우리 가족")
- 내 이름 (필수, 예: "남편")
- 기존 데이터 공유 체크박스 (가계부 N개, 할 일 N개, 통장 N개)
- "만들기" 버튼 → 6자리 공유 코드 생성

**그룹 참여 입력**
- 내 이름 (필수)
- 6자리 그룹 코드 (대문자 자동 변환)
- "참여하기" 버튼

**연결됨 (connected)**
- 그룹명 (또는 "그룹 연결됨")
- 공유 코드 (큰 글자 32px)
- 내 이름
- 멤버 목록 (N명): 색상 도트 + 이름
  - 자기 자신의 도트 터치 → 색상 선택 행 토글
- "코드 공유하기" 버튼 (Share API)
- "그룹 나가기" 버튼 (확인 후 실행)

### 8.2 그룹 생성 흐름

```
"공유 코드 만들기" → 이름 입력 → "만들기"
  → Firebase 익명 인증
  → 6자리 코드 생성 (충돌 체크)
  → Firestore groups/{code} 문서 생성
  → 기존 데이터 업로드 (선택 시): 가계부, 할 일, 통장, 카테고리
  → 실시간 구독 시작
  → 공유 코드 표시
```

### 8.3 그룹 참여 흐름

```
"코드로 참여하기" → 이름 + 코드 입력 → "참여하기"
  → Firebase에서 그룹 확인
  → 멤버로 추가 (members, memberNames)
  → 로컬 카테고리와 원격 카테고리 병합
  → 실시간 구독 시작
```

### 8.4 그룹 나가기 흐름

```
"그룹 나가기" → 확인 다이얼로그
  → 구독 해제 + 내 데이터 보존 (disconnectGroup)
    - 내 가계부/할 일만 Firebase에서 가져옴
    - 내 통장만 유지 (소유자 기준 + 소유자 미지정 포함)
    - 로컬 AsyncStorage에 저장
  → Firebase에서 멤버 제거 (leaveGroup)
    - members 배열에서 uid 제거
    - memberNames, memberColors에서 해당 uid 삭제
```

### 8.5 실시간 동기화

5개 Firestore 구독이 병렬로 초기화 (`Promise.allSettled`):

| 구독 | Firestore 경로 | 동기화 대상 |
|------|---------------|-----------|
| 가계부 | groups/{code}/budgets/ | budgets |
| 할 일 | groups/{code}/todos/ | todos |
| 통장 | groups/{code}/settings/accounts | accounts, owners |
| 카테고리 | groups/{code}/settings/categories | categories, fixedCategories |
| 그룹 정보 | groups/{code} | memberNames, memberColors |

**안정화 장치**:
- `_syncInProgress` 플래그: 중복 호출 방지
- `_fixingOrphans` 플래그: 고아 통장 보정 무한 루프 방지
- 각 구독 실패 시 경고 로그 (다른 구독에 영향 없음)

### 8.6 멤버 색상 시스템

**10가지 색상 팔레트**: 파랑, 핑크, 초록, 주황, 보라, 청록, 빨강, 남색, 갈색, 회청

**자동 할당**: UID 정렬 후 인덱스 기반
**커스텀 선택**: 함께해요 탭에서 자기 도트 터치 → 색상 선택
- 다른 멤버가 사용 중인 색상은 `opacity: 0.3` + 비활성화
- 선택 시 `saveMemberColor(uid, color)` → Firebase 저장 → 실시간 반영

### 8.7 작성자 라벨링 (그룹 모드 전용)

**표시 위치**:
- TodoItem / TodoFullList: 제목 앞 7×7 색상 도트
- BudgetItem: 제목 앞 7×7 색상 도트
- MonthlySummaryCard 통장 잔액: 소유자 색상 바 (4×20)

**동작**: 솔로 모드에서는 도트 미표시

---

## 9. 데이터 저장 구조

### 9.1 로컬 저장소 (AsyncStorage)

| 키 | 데이터 타입 | 설명 |
|----|-----------|------|
| `@todos` | Todo[] | 할 일 목록 |
| `@budgets` | Budget[] | 가계부 항목 |
| `@budget_categories` | string[] | 카테고리 목록 |
| `@fixed_expense_categories` | string[] | 고정지출 카테고리 |
| `@monthly_goals` | { [YYYY-MM]: number } | 월별 목표 |
| `@accounts` | string[] | 통장 목록 |
| `@investments` | Investment[] | 투자 항목 |
| `@savings` | Savings[] | 적금/예금 항목 |
| `@onboarding_complete` | boolean | 온보딩 완료 여부 |
| `@budget_tutorial_complete` | boolean | 가계부 튜토리얼 완료 |
| `@group_code` | string | 현재 그룹 코드 |
| `@user_name` | string | 그룹 내 이름 |

### 9.2 Firebase Firestore (그룹 모드)

```
groups/{groupCode}/
  ├─ (문서 자체) → members[], memberNames{}, memberColors{}, name?, createdAt
  ├─ budgets/{budgetId} → SharedBudget (money, date, account, category, memo, author, authorName)
  ├─ todos/{todoId} → SharedTodo (title, type, completed, 날짜필드들, author, authorName)
  └─ settings/
     ├─ accounts → { accounts[], owners{} }
     └─ categories → { categories[], fixedCategories[] }
```

### 9.3 iOS 위젯 동기화

App Group 공유 저장소를 통해 iOS 위젯에 데이터 동기화:
`widget_todos`, `widget_budgets`, `widget_accounts`, `widget_fixed_expense_categories`, `widget_monthly_goals`

---

## 10. 상태 관리 아키텍처

### 10.1 AppDataStore (싱글톤)

OOP 패턴의 중앙 데이터 저장소:
- 모든 데이터의 단일 진실 공급원 (Single Source of Truth)
- 옵저버 패턴으로 React 연동 (`subscribe` / `notify`)
- 디바운스된 AsyncStorage 저장 (500ms)
- 그룹/솔로 모드 자동 분기

### 10.2 도메인별 Context 분리

불필요한 리렌더 방지를 위해 6개 Context로 분리:

| Context | 데이터 | 주요 소비자 |
|---------|--------|-----------|
| StoreContext | store, isLoaded | App, 모든 CRUD 컴포넌트 |
| TodoContext | todos | TodoList, TodoFullList |
| BudgetContext | budgets, categories, fixedCategories, monthlyGoals | BudgetList, BudgetFullList |
| AccountContext | accounts, accountOwners | BudgetList, BudgetFullList |
| GroupContext | isGroupConnected, memberNames, memberColors, groupCode, userName | 그룹 관련 컴포넌트 |
| InvestmentContext | investments, savings | InvestmentScreen |

**효과**: 가계부 변경 시 TodoList 리렌더 안 됨, 멤버 정보 변경 시 투자 화면 리렌더 안 됨

---

## 11. 유틸리티

### 11.1 포맷팅 (`utils/format.ts`)

- `formatMoneyKorean(1000000)` → "1,000,000원"
- `formatDateKorean(date)` → "2024년 1월 15일 월요일"

### 11.2 가계부 분석 (`utils/budgetAnalytics.ts`)

- `computeMonthlyStats()`: 월간 수입/지출/저축/고정지출/카테고리별 통계
- `computeYoYGrowthRate()`: 전년 동월 대비 증감률
- `getMultiMonthChartData()`: 6개월 차트 데이터
- `computeAccountBalances()`: 통장별 잔액 계산 (수입 합계 − 지출 합계)

### 11.3 적금 계산 (`utils/savingsCalculator.ts`)

- `getTotalSavingsValue()`: 현재 총 적금 평가액
- `getTotalExpectedMaturity()`: 예상 만기 총액
- `getMissingSavingsPayments()`: 누락된 자동 납입 검출

### 11.4 주가 서비스 (`services/stockService.ts`)

- `searchStocks(query)`: 종목 검색 (KRX/NASDAQ)
- `getMultipleStockPrices(stocks)`: 복수 종목 현재가 조회

---

## 12. UI/UX 특징

### 12.1 디자인 원칙

- **캘린더 중심**: 홈에서 날짜 선택 → 하루 할 일/가계부 즉시 확인
- **모달 기반 CRUD**: 추가/편집/삭제 모두 모달로 처리
- **색상 시각화**: 수입 초록 / 지출 빨강 / 증가 빨강 / 감소 초록
- **그룹 구분**: 멤버별 고유 색상 도트
- **키보드 대응**: 모든 입력 모달에 KeyboardAvoidingView 적용 (iOS)

### 12.2 색상 팔레트

| 용도 | 색상 |
|------|------|
| 주색 | #4A90E2 (파랑) |
| 수입/긍정 | #4CAF50 (초록) |
| 지출/경고 | #F44336 (빨강) |
| 고정지출 | #FF9800 (주황) |
| 저축 | #2196F3 (파랑) |
| 배경 | #F8F9FA, #f0f0f0 |

### 12.3 데이터 포맷

| 항목 | 형식 |
|------|------|
| 날짜 저장 | YYYY-MM-DD |
| 날짜 표시 | "2024년 1월 15일" |
| 금액 표시 | 3자리 쉼표 + "원" (또는 "USD") |
| 그룹 코드 | 6자리 대문자 (혼동 문자 I,O,1,0 제외) |

---

## 13. 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | React Native (Expo Managed) |
| 언어 | TypeScript (strict mode) |
| 상태 관리 | Custom Singleton Store + React Context |
| 로컬 저장 | AsyncStorage |
| 클라우드 | Firebase Firestore + Anonymous Auth |
| 차트 | Chart.js + WebView |
| 위젯 | react-native-shared-group-preferences (iOS) |
| 날짜 선택 | @react-native-community/datetimepicker |
