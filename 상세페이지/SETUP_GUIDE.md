# 두런두런 워케이션 예약 시스템 가이드

> 상품별 객실·가격·링크·담당자 등 데이터는 [상품정보.md](상품정보.md) 참고.
> 이 문서는 **시스템 구조와 세팅 방법**만 다룹니다.

---

## 시스템 구성

### 파일 구조
```
상세페이지/
├── {product}-reservation.html  # 상품별 예약폼 (편집용)
├── {product}/index.html        # GitHub Pages 배포용 (예약폼과 동일)
├── apps-script.js              # GAS 마스터 코드
├── apps-script/                # clasp 프로젝트 폴더
│   ├── Code.js                 # apps-script.js와 동일 유지
│   ├── appsscript.json
│   └── .clasp.json
├── 예약폼_링크.txt              # 링크 모음
├── 상품정보.md                  # 상품별 데이터
└── SETUP_GUIDE.md              # 이 파일
```

`{product}-reservation.html`(편집용)과 `{product}/index.html`(배포용)은 **항상 동일**해야 함.

### 호스팅
- **GitHub Pages** (gj24-commits/detail_page 레포, main 브랜치 루트)
- 코드 수정 후 `git push` → 자동 배포 (1~2분 소요)

### 백엔드
- **Google Apps Script** — 폼 데이터 수신, 스프레드시트 저장, 알림 발송
- Apps Script 프로젝트 ID: `13-aRD-aegodUEnNC3m1MXNjjqN3ARjqAJUCkz16gK8zsfutVAAGb7auk`
- 에디터: https://script.google.com/d/13-aRD-aegodUEnNC3m1MXNjjqN3ARjqAJUCkz16gK8zsfutVAAGb7auk/edit

### 파일 저장소
- **Supabase Storage** (uploads 버킷)
- 대시보드: https://supabase.com/dashboard/project/keljydlboramvnbhxytg/storage/buckets/uploads
- 프로젝트 ID: `keljydlboramvnbhxytg`

---

## 예약 플로우

### 1. 고객이 예약폼 제출
```
고객 → 예약폼 작성 + 신청서 파일 첨부 → 제출
```

### 2. 자동 처리 (동시 5가지)
| 순서 | 동작 | 저장 위치 |
|---|---|---|
| 1 | 파일 업로드 | Supabase Storage |
| 2 | 폼 데이터 + 파일 URL 저장 | Google 스프레드시트 (예약상태: "대기") |
| 3 | 슬랙 알림 | `#00_상품예약현황` |
| 4 | 내부 알림 메일 | developer@darimaker.com |
| 5 | 호텔 담당자 확인 메일 | 호텔별 담당자 이메일 (승인/거절 버튼 포함) |

### 3. 호텔 담당자 응답
- **승인 클릭** → 스프레드시트 "승인" (초록) + 슬랙 승인 알림
- **거절 클릭** → 스프레드시트 "거절" (빨강) + 슬랙 거절 알림

---

## 스프레드시트

시트 이름: `예약문의`

기본 컬럼 순서:
```
접수일시 / 개인정보동의 / 마케팅동의 / 기업명 / 예약자명 / 성별 / 연락처 /
총인원 / 보호자정보 / 자녀정보 / 객실타입 / 입실일 / 퇴실일 /
워케이션센터일정 / 업무필수시간 / 관광프로그램 / 기타문의 / 신청서파일 / 예약상태
```

상품별 추가 컬럼은 GAS의 `saveToSheet` 분기에서 정의 (예: 안동은 관광·조식·사우나 인원 컬럼이 추가됨).

---

## 알림 설정

### 슬랙 (Bot Token 방식 — 만료 없음)
- 채널: `#00_상품예약현황`
- 앱: Demo App
- 메시지 형식:
```
[상품명] 예약이 들어왔습니다.
기업명 : OOO
예약자명 : OOO
연락처 : 010-0000-0000
객실 타입 : OOO
숙박인원 : O명
입실일 : 2026-00-00
퇴실일 : 2026-00-00
관광프로그램 : - (없으면 -)
```

### 이메일
- 내부 알림: developer@darimaker.com (모든 예약)
- 호텔 확인 메일: [상품정보.md](상품정보.md)의 담당자 이메일 매핑 참조

---

## 새 상품 추가 방법

1. 기존 HTML 파일 복사
   ```
   cp silla-reservation.html 새상품-reservation.html
   ```
2. 새 폼에서 수정
   - 상품명/헤더 텍스트
   - 객실 select 옵션, ROOM_PRICES (시즌·요일 구조도 상품마다 다를 수 있음)
   - 성수기 PEAK_DATES
   - 입실 요일 제한 / 관광 프로그램 / 추가 옵션
   - `formData.product = '새상품코드'`
3. `apps-script.js` (+ `apps-script/Code.js` 동기화)
   - `SPREADSHEET_MAP`에 새 스프레드시트 ID 추가
   - `HOTEL_EMAIL_MAP`에 호텔 담당자 이메일 추가
   - `sendSlackNotification` / `sendEmailNotification` / `sendHotelInquiry`의 `productNames` 상수에 표시명 추가
   - 신규 필드(예: 추가 옵션 수량 등)가 있으면 `saveToSheet` 분기 함수 신설
4. GitHub Pages 배포용 폴더 생성
   ```
   mkdir 상세페이지/새상품
   cp 새상품-reservation.html 상세페이지/새상품/index.html
   ```
5. GAS 새 배포 → 발급된 웹앱 URL을 모든 HTML의 `SCRIPT_URL` 상수에 반영
6. [상품정보.md](상품정보.md)에 상품 정보 추가
7. `git add` + `git commit` + `git push`

---

## 주의사항

- **GAS 코드 수정 후 반드시 새 배포** — 기존 배포 수정은 반영되지 않음
- GAS 새 배포 시 발급되는 웹앱 URL을 모든 상품 HTML의 `SCRIPT_URL`에 동시 반영
- `apps-script.js`와 `apps-script/Code.js`는 항상 같은 내용 유지 (둘 다 push)
- `{product}-reservation.html`과 `{product}/index.html`도 항상 같은 내용 유지
- GitHub push 시 슬랙 토큰이 시크릿으로 감지되면 허용 필요
- 호텔 확인 메일이 스팸함에 들어갈 수 있음 — 수신자가 스팸 해제 필요
- **상품별 정책 혼용 금지**: 칠곡 성수기(7/15~8/24), 안동 성수기, 신라 패밀리 금토일 입실 제한 등은 각 상품 전용이므로 다른 상품에 적용 X
