/**
 * Google Apps Script - 두런두런 패밀리 워케이션 경주 신라레거시점 예약 문의 자동 처리
 *
 * 이 스크립트를 Google Apps Script(script.google.com)에 붙여넣으세요.
 * 스프레드시트 자동 저장 + 슬랙 알림을 처리합니다.
 *
 * 설정 방법은 SETUP_GUIDE.md를 참고하세요.
 */

// 상품별 스프레드시트 ID
const SPREADSHEET_MAP = {
  'silla': '1t9NdbI0_WmjQ03JnDY0CKiy5jWplNoUJljCA6JgoOyM',        // 경주 신라레거시점
  'silla-family': '1t9NdbI0_WmjQ03JnDY0CKiy5jWplNoUJljCA6JgoOyM',  // 경주 신라레거시점 패밀리
  'chilgok': '12RJAZ8CdwR5yJjmbetusxvTxuLxweABbP-CiTzEbctM',       // 국립칠곡숲체원
};
const SHEET_NAME = '예약문의';
const SLACK_BOT_TOKEN = 'xoxb-4412915678199-10837806412710-6OytkHJSZrJlXniz96REKk4o';
const SLACK_CHANNEL = '00_상품예약현황';
const NOTIFY_EMAIL = 'developer@darimaker.com';

// 호텔 담당자 이메일 매핑
const HOTEL_EMAIL_MAP = {
  'silla': 'gj24@darimaker.com',
  'silla-family': 'gj24@darimaker.com',
  'chilgok': '',  // 추후 설정
};

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

    // 1. 파일 URL (Supabase에서 업로드 완료된 URL)
    data.fileUrl = data.fileUrls || '';

    // 2. 스프레드시트에 저장
    saveToSheet(data);

    // 3. 슬랙 알림 발송
    sendSlackNotification(data);

    // 4. 이메일 알림 발송
    sendEmailNotification(data);

    // 5. 호텔 담당자에게 예약 확인 메일 발송
    sendHotelInquiry(data);

    return HtmlService.createHtmlOutput('<html><body>OK</body></html>');

  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return HtmlService.createHtmlOutput('<html><body>Error: ' + error.toString() + '</body></html>');
  }
}

/**
 * GET 요청 처리 (승인/거절 처리 + 테스트)
 */
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  const rowNum = e && e.parameter && e.parameter.row;
  const product = e && e.parameter && e.parameter.product;

  if (action && rowNum && product) {
    const sheetId = SPREADSHEET_MAP[product] || SPREADSHEET_MAP['silla'];
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const row = parseInt(rowNum);

    // 상태 컬럼 (19번째 = S열)
    const statusCell = sheet.getRange(row, 19);

    if (action === 'approve') {
      statusCell.setValue('승인');
      statusCell.setBackground('#c8e6c9');

      // 슬랙에 승인 알림
      const name = sheet.getRange(row, 5).getValue();
      const company = sheet.getRange(row, 4).getValue();
      const productNames = { 'silla': '경주 신라레거시점', 'silla-family': '경주 신라레거시점 패밀리', 'chilgok': '국립칠곡숲체원' };
      const prodName = productNames[product] || product;
      sendSlackMessage(`✅ [${prodName}] ${company} ${name}님 예약이 승인되었습니다.`);

      return HtmlService.createHtmlOutput('<html><body style="font-family:sans-serif;text-align:center;padding:60px;"><h1 style="color:#1a5c3a;">✅ 예약 승인 완료</h1><p>해당 예약이 승인 처리되었습니다.</p></body></html>');

    } else if (action === 'reject') {
      statusCell.setValue('거절');
      statusCell.setBackground('#ffcdd2');

      const name = sheet.getRange(row, 5).getValue();
      const company = sheet.getRange(row, 4).getValue();
      const productNames = { 'silla': '경주 신라레거시점', 'silla-family': '경주 신라레거시점 패밀리', 'chilgok': '국립칠곡숲체원' };
      const prodName = productNames[product] || product;
      sendSlackMessage(`❌ [${prodName}] ${company} ${name}님 예약이 거절되었습니다.`);

      return HtmlService.createHtmlOutput('<html><body style="font-family:sans-serif;text-align:center;padding:60px;"><h1 style="color:#e53935;">❌ 예약 거절 처리</h1><p>해당 예약이 거절 처리되었습니다.</p></body></html>');
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: '예약 문의 API가 정상 작동 중입니다.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 슬랙 메시지 전송 (간단 버전)
 */
function sendSlackMessage(text) {
  UrlFetchApp.fetch('https://slack.com/api/chat.postMessage', {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + SLACK_BOT_TOKEN },
    contentType: 'application/json',
    payload: JSON.stringify({ channel: SLACK_CHANNEL, text: text })
  });
}

/**
 * 스프레드시트에 데이터 저장
 */
function saveToSheet(data) {
  const sheetId = SPREADSHEET_MAP[data.product] || SPREADSHEET_MAP['silla'];
  const ss = SpreadsheetApp.openById(sheetId);
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
      '신청서파일',
      '예약상태'
    ]);

    // 헤더 스타일링
    const headerRange = sheet.getRange(1, 1, 1, 19);
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
    data.fileUrl || '',
    '대기'
  ]);

  // 열 너비 자동 조절
  sheet.autoResizeColumns(1, 19);
}

/**
 * 슬랙 알림 발송
 */
function sendSlackNotification(data) {
  if (!SLACK_BOT_TOKEN) {
    Logger.log('슬랙 Bot Token이 설정되지 않았습니다.');
    return;
  }

  // 상품명 매핑
  const productNames = {
    'silla': '두런두런 워케이션 경주 신라레거시점',
    'silla-family': '두런두런 패밀리 워케이션 경주 신라레거시점',
    'chilgok': '두런두런 워케이션 국립칠곡숲체원'
  };
  const productName = productNames[data.product] || '두런두런 워케이션';

  const text = `[${productName}] 예약이 들어왔습니다.\n` +
    `기업명 : ${data.company || '-'}\n` +
    `예약자명 : ${data.name || '-'}\n` +
    `연락처 : ${data.phone || '-'}\n` +
    `객실 타입 : ${data.roomType || '-'}\n` +
    `숙박인원 : ${data.totalGuests || '-'}명\n` +
    `입실일 : ${data.checkIn || '-'}\n` +
    `퇴실일 : ${data.checkOut || '-'}\n` +
    `관광프로그램 : ${data.tourProgram || '-'}`;

  const options = {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + SLACK_BOT_TOKEN },
    contentType: 'application/json',
    payload: JSON.stringify({ channel: SLACK_CHANNEL, text: text })
  };

  UrlFetchApp.fetch('https://slack.com/api/chat.postMessage', options);
}

/**
 * 이메일 알림 발송
 */
function sendEmailNotification(data) {
  try {
    const productNames = {
      'silla': '두런두런 워케이션 경주 신라레거시점',
      'silla-family': '두런두런 패밀리 워케이션 경주 신라레거시점',
      'chilgok': '두런두런 워케이션 국립칠곡숲체원'
    };
    const productName = productNames[data.product] || '두런두런 워케이션';

    const subject = `[예약접수] ${productName} - ${data.company || ''} ${data.name || ''}`;

    const body = `[${productName}] 예약이 들어왔습니다.\n\n` +
      `기업명 : ${data.company || '-'}\n` +
      `예약자명 : ${data.name || '-'}\n` +
      `연락처 : ${data.phone || '-'}\n` +
      `성별 : ${data.gender || '-'}\n` +
      `숙박인원 : ${data.totalGuests || '-'}명\n` +
      `객실 타입 : ${data.roomType || '-'}\n` +
      `입실일 : ${data.checkIn || '-'}\n` +
      `퇴실일 : ${data.checkOut || '-'}\n` +
      `관광프로그램 : ${data.tourProgram || '-'}\n` +
      `워케이션센터 일정 : ${data.workationSchedule || '-'}\n` +
      `기타 문의 : ${data.otherInquiry || '-'}\n` +
      `예상 가격 : ${data.estimatedPrice || '-'}\n` +
      `신청서 파일 : ${data.fileUrl || '-'}\n` +
      `\n접수 시각 : ${data.timestamp || new Date().toLocaleString('ko-KR')}`;

    MailApp.sendEmail('developer@darimaker.com', subject, body);
  } catch(e) {
    Logger.log('Email error: ' + e.toString());
  }
}

/**
 * 호텔 담당자에게 예약 확인 메일 발송 (승인/거절 버튼 포함)
 */
function sendHotelInquiry(data) {
  try {
    const hotelEmail = HOTEL_EMAIL_MAP[data.product];
    if (!hotelEmail) return;

    const productNames = {
      'silla': '두런두런 워케이션 경주 신라레거시점',
      'silla-family': '두런두런 패밀리 워케이션 경주 신라레거시점',
      'chilgok': '두런두런 워케이션 국립칠곡숲체원'
    };
    const productName = productNames[data.product] || '두런두런 워케이션';

    // 현재 행 번호 찾기
    const sheetId = SPREADSHEET_MAP[data.product] || SPREADSHEET_MAP['silla'];
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const lastRow = sheet.getLastRow();

    // 승인/거절 URL 생성
    const scriptUrl = ScriptApp.getService().getUrl();
    const approveUrl = `${scriptUrl}?action=approve&row=${lastRow}&product=${data.product}`;
    const rejectUrl = `${scriptUrl}?action=reject&row=${lastRow}&product=${data.product}`;

    const subject = `[예약확인요청] ${productName} - ${data.company || ''} ${data.name || ''}`;

    const htmlBody = `
      <div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1a5c3a;color:#fff;padding:24px;border-radius:12px 12px 0 0;">
          <h2 style="margin:0;">${productName}</h2>
          <p style="margin:8px 0 0;opacity:0.9;">예약 가능 여부를 확인해 주세요</p>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e0e0e0;">
          <table style="width:100%;border-collapse:collapse;font-size:15px;">
            <tr><td style="padding:10px;color:#888;width:120px;">기업명</td><td style="padding:10px;font-weight:500;">${data.company || '-'}</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding:10px;color:#888;">예약자명</td><td style="padding:10px;font-weight:500;">${data.name || '-'}</td></tr>
            <tr><td style="padding:10px;color:#888;">연락처</td><td style="padding:10px;">${data.phone || '-'}</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding:10px;color:#888;">숙박인원</td><td style="padding:10px;">${data.totalGuests || '-'}명</td></tr>
            <tr><td style="padding:10px;color:#888;">객실 타입</td><td style="padding:10px;font-weight:600;color:#1a5c3a;">${data.roomType || '-'}</td></tr>
            <tr style="background:#f9f9f9;"><td style="padding:10px;color:#888;">입실일</td><td style="padding:10px;font-weight:600;">${data.checkIn || '-'}</td></tr>
            <tr><td style="padding:10px;color:#888;">퇴실일</td><td style="padding:10px;font-weight:600;">${data.checkOut || '-'}</td></tr>
          </table>
        </div>
        <div style="text-align:center;padding:30px;background:#f5f5f5;border-radius:0 0 12px 12px;">
          <p style="margin:0 0 20px;color:#666;font-size:14px;">해당 일정에 객실 예약이 가능한가요?</p>
          <a href="${approveUrl}" style="display:inline-block;background:#1a5c3a;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;margin:0 8px;">✅ 승인</a>
          <a href="${rejectUrl}" style="display:inline-block;background:#e53935;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;margin:0 8px;">❌ 거절</a>
        </div>
      </div>`;

    MailApp.sendEmail({
      to: hotelEmail,
      subject: subject,
      htmlBody: htmlBody
    });

  } catch(e) {
    Logger.log('Hotel inquiry error: ' + e.toString());
  }
}

/**
 * 다중 파일을 Google Drive에 저장 (REST API 직접 호출로 권한 문제 우회)
 */
function saveFilesToDrive(files, name, phone) {
  try {
    // DriveApp 참조로 OAuth 토큰에 drive 스코프 포함시키기
    DriveApp.getRootFolder();
    const token = ScriptApp.getOAuthToken();
    const PARENT_FOLDER_ID = '1HDb03ijx2RFXTD8xwY8RSHnI88Od0bKr';

    // 신청자명_연락처 뒷자리 4개로 폴더명 생성
    const phoneLast4 = (phone || '').replace(/[^0-9]/g, '').slice(-4);
    const folderName = `${name}_${phoneLast4}`;

    // 기존 폴더 검색
    const searchUrl = 'https://www.googleapis.com/drive/v3/files?' +
      'q=' + encodeURIComponent(`'${PARENT_FOLDER_ID}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`) +
      '&supportsAllDrives=true&includeItemsFromAllDrives=true';
    const searchRes = JSON.parse(UrlFetchApp.fetch(searchUrl, {
      headers: { 'Authorization': 'Bearer ' + token }
    }).getContentText());

    let subFolderId;
    if (searchRes.files && searchRes.files.length > 0) {
      subFolderId = searchRes.files[0].id;
    } else {
      // 폴더 생성
      const createRes = JSON.parse(UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
        method: 'post',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        payload: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [PARENT_FOLDER_ID]
        })
      }).getContentText());
      subFolderId = createRes.id;
    }

    // 파일들 업로드
    for (const f of files) {
      const ext = f.name.split('.').pop();
      const fileBytes = Utilities.base64Decode(f.data);
      const boundary = 'boundary_' + Utilities.getUuid();
      const mimeType = getMimeType(ext);

      const metadata = JSON.stringify({
        name: f.name,
        parents: [subFolderId]
      });

      // multipart upload
      const requestBody = Utilities.newBlob(
        '--' + boundary + '\r\n' +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        metadata + '\r\n' +
        '--' + boundary + '\r\n' +
        'Content-Type: ' + mimeType + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        f.data + '\r\n' +
        '--' + boundary + '--'
      ).getBytes();

      UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
        method: 'post',
        headers: { 'Authorization': 'Bearer ' + token },
        contentType: 'multipart/related; boundary=' + boundary,
        payload: requestBody
      });
    }

    return 'https://drive.google.com/drive/folders/' + subFolderId;
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
    product: 'silla',
    timestamp: new Date().toLocaleString('ko-KR'),
    privacyConsent: '네',
    marketingConsent: '네',
    company: '테스트 기업',
    name: '홍길동',
    gender: '남',
    phone: '010-1234-5678',
    totalGuests: '2',
    guardianInfo: '[]',
    childrenInfo: '',
    roomType: '수페리어 스위트 (침대)',
    checkIn: '2026-05-10',
    checkOut: '2026-05-12',
    workationSchedule: '테스트',
    workHours: '',
    tourProgram: '',
    otherInquiry: '',
    estimatedPrice: '220,000원',
    fileUrl: ''
  };

  Logger.log('스프레드시트 저장 테스트...');
  saveToSheet(testData);
  Logger.log('스프레드시트 저장 성공!');

  Logger.log('슬랙 알림 테스트...');
  sendSlackNotification(testData);
  Logger.log('슬랙 알림 전송 성공!');

  Logger.log('내부 이메일 알림 테스트...');
  sendEmailNotification(testData);
  Logger.log('내부 이메일 전송 성공!');

  Logger.log('호텔 문의 메일 테스트...');
  sendHotelInquiry(testData);
  Logger.log('호텔 문의 메일 전송 성공!');
}
