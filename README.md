# PerfectCalendar

가계부 + 달력 + 할 일 관리를 하나로! 📅💰✅

## 프로젝트 소개
Android와 iOS에서 사용 가능한 올인원 생산성 앱

### 주요 기능
- 📅 **달력**: 일정 관리 및 월간/주간 보기
- 💰 **가계부**: 수입/지출 관리 및 통계
- ✅ **할 일**: 할 일 목록 및 완료 체크
- 📱 **위젯**: 
  - 가계부 요약 위젯
  - 할 일 목록 위젯

## 기술 스택
- React Native (Expo)
- TypeScript
- React Navigation
- AsyncStorage / SQLite

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
├── app/                 # 앱 화면 및 라우팅
├── components/          # 재사용 가능한 컴포넌트
├── services/           # 비즈니스 로직 및 데이터 관리
├── assets/             # 이미지, 폰트 등
├── types/              # TypeScript 타입 정의
└── App.tsx             # 앱 진입점
```

## 개발 가이드

### 코드 스타일
- TypeScript strict 모드 사용
- 함수형 컴포넌트 + Hooks 사용

## 라이센스
MIT

## 개발자
rapidmon
