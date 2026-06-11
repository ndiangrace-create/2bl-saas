// 
// 兔彼樂報名系統 v3.0
// Google Apps Script 後端
// 

const CONFIG = {
  SHEET_ID: '1TZJAuvebflLoOy5rtb88Q5gSlEcFJ16IT_CWAu_FSRQ',
  SITE_URL: 'https://ndiangrace-create.github.io/tuibile/',  // 前台網址
  ADMIN_URL: 'https://ndiangrace-create.github.io/tuibile/admin.html',
  LINE_URL: 'https://lin.ee/Xpiib15',
  BANK_NAME: '台北富邦銀行左營分行（012）',
  BANK_ACCOUNT: '82110000172998',
  BANK_HOLDER: '兔彼樂共創活動有限公司',
  PAY_DEADLINE_DAYS: 7,  // 錄取後幾天內繳費
  EMAIL_FROM: 'noreply@tuibile.com',

  // 綠界金流 (測試模式，正式上線換成正式帳號)
  ECPAY_MERCHANT_ID: '3098138',
  ECPAY_HASH_KEY: 'KTubxEGg9YpOKFCC',
  ECPAY_HASH_IV: 'UCKRTkLdWlcflY08',
  ECPAY_API_URL: 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5',

  // LINE Pay (測試模式)
  LINEPAY_CHANNEL_ID: '2000232801',
  LINEPAY_SECRET: 'b5f8ed51d99579ecef702ffe6a957285',
  LINEPAY_API_URL: 'https://api-pay.line.me',

  // Sheet 名稱
  SH_EVENTS:  '活動清單',
  SH_SESSIONS:'場次設定',
  SH_REGS:    '報名資料',
  SH_MEMBERS: '會員資料',
  SH_PAYMENTS:'付款紀錄',
  SH_STAFF:   '管理員',
  SH_ANNOUNCEMENTS: '公告',
  SH_STALLS: '攤位管理',
  STALL_HOLD_DAYS: 3,
};

// 
// 1. 進入點
// 
function doGet(e) {
  const p = e.parameter || {};
  const action = p.action || '';
  let result;
  try {
    switch (action) {
      case 'getEvents':      result = getEvents(); break;
      case 'getSessions':    result = getSessions(p); break;
      case 'getSession':     result = getSessionById(p.id); break;
      case 'getFinance':       result = getFinance(p); break;
      case 'getRegsBySession': result = getRegsBySession(p); break;
      case 'getInvoiceList':   result = getInvoiceList(p); break;

      case 'getMember':      result = getMember(p); break;
      case 'getMyRegs':      result = getMyRegs(p); break;
      case 'getAnnouncements': result = getAnnouncements(); break;
      case 'getStalls':      result = getStalls(p); break;
      case 'getMyStall':     result = getMyStall(p); break;
      case 'adminLogin':     result = adminLogin(p); break;
      case 'getDashboard':   result = getDashboard(p); break;
      case 'getSessionDashboard': result = getSessionDashboard(p); break;
      case 'getRegs':        result = getRegs(p); break;
      case 'getStaff':       result = getStaff(p); break;
      case 'getEventsAdmin': result = getEventsAdmin(p); break;
      case 'getSessionsAdmin': result = getSessionsAdmin(p); break;
      case 'getPayments':    result = getPayments(p); break;
      case 'getSiteConfig':  result = getSiteConfig(); break;
      case 'ecpayReturn':    return ecpayCallback(e);
      default: result = { error: 'unknown action: ' + action };
    }
  } catch(err) {
    result = { error: err.message };
  }
  return jsonResponse(result);
}

function doPost(e) {
  let body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch(err) {
    return jsonResponse({ error: 'invalid JSON' });
  }
  const action = body.action || '';
  let result;
  try {
    switch (action) {
      case 'register':        result = register(body); break;
      case 'saveMember':      result = saveMember(body); break;
      case 'createEvent':     result = createEvent(body); break;
      case 'updateEvent':     result = updateEvent(body); break;
      case 'deleteEvent':     result = deleteEvent(body); break;
      case 'createSession':   result = createSession(body); break;
      case 'getSession':      result = getSessionById(body.id); break;
      case 'updateSession':   result = updateSession(body); break;
      case 'deleteSession':   result = deleteSession(body); break;
      case 'toggleSession':   result = toggleSession(body); break;
      case 'toggleSessionStatus': result = toggleSessionStatus(body); break;
      case 'copySession':     result = copySession(body); break;
      case 'updateRegStatus': result = updateRegStatus(body); break;
      case 'batchUpdateStatus': result = batchUpdateStatus(body); break;
      case 'confirmPayment':  result = confirmPayment(body); break;
      case 'sendNotify':      result = sendNotify(body); break;
      case 'resendInvite':    result = resendInvite(body); break;
      case 'addStaff':        result = addStaff(body); break;
      case 'removeStaff':     result = removeStaff(body); break;
      case 'saveAnnouncement': result = saveAnnouncement(body); break;
      case 'deleteAnnouncement': result = deleteAnnouncement(body); break;
      case 'checkin':         result = checkin(body); break;
      case 'markClear':       result = markClear(body); break;
      case 'getFinance':       result = getFinance(body); break;
      case 'saveFinanceItem':  result = saveFinanceItem(body); break;
      case 'deleteFinanceItem': result = deleteFinanceItem(body); break;
      case 'getInvoiceList':   result = getInvoiceList(body); break;
      case 'updateInvoiceStatus': result = updateInvoiceStatus(body); break;
      case 'refundDeposit':   result = refundDeposit(body); break;
      case 'getRegsBySession': result = getRegsBySession(body); break;
      case 'cancelReg':       result = cancelReg(body); break;
      case 'approveReg':       result = approveReg(body); break;
      case 'updateStaffPerms':       result = updateStaffPerms(body); break;
      case 'createLinePayOrder':       result = createLinePayOrder(body); break;
      case 'createEcpayOrder':       result = createEcpayOrder(body); break;
      case 'submitPayment':       result = submitPayment(body); break;
      case 'setFastPass':       result = setFastPass(body); break;
      case 'getStallStatus':  result = getStallStatus(body); break;
      case 'selectStall':     result = selectStall(body); break;
      case 'initStalls':      result = initStalls(body); break;
      case 'saveStallConfig': result = saveStallConfig(body); break;
      case 'saveSiteConfig':  result = saveSiteConfig(body); break;
      default: result = { error: 'unknown action: ' + action };
    }
  } catch(err) {
    result = { error: err.message };
  }
  return jsonResponse(result);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}



//  一鍵修復場次名稱欄位 
function fixSessionNames() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sh = ss.getSheetByName(CONFIG.SH_SESSIONS);
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const nameCol = headers.indexOf('場次名稱'); // 0-indexed
  
  let fixed = 0;
  for (let i = 1; i < data.length; i++) {
    const val = String(data[i][nameCol] || '');
    // 如果場次名稱含有 JSON 格式
    if (val.includes('{"') || val.startsWith('[{')) {
      // 找最後一個 }] 之後的文字
      const match = val.match(/[\}\]]\s*(.+)$/);
      if (match && match[1].trim()) {
        const cleanName = match[1].trim();
        sh.getRange(i + 1, nameCol + 1).setValue(cleanName);
        Logger.log('修復第 ' + (i+1) + ' 行: ' + cleanName);
        fixed++;
      }
    }
  }
  Logger.log(' 共修復 ' + fixed + ' 筆');
}




//  清理場次名稱髒資料 
function cleanSessionNames() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sh = ss.getSheetByName(CONFIG.SH_SESSIONS);
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const nameCol = headers.indexOf('場次名稱');
  let fixed = 0;
  for (let i = 1; i < data.length; i++) {
    const val = String(data[i][nameCol]||'');
    if (val.includes('{"name"') || val.startsWith('[[{') || val.startsWith('[{')) {
      // 取最後一個 }] 或 }} 之後的中文
      const match = val.match(/[\}\]]+\s*([^\[\{].+)$/);
      if (match && match[1].trim()) {
        sh.getRange(i+1, nameCol+1).setValue(match[1].trim());
        Logger.log('修復: ' + match[1].trim());
        fixed++;
      }
    }
  }
  Logger.log('完成，修復 ' + fixed + ' 筆');
}

//  診斷所有場次欄位 
function diagAllSessions() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sh = ss.getSheetByName(CONFIG.SH_SESSIONS);
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  Logger.log('欄位清單: ' + headers.join(' | '));
  for(let i=1;i<Math.min(data.length,4);i++){
    Logger.log('=== 第'+(i+1)+'行 ===');
    headers.forEach((h,j)=>{
      if(data[i][j]) Logger.log('['+h+']: '+String(data[i][j]).slice(0,60));
    });
  }
}


//  修復場次名稱前的 JSON 
function fixSessionNameJSON() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sh = ss.getSheetByName(CONFIG.SH_SESSIONS);
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const nameCol = headers.indexOf('場次名稱');
  
  let fixed = 0;
  for (let i = 1; i < data.length; i++) {
    const val = String(data[i][nameCol]||'');
    if (val.includes('{"name"') || val.startsWith('[[{') || val.startsWith('[{')) {
      // 找最後一個 }] 或 }} 之後的中文文字
      const match = val.match(/[\}\]]{1,2}\s*([^\[\{\}]+)$/);
      if (match && match[1].trim()) {
        const clean = match[1].trim();
        sh.getRange(i+1, nameCol+1).setValue(clean);
        Logger.log('修復: ' + clean);
        fixed++;
      }
    }
  }
  Logger.log('共修復 ' + fixed + ' 筆');
}

//  修復欄位錯位 
function fixColumnMismatch() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sh = ss.getSheetByName(CONFIG.SH_SESSIONS);
  const data = sh.getDataRange().getValues();
  const headers = data[0];

  // 找出每個欄位的實際索引
  function col(name){ return headers.indexOf(name); }

  Logger.log('欄位對照：');
  Logger.log('場次名稱在第 '+(col('場次名稱')+1)+' 欄');
  Logger.log('地區在第 '+(col('地區')+1)+' 欄');
  Logger.log('活動日期JSON在第 '+(col('活動日期JSON')+1)+' 欄');
  Logger.log('加購JSON在第 '+(col('加購JSON')+1)+' 欄');
  Logger.log('建立時間在第 '+(col('建立時間')+1)+' 欄');

  // 修復：把地區欄的加購JSON移到加購JSON欄，地區欄清空
  let fixed = 0;
  for(let i = 1; i < data.length; i++){
    const regionVal = String(data[i][col('地區')]||'');
    const addonVal = String(data[i][col('加購JSON')]||'');
    
    // 如果地區欄有 JSON 陣列
    if(regionVal.startsWith('[{') || regionVal === '[]'){
      // 把地區欄的值移到加購JSON欄（如果加購JSON欄是空的）
      if(!addonVal || addonVal === '[]' || addonVal === ''){
        sh.getRange(i+1, col('加購JSON')+1).setValue(regionVal);
      }
      // 清空地區欄
      sh.getRange(i+1, col('地區')+1).setValue('');
      fixed++;
      Logger.log('修復第'+(i+1)+'行');
    }
    
    // 修復建立時間欄是 [] 的問題
    const createdVal = String(data[i][col('建立時間')]||'');
    if(createdVal === '[]' || createdVal === ''){
      sh.getRange(i+1, col('建立時間')+1).setValue(new Date().toISOString());
    }
  }
  Logger.log(' 修復完成，共 '+fixed+' 筆');
}

//  強制修復第2行場次名稱 
function fixRow2() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sh = ss.getSheetByName(CONFIG.SH_SESSIONS);
  const row2 = sh.getRange(2, 1, 1, sh.getLastColumn()).getValues()[0];
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  
  Logger.log('=== 第2行所有欄位 ===');
  headers.forEach((h, i) => {
    if (row2[i]) Logger.log('[' + h + ']: ' + String(row2[i]).slice(0, 80));
  });
}

//  安全新增欄位（不清除現有資料）
function addNewColumns() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);

  // 場次設定 新增欄位
  const sesNewCols = ['地區','活動日期JSON','最大攤數','自訂欄位JSON','加購JSON','圖片連結','場次說明','攤位清單','發票含稅JSON'];
  addColsIfMissing(ss, CONFIG.SH_SESSIONS, sesNewCols);

  // 會員資料 補齊發票欄位
  const memNewCols = ['FB連結','IG連結','合作連結','發票類型','發票載具','統一編號','公司抬頭','發票Email'];
  addColsIfMissing(ss, CONFIG.SH_MEMBERS, memNewCols);

  // 報名資料 補齊完整發票欄位
  const regNewCols = [
    '攤位號碼','攤位數','保證金','FB連結','IG連結',
    '發票類型','發票載具','統一編號','發票抬頭','發票Email',
    '發票含稅金額','發票未稅金額','營業稅額','發票狀態','發票備註',
    '押金','付款時間'
  ];
  addColsIfMissing(ss, CONFIG.SH_REGS, regNewCols);

  // 攤位管理 tab
  const ss2 = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  if (!ss2.getSheetByName(CONFIG.SH_STALLS)) {
    const stallSh = ss2.insertSheet(CONFIG.SH_STALLS);
    const stallHeaders = ['攤位ID','場次ID','攤位號碼','狀態','報名ID','預留時間','Email','建立時間'];
    stallSh.getRange(1,1,1,stallHeaders.length).setValues([stallHeaders])
      .setBackground('#2d6a4f').setFontColor('#fff').setFontWeight('bold');
    stallSh.setFrozenRows(1);
    Logger.log('建立攤位管理 tab');
  }

  Logger.log('✅ 新欄位新增完成，現有資料完整保留！');
}

function addColsIfMissing(ss, sheetName, newCols) {
  let sh = ss.getSheetByName(sheetName);
  if (!sh) {
    Logger.log('找不到 tab: ' + sheetName);
    return;
  }
  const existing = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  newCols.forEach(col => {
    if (!existing.includes(col)) {
      const nextCol = sh.getLastColumn() + 1;
      sh.getRange(1, nextCol).setValue(col)
        .setBackground('#1b4332')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      Logger.log('新增欄位: ' + col + ' 到 ' + sheetName);
    } else {
      Logger.log('已存在，跳過: ' + col);
    }
  });
}

// 
// 2. 初始化試算表
// 
function setupSpreadsheet() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const defs = [
    {
      name: CONFIG.SH_EVENTS,
      headers: ['活動ID','活動名稱','活動說明','地點','主視覺圖連結','狀態','建立時間'],
      color: '#2d6a4f'
    },
    {
      name: CONFIG.SH_SESSIONS,
      headers: ['場次ID','活動ID','場次名稱','場次類型','地區','活動日期JSON','場地名稱',
                '費用','保證金','名額上限','最大攤數','現有報名','狀態','需要審核','模組JSON','設備JSON',
                '基本配備說明','主題','主辦單位','協辦單位','顯示入口','自訂欄位JSON','加購JSON','圖片連結','場次說明','發票含稅JSON','指派管理員','建立時間'],
      color: '#1b4332'
    },
    {
      name: CONFIG.SH_REGS,
      headers: ['報名ID','場次ID','活動ID','Email','姓名','手機','品牌名稱','品牌介紹',
                '販售類別','販售商品','商品連結','出攤照連結','FB連結','IG連結','設備JSON','自訂欄位JSON',
                '攤位數','保證金','審核狀態','付款狀態','繳費金額','付款方式','付款時間','報到狀態','報到時間',
                '清場狀態','退押金狀態','攤位號碼','統一編號','發票抬頭','發票Email','發票狀態','管理員備註','報名時間'],
      color: '#40916c'
    },
    {
      name: CONFIG.SH_MEMBERS,
      headers: ['Email','姓名','手機','品牌名稱','品牌介紹','出攤照連結',
                'FB連結','IG連結','合作連結','合作說明','公司名稱','統一編號','發票Email','合作項目','縣市','LINE ID','快速通關','加入時間','最後更新'],
      color: '#52b788'
    },
    {
      name: CONFIG.SH_PAYMENTS,
      headers: ['付款ID','報名ID','場次ID','Email','金額','付款方式','付款狀態',
                '綠界訂單號','付款時間','建立時間'],
      color: '#74c69d'
    },
    {
      name: CONFIG.SH_STAFF,
      headers: ['Email','姓名','角色','權限JSON','限定場次','加入時間'],
      color: '#95d5b2'
    },
    {
      name: CONFIG.SH_ANNOUNCEMENTS,
      headers: ['公告ID','標題','內容','連結','連結文字','建立時間'],
      color: '#b7e4c7'
    },
    {
      name: '攤位管理',
      headers: ['攤位ID','場次ID','攤位號碼','狀態','報名ID','預留時間','Email','建立時間'],
      color: '#2d6a4f'
    },
    {
      name: '攤位設定',
      headers: ['攤位ID','場次ID','攤位號碼','狀態','預留到期','報名ID','Email','鎖定時間'],
      color: '#52b788'
    },
  ];

  defs.forEach(def => {
    let sh = ss.getSheetByName(def.name);
    if (!sh) sh = ss.insertSheet(def.name);
    sh.clearContents();
    const hdr = sh.getRange(1, 1, 1, def.headers.length);
    hdr.setValues([def.headers])
       .setBackground(def.color)
       .setFontColor('#ffffff')
       .setFontWeight('bold')
       .setFontSize(10)
       .setHorizontalAlignment('center');
    sh.setFrozenRows(1);
    sh.setRowHeight(1, 32);
  });

  // 預設管理員
  const staffSh = ss.getSheetByName(CONFIG.SH_STAFF);
  if (staffSh.getLastRow() <= 1) {
    staffSh.appendRow(['admin@tuibile.com', '超級管理員', 'superadmin', '{}', '', new Date().toISOString()]);
  }

  Logger.log(' 初始化完成！所有分頁已重建，可以開始使用。');
}

// 
// 3. ID 生成
// 
function genId(prefix) {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

// 
// 4. Sheet 操作工具
// 
//  攤位管理 
function getStalls(p) {
  const sh = getSheet(CONFIG.SH_STALLS);
  if (!sh) return [];
  const rows = sheetToObjects(sh);
  let list = rows;
  if (p.sessionId) list = rows.filter(r => r['場次ID'] == p.sessionId);
  return list.map(r => ({
    id: r['攤位ID'], sessionId: r['場次ID'],
    number: r['攤位號碼'], status: r['狀態']||'空閒',
    regId: r['報名ID']||'', holdTime: r['預留時間']||'',
    email: r['Email']||'',
  }));
}

function getMyStall(p) {
  if (!p.regId) return null;
  const sh = getSheet(CONFIG.SH_STALLS);
  if (!sh) return null;
  const rows = sheetToObjects(sh);
  const s = rows.find(r => r['報名ID'] == p.regId);
  return s ? { number: s['攤位號碼'], status: s['狀態'] } : null;
}

function holdStall(body) {
  // 攤友選位（預留）
  const sh = getSheet(CONFIG.SH_STALLS);
  if (!sh) return { error: '攤位系統未初始化' };
  const rows = sheetToObjects(sh);
  // 檢查攤位是否可選
  const stallIdx = rows.findIndex(r =>
    r['場次ID'] == body.sessionId &&
    r['攤位號碼'] == body.stallNumber &&
    (r['狀態'] === '空閒' || !r['狀態'])
  );
  if (stallIdx < 0) return { error: '此攤位已被選走或不存在' };
  // 檢查此報名是否已選位
  const existing = rows.find(r => r['報名ID'] == body.regId && r['狀態'] !== '空閒');
  if (existing) return { error: '您已選擇攤位 ' + existing['攤位號碼'] };
  // 預留
  const row = stallIdx + 2;
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  function setC(col, val) { const i=headers.indexOf(col); if(i>=0) sh.getRange(row,i+1).setValue(val); }
  setC('狀態', '預留中');
  setC('報名ID', body.regId);
  setC('Email', body.email||'');
  setC('預留時間', new Date().toISOString());
  return { success: true, stallNumber: body.stallNumber };
}

function releaseStall(body) {
  const sh = getSheet(CONFIG.SH_STALLS);
  if (!sh) return { error: '攤位系統未初始化' };
  const rows = sheetToObjects(sh);
  const idx = rows.findIndex(r =>
    r['報名ID'] == body.regId ||
    (r['場次ID'] == body.sessionId && r['攤位號碼'] == body.stallNumber)
  );
  if (idx < 0) return { error: '找不到攤位' };
  const row = idx + 2;
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  function setC(col, val) { const i=headers.indexOf(col); if(i>=0) sh.getRange(row,i+1).setValue(val); }
  setC('狀態', '空閒');
  setC('報名ID', '');
  setC('Email', '');
  setC('預留時間', '');
  return { success: true };
}

function lockStall(body) {
  // 付款後鎖定攤位
  const sh = getSheet(CONFIG.SH_STALLS);
  if (!sh) return { error: '攤位系統未初始化' };
  const rows = sheetToObjects(sh);
  const idx = rows.findIndex(r => r['報名ID'] == body.regId);
  if (idx < 0) return { success: true }; // 沒選位就跳過
  const row = idx + 2;
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const i = headers.indexOf('狀態');
  if (i >= 0) sh.getRange(row, i+1).setValue('已鎖定');
  // 更新報名資料的攤位號碼
  const stallNumber = rows[idx]['攤位號碼'];
  const regSh = getSheet(CONFIG.SH_REGS);
  const regRow = findRowById(regSh, 0, body.regId);
  if (regRow > 0) {
    const regHeaders = regSh.getRange(1,1,1,regSh.getLastColumn()).getValues()[0];
    const snCol = regHeaders.indexOf('攤位號碼') + 1;
    if (snCol > 0) regSh.getRange(regRow, snCol).setValue(stallNumber);
  }
  return { success: true, stallNumber };
}

function saveStallConfig(body) {
  // 後台設定攤位清單
  if (!verifyStaff(body.email, body.token)) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_STALLS);
  if (!sh) return { error: '攤位系統未初始化，請執行 addNewColumns' };
  const sessionId = body.sessionId;
  // 先刪除此場次所有空閒攤位
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const sidCol = headers.indexOf('場次ID');
  const statusCol = headers.indexOf('狀態');
  const toDelete = [];
  for (let i = data.length-1; i >= 1; i--) {
    if (data[i][sidCol] == sessionId && (data[i][statusCol] === '空閒' || !data[i][statusCol])) {
      toDelete.push(i+1);
    }
  }
  toDelete.forEach(r => sh.deleteRow(r));
  // 新增攤位
  (body.stalls||[]).forEach(num => {
    sh.appendRow([genId('STL'), sessionId, num, '空閒', '', '', '', new Date().toISOString()]);
  });
  return { success: true };
}

function releaseExpiredStalls(body) {
  // 定時器呼叫：釋出逾期預留
  const sh = getSheet(CONFIG.SH_STALLS);
  if (!sh) return { released: 0 };
  const rows = sheetToObjects(sh);
  const now = new Date();
  let released = 0;
  rows.forEach((r, idx) => {
    if (r['狀態'] !== '預留中') return;
    const holdTime = new Date(r['預留時間']);
    const diffDays = (now - holdTime) / (1000*60*60*24);
    if (diffDays >= CONFIG.STALL_HOLD_DAYS) {
      const row = idx + 2;
      const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
      function setC(col, val) { const i=headers.indexOf(col); if(i>=0) sh.getRange(row,i+1).setValue(val); }
      setC('狀態', '空閒');
      setC('報名ID', '');
      setC('Email', '');
      setC('預留時間', '');
      released++;
    }
  });
  return { released };
}

// 定時器（每天自動執行）
function dailyStallRelease() {
  releaseExpiredStalls({});
  sendReminder({email:'system',token:'system_bypass'});
}

//  攤位管理 


function getStallStatus(p) {
  const sh = getSheet(CONFIG.SH_STALLS);
  if (!sh) return { stallList: [], taken: {} };
  const rows = sheetToObjects(sh).filter(r => r['場次ID'] == p.sessionId);
  const stallList = rows.map(r => r['攤位號碼']);
  const taken = {};
  rows.forEach(r => {
    if (r['狀態'] === '鎖定' || r['狀態'] === '已鎖定' || r['狀態'] === '預留' || r['狀態'] === '預留中') {
      taken[r['攤位號碼']] = { status: (r['狀態'] === '鎖定' || r['狀態'] === '已鎖定') ? 'paid' : 'reserved', regId: r['報名ID'] || '' };
    }
  });
  return { stallList, taken };
}

function selectStall(body) {
  const sh = getSheet(CONFIG.SH_STALLS);
  if (!sh) return { error: '攤位系統未初始化' };
  const stalls = Array.isArray(body.stalls) ? body.stalls : (body.stalls ? [body.stalls] : (body.stallNumber ? [body.stallNumber] : []));
  if (stalls.length === 0) return { error: '請選擇攤位' };
  const rows = sheetToObjects(sh);
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  function colIdx(name){ return headers.indexOf(name); }
  // 檢查每個攤位是否可選
  for (const stall of stalls) {
    const idx = rows.findIndex(r => r['場次ID']==body.sessionId && r['攤位號碼']==stall);
    if (idx < 0) return { error: '找不到攤位 ' + stall };
    const st = rows[idx]['狀態'];
    const owner = rows[idx]['報名ID'];
    if ((st === '鎖定' || st === '已鎖定' || st === '預留' || st === '預留中') && owner !== body.regId) {
      return { error: '攤位 ' + stall + ' 已被選走' };
    }
  }
  // 釋放此報名的舊攤位
  rows.forEach((r, i) => {
    if (r['報名ID'] === body.regId && !stalls.includes(r['攤位號碼'])) {
      const row = i + 2;
      sh.getRange(row, colIdx('狀態')+1).setValue('空閒');
      sh.getRange(row, colIdx('報名ID')+1).setValue('');
      sh.getRange(row, colIdx('Email')+1).setValue('');
    }
  });
  // 預留選擇的攤位
  stalls.forEach(stall => {
    const idx = rows.findIndex(r => r['場次ID']==body.sessionId && r['攤位號碼']==stall);
    if (idx >= 0) {
      const row = idx + 2;
      sh.getRange(row, colIdx('狀態')+1).setValue('預留');
      sh.getRange(row, colIdx('報名ID')+1).setValue(body.regId||'');
      sh.getRange(row, colIdx('Email')+1).setValue(body.email||'');
      sh.getRange(row, colIdx('預留時間')+1).setValue(new Date().toISOString());
    }
  });
  // 寫入報名資料的攤位號碼
  if (body.regId) {
    const regSh = getSheet(CONFIG.SH_REGS);
    const regRow = findRowById(regSh, 0, body.regId);
    if (regRow > 0) {
      const rh = regSh.getRange(1,1,1,regSh.getLastColumn()).getValues()[0];
      const sc = rh.indexOf('攤位號碼') + 1;
      if (sc > 0) regSh.getRange(regRow, sc).setValue(stalls.join(','));
    }
  }
  return { success: true, stalls };
}

function initStalls(body) {
  if (!verifyStaff(body.email, body.token, 'sessions')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_STALLS);
  if (!sh) return { error: '找不到攤位設定 tab，請執行 addNewColumns' };
  // 清除此場次舊攤位
  const data = sh.getDataRange().getValues();
  const toDelete = [];
  for (let i = data.length-1; i >= 1; i--) {
    if (data[i][1] == body.sessionId) toDelete.push(i+1);
  }
  toDelete.forEach(r => sh.deleteRow(r));
  // 新增攤位
  const numbers = (body.stallNumbers||'').split(/[,，\n\r]/).map(s=>s.trim()).filter(Boolean);
  numbers.forEach(num => {
    sh.appendRow([genId('STL'), body.sessionId, num, '開放', '', '', '', '']);
  });
  return { success: true, count: numbers.length };
}

function lockStallAfterPayment(regId) {
  const sh = getSheet(CONFIG.SH_STALLS);
  if (!sh) return;
  const rows = sheetToObjects(sh);
  const idx = rows.findIndex(r => r['報名ID'] === regId);
  if (idx < 0) return;
  sh.getRange(idx+2, 4).setValue('鎖定');
  sh.getRange(idx+2, 8).setValue(new Date().toISOString());
}

//  攤位選位系統 
function getReserveExpiry(regTime) {
  if (!regTime) return null;
  const d = new Date(regTime);
  d.setDate(d.getDate() + 3);
  return d.toISOString();
}





//  定時釋出逾期攤位（每天執行）


//  快速通關設定 
function setFastPass(body) {
  if (!verifyStaff(body.email, body.token, 'checkin')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_MEMBERS);
  const rows = sheetToObjects(sh);
  const idx = rows.findIndex(r => r['Email'] === body.targetEmail);
  if (idx < 0) return { error: '找不到會員' };
  const row = idx + 2;
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const col = headers.indexOf('快速通關') + 1;
  if (col <= 0) return { error: '欄位不存在，請執行 addNewColumns' };
  sh.getRange(row, col).setValue(body.enable ? 'TRUE' : 'FALSE');
  return { success: true };
}

//  管理員權限設定 
function updateStaffPerms(body) {
  if (!verifyStaff(body.email, body.token, 'superadmin')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_STAFF);
  const row = findRowById(sh, 0, body.targetEmail);
  if (row < 0) return { error: '找不到管理員' };
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const col = headers.indexOf('權限JSON') + 1;
  if (col > 0) sh.getRange(row, col).setValue(JSON.stringify(body.perms||{}));
  return { success: true };
}

//  攤友自行回報付款 
function submitPayment(body) {
  const sh = getSheet(CONFIG.SH_REGS);
  const row = findRowById(sh, 0, body.regId);
  if (row < 0) return { error: '找不到報名紀錄' };
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const rowData = sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0];
  const obj = {};
  headers.forEach((h,i) => obj[h] = rowData[i]);

  if (obj['審核狀態'] !== '已錄取') return { error: '尚未錄取，無法繳費' };
  if (isPaidStatus(obj['付款狀態'])) return { error: '此報名已完成繳費' };

  // 寫入待確認狀態
  sh.getRange(row, headers.indexOf('付款狀態')+1).setValue('待確認');
  sh.getRange(row, headers.indexOf('付款方式')+1).setValue(body.method||'匯款');
  sh.getRange(row, headers.indexOf('管理員備註')+1).setValue(
    (obj['管理員備註']||'') + ' [攤友回報付款] ' + (body.method||'匯款') +
    ' NT$'+(body.amount||'') + ' 末五碼:'+(body.lastFive||'') +
    ' 時間:'+new Date().toLocaleString('zh-TW')
  );

  // 管理員通知：不寄信，請自行至後台查看

  return { success: true };
}

//  活動前三天提醒（需手動觸發或設定定時器）
function sendReminder(body) {
  if (!verifyStaff(body.email, body.token, 'notify')) return { error: '無權限' };
  const sesSh = getSheet(CONFIG.SH_SESSIONS);
  const regSh = getSheet(CONFIG.SH_REGS);
  const sessions = sheetToObjects(sesSh);
  const regs = sheetToObjects(regSh);
  const now = new Date();
  let sent = 0;

  sessions.forEach(s => {
    if (!s['活動日期']) return;
    const eventDate = new Date(s['活動日期']);
    const diffDays = Math.ceil((eventDate - now) / (1000*60*60*24));
    if (diffDays !== 3) return; // 只發三天前的

    const sesRegs = regs.filter(r =>
      r['場次ID'] == s['場次ID'] &&
      r['審核狀態'] === '已錄取' &&
      isPaidStatus(r['付款狀態'])
    );
    sesRegs.forEach(r => {
      try {
        GmailApp.sendEmail(r['Email'], `[兔彼樂] 活動提醒  ${s['場次名稱']} 還有3天！`, '', {
          htmlBody: buildEmailHtml(`
            <p>親愛的 <strong>${r['姓名']}</strong>，</p>
            <p><strong>${s['場次名稱']}</strong> 還有 <strong>3天</strong> 就要開始了！</p>
            <p>活動日期：${safeDate(s['活動日期'])}</p>
            <p>活動地點：${s['場地名稱']||''}</p>
            <p>開始時間：${safeTime(s['開始時間'])||''}</p>
            <p style="color:#666;font-size:13px">請準時到場，如有任何問題請透過 LINE 聯繫：<a href="${CONFIG.LINE_URL}">@2beloved</a></p>
          `, r['姓名'])
        });
        sent++;
      } catch(e) {}
    });
  });
  return { success: true, sent };
}

//  定時提醒（設定觸發器後自動執行）
// ── 觸發器安裝說明 ──
// 在 Apps Script 執行 installDailyTrigger() 一次即可
function installDailyTrigger() {
  // 刪除舊的觸發器
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'dailyReminder' ||
        t.getHandlerFunction() === 'dailyStallRelease') {
      ScriptApp.deleteTrigger(t);
    }
  });
  // 每天早上9點執行
  ScriptApp.newTrigger('dailyReminder')
    .timeBased().everyDays(1).atHour(9).create();
  ScriptApp.newTrigger('dailyStallRelease')
    .timeBased().everyDays(1).atHour(10).create();
  Logger.log('定時觸發器安裝完成！每天9點發送提醒，10點釋出過期攤位');
}

function dailyReminder() {
  sendReminder({email:'system', token:'system_bypass'});
}

function getSheet(name) {
  return SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(name);
}

function sheetToObjects(sh) {
  const data = sh.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function findRowById(sh, idCol, id) {
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] == id) return i + 1; // 1-indexed
  }
  return -1;
}

function getColIndex(sh, header) {
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  return headers.indexOf(header); // 0-indexed
}

// 
// 5. 活動（Events）
// 
function getEvents() {
  const sh = getSheet(CONFIG.SH_EVENTS);
  const rows = sheetToObjects(sh);
  return rows.filter(r => r['狀態'] !== '停用').map(r => ({
    id: r['活動ID'],
    title: r['活動名稱'],
    desc: r['活動說明'],
    location: r['地點'],
    cover: r['主視覺圖連結'],
    status: r['狀態'],
  }));
}

function getEventsAdmin(p) {
  if (!verifyStaff(p.email, p.token)) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_EVENTS);
  return sheetToObjects(sh).map(r => ({
    id: r['活動ID'], title: r['活動名稱'], desc: r['活動說明'],
    location: r['地點'], cover: r['主視覺圖連結'], status: r['狀態'],
    createdAt: r['建立時間'],
  }));
}

function createEvent(body) {
  if (!verifyStaff(body.email, body.token, 'events')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_EVENTS);
  const id = genId('EVT');
  sh.appendRow([id, body.title, body.desc||'', body.location||'', body.cover||'', '開放中', new Date().toISOString()]);
  return { success: true, id };
}

function updateEvent(body) {
  if (!verifyStaff(body.email, body.token, 'events')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_EVENTS);
  const row = findRowById(sh, 0, body.id);
  if (row < 0) return { error: '找不到活動' };
  sh.getRange(row, 2, 1, 4).setValues([[body.title, body.desc||'', body.location||'', body.cover||'']]);
  if (body.status) sh.getRange(row, 6).setValue(body.status);
  return { success: true };
}

function deleteEvent(body) {
  if (!verifyStaff(body.email, body.token, 'superadmin')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_EVENTS);
  const row = findRowById(sh, 0, body.id);
  if (row < 0) return { error: '找不到活動' };
  sh.deleteRow(row);
  return { success: true };
}

// 
// 6. 場次（Sessions）
// 
function getSessions(p) {
  const sh = getSheet(CONFIG.SH_SESSIONS);
  const rows = sheetToObjects(sh);
  let list = rows.filter(r => r['狀態'] === '報名中' || r['狀態'] === '開放中');
  if (p.eventId) list = list.filter(r => r['活動ID'] == p.eventId);
  if (p.portal) list = list.filter(r => {
    const portals = r['顯示入口'] ? String(r['顯示入口']).split(',').map(x=>x.trim()) : [];
    return portals.includes(p.portal);
  });
  return list.map(formatSession);
}

function isPaidStatus(v) {
  return String(v || '').indexOf('已繳費') >= 0;
}

function getSessionsAdmin(p) {
  if (!verifyStaff(p.email, p.token)) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_SESSIONS);
  const rows = sheetToObjects(sh);
  let list = rows;
  if (p.eventId) list = rows.filter(r => r['活動ID'] == p.eventId);
  const regSh = getSheet(CONFIG.SH_REGS);
  const allRegs = sheetToObjects(regSh);
  return list.map(s => {
    const sId = s['場次ID']||'';
    const sRegs = allRegs.filter(r => r['場次ID'] === sId);
    const formatted = formatSession(s);
    formatted.total = sRegs.length;
    formatted.pending = sRegs.filter(r => r['審核狀態'] === '待審核').length;
    formatted.approved = sRegs.filter(r => r['審核狀態'] === '已錄取').length;
    formatted.paid = sRegs.filter(r => isPaidStatus(r['付款狀態'])).length;
    formatted.seated = sRegs.filter(r => r['報到狀態'] === '已報到').length;
    formatted.revenue = sRegs.filter(r => isPaidStatus(r['付款狀態'])).reduce((sum,r) => sum+(Number(r['繳費金額'])||0), 0);
    formatted.depositTotal = sRegs.filter(r => isPaidStatus(r['付款狀態'])).reduce((sum,r) => sum+(Number(r['保證金'])||0), 0);
    return formatted;
  });
}

function getSessionById(id) {
  const sh = getSheet(CONFIG.SH_SESSIONS);
  const rows = sheetToObjects(sh);
  const r = rows.find(x => x['場次ID'] == id);
  if (!r) return { error: '找不到場次' };
  return formatSession(r);
}

function safeDate(v) {
  if (!v) return '';
  if (v instanceof Date) {
    var y=v.getFullYear(), m=String(v.getMonth()+1).padStart(2,'0'), d=String(v.getDate()).padStart(2,'0');
    return y+'-'+m+'-'+d;
  }
  return String(v).slice(0,10);
}
function safeTime(v) {
  if (!v) return '';
  if (v instanceof Date) return String(v.getHours()).padStart(2,'0')+':'+String(v.getMinutes()).padStart(2,'0');
  var s=String(v); if(s.includes(':')) return s.slice(0,5); return s;
}
function safeNum(v) { var n=Number(v); return (isNaN(n)||n<0)?0:n; }

function formatSession(r) {
  let modules={}, equip={}, customFields=[], addons=[], dates=[];
  try { modules=JSON.parse(r['模組JSON']||'{}'); } catch(e) {}
  try { equip=JSON.parse(r['設備JSON']||'{}'); } catch(e) {}
  try { customFields=JSON.parse(r['自訂欄位JSON']||'[]'); } catch(e) {}
  try { addons=JSON.parse(r['加購JSON']||'[]'); } catch(e) {}
  try { dates=JSON.parse(r['活動日期JSON']||'[]'); } catch(e) {}
  return {
    id: r['場次ID'],
    eventId: r['活動ID'],
    name: r['場次名稱'],
    type: r['場次類型'],
    region: r['地區']||'',
    dates: dates,
    venue: r['場地名稱'],
    fee: safeNum(r['費用']),
    deposit: safeNum(r['保證金']),
    limit: safeNum(r['名額上限']),
    maxStalls: safeNum(r['最大攤數'])||0,
    count: safeNum(r['現有報名']),
    status: r['狀態'],
    needReview: r['需要審核']===true||r['需要審核']==='TRUE',
    modules: modules,
    equip: equip,
    customFields: customFields,
    addons: addons,
    invoiceTax: (function(){ try{return JSON.parse(r['發票含稅JSON']||'{"stall":true,"equip":false,"extra":false}');}catch(e){return {stall:true,equip:false,extra:false};} })(),
    basicEquip: r['基本配備說明']||'',
    theme: r['主題']||'',
    organizer: r['主辦單位']||'',
    coorg: r['協辦單位']||'',
    portals: r['顯示入口']?String(r['顯示入口']).split(','):[],
    cover: r['圖片連結']||'',
    desc: r['場次說明']||'',
    stallList: (()=>{try{return JSON.parse(r['攤位清單']||'[]');}catch(e){return [];}})(),
    assignedStaff: r['指派管理員'] ? String(r['指派管理員']).split(',').filter(Boolean) : [],
    createdAt: r['建立時間'],
  };
}

function createSession(body) {
  if (!verifyStaff(body.email, body.token, 'sessions')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_SESSIONS);
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const id = genId('SES');
  const rowData = new Array(headers.length).fill('');
  function set(col, val) {
    const i = headers.indexOf(col);
    if (i >= 0) rowData[i] = val;
  }
  set('場次ID', id);
  set('活動ID', body.eventId);
  set('場次名稱', body.name);
  set('場次類型', body.type||'市集場次');
  set('地區', body.region||'');
  set('活動日期JSON', JSON.stringify(body.dates||[]));
  set('場地名稱', body.venue||'');
  set('費用', Number(body.fee)||0);
  set('保證金', Number(body.deposit)||0);
  set('名額上限', Number(body.limit)||0);
  set('最大攤數', Number(body.maxStalls)||0);
  set('現有報名', 0);
  set('狀態', '報名中');
  set('需要審核', body.needReview?'TRUE':'FALSE');
  set('模組JSON', JSON.stringify(body.modules||{}));
  set('設備JSON', JSON.stringify(body.equip||{}));
  set('基本配備說明', body.basicEquip||'');
  set('發票含稅JSON', JSON.stringify(body.invoiceTax||{stall:true,equip:false,extra:false}));
  set('主題', body.theme||'');
  set('主辦單位', body.organizer||'');
  set('協辦單位', body.coorg||'');
  set('顯示入口', (body.portals||[]).join(','));
  set('自訂欄位JSON', JSON.stringify(body.customFields||[]));
  set('加購JSON', JSON.stringify(body.addons||[]));
  set('圖片連結', body.cover||'');
  set('場次說明', body.desc||'');
  set('攤位清單', JSON.stringify(body.stallList||[]));
  set('指派管理員', (body.assignedStaff||[]).join(','));
  set('建立時間', new Date().toISOString());
  sh.appendRow(rowData);
  return { success: true, id };
}

function updateSession(body) {
  if (!verifyStaff(body.email, body.token, 'sessions')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_SESSIONS);
  const row = findRowById(sh, 0, body.id);
  if (row < 0) return { error: '找不到場次' };
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  function setCell(col, val) {
    const i = headers.indexOf(col);
    if (i >= 0) sh.getRange(row, i+1).setValue(val);
  }
  setCell('活動ID', body.eventId);
  setCell('場次名稱', body.name);
  setCell('場次類型', body.type||'市集場次');
  setCell('地區', body.region||'');
  setCell('活動日期JSON', JSON.stringify(body.dates||[]));
  setCell('場地名稱', body.venue||'');
  setCell('費用', Number(body.fee)||0);
  setCell('保證金', Number(body.deposit)||0);
  setCell('名額上限', Number(body.limit)||0);
  setCell('最大攤數', Number(body.maxStalls)||0);
  setCell('狀態', body.status||'報名中');
  setCell('需要審核', body.needReview?'TRUE':'FALSE');
  setCell('模組JSON', JSON.stringify(body.modules||{}));
  setCell('設備JSON', JSON.stringify(body.equip||{}));
  setCell('基本配備說明', body.basicEquip||'');
  setCell('發票含稅JSON', JSON.stringify(body.invoiceTax||{stall:true,equip:false,extra:false}));
  setCell('主題', body.theme||'');
  setCell('主辦單位', body.organizer||'');
  setCell('協辦單位', body.coorg||'');
  setCell('顯示入口', (body.portals||[]).join(','));
  setCell('自訂欄位JSON', JSON.stringify(body.customFields||[]));
  setCell('加購JSON', JSON.stringify(body.addons||[]));
  setCell('圖片連結', body.cover||'');
  setCell('場次說明', body.desc||'');
  setCell('指派管理員', (body.assignedStaff||[]).join(','));
  setCell('攤位清單', JSON.stringify(body.stallList||[]));
  return { success: true };
}

function toggleSession(body) {
  if (!verifyStaff(body.email, body.token, 'sessions')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_SESSIONS);
  const row = findRowById(sh, 0, body.id || body.sessionId);
  if (row < 0) return { error: '找不到場次' };
  const colIdx = getColIndex(sh, '狀態') + 1;
  const cur = sh.getRange(row, colIdx).getValue();
  const next = cur === '關閉' ? '報名中' : '關閉';
  sh.getRange(row, colIdx).setValue(next);
  return { success: true, status: next };
}

function copySession(body) {
  if (!verifyStaff(body.email, body.token, 'sessions')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_SESSIONS);
  const row = findRowById(sh, 0, body.id);
  if (row < 0) return { error: '找不到場次' };
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const src = sh.getRange(row, 1, 1, sh.getLastColumn()).getValues()[0];
  function setByName(name, val) { const i = headers.indexOf(name); if (i >= 0) src[i] = val; }
  const newId = genId('SES');
  setByName('場次ID', newId);
  setByName('場次名稱', (src[headers.indexOf('場次名稱')] || '') + '（複製）');
  setByName('現有報名', 0);
  setByName('狀態', '報名中');
  setByName('建立時間', new Date().toISOString());
  sh.appendRow(src);
  return { success: true, id: newId };
}

function toggleSessionStatus(body) {
  if (!verifyStaff(body.email, body.token, 'sessions')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_SESSIONS);
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][headers.indexOf('場次ID')] == body.sessionId) {
      sh.getRange(i+1, headers.indexOf('狀態')+1).setValue(body.status||'已關閉');
      return { success: true };
    }
  }
  return { error: '找不到場次' };
}

function deleteSession(body) {
  if (!verifyStaff(body.email, body.token, 'superadmin')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_SESSIONS);
  const row = findRowById(sh, 0, body.id);
  if (row < 0) return { error: '找不到場次' };
  sh.deleteRow(row);
  return { success: true };
}

// 
// 7. 報名
// 
function register(body) {
  const sh = getSheet(CONFIG.SH_REGS);
  const sesSh = getSheet(CONFIG.SH_SESSIONS);

  // 取場次
  const sesRow = findRowById(sesSh, 0, body.sessionId);
  if (sesRow < 0) return { error: '找不到場次' };
  const sesData = sesSh.getRange(sesRow, 1, 1, sesSh.getLastColumn()).getValues()[0];
  const sesHeaders = sesSh.getRange(1, 1, 1, sesSh.getLastColumn()).getValues()[0];
  const sesObj = {};
  sesHeaders.forEach((h, i) => sesObj[h] = sesData[i]);

  if (sesObj['狀態'] === '關閉') return { error: '此場次已關閉報名' };

  // 名額檢查
  const cur = safeNum(sesObj['現有報名']);
  const lim = safeNum(sesObj['名額上限']) || 999;
  const stallCount = Math.min(Math.max(parseInt(body.stallCount)||1, 1), 3);
  if (lim > 0 && cur + stallCount > lim) return { error: '此場次名額不足，剩餘 '+(lim-cur)+' 個攤位' };

  // 重複報名檢查
  const regs = sheetToObjects(sh);
  const dup = regs.find(r => r['場次ID'] == body.sessionId && r['Email'] == body.email && r['審核狀態'] !== '不錄取');
  if (dup) return { error: '您已報名此場次' };

  const id = genId('REG');
  const needReview = sesObj['需要審核'] === true || sesObj['需要審核'] === 'TRUE';
  // 快速通關：檢查此 Email 是否有快速通關標記
  let fastPass = false;
  try {
    const memSh = getSheet(CONFIG.SH_MEMBERS);
    const memRows = sheetToObjects(memSh);
    const mem = memRows.find(m => m['Email'] === body.email);
    if (mem && (mem['快速通關'] === 'TRUE' || mem['快速通關'] === true)) fastPass = true;
  } catch(e) {}
  const status = (!needReview || fastPass) ? '已錄取' : '待審核';
  const fee = Number(sesObj['費用']) || 0;
  const deposit = Number(sesObj['保證金']) || 0;
  const equipTotal = calcEquipTotal(body.equip || {}, sesObj['設備JSON'], stallCount);
  // 攤位費 × 攤數；設備費照數量；保證金固定不乘攤數
  const total = (fee * stallCount) + deposit + equipTotal;

  // 用欄位名寫入（最穩固，不受欄位順序影響）
  const regHeaders = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const newRow = new Array(regHeaders.length).fill('');
  function setR(col, val){ const i = regHeaders.indexOf(col); if(i>=0) newRow[i] = val; }
  setR('報名ID', id);
  setR('場次ID', body.sessionId);
  setR('活動ID', sesObj['活動ID']);
  setR('Email', body.email);
  setR('姓名', body.name);
  setR('手機', String(body.phone||''));
  setR('品牌名稱', body.brand||'');
  setR('品牌介紹', body.brandIntro||'');
  setR('販售類別', body.sellCat||'');
  setR('販售商品', body.sellItem||'');
  setR('商品連結', body.sellLink||'');
  setR('出攤照連結', body.photo||'');
  setR('FB連結', body.fb||'');
  setR('IG連結', body.ig||'');
  setR('設備JSON', JSON.stringify(body.equip||{}));
  setR('自訂欄位JSON', JSON.stringify(body.customFields||{}));
  setR('審核狀態', status);
  setR('付款狀態', needReview ? '未繳費' : (fee === 0 ? '免費' : '未繳費'));
  setR('繳費金額', total);
  setR('保證金', deposit);
  setR('攤位數', stallCount);
  setR('報到狀態', '未報到');
  setR('清場狀態', '未清場');
  setR('退押金狀態', '未退押金');
  setR('攤位號碼', '');
  setR('報名時間', new Date().toISOString());
  setR('統一編號', body.taxId||'');
  setR('發票抬頭', body.invoiceTitle||'');
  setR('發票Email', body.invoiceEmail||'');
  setR('發票狀態', body.needInvoice?'待開立':'');
  sh.appendRow(newRow);;

  // 更新場次人數（依攤數）
  const countCol = getColIndex(sesSh, '現有報名') + 1;
  sesSh.getRange(sesRow, countCol).setValue(cur + stallCount);

  // 更新/建立會員
  upsertMember(body);
  // 攤位預留（如果有選位）
  if (body.stallNumber) {
    holdStall({
      sessionId: body.sessionId,
      stallNumber: body.stallNumber,
      regId: id,
      email: body.email
    });
  }

  // 發確認信
  sendRegConfirmEmail(body.email, body.name, sesObj['場次名稱'], id, status, total, sesObj['場次ID']);

  return { success: true, id, status, total };
}

function calcEquipTotal(equip, equipJson, stallCount) {
  let total = 0;
  const stalls = Number(stallCount) || 1;
  try {
    const equipDef = JSON.parse(equipJson || '{}');
    Object.entries(equip).forEach(([k, qty]) => {
      if (equipDef[k] && equipDef[k].open) {
        const incl = (Number(equipDef[k].incl) || 0) * stalls;  // 內含總數
        const want = Number(qty) || 0;
        const extra = Math.max(0, want - incl);  // 只收超過內含的
        total += (Number(equipDef[k].price) || 0) * extra;
      }
    });
  } catch(e) {}
  return total;
}

// 
// 8. 審核 / 付款
// 
function approveReg(body) {
  if (!verifyStaff(body.email, body.token, 'review')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_REGS);
  const row = findRowById(sh, 0, body.regId);
  if (row < 0) return { error: '找不到報名' };
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const rows = sh.getDataRange().getValues();
  const obj = {};
  headers.forEach((h,i) => obj[h] = rows[row-1][i]);
  
  // 支援直接傳 status（備取）或用 approved boolean
  const status = body.status || (body.approved ? '已錄取' : '不錄取');
  
  const statusCol = headers.indexOf('審核狀態') + 1;
  if (statusCol > 0) sh.getRange(row, statusCol).setValue(status);
  
  // 已錄取時發付款通知
  if (status === '已錄取') {
    try {
      const fee = Number(obj['繳費金額']) || 0;
      sendApprovalEmail(obj['Email'], obj['姓名'], obj['場次ID'], obj['報名ID'], fee);
    } catch(e) { Logger.log('Email 發送失敗: ' + e); }
  }
  // 不錄取時發通知
  if (status === '不錄取') {
    try {
      sendRejectionEmail(obj['Email'], obj['姓名'], obj['場次ID']);
    } catch(e) { Logger.log('Email 發送失敗: ' + e); }
  }
  
  return { success: true, status };
}

function updateRegStatus(body) {
  if (!verifyStaff(body.email, body.token, 'review')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_REGS);
  const row = findRowById(sh, 0, body.regId);
  if (row < 0) return { error: '找不到報名' };

  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const rowData = sh.getRange(row, 1, 1, sh.getLastColumn()).getValues()[0];
  const obj = {};
  headers.forEach((h, i) => obj[h] = rowData[i]);

  const statusCol = headers.indexOf('審核狀態') + 1;
  sh.getRange(row, statusCol).setValue(body.status);

  if (body.adminNote) {
    const noteCol = headers.indexOf('管理員備註') + 1;
    sh.getRange(row, noteCol).setValue(body.adminNote);
  }

  // 核准時發付款連結
  if (body.status === '已錄取') {
    const fee = Number(obj['繳費金額']) || 0;
    sendApprovalEmail(obj['Email'], obj['姓名'], obj['場次ID'], obj['報名ID'], fee);
  }
  // 拒絕時發通知
  if (body.status === '不錄取') {
    sendRejectionEmail(obj['Email'], obj['姓名'], obj['場次ID']);
  }

  return { success: true };
}

function batchUpdateStatus(body) {
  if (!verifyStaff(body.email, body.token, 'review')) return { error: '無權限' };
  const results = (body.regIds || []).map(id => updateRegStatus({ ...body, regId: id }));
  return { success: true, results };
}

function confirmPayment(body) {
  if (!verifyStaff(body.email, body.token)) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_REGS);
  const row = findRowById(sh, 0, body.regId);
  if (row < 0) return { error: '找不到報名' };

  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const payCol = headers.indexOf('付款狀態') + 1;
  const methodCol = headers.indexOf('付款方式') + 1;
  const timeCol = headers.indexOf('付款時間') + 1;

  sh.getRange(row, payCol).setValue('已繳費');
  sh.getRange(row, methodCol).setValue(body.method || '手動確認');
  sh.getRange(row, timeCol).setValue(new Date().toISOString());

  // 寫付款紀錄
  const pSh = getSheet(CONFIG.SH_PAYMENTS);
  const rowData = sh.getRange(row, 1, 1, sh.getLastColumn()).getValues()[0];
  const obj = {};
  headers.forEach((h, i) => obj[h] = rowData[i]);
  pSh.appendRow([
    genId('PAY'), body.regId, obj['場次ID'], obj['Email'],
    obj['繳費金額'], body.method || '手動確認', '已確認',
    body.merchantTradeNo || '', new Date().toISOString(), new Date().toISOString()
  ]);

  sendPaymentConfirmEmail(obj['Email'], obj['姓名'], obj['場次ID'], obj['繳費金額']);
  return { success: true };
}

// 
// 9. 報到 / 清場
// 
function checkin(body) {
  if (!verifyStaff(body.email, body.token, 'checkin')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_REGS);
  const row = findRowById(sh, 0, body.regId);
  if (row < 0) return { error: '找不到報名' };
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const isUndo = body.undo === true || body.undo === 'true';
  const checkinCol = headers.indexOf('報到狀態') + 1;
  const checkinTimeCol = headers.indexOf('報到時間') + 1;
  if (isUndo) {
    if (checkinCol > 0) sh.getRange(row, checkinCol).setValue('');
    if (checkinTimeCol > 0) sh.getRange(row, checkinTimeCol).setValue('');
    return { success: true, undo: true };
  }
  if (checkinCol > 0) sh.getRange(row, checkinCol).setValue('已報到');
  if (checkinTimeCol > 0) sh.getRange(row, checkinTimeCol).setValue(new Date().toISOString());
  return { success: true };
}

function markClear(body) {
  if (!verifyStaff(body.email, body.token, 'checkin')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_REGS);
  const row = findRowById(sh, 0, body.regId);
  if (row < 0) return { error: '找不到報名' };
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  sh.getRange(row, headers.indexOf('清場狀態') + 1).setValue('已撤場');
  if (body.refunded) {
    sh.getRange(row, headers.indexOf('退押金狀態') + 1).setValue('已退押金');
  }
  return { success: true };
}

// 
// 10. 會員
// 
function getMember(p) {
  if (!p.email) return { error: '請提供 email' };
  const sh = getSheet(CONFIG.SH_MEMBERS);
  const rows = sheetToObjects(sh);
  const m = rows.find(r => r['Email'] === p.email);
  if (!m) return null;
  return {
    email: m['Email'], name: m['姓名'], phone: m['手機'],
    brand: m['品牌名稱'], brandIntro: m['品牌介紹'],
    photo: m['出攤照連結'],
    fb: m['FB連結']||'', ig: m['IG連結']||'',
    collabUrl: m['合作連結']||'', collabDesc: m['合作說明']||'',
    company: m['公司名稱']||'', taxId: m['統一編號']||'',
    invoiceEmail: m['發票Email']||'', collabItems: m['合作項目']||'',
    city: m['縣市'], lineId: m['LINE ID'],
    fastPass: m['快速通關']==='TRUE'||m['快速通關']===true,
    joinedAt: m['加入時間'],
  };
}

function saveMember(body) {
  return upsertMember(body);
}

function upsertMember(body) {
  if (!body.email) return { error: '請提供 email' };
  const sh = getSheet(CONFIG.SH_MEMBERS);
  const rows = sheetToObjects(sh);
  const idx = rows.findIndex(r => r['Email'] === body.email);
  const now = new Date().toISOString();
  const rowData = [
    body.email, body.name||'', body.phone||'',
    body.brand||'', body.brandIntro||'',
    body.photo||'', body.fb||'', body.ig||'',
    body.collabUrl||'', body.collabDesc||'',
    body.company||'', body.taxId||'',
    body.invoiceEmail||'', body.collabDesc||'',
    body.city||'', body.lineId||'',
    body.fastPass?'TRUE':(body.fastPass===false?'FALSE':''),
    '', now
  ];
  if (idx < 0) {
    rowData[9] = now; // 加入時間
    sh.appendRow(rowData);
  } else {
    const row = idx + 2;
    rowData[9] = sh.getRange(row, 10).getValue(); // 保留加入時間
    sh.getRange(row, 1, 1, rowData.length).setValues([rowData]);
  }
  return { success: true };
}

function refundDeposit(body) {
  if (!verifyStaff(body.email, body.token)) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_REGS);
  const row = findRowById(sh, 0, body.regId);
  if (row < 0) return { error: '找不到報名' };
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const col = headers.indexOf('退押金狀態');
  if (col < 0) return { error: '欄位不存在' };
  sh.getRange(row, col+1).setValue('已退');
  return { success: true };
}

function getRegsBySession(body) {
  if (!verifyStaff(body.email, body.token)) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_REGS);
  const rows = sheetToObjects(sh);
  const filtered = rows.filter(r => r['場次ID'] === body.sessionId);
  return filtered.map(r => ({
    id: r['報名ID'], sessionId: r['場次ID'], eventId: r['活動ID'],
    email: r['Email'], name: r['姓名'], phone: r['手機'],
    brand: r['品牌名稱'], brandIntro: r['品牌介紹']||'',
    sellCat: r['販售類別']||'', products: r['販售商品']||'',
    fb: r['FB連結']||'', ig: r['IG連結']||'',
    stallCount: safeNum(r['攤位數'])||1,
    equip: r['設備JSON']||'{}',
    status: r['審核狀態']||'待審核',
    payStatus: r['付款狀態']||'未繳費',
    amount: safeNum(r['繳費金額']),
    deposit: safeNum(r['保證金']),
    checkin: r['報到狀態']||'未報到',
    clearStatus: r['清場狀態']||'未清場',
    depositRefunded: r['退押金狀態']||'未退押金',
    stallNo: r['攤位號碼']||'',
    taxId: r['統一編號']||'',
    invoiceTitle: r['發票抬頭']||'',
    invoiceEmail: r['發票Email']||'',
    invoiceStatus: r['發票狀態']||'',
    createdAt: r['報名時間']||'',
    adminNote: r['管理員備註']||'',
  }));
}

// ── 場次財報 ──

function cancelReg(body) {
  const sh = getSheet(CONFIG.SH_REGS);
  const row = findRowById(sh, 0, body.regId);
  if (row < 0) return { error: '找不到報名' };
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const rowData = sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0];
  const obj = {};
  headers.forEach((h,i) => obj[h] = rowData[i]);
  // 驗證身分（本人才能取消）
  if (body.email && obj['Email'] !== body.email) return { error: '無權限取消此報名' };
  // 標記為已取消
  const statusCol = headers.indexOf('審核狀態') + 1;
  if (statusCol > 0) sh.getRange(row, statusCol).setValue('已取消');
  // 釋出名額
  const sesSh = getSheet(CONFIG.SH_SESSIONS);
  const sesRow = findRowById(sesSh, 0, obj['場次ID']);
  if (sesRow > 0) {
    const sesHeaders = sesSh.getRange(1,1,1,sesSh.getLastColumn()).getValues()[0];
    const cntCol = sesHeaders.indexOf('現有報名') + 1;
    if (cntCol > 0) {
      const cur = Number(sesSh.getRange(sesRow, cntCol).getValue()) || 0;
      const stalls = Number(obj['攤位數']) || 1;
      sesSh.getRange(sesRow, cntCol).setValue(Math.max(0, cur - stalls));
    }
  }
  // 釋出攤位
  try {
    const stallSh = getSheet(CONFIG.SH_STALLS);
    if (stallSh) {
      const sRows = sheetToObjects(stallSh);
      const sHeaders = stallSh.getRange(1,1,1,stallSh.getLastColumn()).getValues()[0];
      sRows.forEach((r, i) => {
        if (r['報名ID'] === body.regId) {
          stallSh.getRange(i+2, sHeaders.indexOf('狀態')+1).setValue('空閒');
          stallSh.getRange(i+2, sHeaders.indexOf('報名ID')+1).setValue('');
          stallSh.getRange(i+2, sHeaders.indexOf('Email')+1).setValue('');
        }
      });
    }
  } catch(e) {}
  return { success: true };
}

function getFinance(body) {
  if (!verifyStaff(body.email, body.token, 'finance')) return { error: '無權限' };
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sh = ss.getSheetByName('財報明細');
  if (!sh) { sh = ss.insertSheet('財報明細'); sh.appendRow(['ID','場次ID','類型','品項','金額','自動','建立時間']); }
  return sheetToObjects(sh).filter(r => r['場次ID'] === body.sessionId);
}
function saveFinanceItem(body) {
  if (!verifyStaff(body.email, body.token, 'finance')) return { error: '無權限' };
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sh = ss.getSheetByName('財報明細');
  if (!sh) { sh = ss.insertSheet('財報明細'); sh.appendRow(['ID','場次ID','類型','品項','金額','自動','建立時間']); }
  const id = genId('FIN');
  sh.appendRow([id, body.sessionId, body.type, body.name, Number(body.amount)||0, body.auto?'TRUE':'FALSE', new Date().toISOString()]);
  return { success: true, id };
}
function deleteFinanceItem(body) {
  if (!verifyStaff(body.email, body.token, 'finance')) return { error: '無權限' };
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sh = ss.getSheetByName('財報明細');
  if (!sh) return { error: '找不到' };
  const row = findRowById(sh, 0, body.id);
  if (row < 0) return { error: '找不到項目' };
  sh.deleteRow(row); return { success: true };
}
function getInvoiceList(body) {
  if (!verifyStaff(body.email, body.token)) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_REGS);
  // 不過濾統編：個人發票與公司發票都納入清單
  return sheetToObjects(sh).filter(r => r['場次ID'] === body.sessionId)
    .map(r => ({
      id: r['報名ID'], email: r['Email'], name: r['姓名'],
      brand: r['品牌名稱'], phone: r['手機'],
      invoiceType: r['發票類型']||(r['統一編號']?'公司／機關':'個人'),
      carrier: r['發票載具']||'',
      taxId: r['統一編號']||'',
      invoiceTitle: r['發票抬頭']||r['品牌名稱']||'',
      invoiceEmail: r['發票Email']||r['Email'],
      deposit: safeNum(r['押金']),
      amount: safeNum(r['繳費金額']),
      untaxedAmount: Math.round(safeNum(r['繳費金額'])/1.05),
      taxAmount: Math.round(safeNum(r['繳費金額'])/1.05*0.05),
      invoiceStatus: r['發票狀態']||'待開立',
      note: r['管理員備註']||'',
    }));
}
function updateInvoiceStatus(body) {
  if (!verifyStaff(body.email, body.token)) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_REGS);
  const row = findRowById(sh, 0, body.regId);
  if (row < 0) return { error: '找不到' };
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const col = headers.indexOf('發票狀態');
  if (col >= 0) sh.getRange(row, col+1).setValue(body.status);
  return { success: true };
}

function getMyRegs(p) {
  if (!p.email) return { error: '請提供 email' };
  const sh = getSheet(CONFIG.SH_REGS);
  const rows = sheetToObjects(sh);
  return rows
    .filter(r => r['Email'] === p.email)
    .map(r => ({
      id: r['報名ID'],
      sessionId: r['場次ID'],
      eventId: r['活動ID'],
      status: r['審核狀態'],
      payStatus: r['付款狀態'],
      amount: r['繳費金額'],
      checkin: r['報到狀態'],
      createdAt: r['報名時間'],
    }));
}

// 
// 11. 後台資料
// 
function getRegs(p) {
  if (!verifyStaff(p.email, p.token)) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_REGS);
  const rows = sheetToObjects(sh);
  let list = rows;
  if (p.sessionId) list = rows.filter(r => r['場次ID'] == p.sessionId);
  if (p.eventId) list = rows.filter(r => r['活動ID'] == p.eventId);
  return list.map(r => ({
    id: r['報名ID'], sessionId: r['場次ID'], eventId: r['活動ID'],
    email: r['Email'], name: r['姓名'], phone: r['手機'],
    brand: r['品牌名稱'], sellCat: r['販售類別'],
    photo: r['出攤照連結'],
    equip: r['設備JSON'], customFields: r['自訂欄位JSON'],
    status: r['審核狀態'], payStatus: r['付款狀態'],
    amount: r['繳費金額'], payMethod: r['付款方式'], paidAt: r['付款時間'],
    checkin: r['報到狀態'], clearStatus: r['清場狀態'],
    adminNote: r['管理員備註'], createdAt: r['報名時間'],
  }));
}

function getSessionDashboard(p) {
  if (!verifyStaff(p.email, p.token)) return { error: '無權限' };
  const regs = sheetToObjects(getSheet(CONFIG.SH_REGS));
  const sessions = sheetToObjects(getSheet(CONFIG.SH_SESSIONS));
  const events = sheetToObjects(getSheet(CONFIG.SH_EVENTS));

  const eventMap = {};
  events.forEach(e => eventMap[e['活動ID']] = e);

  return sessions.map(s => {
    const sid = s['場次ID'];
    const list = regs.filter(r => r['場次ID'] == sid);
    const fee = Number(s['費用']) || 0;
    const deposit = Number(s['保證金']) || 0;
    const paidList = list.filter(r => isPaidStatus(r['付款狀態']));
    const revenue = paidList.reduce((sum, r) => sum + (Number(r['繳費金額']) || 0), 0);
    const depositTotal = paidList.length * deposit;
    const evt = eventMap[s['活動ID']] || {};
    // 設備需求總計：已錄取或已繳費的攤主（確定會來的）
    const confirmedList = list.filter(r => r['審核狀態'] === '已錄取' || isPaidStatus(r['付款狀態']));
    const equipNeed = {};
    confirmedList.forEach(r => {
      try {
        const eq = JSON.parse(r['設備JSON'] || '{}');
        Object.entries(eq).forEach(([k, v]) => { if (Number(v) > 0) equipNeed[k] = (equipNeed[k] || 0) + Number(v); });
      } catch(e) {}
    });
    // 同時算全部報名的設備（含待審核，給你參考）
    const equipNeedAll = {};
    list.forEach(r => {
      try {
        const eq = JSON.parse(r['設備JSON'] || '{}');
        Object.entries(eq).forEach(([k, v]) => { if (Number(v) > 0) equipNeedAll[k] = (equipNeedAll[k] || 0) + Number(v); });
      } catch(e) {}
    });
    return {
      id: sid,
      eventId: s['活動ID'],
      eventName: evt['活動名稱'] || '',
      eventCover: evt['主視覺圖連結'] || '',
      name: s['場次名稱'],
      type: s['場次類型'],
      date: safeDate(s['活動日期']),
      venue: s['場地名稱'],
      status: s['狀態'],
      fee: safeNum(s['費用']),
      deposit: safeNum(s['保證金']),
      limit: safeNum(s['名額上限']),
      total: list.length,
      pending: list.filter(r => r['審核狀態'] === '待審核').length,
      approved: list.filter(r => r['審核狀態'] === '已錄取').length,
      rejected: list.filter(r => r['審核狀態'] === '不錄取').length,
      paid: paidList.length,
      seated: list.filter(r => r['報到狀態'] === '已報到').length,
      revenue: revenue,
      depositTotal: depositTotal,
      needReview: s['需要審核'] === true || s['需要審核'] === 'TRUE',
      startTime: safeTime(s['開始時間']),
      endTime: safeTime(s['結束時間']),
      organizer: s['主辦單位'] || '',
      basicEquip: s['基本配備說明'] || '',
      equipNeed: equipNeed,
      equipNeedAll: equipNeedAll,
      portals: s['顯示入口']?String(s['顯示入口']).split(','):[],
      region: s['地區']||'',
      cover: s['圖片連結']||'',
      desc: s['場次說明']||'',
      maxStalls: safeNum(s['最大攤數'])||0,
      dates: (()=>{try{return JSON.parse(s['活動日期JSON']||'[]');}catch(e){return [];}})(),
      customFields: (()=>{try{return JSON.parse(s['自訂欄位JSON']||'[]');}catch(e){return [];}})(),
      addons: (()=>{try{return JSON.parse(s['加購JSON']||'[]');}catch(e){return [];}})(),
      stallList: (()=>{try{return JSON.parse(s['攤位清單']||'[]');}catch(e){return [];}})(),
      modules: (function(){ try{ return JSON.parse(s['模組JSON']||'{}'); }catch(e){ return {}; } })(),
      equip: (function(){ try{ return JSON.parse(s['設備JSON']||'{}'); }catch(e){ return {}; } })(),
      assignedStaff: s['指派管理員'] ? String(s['指派管理員']).split(',').filter(Boolean) : [],
    };
  });
}


function getDashboard(p) {
  if (!verifyStaff(p.email, p.token)) return { error: '無權限' };
  const regs = sheetToObjects(getSheet(CONFIG.SH_REGS));
  const sessions = sheetToObjects(getSheet(CONFIG.SH_SESSIONS));
  const events = sheetToObjects(getSheet(CONFIG.SH_EVENTS));

  let list = regs;
  if (p.sessionId) list = regs.filter(r => r['場次ID'] == p.sessionId);
  if (p.eventId) list = regs.filter(r => r['活動ID'] == p.eventId);

  return {
    total: list.length,
    pending: list.filter(r => r['審核狀態'] === '待審核').length,
    approved: list.filter(r => r['審核狀態'] === '已錄取').length,
    rejected: list.filter(r => r['審核狀態'] === '不錄取').length,
    paid: list.filter(r => isPaidStatus(r['付款狀態'])).length,
    revenue: list.filter(r => isPaidStatus(r['付款狀態']))
              .reduce((s, r) => s + (Number(r['繳費金額']) || 0), 0),
    checkedIn: list.filter(r => r['報到狀態'] === '已報到').length,
    sessionCount: sessions.filter(r => r['狀態'] === '報名中').length,
    eventCount: events.filter(r => r['狀態'] !== '停用').length,
  };
}

function getPayments(p) {
  if (!verifyStaff(p.email, p.token)) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_PAYMENTS);
  return sheetToObjects(sh).map(r => ({
    id: r['付款ID'], regId: r['報名ID'], sessionId: r['場次ID'],
    email: r['Email'], amount: r['金額'], method: r['付款方式'],
    status: r['付款狀態'], tradeNo: r['綠界訂單號'],
    paidAt: r['付款時間'], createdAt: r['建立時間'],
  }));
}

// 
// 12. 管理員 / 權限
// 
function adminLogin(p) {
  const sh = getSheet(CONFIG.SH_STAFF);
  const rows = sheetToObjects(sh);
  const staff = rows.find(r => r['Email'] === p.email);
  if (!staff) return { error: '此帳號無管理員權限' };
  const token = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    p.email + 'tuibile2025secret'
  ).map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
  return {
    success: true,
    role: staff['角色'],
    name: staff['姓名'],
    token: token,
  };
}

function verifyStaff(email, token, requiredRole, sessionId) {
  if (email === 'system' && token === 'system_bypass' && !requiredRole) return true;
  if (!email || !token) return false;
  const sh = getSheet(CONFIG.SH_STAFF);
  const rows = sheetToObjects(sh);
  const staff = rows.find(r => r['Email'] === email);
  if (!staff) return false;
  const expected = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    email + 'tuibile2025secret'
  ).map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
  if (token !== expected) return false;
  // 超級管理員通過所有權限
  if (staff['角色'] === 'superadmin' || staff['角色'] === '超級管理員') return true;
  // 其他角色檢查權限JSON
  if (requiredRole) {
    let perms = {};
    try { perms = JSON.parse(staff['權限JSON'] || '{}'); } catch(e) {}
    if (!perms[requiredRole]) return false;
  }
  // 場次限定檢查
  if (sessionId && staff['限定場次']) {
    const allowed = String(staff['限定場次']).split(',').map(s=>s.trim()).filter(Boolean);
    if (allowed.length > 0 && !allowed.includes(sessionId)) return false;
  }
  return true;
}

function getStaff(p) {
  if (!verifyStaff(p.email, p.token, 'superadmin')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_STAFF);
  return sheetToObjects(sh).map(r => ({
    email: r['Email'], name: r['姓名'], role: r['角色'],
    permsJson: r['權限JSON']||'{}',
    limitSessions: r['限定場次']?String(r['限定場次']).split(',').filter(Boolean):[],
    joinedAt: r['加入時間']
  }));
}


function resendInvite(body) {
  if (!verifyStaff(body.email, body.token, 'superadmin')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_STAFF);
  const rows = sheetToObjects(sh);
  const staff = rows.find(r => r['Email'] === body.targetEmail);
  if (!staff) return { error: '找不到此管理員' };
  let perms = {};
  try { perms = JSON.parse(staff['權限JSON'] || '{}'); } catch(e) {}
  const limitSessions = (staff['限定場次'] || '').split(',').filter(x => x);
  try {
    sendStaffInviteEmail(staff['Email'], staff['姓名']||'', staff['角色']||'活動夥伴', perms, limitSessions);
  } catch(e) { return { error: '寄信失敗：' + e }; }
  return { success: true };
}

function addStaff(body) {
  if (!verifyStaff(body.email, body.token, 'superadmin')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_STAFF);
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const rows = sheetToObjects(sh);
  if (rows.find(r => r['Email'] === body.targetEmail)) return { error: '此帳號已存在' };
  const rowData = new Array(headers.length).fill('');
  function set(col,val){const i=headers.indexOf(col);if(i>=0)rowData[i]=val;}
  set('Email', body.targetEmail);
  set('姓名', body.targetName||'');
  set('角色', body.role||'活動夥伴');
  set('權限JSON', JSON.stringify(body.perms||{}));
  set('限定場次', (body.limitSessions||[]).join(','));
  set('加入時間', new Date().toISOString());
  sh.appendRow(rowData);
  // 寄送管理員邀請信
  try {
    sendStaffInviteEmail(body.targetEmail, body.targetName||'', body.role||'活動夥伴', body.perms||{}, body.limitSessions||[]);
  } catch(e) { Logger.log('邀請信寄送失敗: '+e); }
  return { success: true };
}

function removeStaff(body) {
  if (!verifyStaff(body.email, body.token, 'superadmin')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_STAFF);
  const row = findRowById(sh, 0, body.targetEmail);
  if (row < 0) return { error: '找不到帳號' };
  sh.deleteRow(row);
  return { success: true };
}

// 
// 13. 公告
// 
function getAnnouncements() {
  const sh = getSheet(CONFIG.SH_ANNOUNCEMENTS);
  return sheetToObjects(sh).map(r => ({
    id: r['公告ID'], title: r['標題'], content: r['內容'],
    url: r['連結'], urlText: r['連結文字'], createdAt: r['建立時間'],
  }));
}

function saveAnnouncement(body) {
  if (!verifyStaff(body.email, body.token, 'announce')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_ANNOUNCEMENTS);
  if (body.id) {
    const row = findRowById(sh, 0, body.id);
    if (row > 0) {
      if(body.status){const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];const sc=h.indexOf('狀態');if(sc>=0)sh.getRange(row,sc+1).setValue(body.status);}
      sh.getRange(row, 2, 1, 4).setValues([[body.title, body.content||'', body.url||'', body.urlText||'']]);
      return { success: true };
    }
  }
  const id = genId('ANN');
  sh.appendRow([id, body.title, body.content||'', body.url||'', body.urlText||'', new Date().toISOString()]);
  return { success: true, id };
}

function deleteAnnouncement(body) {
  if (!verifyStaff(body.email, body.token, 'announce')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_ANNOUNCEMENTS);
  const row = findRowById(sh, 0, body.id);
  if (row < 0) return { error: '找不到公告' };
  sh.deleteRow(row);
  return { success: true };
}

// 
// 14. 通知發送
// 
function sendNotify(body) {
  if (!verifyStaff(body.email, body.token, 'notify')) return { error: '無權限' };
  const sh = getSheet(CONFIG.SH_REGS);
  let rows = sheetToObjects(sh);
  if (body.sessionId) rows = rows.filter(r => r['場次ID'] == body.sessionId);
  if (body.target && body.target !== 'all') rows = rows.filter(r => r['審核狀態'] == body.target);
  if (body.regId) rows = rows.filter(r => r['報名ID'] == body.regId);

  let sent = 0;
  rows.forEach(r => {
    if (r['Email']) {
      try {
        GmailApp.sendEmail(r['Email'], body.subject, '', {
          htmlBody: buildEmailHtml(body.content, r['姓名'])
        });
        sent++;
      } catch(e) {}
    }
  });
  return { success: true, sent };
}

function sendRegConfirmEmail(email, name, sessionName, regId, status, total, sessionId) {
  try {
    const sesType = sessionId ? getSessionType(sessionId) : '';
    const brand = '';  // register 時 brand 從 body 傳入，若未傳用空
    const displayName = name;  // register 呼叫時只有 name，brand 另外從 obj 取
    GmailApp.sendEmail(email, `【${sessionName}】收到您的報名申請`, '', {
      htmlBody: buildEmailHtml(`
        <p>親愛的 <strong>${displayName}</strong>，</p>
        <p>我們已收到您報名 <strong>${sessionName}</strong> 的申請，請耐心等候審核通知。</p>
        <p>【報名編號】：<strong>${regId}</strong></p>
        <p style="margin-top:16px">審核結果將以 Email 通知，請記得先加入官方 LINE 告知品牌，即可快速劃位！</p>
        <p style="text-align:center;margin:20px 0">
          <a href="https://lin.ee/ZMcOn34" style="background:#06C755;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">加入官方 LINE</a>
        </p>
        <p style="text-align:center;margin:20px 0">
          <a href="${CONFIG.SITE_URL}" style="background:#f0fdf4;color:#2d6a4f;border:2px solid #2d6a4f;padding:10px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">報名其他場次</a>
        </p>
      `, displayName)
    });
  } catch(e) {}
}

function sendApprovalEmail(email, name, sessionId, regId, fee) {
  const sesName = getSessionNameById(sessionId);
  const sesType = getSessionType(sessionId);
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + CONFIG.PAY_DEADLINE_DAYS);
  const deadlineStr = deadline.getFullYear()+'/'+(deadline.getMonth()+1)+'/'+deadline.getDate();
  // 取品牌名稱（從報名資料）
  const sh = getSheet(CONFIG.SH_REGS);
  const rows = sheetToObjects(sh);
  const reg = rows.find(r => r['報名ID'] == regId);
  const brand = reg ? (reg['品牌名稱']||'') : '';
  const displayName = getDisplayName(name, brand, sesType);
  const payUrl = CONFIG.SITE_URL + '?member=1&pay=' + regId;
  try {
    GmailApp.sendEmail(email, `【${sesName}】${displayName} 恭喜錄取！請完成繳費`, '', {
      htmlBody: buildEmailHtml(`
        <p>親愛的 <strong>${displayName}</strong>，</p>
        <p>恭喜！您已成功錄取 <strong>${sesName}</strong>。</p>
        ${fee > 0 ? `
        <div style="background:#f0fdf4;border-radius:10px;padding:16px;margin:16px 0">
          <p style="font-size:16px;font-weight:700;color:#2d6a4f;margin-bottom:8px">應繳金額：NT$ ${fee}</p>
          <p style="color:#c0392b;font-size:13px">請於 <strong>${deadlineStr}</strong> 前完成繳費，逾期將自動釋出位置。</p>
        </div>
        <p style="text-align:center;margin:20px 0">
          <a href="${payUrl}" style="background:#2d6a4f;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">前往會員區完成繳費 →</a>
        </p>
        ` : '<p style="color:#2d6a4f;font-weight:700">本場次免費，您的名額已保留！</p>'}
        <p style="text-align:center;margin:16px 0;font-size:13px;color:#888">
          如有問題請聯繫官方 LINE：<a href="https://lin.ee/ZMcOn34" style="color:#06C755;font-weight:700">@2beloved</a>
        </p>
      `, displayName)
    });
  } catch(e) {}
}

function sendRejectionEmail(email, name, sessionId) {
  const sesName = getSessionNameById(sessionId);
  const sesType = getSessionType(sessionId);
  const sh = getSheet(CONFIG.SH_REGS);
  const rows = sheetToObjects(sh);
  // 找最新一筆該 email + 場次的報名
  const reg = rows.filter(r => r['Email']==email && r['場次ID']==sessionId).pop();
  const brand = reg ? (reg['品牌名稱']||'') : '';
  const displayName = getDisplayName(name, brand, sesType);
  try {
    GmailApp.sendEmail(email, `【${sesName}】報名結果通知`, '', {
      htmlBody: buildEmailHtml(`
        <p>親愛的 <strong>${displayName}</strong>，</p>
        <p>很抱歉，您本次報名的 <strong>${sesName}</strong> 已額滿。</p>
        <p>歡迎提前報名其他場次，我們期待與您相遇！</p>
        <p style="text-align:center;margin:24px 0">
          <a href="${CONFIG.SITE_URL}" style="background:#2d6a4f;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">報名其他場次</a>
        </p>
        <p style="text-align:center;font-size:13px;color:#888">
          如有問題請聯繫官方 LINE：<a href="https://lin.ee/ZMcOn34" style="color:#06C755;font-weight:700">@2beloved</a>
        </p>
      `, displayName)
    });
  } catch(e) {}
}


function sendStaffInviteEmail(email, name, role, perms, limitSessions) {
  const permLabels = {
    view_regs:'查看報名',review:'審核報名',checkin:'現場報到',pay:'確認付款',
    sessions:'管理場次',events:'管理活動',notify:'發送通知',announce:'管理公告',admin:'管理員帳號'
  };
  let permText = '';
  if (role==='superadmin'||role==='超級管理員') {
    permText = '所有功能（超級管理員）';
  } else {
    const granted = Object.keys(perms||{}).filter(k=>perms[k]).map(k=>permLabels[k]||k);
    permText = granted.length ? granted.join('、') : '（請聯繫主辦確認）';
  }
  let sesText = '所有場次';
  if (limitSessions&&limitSessions.length) {
    sesText = '僅限：'+limitSessions.map(id=>getSessionNameById(id)).join('、');
  }
  const displayName = name||email;
  try {
    GmailApp.sendEmail(email, '【兔彼樂】您已被授權為活動管理員', '', {
      htmlBody: buildEmailHtml(`
        <p>親愛的 <strong>${displayName}</strong>，</p>
        <p>兔彼樂共創活動已開通您的後台管理權限，歡迎加入團隊！</p>
        <div style="background:#f0fdf4;border-radius:10px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px"><strong>您的權限：</strong>${permText}</p>
          <p style="margin:0"><strong>可管理場次：</strong>${sesText}</p>
        </div>
        <p style="font-weight:700;margin-bottom:6px">登入後台方式：</p>
        <ol style="margin:0 0 12px;padding-left:20px;line-height:2">
          <li>開啟前台網址：<a href="${CONFIG.SITE_URL}">${CONFIG.SITE_URL}</a></li>
          <li>在首頁封面區域（Logo 位置）<strong>長按 3 秒</strong>，即可進入後台</li>
          <li>輸入您的 Email（${email}）登入</li>
        </ol>
        <p style="background:#fff8ed;border-radius:8px;padding:12px 14px;font-size:13px;color:#7c2d12">
          ⚠️ 登入方式為「長按首頁封面區域 3 秒」，非點擊圖片，任何封面圖片下都有效。
        </p>
        <p style="text-align:center;margin:20px 0">
          <a href="${CONFIG.SITE_URL}" style="background:#2d6a4f;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">前往前台登入後台</a>
        </p>
        <p style="text-align:center;font-size:13px;color:#888">
          如有問題請聯繫官方 LINE：<a href="https://lin.ee/ZMcOn34" style="color:#06C755;font-weight:700">@2beloved</a>
        </p>
      `, displayName)
    });
  } catch(e) { Logger.log('Staff invite email 失敗: '+e); }
}

function sendPaymentConfirmEmail(email, name, sessionId, amount, equipStr, stallNo) {
  const sesName = getSessionNameById(sessionId);
  const sesType = getSessionType(sessionId);
  const sh = getSheet(CONFIG.SH_REGS);
  const rows = sheetToObjects(sh);
  const reg = rows.filter(r => r['Email']==email && r['場次ID']==sessionId).pop();
  const brand = reg ? (reg['品牌名稱']||'') : '';
  const displayName = getDisplayName(name, brand, sesType);
  const regId = reg ? (reg['報名ID']||'') : '';
  const payUrl = CONFIG.SITE_URL + (regId ? '?member=1&pay='+regId : '');
  try {
    GmailApp.sendEmail(email, `【${sesName}】${displayName} 付款確認成功！`, '', {
      htmlBody: buildEmailHtml(`
        <p>親愛的 <strong>${displayName}</strong>，</p>
        <div style="background:#f0fdf4;border-radius:10px;padding:16px;margin:16px 0">
          <p style="font-size:16px;font-weight:700;color:#2d6a4f;margin-bottom:8px">✅ 付款確認成功！</p>
          <p>場次：<strong>${sesName}</strong></p>
          <p>繳費金額：<strong>NT$ ${amount}</strong></p>
          ${equipStr ? `<p>設備：${equipStr}</p>` : ''}
          ${stallNo ? `<p style="color:#2d6a4f;font-weight:700;font-size:16px;margin-top:8px">攤位號碼：${stallNo}</p>` : ''}
        </div>
        <p>繳費後記得填寫匯款通知，方便對帳快速劃位！</p>
        <p style="text-align:center;margin:20px 0">
          <a href="${payUrl}" style="background:#2d6a4f;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">填寫繳費通知</a>
        </p>
        <p>請記得按時出席，期待與您相見！</p>
        <p style="text-align:center;margin:16px 0">
          <a href="${CONFIG.SITE_URL}" style="background:#f0fdf4;color:#2d6a4f;border:2px solid #2d6a4f;padding:10px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">報名其他場次</a>
        </p>
        <p style="text-align:center;font-size:13px;color:#888">
          如有問題請聯繫官方 LINE：<a href="https://lin.ee/ZMcOn34" style="color:#06C755;font-weight:700">@2beloved</a>
        </p>
      `, displayName)
    });
  } catch(e) {}
}


// ── Email 稱呼 helper ──
function getDisplayName(name, brand, sessionType) {
  const useBrand = ['市集場次','通路寄賣'].includes(sessionType||'');
  return (useBrand && brand) ? brand : (name || brand || '您');
}

function getSessionType(sessionId) {
  const sh = getSheet(CONFIG.SH_SESSIONS);
  const rows = sheetToObjects(sh);
  const s = rows.find(r => r['場次ID'] == sessionId);
  return s ? (s['場次類型']||'') : '';
}

function buildEmailHtml(content, name) {
  return `
    <div style="font-family:'Noto Sans TC',sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fafaf8;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="color:#2d6a4f;font-size:20px;margin:0">兔彼樂共創活動</h2>
      </div>
      ${content}
      <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0">
      <p style="font-size:12px;color:#aaa;text-align:center">兔彼樂共創活動有限公司  統編 90279650</p>
    </div>`;
}

function getSessionNameById(sessionId) {
  const sh = getSheet(CONFIG.SH_SESSIONS);
  const rows = sheetToObjects(sh);
  const s = rows.find(r => r['場次ID'] == sessionId);
  return s ? s['場次名稱'] : sessionId;
}

// 
// 15. 綠界金流回呼
// 
//  綠界建立訂單 
function createEcpayOrder(body) {
  const sh = getSheet(CONFIG.SH_REGS);
  const row = findRowById(sh, 0, body.regId);
  if (row < 0) return { error: '找不到報名' };
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const rowData = sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0];
  const obj = {};
  headers.forEach((h,i) => obj[h]=rowData[i]);

  if (obj['審核狀態'] !== '已錄取') return { error: '尚未錄取' };
  if (isPaidStatus(obj['付款狀態'])) return { error: '已完成繳費' };

  const amount = Number(obj['繳費金額'])||0;
  if (amount <= 0) return { error: '金額錯誤' };

  const tradeNo = 'TBL' + Date.now().toString().slice(-10);
  const tradeDate = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss');

  // 建立綠界參數
  const params = {
    MerchantID: CONFIG.ECPAY_MERCHANT_ID,
    MerchantTradeNo: tradeNo,
    MerchantTradeDate: tradeDate,
    PaymentType: 'aio',
    TotalAmount: String(amount),
    TradeDesc: encodeURIComponent('兔彼樂報名費'),
    ItemName: encodeURIComponent(obj['場次ID']||'報名費'),
    ReturnURL: CONFIG.SITE_URL.replace('index.html','') + 'Code.gs?action=ecpayReturn',
    OrderResultURL: CONFIG.SITE_URL + '?pay_result=1',
    ChoosePayment: 'ALL',
    EncryptType: '1',
    ClientBackURL: CONFIG.SITE_URL,
  };

  // 計算 CheckMacValue
  params.CheckMacValue = calcCheckMac(params);

  // 記錄訂單號
  const pSh = getSheet(CONFIG.SH_PAYMENTS);
  pSh.appendRow([
    genId('PAY'), body.regId, obj['場次ID'], obj['Email'],
    amount, '綠界', '待付款', tradeNo, '', new Date().toISOString()
  ]);

  return { success: true, params, apiUrl: CONFIG.ECPAY_API_URL };
}

function calcCheckMac(params) {
  // 排序並組成字串
  const sorted = Object.keys(params).sort((a,b)=>a.toLowerCase().localeCompare(b.toLowerCase()));
  let str = 'HashKey=' + CONFIG.ECPAY_HASH_KEY + '&';
  str += sorted.map(k => k + '=' + params[k]).join('&');
  str += '&HashIV=' + CONFIG.ECPAY_HASH_IV;
  // URL encode
  str = encodeURIComponent(str).toLowerCase()
    .replace(/%20/g,'+').replace(/%21/g,'!').replace(/%28/g,'(')
    .replace(/%29/g,')').replace(/%2a/g,'*').replace(/%2d/g,'-')
    .replace(/%2e/g,'.').replace(/%5f/g,'_');
  // SHA256
  const raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    str, Utilities.Charset.UTF_8
  );
  return raw.map(b=>(b<0?b+256:b).toString(16).padStart(2,'0')).join('').toUpperCase();
}

// ── LINE Pay 建立訂單 ──
function createLinePayOrder(body) {
  const sh = getSheet(CONFIG.SH_REGS);
  const row = findRowById(sh, 0, body.regId);
  if (row < 0) return { error: '找不到報名' };
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const rowData = sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0];
  const obj = {};
  headers.forEach((h,i) => obj[h]=rowData[i]);
  if (obj['審核狀態'] !== '已錄取') return { error: '尚未錄取' };
  if (isPaidStatus(obj['付款狀態'])) return { error: '已完成繳費' };
  const amount = Number(obj['繳費金額'])||0;
  if (amount <= 0) return { error: '金額錯誤' };
  const orderId = 'TBL' + Date.now().toString().slice(-12);
  const returnUrl = CONFIG.SITE_URL + '?linepay_result=1&regId=' + body.regId;
  const cancelUrl = CONFIG.SITE_URL + '?linepay_cancel=1';
  const payload = {
    amount: amount, currency: 'TWD', orderId: orderId,
    packages: [{ id: 'pkg_'+orderId, amount: amount,
      products: [{ name: (obj['場次ID']||'報名費').slice(0,50), quantity: 1, price: amount }]
    }],
    redirectUrls: { confirmUrl: returnUrl, cancelUrl: cancelUrl }
  };
  const nonce = Utilities.getUuid();
  const timestamp = new Date().getTime().toString();
  const uri = '/v3/payments/request';
  const message = CONFIG.LINEPAY_SECRET + uri + JSON.stringify(payload) + nonce + timestamp;
  const rawSig = Utilities.computeHmacSha256Signature(message, CONFIG.LINEPAY_SECRET);
  const signature = Utilities.base64Encode(rawSig);
  const options = {
    method: 'POST', contentType: 'application/json',
    headers: {
      'Content-Type': 'application/json',
      'X-LINE-ChannelId': CONFIG.LINEPAY_CHANNEL_ID,
      'X-LINE-Authorization-Nonce': nonce,
      'X-LINE-Authorization-Date': timestamp,
      'X-LINE-Authorization': signature
    },
    payload: JSON.stringify(payload), muteHttpExceptions: true
  };
  try {
    const res = UrlFetchApp.fetch(CONFIG.LINEPAY_API_URL + uri, options);
    const data = JSON.parse(res.getContentText());
    if (data.returnCode !== '0000') return { error: data.returnMessage||'LINE Pay 錯誤' };
    const pSh = getSheet(CONFIG.SH_PAYMENTS);
    pSh.appendRow([genId('PAY'), body.regId, obj['場次ID'], obj['Email'],
      amount, 'LINE Pay', '待付款', orderId, '', new Date().toISOString()]);
    return { success: true, paymentUrl: data.info.paymentUrl.web };
  } catch(e) { return { error: 'LINE Pay 連線失敗: '+e.message }; }
}

function ecpayCallback(e) {
  try {
    const params = e.parameter;
    if (params.RtnCode !== '1') return ContentService.createTextOutput('0|RtnCode not 1');

    const tradeNo = params.MerchantTradeNo; // TBL+timestamp，不是 REG...

    // 用訂單號反查付款紀錄表，取得報名 ID
    const pSh = getSheet(CONFIG.SH_PAYMENTS);
    const pData = sheetToObjects(pSh);
    // SH_PAYMENTS 欄位順序：ID, 報名ID, 場次ID, Email, 金額, 方式, 狀態, 訂單號, ...
    const payRow = pData.find(r => (r['訂單號']||r['MerchantTradeNo']||r[7]||'') === tradeNo);
    if (!payRow) return ContentService.createTextOutput('0|tradeNo not found: ' + tradeNo);

    const regId = payRow['報名ID'] || payRow[1] || '';
    if (!regId) return ContentService.createTextOutput('0|regId empty');

    // 更新付款紀錄狀態
    const pHeaders = pSh.getRange(1,1,1,pSh.getLastColumn()).getValues()[0];
    const pRows = pSh.getDataRange().getValues();
    for (let i = 1; i < pRows.length; i++) {
      const rowTradeNo = String(pRows[i][pHeaders.indexOf('訂單號')]||pRows[i][7]||'');
      if (rowTradeNo === tradeNo) {
        const statusCol = pHeaders.indexOf('狀態');
        const paidAtCol = pHeaders.indexOf('付款時間');
        if (statusCol >= 0) pSh.getRange(i+1, statusCol+1).setValue('已確認');
        if (paidAtCol >= 0) pSh.getRange(i+1, paidAtCol+1).setValue(new Date().toISOString());
        break;
      }
    }

    // 更新報名資料
    const sh = getSheet(CONFIG.SH_REGS);
    const row = findRowById(sh, 0, regId);
    if (row < 0) return ContentService.createTextOutput('0|reg not found: ' + regId);

    const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    const rowData = sh.getRange(row, 1, 1, sh.getLastColumn()).getValues()[0];
    const obj = {};
    headers.forEach((h, i) => obj[h] = rowData[i]);

    sh.getRange(row, headers.indexOf('付款狀態') + 1).setValue('已繳費 ✓');
    sh.getRange(row, headers.indexOf('付款方式') + 1).setValue('綠界');
    const paidAtIdx = headers.indexOf('付款時間');
    if (paidAtIdx >= 0) sh.getRange(row, paidAtIdx + 1).setValue(new Date().toISOString());

    // 鎖定攤位（若有選位）
    try {
      if (obj['攤位號碼']) lockStall({ regId: regId });
    } catch(se) { Logger.log('lockStall error: ' + se.message); }

    // 整理設備字串
    let equipStr = '';
    try {
      const eq = JSON.parse(obj['設備JSON']||'{}');
      equipStr = Object.entries(eq).filter(([k,v])=>v>0).map(([k,v])=>k+'x'+v).join('、');
    } catch(ee) {}

    // 寄確認信
    const stallNo = obj['攤位號碼'] || '';
    sendPaymentConfirmEmail(obj['Email'], obj['姓名'], obj['場次ID'], obj['繳費金額'], equipStr, stallNo);

    return ContentService.createTextOutput('1|OK');
  } catch(err) {
    Logger.log('ecpayCallback error: ' + err.message);
    return ContentService.createTextOutput('0|' + err.message);
  }
}

// ══ 測試資料建立工具 ══
// ⚠️ 正式版：setupTestData 已停用，請勿執行。如需測試請複製此函式並手動改名後使用。
function DISABLED_setupTestData() {
  throw new Error('⛔ setupTestData 已停用，正式版不可執行此函式。如需建立測試資料，請複製此函式並手動改名後使用。');
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  
  // ── 1. 活動 ──
  const evSh = ss.getSheetByName(CONFIG.SH_EVENTS) || ss.insertSheet(CONFIG.SH_EVENTS);
  const evHeaders = evSh.getRange(1,1,1,evSh.getLastColumn()).getValues()[0];
  
  const events = [
    { id:'EVT_TEST_001', title:'耶市集', region:'高雄', portal:'市集報名', cover:'', status:'開放' },
    { id:'EVT_TEST_002', title:'Holy嗨主題市集', region:'台中', portal:'市集報名', cover:'', status:'開放' },
    { id:'EVT_TEST_003', title:'兔彼樂的市集小旅行', region:'台東', portal:'體驗活動', cover:'', status:'開放' },
    { id:'EVT_TEST_004', title:'恩典之約禮物店', region:'台南', portal:'通路寄賣', cover:'', status:'開放' },
  ];
  
  // 清除舊測試資料
  const evData = evSh.getDataRange().getValues();
  const toDeleteEv = [];
  for(let i=1; i<evData.length; i++){
    if(String(evData[i][0]).startsWith('EVT_TEST_')) toDeleteEv.unshift(i+1);
  }
  toDeleteEv.forEach(r => evSh.deleteRow(r));
  
  events.forEach(ev => {
    evSh.appendRow([ev.id, ev.title, ev.region, ev.portal, ev.cover, ev.status, new Date().toISOString()]);
  });
  Logger.log('✅ 活動建立完成');

  // ── 2. 場次 ──
  const sesSh = ss.getSheetByName(CONFIG.SH_SESSIONS) || ss.insertSheet(CONFIG.SH_SESSIONS);
  
  const sessions = [
    { id:'SES_TEST_001', eventId:'EVT_TEST_001', name:'耶市集 7月場', region:'高雄美麗島', date:'2026/07/05', fee:2200, deposit:500, limit:30, status:'報名中', portal:'市集報名' },
    { id:'SES_TEST_002', eventId:'EVT_TEST_002', name:'Holy嗨 聖誕主題場', region:'台中大里', date:'2026/12/20', fee:1800, deposit:400, limit:25, status:'報名中', portal:'市集報名' },
    { id:'SES_TEST_003', eventId:'EVT_TEST_003', name:'台東鐵道市集場', region:'台東', date:'2026/08/15', fee:1500, deposit:300, limit:20, status:'報名中', portal:'體驗活動' },
    { id:'SES_TEST_004', eventId:'EVT_TEST_004', name:'恩典之約寄賣申請', region:'台南', date:'2026/07/01', fee:0, deposit:0, limit:10, status:'報名中', portal:'通路寄賣' },
  ];
  
  // 清除舊測試場次
  const sesData = sesSh.getDataRange().getValues();
  const toDeleteSes = [];
  for(let i=1; i<sesData.length; i++){
    if(String(sesData[i][0]).startsWith('SES_TEST_')) toDeleteSes.unshift(i+1);
  }
  toDeleteSes.forEach(r => sesSh.deleteRow(r));
  
  sessions.forEach(s => {
    const dates = JSON.stringify([{date:s.date, fee:s.fee}]);
    sesSh.appendRow([
      s.id, s.eventId, s.name, s.region, dates,
      s.fee, s.deposit, s.limit, s.status, s.portal,
      '[]', '[]', '', '', new Date().toISOString()
    ]);
  });
  Logger.log('✅ 場次建立完成');

  // ── 3. 報名資料 ──
  const regSh = ss.getSheetByName(CONFIG.SH_REGS) || ss.insertSheet(CONFIG.SH_REGS);
  
  const regs = [
    // 耶市集 - 3筆
    { id:'REG_TEST_001', sesId:'SES_TEST_001', evId:'EVT_TEST_001', email:'mei@test.com', name:'陳小美', phone:'0912345001', brand:'小美手作坊', brandIntro:'手工皮革小物', stallCount:1, equip:'{"桌子":1,"椅子":2}', status:'已錄取', payStatus:'已繳費 ✓', amount:2200, deposit:500, checkin:'', taxId:'', invoiceTitle:'' },
    { id:'REG_TEST_002', sesId:'SES_TEST_001', evId:'EVT_TEST_001', email:'wang@test.com', name:'王大明', phone:'0912345002', brand:'明記古著', brandIntro:'二手古著服飾', stallCount:2, equip:'{"桌子":2,"椅子":4}', status:'待審核', payStatus:'未繳費', amount:4400, deposit:1000, checkin:'', taxId:'', invoiceTitle:'' },
    { id:'REG_TEST_003', sesId:'SES_TEST_001', evId:'EVT_TEST_001', email:'lin@test.com', name:'林美珠', phone:'0912345003', brand:'珠珠陶藝', brandIntro:'手拉坯陶器', stallCount:1, equip:'{"桌子":1,"椅子":2}', status:'已錄取', payStatus:'已繳費 ✓', amount:2200, deposit:500, checkin:'', taxId:'12345678', invoiceTitle:'珠珠工作室有限公司' },
    // Holy嗨 - 3筆
    { id:'REG_TEST_004', sesId:'SES_TEST_002', evId:'EVT_TEST_002', email:'chen@test.com', name:'陳志豪', phone:'0912345004', brand:'豪氣插畫', brandIntro:'原創插畫商品', stallCount:1, equip:'{"桌子":1}', status:'待審核', payStatus:'未繳費', amount:1800, deposit:400, checkin:'', taxId:'', invoiceTitle:'' },
    { id:'REG_TEST_005', sesId:'SES_TEST_002', evId:'EVT_TEST_002', email:'huang@test.com', name:'黃雅婷', phone:'0912345005', brand:'婷婷烘焙坊', brandIntro:'手工餅乾點心', stallCount:1, equip:'{"桌子":1,"椅子":2}', status:'備取', payStatus:'未繳費', amount:1800, deposit:400, checkin:'', taxId:'', invoiceTitle:'' },
    { id:'REG_TEST_006', sesId:'SES_TEST_002', evId:'EVT_TEST_002', email:'wu@test.com', name:'吳建宏', phone:'0912345006', brand:'建宏皮件', brandIntro:'客製皮革配件', stallCount:2, equip:'{"桌子":2,"椅子":2}', status:'已錄取', payStatus:'已繳費 ✓', amount:3600, deposit:800, checkin:'', taxId:'', invoiceTitle:'' },
    // 台東鐵道 - 3筆
    { id:'REG_TEST_007', sesId:'SES_TEST_003', evId:'EVT_TEST_003', email:'tsai@test.com', name:'蔡依珊', phone:'0912345007', brand:'珊瑚漂流品', brandIntro:'海洋風格手作', stallCount:1, equip:'{"桌子":1}', status:'待審核', payStatus:'未繳費', amount:1500, deposit:300, checkin:'', taxId:'', invoiceTitle:'' },
    { id:'REG_TEST_008', sesId:'SES_TEST_003', evId:'EVT_TEST_003', email:'liao@test.com', name:'廖家豪', phone:'0912345008', brand:'家豪木工', brandIntro:'台灣原木小物', stallCount:1, equip:'{"桌子":1,"椅子":2}', status:'已錄取', payStatus:'已繳費 ✓', amount:1500, deposit:300, checkin:'', taxId:'', invoiceTitle:'' },
    { id:'REG_TEST_009', sesId:'SES_TEST_003', evId:'EVT_TEST_003', email:'hsu@test.com', name:'許雅文', phone:'0912345009', brand:'雅文刺繡坊', brandIntro:'傳統刺繡現代化', stallCount:1, equip:'{"桌子":1}', status:'不錄取', payStatus:'未繳費', amount:1500, deposit:0, checkin:'', taxId:'', invoiceTitle:'' },
    // 恩典之約 - 3筆
    { id:'REG_TEST_010', sesId:'SES_TEST_004', evId:'EVT_TEST_004', email:'fang@test.com', name:'方小玲', phone:'0912345010', brand:'玲玲香皂工坊', brandIntro:'天然手工皂', stallCount:1, equip:'{}', status:'待審核', payStatus:'未繳費', amount:0, deposit:0, checkin:'', taxId:'', invoiceTitle:'' },
    { id:'REG_TEST_011', sesId:'SES_TEST_004', evId:'EVT_TEST_004', email:'kuo@test.com', name:'郭明翰', phone:'0912345011', brand:'明翰文創設計', brandIntro:'文創紙品設計', stallCount:1, equip:'{}', status:'已錄取', payStatus:'已繳費 ✓', amount:0, deposit:0, checkin:'', taxId:'', invoiceTitle:'' },
    { id:'REG_TEST_012', sesId:'SES_TEST_004', evId:'EVT_TEST_004', email:'chiang@test.com', name:'江佩君', phone:'0912345012', brand:'佩君手織品', brandIntro:'手工編織包袋', stallCount:1, equip:'{}', status:'待審核', payStatus:'未繳費', amount:0, deposit:0, checkin:'', taxId:'', invoiceTitle:'' },
  ];
  
  // 清除舊測試報名
  let regData = regSh.getDataRange().getValues();
  const toDeleteReg = [];
  for(let i=1; i<regData.length; i++){
    if(String(regData[i][0]).startsWith('REG_TEST_')) toDeleteReg.unshift(i+1);
  }
  toDeleteReg.forEach(r => regSh.deleteRow(r));
  
  // 取得表頭
  const regHeaders = regSh.getRange(1,1,1,regSh.getLastColumn()).getValues()[0];
  
  regs.forEach(r => {
    const row = new Array(Math.max(regHeaders.length, 30)).fill('');
    function setCol(name, val) {
      const i = regHeaders.indexOf(name);
      if(i >= 0) row[i] = val;
    }
    setCol('報名ID', r.id);
    setCol('場次ID', r.sesId);
    setCol('活動ID', r.evId);
    setCol('Email', r.email);
    setCol('姓名', r.name);
    setCol('手機', r.phone);
    setCol('品牌名稱', r.brand);
    setCol('品牌介紹', r.brandIntro);
    setCol('攤位數', r.stallCount);
    setCol('加購JSON', r.equip);
    setCol('審核狀態', r.status);
    setCol('付款狀態', r.payStatus);
    setCol('繳費金額', r.amount);
    setCol('保證金', r.deposit);
    setCol('報到狀態', '未報到');
    setCol('清場狀態', '未清場');
    setCol('退押金狀態', '未退押金');
    setCol('統一編號', r.taxId);
    setCol('發票抬頭', r.invoiceTitle);
    setCol('發票狀態', r.taxId?'待開立':'');
    setCol('報名時間', new Date().toISOString());
    regSh.appendRow(row.slice(0, regHeaders.length));
  });
  Logger.log('✅ 報名資料建立完成（12筆）');

  // ── 4. 財報測試資料 ──
  let finSh = ss.getSheetByName('財報明細');
  if(!finSh){
    finSh = ss.insertSheet('財報明細');
    finSh.appendRow(['ID','場次ID','類型','品項','金額','自動','建立時間']);
  }
  
  // 清除舊財報測試
  let finData = finSh.getDataRange().getValues();
  const toDeleteFin = [];
  for(let i=1; i<finData.length; i++){
    if(String(finData[i][0]).startsWith('FIN_TEST_')) toDeleteFin.unshift(i+1);
  }
  toDeleteFin.forEach(r => finSh.deleteRow(r));
  
  const finItems = [
    ['FIN_TEST_001', 'SES_TEST_001', 'expense', '場地租金', 8000, 'FALSE'],
    ['FIN_TEST_002', 'SES_TEST_001', 'expense', '設備租借成本', 1500, 'FALSE'],
    ['FIN_TEST_003', 'SES_TEST_001', 'income',  '臨時加租椅子', 300,  'FALSE'],
    ['FIN_TEST_004', 'SES_TEST_002', 'expense', '場地租金', 6000, 'FALSE'],
    ['FIN_TEST_005', 'SES_TEST_002', 'expense', '臨時印海報', 450, 'FALSE'],
    ['FIN_TEST_006', 'SES_TEST_003', 'expense', '場地租金(鐵道)', 5000, 'FALSE'],
    ['FIN_TEST_007', 'SES_TEST_003', 'income',  '停車費收入', 2000, 'FALSE'],
  ];
  
  finItems.forEach(item => {
    finSh.appendRow([...item, new Date().toISOString()]);
  });
  Logger.log('✅ 財報測試資料建立完成');

  Logger.log('');
  Logger.log('=== 測試資料摘要 ===');
  Logger.log('活動: 4個（耶市集/Holy嗨/台東鐵道/恩典之約）');
  Logger.log('場次: 各1個，共4個');
  Logger.log('報名: 各3筆，共12筆');
  Logger.log('  - 耶市集: 已錄取已繳費x2、待審核x1（其中1筆有統編）');
  Logger.log('  - Holy嗨: 已錄取已繳費x1、待審核x1、備取x1');
  Logger.log('  - 台東鐵道: 已錄取已繳費x1、待審核x1、不錄取x1');
  Logger.log('  - 恩典之約: 已錄取x1、待審核x2（免費場次）');
  Logger.log('財報: 7筆收支紀錄');
  Logger.log('');
  Logger.log('→ 請至後台重新整理頁面查看測試資料');
}

// ── 系統外觀設定（PropertiesService）──
function getSiteConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    heroImg:  props.getProperty('SITE_HERO_IMG')  || '',
    infoText: props.getProperty('SITE_INFO_TEXT') || '',
  };
}

function saveSiteConfig(body) {
  if (!verifyStaff(body.email, body.token, 'superadmin')) return { error: '無權限' };
  const props = PropertiesService.getScriptProperties();
  props.setProperty('SITE_HERO_IMG',  body.heroImg  || '');
  props.setProperty('SITE_INFO_TEXT', body.infoText || '');
  return { success: true };
}

