/**
 * Google Apps Script - 두런두런 패밀리 워케이션 경주 신라레거시점 예약 문의 자동 처리
 *
 * 이 스크립트를 Google Apps Script(script.google.com)에 붙여넣으세요.
 * 스프레드시트 자동 저장 + 슬랙 알림을 처리합니다.
 *
 * 설정 방법은 SETUP_GUIDE.md를 참고하세요.
 */

// ⚠️ 아래 값들을 실제 값으로 교체하세요
const SPREADSHEET_ID = '1t9NdbI0_WmjQ03JnDY0CKiy5jWplNoUJljCA6JgoOyM';  // 두런두런 패밀리 워케이션 경주 신라레거시점 응답폼
const SHEET_NAME = '예약문의';                    // 시트 이름
const SLACK_WEBHOOK_URL = 'YOUR_SLACK_WEBHOOK_URL';  // 슬랙 웹훅 URL

/**
 * POST 요청 처리 (폼 데이터 수신)
 */
function doPost(e) {
  try {
    let data;
    // form submit 방식: e.parameter.payload에 JSON 문자열
    if (e && e.parameter && e.parameter.payload) {
      data = JSON.parse(e.parameter.payload);
    // raw body 방식
    } else if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error('No data received');
    }

    // 1. 파일이 있으면 Google Drive에 저장
    let fileUrl = '';
    if (data.files && data.files.length > 0) {
      fileUrl = saveFilesToDrive(data.files, data.name, data.phone);
      delete data.files;
    }
    data.fileUrl = fileUrl;

    // 2. 스프레드시트에 저장
    saveToSheet(data);

    // 3. 슬랙 알림 발송
    sendSlackNotification(data);

    return HtmlService.createHtmlOutput('<html><body>OK</body></html>');

  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return HtmlService.createHtmlOutput('<html><body>Error: ' + error.toString() + '</body></html>');
  }
}

/**
 * GET 요청 처리 (테스트용)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: '예약 문의 API가 정상 작동 중입니다.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 스프레드시트에 데이터 저장
 */
function saveToSheet(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  // 보호자/자녀 JSON 파싱 → 읽기 좋은 텍스트로 변환
  const guardianText = formatGuardians(data.guardianInfo);
  const childText = formatChildren(data.childrenInfo);

  // 시트가 없으면 생성 + 헤더 추가
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      '접수일시',
      '개인정보동의',
      '마케팅동의',
      '기업명',
      '예약자명',
      '성별',
      '연락처',
      '총인원',
      '보호자정보',
      '자녀정보',
      '객실타입',
      '입실일',
      '퇴실일',
      '워케이션센터일정',
      '업무필수시간',
      '관광프로그램',
      '기타문의',
      '신청서파일'
    ]);

    // 헤더 스타일링
    const headerRange = sheet.getRange(1, 1, 1, 18);
    headerRange.setBackground('#1a5c3a');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // 데이터 행 추가
  sheet.appendRow([
    data.timestamp || new Date().toLocaleString('ko-KR'),
    data.privacyConsent || '',
    data.marketingConsent || '',
    data.company || '',
    data.name || '',
    data.gender || '',
    data.phone || '',
    data.totalGuests || '',
    guardianText,
    childText,
    data.roomType || '',
    data.checkIn || '',
    data.checkOut || '',
    data.workationSchedule || '',
    data.workHours || '',
    data.tourProgram || '',
    data.otherInquiry || '',
    data.fileUrl || ''
  ]);

  // 열 너비 자동 조절
  sheet.autoResizeColumns(1, 18);
}

/**
 * 슬랙 알림 발송
 */
function sendSlackNotification(data) {
  if (!SLACK_WEBHOOK_URL || SLACK_WEBHOOK_URL === 'YOUR_SLACK_WEBHOOK_URL') {
    Logger.log('슬랙 웹훅 URL이 설정되지 않았습니다.');
    return;
  }

  const nights = calculateNights(data.checkIn, data.checkOut);

  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🏨 새로운 예약 문의가 접수되었습니다!',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*기업명:*\n${data.company || '-'}` },
          { type: 'mrkdwn', text: `*예약자:*\n${data.name || '-'} (${data.gender || '-'})` },
          { type: 'mrkdwn', text: `*연락처:*\n${data.phone || '-'}` },
          { type: 'mrkdwn', text: `*총 인원:*\n${data.totalGuests || '-'}명` }
        ]
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*객실 타입:*\n${data.roomType || '-'}` },
          { type: 'mrkdwn', text: `*숙박 일정:*\n${data.checkIn || '-'} ~ ${data.checkOut || '-'} (${nights})` }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*관광 프로그램:*\n${data.tourProgram || '-'}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*보호자:*\n${formatGuardians(data.guardianInfo)}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*자녀 정보:*\n${formatChildren(data.childrenInfo)}`
        }
      }
    ]
  };

  // 기타 문의가 있으면 추가
  if (data.otherInquiry) {
    message.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*기타 문의:*\n${data.otherInquiry}`
      }
    });
  }

  message.blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `📅 접수 시각: ${data.timestamp || new Date().toLocaleString('ko-KR')}`
      }
    ]
  });

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(message)
  };

  UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options);
}

/**
 * 다중 파일을 Google Drive에 저장 (신청자별 폴더 생성)
 */
function saveFilesToDrive(files, name, phone) {
  try {
    // 사업수행자료 폴더
    const parentFolder = DriveApp.getFolderById('1HDb03ijx2RFXTD8xwY8RSHnI88Od0bKr');

    // 신청자명_연락처 뒷자리 4개로 폴더 생성
    const phoneLast4 = (phone || '').replace(/[^0-9]/g, '').slice(-4);
    const folderName = `${name}_${phoneLast4}`;

    // 같은 이름 폴더가 있으면 재사용
    const existingFolders = parentFolder.getFoldersByName(folderName);
    const subFolder = existingFolders.hasNext() ? existingFolders.next() : parentFolder.createFolder(folderName);

    // 파일들 저장
    const urls = [];
    for (const f of files) {
      const ext = f.name.split('.').pop();
      const blob = Utilities.newBlob(Utilities.base64Decode(f.data), getMimeType(ext), f.name);
      const file = subFolder.createFile(blob);
      urls.push(file.getUrl());
    }

    // 폴더 URL 반환
    return subFolder.getUrl();
  } catch(e) {
    Logger.log('File save error: ' + e.toString());
    return 'Error: ' + e.toString();
  }
}

/**
 * 확장자로 MIME 타입 반환
 */
function getMimeType(ext) {
  const types = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'hwp': 'application/x-hwp',
    'hwpx': 'application/x-hwpx',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png'
  };
  return types[ext.toLowerCase()] || 'application/octet-stream';
}

/**
 * 보호자 JSON → 텍스트 변환
 */
function formatGuardians(jsonStr) {
  try {
    const list = JSON.parse(jsonStr);
    return list.map((g, i) =>
      `[보호자${i+1}] ${g.이름} / ${g.주민번호} / ${g.연락처} / 알러지:${g.알러지 || '없음'} / ${g.근무여부}`
    ).join('\n');
  } catch(e) {
    return jsonStr || '';
  }
}

/**
 * 자녀 JSON → 텍스트 변환
 */
function formatChildren(jsonStr) {
  try {
    const list = JSON.parse(jsonStr);
    return list.map((c, i) =>
      `[자녀${i+1}] ${c.돌봄신청 === '신청' ? '✅돌봄' : '❌돌봄'} / ${c.이름} / ${c.주민번호} / 유의:${c.알러지유의사항 || '없음'}`
    ).join('\n');
  } catch(e) {
    return jsonStr || '';
  }
}

/**
 * 숙박일 수 계산
 */
function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return '-';
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const nights = Math.round((outDate - inDate) / (1000 * 60 * 60 * 24));
  return `${nights}박 ${nights + 1}일`;
}

/**
 * 초기 설정 테스트 함수
 * Apps Script 에디터에서 이 함수를 실행하여 연동을 테스트하세요.
 */
function testSetup() {
  const testData = {
    timestamp: new Date().toLocaleString('ko-KR'),
    privacyConsent: '네',
    marketingConsent: '네',
    company: '테스트 기업',
    name: '홍길동',
    gender: '남',
    phone: '010-1234-5678',
    totalGuests: '4',
    guardianInfo: '홍길동(남/35세), 홍길순(여/33세)',
    childrenInfo: '홍아들(남/7세), 홍딸(여/4세)',
    roomType: '패밀리 노블 스위트',
    checkIn: '2026-05-01',
    checkOut: '2026-05-03',
    workationSchedule: '5/1~5/2 09:00-18:00',
    workHours: '10:00-12:00',
    tourProgram: '정글미디어파크, 경주 버드파크',
    otherInquiry: '테스트 문의입니다.'
  };

  Logger.log('📝 스프레드시트 저장 테스트...');
  saveToSheet(testData);
  Logger.log('✅ 스프레드시트 저장 성공!');

  Logger.log('📢 슬랙 알림 테스트...');
  sendSlackNotification(testData);
  Logger.log('✅ 슬랙 알림 전송 성공!');
}
