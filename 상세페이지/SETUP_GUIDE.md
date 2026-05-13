# 두런두런 워케이션 예약 시스템 가이드

## 예약폼 링크

| 상품 | 링크 |
|------|------|
| 경주 신라레거시 - 패밀리 워케이션 | https://gj24-commits.github.io/detail_page/%EC%83%81%EC%84%B8%ED%8E%98%EC%9D%B4%EC%A7%80/silla-family/ |
| 경주 신라레거시 - 워케이션 | https://gj24-commits.github.io/detail_page/%EC%83%81%EC%84%B8%ED%8E%98%EC%9D%B4%EC%A7%80/silla/ |
| 국립칠곡숲체원 - 워케이션 | https://gj24-commits.github.io/detail_page/%EC%83%81%EC%84%B8%ED%8E%98%EC%9D%B4%EC%A7%80/chilgok/ |

---

## 시스템 구성

### 파일 구조
```
상세페이지/
├── silla-family-reservation.html   # 신라레거시 패밀리 워케이션 예약폼
├── silla-reservation.html          # 신라레거시 워케이션 예약폼
├── chilgok-reservation.html        # 칠곡숲체원 워케이션 예약폼
├── silla-family/index.html         # GitHub Pages 배포용 (패밀리)
├── silla/index.html                # GitHub Pages 배포용 (워케이션)
├── chilgok/index.html              # GitHub Pages 배포용 (칠곡)
├── apps-script.js                  # Google Apps Script 코드
├── apps-script/                    # clasp 프로젝트 폴더
│   ├── Code.js
│   ├── appsscript.json
│   └── .clasp.json
├── 예약폼_링크.txt                  # 링크 모음
└── SETUP_GUIDE.md                  # 이 파일
```

### 호스팅
- **GitHub Pages** (gj24-commits/detail_page 레포)
- 코드 수정 후 git push → 자동 배포 (1~2분 소요)

### 백엔드
- **Google Apps Script** — 폼 데이터 수신, 스프레드시트 저장, 알림 발송
- Apps Script 프로젝트 ID: `13-aRD-aegodUEnNC3m1MXNjjqN3ARjqAJUCkz16gK8zsfutVAAGb7auk`
- 에디터: https://script.google.com/d/13-aRD-aegodUEnNC3m1MXNjjqN3ARjqAJUCkz16gK8zsfutVAAGb7auk/edit

### 파일 저장소
- **Supabase Storage** (uploads 버킷)
- 대시보드: https://supabase.com/dashboard/project/keljydlboramvnbhxytg/storage/buckets/uploads
- 프로젝트 ID: keljydlboramvnbhxytg

---

## 예약 플로우

### 1. 고객이 예약폼 제출
```
고객 → 예약폼 작성 + 파일 첨부 → 제출
```

### 2. 자동 처리 (동시에 5가지)
| 순서 | 동작 | 저장 위치 |
|------|------|----------|
| 1 | 파일 업로드 | Supabase Storage |
| 2 | 폼 데이터 + 파일 URL 저장 | Google 스프레드시트 (예약상태: "대기") |
| 3 | 슬랙 알림 | #00_상품예약현황 |
| 4 | 내부 알림 메일 | developer@darimaker.com |
| 5 | 호텔 담당자 확인 메일 | 호텔별 담당자 이메일 (승인/거절 버튼 포함) |

### 3. 호텔 담당자 응답
- **승인 클릭** → 스프레드시트 "승인" (초록) + 슬랙 승인 알림
- **거절 클릭** → 스프레드시트 "거절" (빨강) + 슬랙 거절 알림

---

## 스프레드시트

| 상품 | 스프레드시트 |
|------|-------------|
| 경주 신라레거시 (워케이션 + 패밀리) | https://docs.google.com/spreadsheets/d/1t9NdbI0_WmjQ03JnDY0CKiy5jWplNoUJljCA6JgoOyM/edit |
| 국립칠곡숲체원 | https://docs.google.com/spreadsheets/d/12RJAZ8CdwR5yJjmbetusxvTxuLxweABbP-CiTzEbctM/edit |

시트 이름: `예약문의`

컬럼 순서:
접수일시 / 개인정보동의 / 마케팅동의 / 기업명 / 예약자명 / 성별 / 연락처 / 총인원 / 보호자정보 / 자녀정보 / 객실타입 / 입실일 / 퇴실일 / 워케이션센터일정 / 업무필수시간 / 관광프로그램 / 기타문의 / 신청서파일 / 예약상태

---

## 알림 설정

### 슬랙 (Bot Token 방식 - 만료 없음)
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

### 이메일 알림
- 내부 알림: developer@darimaker.com (모든 예약)
- 호텔 확인 메일: 호텔별 담당자 이메일 (승인/거절 버튼 포함)

### 호텔 담당자 이메일 매핑
| 상품 | 담당자 이메일 |
|------|--------------|
| 경주 신라레거시 (워케이션) | gj24@darimaker.com (테스트) |
| 경주 신라레거시 (패밀리) | gj24@darimaker.com (테스트) |
| 국립칠곡숲체원 | 미설정 |

---

## 객실 & 가격

### 경주 신라레거시점
| 객실 | 비수기 주중(월~목) | 비수기 금 | 비수기 토 | 성수기 주중 | 성수기 금 | 성수기 토 |
|------|-----------------|----------|----------|-----------|----------|----------|
| 패밀리 노블 스위트 | 130,000 | 160,000 | 210,000 | 190,000 | 230,000 | 290,000 |
| 패밀리 로얄 스위트 | 230,000 | 280,000 | 340,000 | 300,000 | 340,000 | 450,000 |
| 수페리어 스위트 | 110,000 | 140,000 | 200,000 | 160,000 | 190,000 | 240,000 |
| 수페리어 풀 스위트 | 100,000 | 120,000 | 200,000 | 150,000 | 180,000 | 230,000 |
| 레지던셜 로얄 스위트 | 280,000 | 330,000 | 400,000 | 380,000 | 430,000 | 560,000 |

- 성수기: 신라레거시 호텔 성수기 요금 적용일 기준
- 관광 프로그램: 1인 20,000원
- 입실 제한: 금/토/일 입실 불가 (패밀리만), 워케이션은 제한 없음

### 국립칠곡숲체원
| 객실 | 주중(월~목) | 주말(금,토)+성수기 |
|------|-----------|------------------|
| 단독형 3인 (기준3/최대4) | 10,000 | 78,000 |
| 단독형 5인 (기준5/최대5) | 27,000 | 106,000 |
| 단독형 7인 (기준7/최대7) | 50,000 | 145,000 |
| 단체형 9인 (기준9/최대10) | 104,000 | 206,000 |
| 단체형 14인 (기준14/최대15) | 163,000 | 309,000 |

- 성수기: 7/15~8/24, 주말(금토), 공휴일 전일
- 관광 프로그램 없음
- 요일 제한 없음

---

## 예약 일정 제한

- 예약 가능 기간: 2026년 4월 13일 ~ 11월 30일
- 숙박: 최소 2박 3일 ~ 최대 3박 4일

---

## 새 상품 추가 방법

1. 기존 HTML 파일 복사 (예: `silla-reservation.html` → `새상품-reservation.html`)
2. 상품명, 객실 타입, 가격 데이터, 성수기 날짜 수정
3. formData에 `product: '새상품코드'` 추가
4. `apps-script.js`에서:
   - `SPREADSHEET_MAP`에 새 스프레드시트 ID 추가
   - `HOTEL_EMAIL_MAP`에 호텔 담당자 이메일 추가
   - `sendSlackNotification`과 `sendHotelInquiry`의 `productNames`에 상품명 추가
5. `mkdir 상세페이지/새상품 && cp 새상품-reservation.html 상세페이지/새상품/index.html`
6. clasp push → GAS 새 배포 → git push

---

## 주의사항

- GAS 코드 수정 후 반드시 **새 배포** 해야 반영됨 (기존 배포 수정 X)
- GAS 새 배포 시 HTML 파일의 `getScriptUrl()` URL도 업데이트 필요
- GitHub push 시 슬랙 토큰이 시크릿으로 감지되면 허용 필요
- 호텔 확인 메일이 스팸함에 들어갈 수 있음 — 수신자가 스팸 해제 필요
