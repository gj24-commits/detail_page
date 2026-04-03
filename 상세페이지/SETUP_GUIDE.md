# 제천 가족 여행 예약 시스템 - 설정 가이드

## 파일 구조

```
상세페이지/
├── index.html          # 상품 상세 페이지
├── reservation.html    # 예약 문의 폼
├── apps-script.js      # Google Apps Script (복사용)
└── SETUP_GUIDE.md      # 이 파일
```

---

## 1단계: 구글 스프레드시트 생성

스프레드시트가 이미 연결되어 있습니다:
- **URL**: https://docs.google.com/spreadsheets/d/1t9NdbI0_WmjQ03JnDY0CKiy5jWplNoUJljCA6JgoOyM/edit
- **ID**: `1t9NdbI0_WmjQ03JnDY0CKiy5jWplNoUJljCA6JgoOyM`
- `apps-script.js`에 이미 설정 완료

---

## 2단계: Google Apps Script 배포

1. [Google Apps Script](https://script.google.com)에서 새 프로젝트 생성
2. `apps-script.js` 파일의 전체 내용을 복사하여 붙여넣기
3. 스프레드시트 ID는 이미 입력되어 있으므로, 슬랙 웹훅 URL만 수정:
   ```javascript
   const SLACK_WEBHOOK_URL = '3단계에서 생성한 URL';
   ```
4. **배포** → **새 배포** 클릭
5. 유형: **웹 앱** 선택
6. 설정:
   - 실행 사용자: **나**
   - 액세스 권한: **모든 사용자**
7. **배포** 클릭 → 생성된 URL 복사

---

## 3단계: 슬랙 웹훅 설정

1. [Slack API](https://api.slack.com/apps)에서 앱 생성 (또는 기존 앱 사용)
2. **Incoming Webhooks** 활성화
3. **Add New Webhook to Workspace** 클릭
4. 알림을 받을 채널 선택
5. 생성된 Webhook URL 복사
   - 형식: `https://hooks.slack.com/services/T.../B.../xxx`

---

## 4단계: 예약 폼에 스크립트 URL 연결

`reservation.html` 파일에서 `getScriptUrl()` 함수를 찾아 URL 교체:

```javascript
function getScriptUrl() {
  return 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
}
```

---

## 5단계: 테스트

1. Apps Script 에디터에서 `testSetup` 함수 실행
2. 스프레드시트에 테스트 데이터가 추가되는지 확인
3. 슬랙 채널에 알림이 오는지 확인
4. 실제 폼에서 제출 테스트

---

## 슬랙 알림 미리보기

새 예약 문의가 접수되면 다음과 같은 형식으로 슬랙 알림이 발송됩니다:

```
🏨 새로운 예약 문의가 접수되었습니다!

기업명: ○○기업          예약자: 홍길동 (남)
연락처: 010-1234-5678   총 인원: 4명
객실 타입: 패밀리 노블 스위트
숙박 일정: 2026-05-01 ~ 2026-05-03 (2박 3일)
관광 프로그램: 정글미디어파크, 경주 버드파크

📅 접수 시각: 2026. 4. 2. 오후 3:00:00
```

---

## 예약 일정 제한

- 최소: **2박 3일**
- 최대: **3박 4일**
- 캘린더에서 입실일 선택 시 퇴실일이 자동으로 2~3일 범위로 제한됩니다
