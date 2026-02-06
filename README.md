# PerfectCalendar

가계부 + 달력 + 할 일 + 투자 + 함께해요를 하나로! 📅💰✅📈👨‍👩‍👧

## 프로젝트 소개
Android와 iOS에서 사용 가능한 올인원 생산성 앱

### 주요 기능
- 📅 **달력**: 일정 관리 및 월간/주간 보기
- ✅ **할 일**: 반복, 마감일, 특정일 등 다양한 일정 유형 관리
- 💰 **가계부**: 통장별 수입/지출 추적 및 카테고리별 통계
- 📈 **투자**: 한국/미국 주식 포트폴리오 관리 및 실시간 시세 조회
- 🏦 **적금**: 정기예금/적금 관리 및 자동 이체 예산 생성
- 👨‍👩‍👧 **함께해요**: Firebase 기반 가족/커플 가계부 & 할 일 공유
- 📱 **위젯**:
  - Android: 가계부 요약 + 할 일 목록 위젯 (react-native-android-widget)
  - iOS: WidgetKit 기반 네이티브 위젯

## 기술 스택
- React Native (Expo SDK 54)
- TypeScript
- Firebase (Firestore, Anonymous Auth)
- AsyncStorage
- react-native-android-widget (Android 위젯)
- iOS WidgetKit (Swift, Expo Config Plugin)
- Naver Finance API / Finnhub API (주식 시세)

## 시작하기

### 1. 저장소 클론
```bash
git clone https://github.com/rapidmon/PerfectCalendar.git
cd PerfectCalendar
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 앱 실행
```bash
npm start
```

### 4. 개발 모드로 실행
- Android: `a` 키 입력 (Android Studio 에뮬레이터 필요)
- iOS: `i` 키 입력 (Mac + Xcode 필요)
- 실제 기기: Expo Go 앱으로 QR 코드 스캔

## 프로젝트 구조
```
PerfectCalendar/
├── components/          # UI 컴포넌트 및 모달
├── contexts/            # React Context (AppDataProvider)
├── stores/              # 싱글톤 스토어 (AppDataStore)
├── firebase/            # Firebase 설정 및 그룹 공유 서비스
├── services/            # 주식 시세 API, 캐시 등
├── types/               # TypeScript 타입 정의
├── utils/               # 유틸리티 함수 및 AsyncStorage 래퍼
├── widgets/             # Android 위젯 핸들러
├── plugins/             # Expo Config Plugin (iOS 위젯)
├── ios-widget/          # iOS WidgetKit Swift 코드
├── assets/              # 이미지, 폰트 등
└── App.tsx              # 앱 진입점 (5탭 네비게이션)
```

## 개발 가이드

### 코드 스타일
- TypeScript strict 모드 사용
- 함수형 컴포넌트 + Hooks 사용

### 상태 관리
- OOP 싱글톤 스토어 (`AppDataStore`) + React Context 패턴
- 로컬 모드: AsyncStorage에 디바운스 저장
- 그룹 모드: Firebase Firestore 실시간 동기화

## 라이센스
MIT

## 개발자
rapidmon
