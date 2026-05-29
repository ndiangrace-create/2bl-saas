// ══════════════════════════════════════════════════════════════
// 兔彼樂活動管理系統｜Apps Script v7
// 敏感資料請存在 Apps Script > 專案設定 > 指令碼屬性
// 屬性名稱：SPREADSHEET_ID / ADMIN_EMAIL / ECPAY_MERCHANT_ID
//           ECPAY_HASH_KEY / ECPAY_HASH_IV / LINE_TOKEN / LINE_ADMIN_ID
// ══════════════════════════════════════════════════════════════

function getProp(key) {
  // 先讀 Properties，沒有再用預設值
  const props = PropertiesService.getScriptProperties();
  const val = props.getProperty(key);
  const defaults = {
    SPREADSHEET_ID: '1FgCbb2gJ4fSYOvTCnWwDcT8YkVyn8LE1pTSlD5qvJ60',
    ADMIN_EMAIL: 'ndiangrace@gmail.com',
    ECPAY_MERCHANT_ID: '3098138',
    ECPAY_HASH_KEY: 'KTubxEGg9Yp0KFCC',
    ECPAY_HASH_IV: 'UCKRTkLdWlcflYO8',
    LINE_TOKEN: '',
    LINE_ADMIN_ID: '',
    SITE_URL: 'https://ndiangrace-create.github.io/tuibile',
  };
  return val || defaults[key] || '';
}

// ── 試算表工具 ──
function getDB() { return SpreadsheetApp.openById(getProp('SPREADSHEET_ID')); }
function getSheet(name) {
  const ss = getDB();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}
function rows(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const h = data[0];
  return data.slice(1).map(r => Object.fromEntries(h.map((k,i) => [k, r[i]])));
}
function genId(prefix) {
  return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substr(2,4).toUpperCase();
}
function fmt(d) {
  if (!d) return '';
  try { return Utilities.formatDate(new Date(d), 'Asia/Taipei', 'yyyy/MM/dd'); } catch(e) { return String(d); }
}
function fmtShort(d) {
  if (!d) return '';
  try { return Utilities.formatDate(new Date(d), 'Asia/Taipei', 'M/d'); } catch(e) { return String(d); }
}
function dateRange(start, end) {
  if (!start) return '';
  const s = new Date(start), e = end ? new Date(end) : null;
  if (!e || s.getTime() === e.getTime()) return fmtShort(start);
  if (s.getMonth() === e.getMonth()) return `${s.getMonth()+1}/${s.getDate()}-${e.getDate()}`;
  return `${fmtShort(start)}-${fmtShort(end)}`;
}

// ══ doGet ══
function doGet(e) {
  const action = e.parameter.action;
  let payload = {};
  if (e.parameter.data) {
    try { payload = JSON.parse(decodeURIComponent(e.parameter.data)); } catch(err) {}
    if (payload.action) {
      return out(handleWrite(payload));
    }
  }
  try {
    switch(action) {
      case 'getSessions':       return out(getSessions());
      case 'getVendor':         return out(getVendorByEmail(decodeURIComponent(e.parameter.email||'')));
      case 'getDashboard':      return out(getDashboard(e.parameter.sessionId));
      case 'getVendors':        return out(getVendors(e.parameter.sessionId));
      case 'getCheckin':        return out(getCheckin(e.parameter.sessionId));
      case 'adminLogin':        return out(adminLogin(e.parameter.email));
      case 'getSession':        return out(getSessionDetail(e.parameter.sessionId));
      case 'getPositions':      return out(getPositions(e.parameter.sessionId));
      case 'getSubSessions':    return out(getSubSessions(e.parameter.sessionId));
      case 'getPartners':       return out(getPartners());
      case 'getWeeklyCheckin':  return out(getWeeklyCheckin());
      case 'getAllSessions':    return out(getAllSessionsForDashboard());
      case 'linePayConfirm': return linePayConfirm(e);
      case 'getAnnouncements': return out(getAnnouncements());
      default: return out({ error: 'unknown action' });
    }
  } catch(err) {
    Logger.log(err);
    return out({ error: err.message });
  }
}
function doPost(e) {
  let payload = {};
  try { payload = JSON.parse(e.postData.contents); } catch(err) {}
  return out(handleWrite(payload));
}
function out(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleWrite(p) {
  switch(p.action) {
    case 'register':          return register(p);
    case 'registerMember':    return registerMember(p);
    case 'updateMember':      return updateMember(p);
    case 'updateStatus':      return updateStatus(p);
    case 'markCheckin':       return markCheckin(p);
    case 'markClear':         return markClear(p);
    case 'markRefunded':      return markRefunded(p);
    case 'saveExpenses':      return saveExpenses(p);
    case 'saveIncomes':       return saveIncomes(p);
    case 'ecpayCallback':     return ecpayCallback(p);
    case 'applyRefund':       return applyRefund(p);
    case 'createSession':     return createSession(p);
    case 'setupPositions':    return setupPositions(p);
    case 'selectPosition':    return selectPosition(p);
    case 'adminMovePos':      return adminMovePos(p);
    case 'savePartner':       return savePartner(p);
    case 'deletePartner':     return deletePartner(p);
    case 'addStaff':          return addStaff(p);
    case 'removeStaff':       return removeStaff(p);
    case 'addPoints':         return addPoints(p);
    case 'lineCallback':      return lineCallback(p);
    case 'createLinePayUrl':  return createLinePayUrl(p);
    case 'cancelRegistration': return cancelRegistration(p);
    case 'copySession': return copySession(p);
    case 'updateSession': return updateSession(p);
    case 'updateSessionStatus': return updateSessionStatus(p);
    case 'deleteSession': return deleteSession(p);
    case 'batchResendEmail': return batchResendEmail(p);
    case 'getStaffList': return out(getStaffList());
    case 'saveAnnouncement':  return saveAnnouncement(p);
    case 'deleteAnnouncement': return deleteAnnouncement(p);
    case 'createPaymentUrl':  return createPaymentUrl(p);
    default: return { success: false, message: '未知操作' };
  }
}

// ══════════════════════════════════════════════════════════════
// 場次
// ══════════════════════════════════════════════════════════════
function getSessions() {
  const sheet = getSheet('場次設定');
  const regs = rows(getSheet('報名記錄'));
  const allRows = rows(sheet).filter(r => r['場次ID'] && r['狀態'] === '報名中');

  const sessions = allRows.map(r => {
    const sid = r['場次ID'];
    const enrolled = regs.filter(x => x['場次ID'] === sid &&
      ['待審核','錄取','已付款'].includes(x['審核狀態'])).length;
    return buildSession(r, enrolled);
  });
  return { sessions };
}

function getAllSessionsForDashboard() {
  const sheet = getSheet('場次設定');
  const regs = rows(getSheet('報名記錄'));
  const allRows = rows(sheet).filter(r => r['場次ID']);

  return { sessions: allRows.map(r => {
    const sid = r['場次ID'];
    const sRegs = regs.filter(x => x['場次ID'] === sid);
    const enrolled = sRegs.length;
    const accepted = sRegs.filter(x => x['審核狀態'] === '錄取').length;
    const paid = sRegs.filter(x => x['付款狀態'] === '已付款').length;
    const pending = sRegs.filter(x => x['審核狀態'] === '待審核').length;
    const limit = parseInt(r['攤位數上限']) || 0;

    // 設備統計
    const equipKeys = ['帳篷','椅子','桌','野餐墊','桌布','電','燈','陽傘'];
    const equip = {};
    equipKeys.forEach(k => {
      const total = sRegs.filter(x=>x['付款狀態']==='已付款')
        .reduce((s,x)=>s+(parseInt(x['加購-'+k])||0),0);
      if (total > 0) equip[k] = total;
    });

    return {
      id: sid,
      name: r['場次名稱'] || '',
      type: r['活動類型'] || '市集',
      dateDisplay: dateRange(r['活動日期'], r['活動結束日期']),
    timeStart: r['開始時間'] || '',
    timeEnd: r['結束時間'] || '',
      dateStart: r['活動日期'] ? fmt(r['活動日期']) : '',
      status: r['狀態'] || '',
      city: r['城市'] || '',
      venue: r['場地名稱'] || '',
      enrolled, accepted, paid, pending, limit,
      remaining: Math.max(0, limit - accepted),
      equip,
      organizer: r['主辦單位'] || '',
      coOrganizer: r['協辦單位'] || '',
    };
  })};
}

function buildSession(r, enrolled) {
  const sid = r['場次ID'];
  return {
    id: sid,
    name: r['場次名稱'] || '',
    type: r['活動類型'] || '市集',
    intro: r['場次說明'] || '',
    date: r['活動日期'] ? fmt(r['活動日期']) : '',
    dateEnd: r['活動結束日期'] ? fmt(r['活動結束日期']) : '',
    dateDisplay: dateRange(r['活動日期'], r['活動結束日期']),
    timeStart: r['開始時間'] || '',
    timeEnd: r['結束時間'] || '',
    city: r['城市'] || '',
    venue: r['場地名稱'] || '',
    mapUrl: r['場地圖連結'] || '',
    fee: parseInt(r['攤位費']) || 0,
    deposit: parseInt(r['保證金']) || 500,
    limit: parseInt(r['攤位數上限']) || 30,
    deadline: r['付款截止日'] ? fmt(r['付款截止日']) : '',
    basicEquip: r['基本配備說明'] || '',
    enrolled: enrolled || 0,
    openVendor: r['開放攤商'] === '是',
    openTeacher: r['開放體驗老師'] === '是',
    openPublic: r['開放民眾體驗'] === '是',
    openPartner: r['開放合作夥伴'] === '是',
    openTheme: r['開放主題活動'] === '是',
    openDept: r['開放百貨寄賣'] === '是',
    hasPositions: r['位子清單'] ? true : false,
    posLabel: r['活動類型']==='體驗' ? '體驗編號' : (r['活動類型']==='百貨' ? '攤位編號' : '攤位編號'),
    modules: (() => { try { return JSON.parse(r['表單模組']||'{}'); } catch(e){ return {}; } })(),
    customFields: (() => { try { return JSON.parse(r['自訂欄位']||'[]'); } catch(e){ return []; } })(),
    feeMode: r['計費方式'] || '場次',
    themeItems: r['主題活動項目'] ? String(r['主題活動項目']).split(',').map(s=>s.trim()).filter(Boolean) : [],
    openFire: r['開放明火申報'] !== '否',
    openPower: r['開放用電申報'] !== '否',
    // 設備
    equip: ['帳篷','椅子','桌','野餐墊','桌布','電','燈','陽傘'].reduce((obj,k) => {
      obj[k] = { open: r[k+'提供']==='是', price: parseInt(r[k+'價格'])||0 };
      return obj;
    }, {}),
  };
}

function getSessionById(id) {
  return rows(getSheet('場次設定')).find(r => r['場次ID'] === id) || null;
}

function getSessionDetail(sessionId) {
  const r = getSessionById(sessionId);
  if (!r) return { found: false };
  const regs = rows(getSheet('報名記錄')).filter(x => x['場次ID'] === sessionId);
  return { found: true, session: r, stats: {
    total: regs.length,
    pending: regs.filter(x=>x['審核狀態']==='待審核').length,
    accepted: regs.filter(x=>x['審核狀態']==='錄取').length,
    paid: regs.filter(x=>x['付款狀態']==='已付款').length,
  }};
}

function getSubSessions(sessionId) {
  const subs = rows(getSheet('子場設定')).filter(r => r['場次ID'] === sessionId);
  return { subSessions: subs.map(s => ({
    id: s['子場ID'], name: s['子場名稱'],
    fee: parseInt(s['攤位費'])||0, deposit: parseInt(s['保證金'])||500,
    limit: parseInt(s['名額'])||30, enrolled: parseInt(s['已報名數'])||0,
  }))};
}

// ══════════════════════════════════════════════════════════════
// 會員
// ══════════════════════════════════════════════════════════════
function getVendorByEmail(email) {
  if (!email) return { found: false };
  const vendor = rows(getSheet('攤商會員')).find(r => r['Email'] === email);
  if (!vendor) return { found: false };

  const regSheet = getSheet('報名記錄');
  const allRegs = rows(regSheet).filter(r => r['Email'] === email);
  const sessions = rows(getSheet('場次設定'));

  const history = allRegs
    .sort((a,b) => new Date(b['報名時間']||0) - new Date(a['報名時間']||0))
    .map(r => {
      const ses = sessions.find(s => s['場次ID'] === r['場次ID']);
      let status = r['審核狀態'] || '待審核';
      if (r['付款狀態'] === '已付款') {
        const actDate = ses ? new Date(ses['活動日期']) : null;
        status = actDate && actDate < new Date() ? '已完成' : '已付款';
      } else if (status === '錄取') {
        status = '已錄取待付款';
      }
      return {
        regId: r['報名ID'] || '',
        sessionId: r['場次ID'] || '',
        sessionName: r['場次名稱'] || r['場次ID'] || '',
        date: ses ? fmt(ses['活動日期']) : '',
        status,
        booth: r['攤位編號'] || '',
        deadline: ses ? fmt(ses['付款截止日']) : '',
        identityType: r['身份類型'] || '攤商',
        myPosition: r['攤位編號'] || '',
        // 選位條件
        canSelectPos: r['審核狀態']==='錄取' && r['付款狀態']==='已付款',
        hasPositions: ses ? (ses['位子清單'] ? true : false) : false,
      };
    });

  return {
    found: true,
    vendor: {
      id: vendor['攤商ID'],
      name: vendor['個人姓名'] || '',
      brand: vendor['品牌名稱'] || '',
      email: vendor['Email'],
      phone: vendor['手機號碼'] || '',
      region: vendor['所在地區'] || '',
      fb: vendor['FB連結'] || '',
      ig: vendor['IG連結'] || '',
      points: parseInt(vendor['累積點數']) || 0,
      history,
    }
  };
}

function registerMember(data) {
  const email = data.email;
  if (!email) return { success: false, message: '請填寫 Email' };

  const sheet = getSheet('攤商會員');
  const existing = rows(sheet).find(r => r['Email'] === email);

  let vendorId;
  if (existing) {
    // 更新現有會員
    vendorId = existing['攤商ID'];
    updateMemberInSheet(sheet, email, data);
  } else {
    // 建立新會員
    vendorId = genId('V');
    const allHeaders = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
    const row = new Array(allHeaders.length).fill('');
    const set = (k,v) => { const i=allHeaders.indexOf(k); if(i>=0) row[i]=v; };
    set('攤商ID', vendorId);
    set('品牌名稱', data.brand || data.name || '');
    set('個人姓名', data.name || '');
    set('Email', email);
    set('手機號碼', data.phone || '');
    set('所在地區', data.region || '');
    set('FB連結', data.fb || '');
    set('IG連結', data.ig || '');
    set('累積點數', 0);
    set('累積場次', 0);
    set('建立時間', new Date());
    set('最後更新', new Date());
    sheet.appendRow(row);
  }

  // 寄歡迎信
  try {
    GmailApp.sendEmail(email, '【兔彼樂】會員建立成功！',
      `${data.brand || data.name} 您好，\n\n會員資料已建立，之後登入即可快速報名各場活動。\n\n兔彼樂共創活動 敬上`);
  } catch(e) {}

  // 回傳完整 vendor 資料（讓前台可以直接設定 localStorage）
  const result = getVendorByEmail(email);
  const isNew = !existing; // 是否新建立
  return { success: true, vendorId, isNew, vendor: result.vendor };
}

function updateMemberInSheet(sheet, email, data) {
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  const emailCol = h.indexOf('Email');
  for (let i=1; i<allData.length; i++) {
    if (allData[i][emailCol] === email) {
      const set = (k,v) => { const col=h.indexOf(k); if(col>=0 && v) sheet.getRange(i+1,col+1).setValue(v); };
      set('品牌名稱', data.brand);
      set('個人姓名', data.name);
      set('手機號碼', data.phone);
      set('所在地區', data.region);
      set('FB連結', data.fb);
      set('IG連結', data.ig);
      set('最後更新', new Date());
      return;
    }
  }
}

function updateMember(data) {
  const sheet = getSheet('攤商會員');
  updateMemberInSheet(sheet, data.email, data);
  const result = getVendorByEmail(data.email);
  return { success: true, vendor: result.vendor };
}

// ══════════════════════════════════════════════════════════════
// 報名
// ══════════════════════════════════════════════════════════════
function register(data) {
  const email = data.email;
  const sessionId = data.sessionId;
  const identityType = data.identityType || '攤商';

  if (!email || !sessionId) return { success: false, message: '資料不完整' };

  // 黑名單
  if (rows(getSheet('黑名單')).some(r => r['Email'] === email))
    return { success: false, message: '您的帳號目前無法報名' };

  // 重複報名（同場次+同身份，排除不錄取）
  const existing = rows(getSheet('報名記錄')).find(r =>
    r['Email'] === email &&
    r['場次ID'] === sessionId &&
    r['身份類型'] === identityType &&
    r['審核狀態'] !== '不錄取'
  );
  if (existing) return { success: false, message: `您已報名此場次（${identityType}）` };

  const session = getSessionById(sessionId);
  if (!session) return { success: false, message: '場次不存在' };

  // 確保有會員
  let vendorId = data.vendorId || '';
  if (!vendorId) {
    const v = rows(getSheet('攤商會員')).find(r => r['Email'] === email);
    vendorId = v ? v['攤商ID'] : genId('V');
  }

  // 費用計算
  const booths = parseInt(data.boothCount) || 1;
  const equip = data.equip || {};
  let equipFee = 0;
  ['帳篷','椅子','桌','野餐墊','桌布','電','燈','陽傘'].forEach(k => {
    equipFee += (parseInt(equip[k])||0) * (parseInt(session[k+'價格'])||0);
  });

  let boothFee = 0, depositFee = 0;
  if (identityType === '民眾體驗') {
    boothFee = parseInt(session['體驗費用']) || 0;
    depositFee = 0;
  } else if (identityType === '合作夥伴') {
    boothFee = 0; depositFee = 0;
  } else if (identityType === '百貨寄賣') {
    boothFee = (parseInt(data.deptFees)||0); // 上架費+代撤費+轉移費
    depositFee = 0;
  } else {
    boothFee = (parseInt(session['攤位費'])||0) * booths;
    depositFee = (parseInt(session['保證金'])||500) * booths;
  }
  const totalFee = boothFee + equipFee + depositFee;

  // 超過上限 → 備取
  const accepted = rows(getSheet('報名記錄')).filter(r =>
    r['場次ID']===sessionId && ['錄取','已付款'].includes(r['審核狀態'])).length;
  const isWaitlist = accepted >= (parseInt(session['攤位數上限'])||30);
  const initStatus = isWaitlist ? '備取' : (identityType==='民眾體驗' ? '已付款' : '待審核');

  const regId = 'R-' + Date.now() + '-' + Math.random().toString(36).substr(2,4).toUpperCase();
  const orderId = 'YE' + Date.now() + Math.floor(Math.random()*10000);

  const regSheet = getSheet('報名記錄');
  const h = regSheet.getRange(1,1,1,regSheet.getLastColumn()).getValues()[0];
  const row = new Array(h.length).fill('');
  const set = (k,v) => { const i=h.indexOf(k); if(i>=0) row[i]=v; };

  set('報名ID', regId);
  set('場次ID', sessionId);
  set('子場ID', data.subSessionId||'');
  set('攤商ID', vendorId);
  set('品牌名稱', data.brand||data.name||'');
  set('Email', email);
  set('手機號碼', data.phone||'');
  set('身份類型', identityType);
  set('攤位類別', data.mainCat||'');
  set('販售內容', data.subCats||'');
  set('攤位數量', booths);
  set('場次名稱', session['場次名稱']||'');

  // 設備
  ['帳篷','椅子','桌','野餐墊','桌布','電','燈','陽傘'].forEach(k => {
    set('加購-'+k, parseInt(equip[k])||0);
  });

  set('明火使用', data.fire||'no');
  set('用電需求', data.power||'none');
  set('用電說明', data.powerNote||'');
  set('贈品意願', data.giftIntent||'');
  set('贈品內容', data.giftContent||'');
  set('體驗提案', data.teacherProposal||'');
  set('合作提案', data.partnerProposal||'');
  set('互惠內容', data.mutualContent||'');
  set('報價金額', data.quoteAmount||'');
  set('主題活動項目', (data.themeItems||[]).join('、'));
  set('百貨位子', data.deptPosition||'');
  set('百貨費用明細', data.deptFeeDetail||'');

  // 民眾體驗特殊欄位
  set('參與者姓名', data.participantName||'');
  set('大人人數', data.adultCount||0);
  set('小孩人數', data.childCount||0);
  set('小孩年齡', (data.childAges||[]).join('、'));
  set('飲食需求', data.dietNeeds||'');
  set('無障礙需求', data.accessNeeds||'');

  set('攤位費', boothFee);
  set('加購費用', equipFee);
  set('保證金', depositFee);
  set('應付總額', totalFee);
  set('訂單編號', orderId);
  set('審核狀態', initStatus);
  set('付款狀態', '未付款');
  set('報到狀態', '未報到');
  set('清場狀態', '未清場');
  set('押金退款狀態', '未退');
  set('報名時間', new Date());

  regSheet.appendRow(row);

  // 通知
  sendConfirmEmail(data, session, regId, initStatus);
  notifyAdmin(`📋 新報名\n場次：${session['場次名稱']}\n身份：${identityType}\n品牌：${data.brand||data.name}`);

  return { success: true, regId };
}

// ══════════════════════════════════════════════════════════════
// 審核
// ══════════════════════════════════════════════════════════════
function updateStatus(data) {
  const sheet = getSheet('報名記錄');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  const regIdCol = h.indexOf('報名ID');
  const statusCol = h.indexOf('審核狀態');
  const boothCol = h.indexOf('攤位編號');

  for (let i=1; i<allData.length; i++) {
    if (allData[i][regIdCol] === data.vendorId) {
      sheet.getRange(i+1, statusCol+1).setValue(data.status);

      if (data.status === '錄取') {
        const session = getSessionById(data.sessionId);
        const booth = assignBooth(data.sessionId, sheet, h, allData);
        if (booth) sheet.getRange(i+1, boothCol+1).setValue(booth);
        // 寄錄取信
        sendAcceptEmail(allData[i], h, session, booth);
      }
      return { success: true };
    }
  }
  return { success: false, message: '找不到記錄' };
}

function assignBooth(sessionId, sheet, h, allData) {
  const pSheet = getSheet('百貨位子');
  const hasPos = rows(pSheet).some(r => r['場次ID'] === sessionId);
  if (hasPos) return null; // 有選位系統，不自動分配

  const existing = allData.slice(1)
    .filter(r => r[h.indexOf('場次ID')]===sessionId && r[h.indexOf('攤位編號')])
    .map(r => r[h.indexOf('攤位編號')]);
  const n = existing.length + 1;
  const letter = String.fromCharCode(64 + Math.ceil(n/9));
  return letter + String(((n-1)%9)+1).padStart(2,'0');
}

// ══════════════════════════════════════════════════════════════
// 報到
// ══════════════════════════════════════════════════════════════
function getVendors(sessionId) {
  if (!sessionId) return { vendors: [] };
  const session = getSessionById(sessionId);
  const regs = rows(getSheet('報名記錄')).filter(r => r['場次ID'] === sessionId);
  const vendors = rows(getSheet('攤商會員'));
  const now = new Date();
  const deadline = session && session['付款截止日'] ? new Date(session['付款截止日']) : null;

  return { vendors: regs.map(r => {
    const v = vendors.find(x => x['攤商ID'] === r['攤商ID']) || {};
    const isOverdue = r['審核狀態']==='錄取' && r['付款狀態']==='未付款' && deadline && now > deadline;
    const vendorAllRegs = rows(getSheet('報名記錄')).filter(x => x['Email']===r['Email'] && x['付款狀態']==='已付款');
    return {
      id: r['報名ID'],
      vendorId: r['攤商ID'],
      brand: r['品牌名稱'],
      name: v['個人姓名']||'',
      email: r['Email'],
      phone: r['手機號碼'],
      identityType: r['身份類型']||'攤商',
      category: r['攤位類別']||'',
      products: r['販售內容']||v['商品說明']||'',
      sellTypes: r['販售內容']||'',
      reviewStatus: r['審核狀態']||'待審核',
      payStatus: r['付款狀態']||'未付款',
      booth: r['攤位編號']||'',
      boothCount: parseInt(r['攤位數量'])||1,
      isOverdue,
      fire: r['明火使用']||'no',
      power: r['用電需求']||'none',
      powerNote: r['用電說明']||'',
      equipment: ['帳篷','椅子','桌','野餐墊','桌布','電','燈','陽傘'].reduce((o,k)=>{o[k]=parseInt(r['加購-'+k])||0;return o;},{}),
      proposal: r['體驗提案']||r['合作提案']||'',
      quoteAmount: r['報價金額']||'',
      fb: v['FB連結']||'', ig: v['IG連結']||'',
      totalFee: parseInt(r['應付總額'])||0,
      deposit: parseInt(r['保證金'])||0,
      regTime: r['報名時間']?String(r['報名時間']).split('T')[0]:'',
      remark: r['備註']||'',
      histCount: vendorAllRegs.length,
    };
  })};
}

function getCheckin(sessionId) {
  if (!sessionId) return { vendors: [] };
  const regs = rows(getSheet('報名記錄'))
    .filter(r => r['場次ID']===sessionId && r['付款狀態']==='已付款');
  return { vendors: regs.map(r => ({
    id: r['報名ID'],
    brand: r['品牌名稱'],
    booth: r['攤位編號']||'-',
    checkinStatus: r['報到狀態']||'未報到',
    checkinTime: r['進場時間']||'',
    clearStatus: r['清場狀態']||'未清場',
    clearTime: r['退場時間']||'',
    refundStatus: r['押金退款狀態']||'未退',
    deposit: parseInt(r['保證金'])||0,
  }))};
}

function markCheckin(data) {
  return updateRegField(data.regId, {'報到狀態':'已報到','進場時間':new Date().toLocaleString('zh-TW')});
}
function markClear(data) {
  return updateRegField(data.regId, {'清場狀態':'已清場','退場時間':new Date().toLocaleString('zh-TW')});
}
function markRefunded(data) {
  const res = updateRegField(data.regId, {'押金退款狀態':'已退','押金退款時間':new Date().toLocaleString('zh-TW')});
  if (res.success) {
    // 確認三條件達成才加點：進場+清場+押金退還
    const regs = rows(getSheet('報名記錄'));
    const reg = regs.find(r => r['報名ID'] === data.regId);
    if (reg &&
        reg['報到狀態'] === '已報到' &&
        reg['清場狀態'] === '已清場' &&
        reg['押金退款狀態'] === '已退') {
      addPointsByEmail(reg['Email'], 1, reg['場次ID'], '出攤完成（進場+清場+退押金）');
    }
  }
  return res;
}

function updateRegField(regId, fields) {
  const sheet = getSheet('報名記錄');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  for (let i=1; i<allData.length; i++) {
    if (allData[i][h.indexOf('報名ID')] === regId) {
      Object.entries(fields).forEach(([k,v]) => {
        const col = h.indexOf(k);
        if (col>=0) sheet.getRange(i+1,col+1).setValue(v);
      });
      return { success: true };
    }
  }
  return { success: false };
}

// ══════════════════════════════════════════════════════════════
// 儀表板
// ══════════════════════════════════════════════════════════════
function getDashboard(sessionId) {
  if (!sessionId) return {};
  const session = getSessionById(sessionId);
  const regs = rows(getSheet('報名記錄')).filter(r => r['場次ID']===sessionId);

  const total = regs.length;
  const pending = regs.filter(r=>r['審核狀態']==='待審核').length;
  const accepted = regs.filter(r=>r['審核狀態']==='錄取').length;
  const paid = regs.filter(r=>r['付款狀態']==='已付款').length;
  const waitlist = regs.filter(r=>r['審核狀態']==='備取').length;

  const paidRegs = regs.filter(r=>r['付款狀態']==='已付款');
  const boothIncome = paidRegs.reduce((s,r)=>s+(parseInt(r['攤位費'])||0),0);
  const equipIncome = paidRegs.reduce((s,r)=>s+(parseInt(r['加購費用'])||0),0);
  const otherIncome = ['門票收入','贊助商費用','場地轉租收入','其他收入']
    .reduce((s,k)=>s+(parseInt(session?.[k])||0),0);
  const equipCost = parseInt(session?.['設備成本'])||0;
  const otherExpense = ['場地費','人事費','保險費','行銷費用','清潔費','交通費','餐飲費','其他支出']
    .reduce((s,k)=>s+(parseInt(session?.[k])||0),0);
  const depositTotal = paidRegs.reduce((s,r)=>s+(parseInt(r['保證金'])||0),0);
  const depositRefunded = regs.filter(r=>r['押金退款狀態']==='已退').reduce((s,r)=>s+(parseInt(r['保證金'])||0),0);

  const equipKeys = ['帳篷','椅子','桌','野餐墊','桌布','電','燈','陽傘'];
  const equipment = equipKeys.reduce((o,k)=>{ o[k]=paidRegs.reduce((s,r)=>s+(parseInt(r['加購-'+k])||0),0); return o; },{});
  const categories = paidRegs.reduce((o,r)=>{ const c=r['攤位類別']||'其他'; o[c]=(o[c]||0)+1; return o; },{});
  const byType = regs.reduce((o,r)=>{ const t=r['身份類型']||'攤商'; o[t]=(o[t]||0)+1; return o; },{});

  return { total, pending, accepted, paid, waitlist, byType,
    boothIncome, equipIncome, otherIncome, equipCost, otherExpense,
    depositTotal, depositRefunded, equipment, categories };
}

// ══════════════════════════════════════════════════════════════
// 選位
// ══════════════════════════════════════════════════════════════
function getPositions(sessionId) {
  const ps = rows(getSheet('百貨位子')).filter(r => r['場次ID']===sessionId);
  return { positions: ps.map(r => ({
    id: r['位子ID'], name: r['位子名稱'],
    zone: r['區域']||'', commission: r['抽成比例']||'',
    status: r['狀態']||'可選',
    occupiedBrand: r['佔用品牌']||'',
    occupiedVendorId: r['佔用攤商ID']||'',
  }))};
}

function selectPosition(data) {
  const { sessionId, vendorId, positionId } = data;
  const regs = rows(getSheet('報名記錄'));
  const reg = regs.find(r => r['場次ID']===sessionId && r['攤商ID']===vendorId && r['付款狀態']==='已付款');
  if (!reg) return { success: false, message: '尚未完成付款，無法選位' };

  const sheet = getSheet('百貨位子');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  for (let i=1; i<allData.length; i++) {
    if (allData[i][h.indexOf('位子ID')] === positionId) {
      if (allData[i][h.indexOf('狀態')] === '已定')
        return { success: false, message: '此位子已被選走' };
      // 釋放舊位
      if (reg['攤位編號']) releasePos(sessionId, reg['攤位編號']);
      sheet.getRange(i+1, h.indexOf('狀態')+1).setValue('已定');
      sheet.getRange(i+1, h.indexOf('佔用攤商ID')+1).setValue(vendorId);
      sheet.getRange(i+1, h.indexOf('佔用品牌')+1).setValue(reg['品牌名稱']);
      const posName = allData[i][h.indexOf('位子名稱')];
      updateRegField(reg['報名ID'], {'攤位編號': posName});
      notifyAdmin(`📍 選位\n${reg['品牌名稱']} → ${posName}`);
      return { success: true, positionName: posName };
    }
  }
  return { success: false, message: '找不到位子' };
}

function releasePos(sessionId, posName) {
  const sheet = getSheet('百貨位子');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  for (let i=1; i<allData.length; i++) {
    if (allData[i][h.indexOf('場次ID')]===sessionId && allData[i][h.indexOf('位子名稱')]===posName) {
      sheet.getRange(i+1,h.indexOf('狀態')+1).setValue('可選');
      sheet.getRange(i+1,h.indexOf('佔用攤商ID')+1).setValue('');
      sheet.getRange(i+1,h.indexOf('佔用品牌')+1).setValue('');
      return;
    }
  }
}

function adminMovePos(data) {
  const regs = rows(getSheet('報名記錄'));
  const reg = regs.find(r => r['場次ID']===data.sessionId && r['攤商ID']===data.vendorId && r['付款狀態']==='已付款');
  if (!reg) return { success: false };
  if (reg['攤位編號']) releasePos(data.sessionId, reg['攤位編號']);
  const sheet = getSheet('百貨位子');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  for (let i=1; i<allData.length; i++) {
    if (allData[i][h.indexOf('場次ID')]===data.sessionId && allData[i][h.indexOf('位子名稱')]===data.newPos) {
      if (allData[i][h.indexOf('狀態')]==='已定') return { success: false, message: '此位子已有人' };
      sheet.getRange(i+1,h.indexOf('狀態')+1).setValue('已定');
      sheet.getRange(i+1,h.indexOf('佔用攤商ID')+1).setValue(data.vendorId);
      sheet.getRange(i+1,h.indexOf('佔用品牌')+1).setValue(reg['品牌名稱']);
      updateRegField(reg['報名ID'], {'攤位編號': data.newPos});
      return { success: true };
    }
  }
  return { success: false };
}

function setupPositions(data) {
  const sheet = getSheet('百貨位子');
  const h = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  data.positions.forEach(p => {
    const row = new Array(h.length).fill('');
    const set = (k,v) => { const i=h.indexOf(k); if(i>=0) row[i]=v; };
    set('位子ID', genId('POS'));
    set('場次ID', data.sessionId);
    set('位子名稱', p.name);
    set('抽成比例', p.commission||'');
    set('區域', p.zone||'');
    set('狀態', '可選');
    set('設定時間', new Date());
    sheet.appendRow(row);
  });
  return { success: true };
}

// ══════════════════════════════════════════════════════════════
// 場次管理（後台）
// ══════════════════════════════════════════════════════════════
function createSession(data) {
  const sheet = getSheet('場次設定');
  const existing = rows(sheet);
  let sessionId = 'K' + (data.dateStart||'').replace(/-/g,'') + '-' + (data.name||'').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g,'').substr(0,3);
  let suffix = 1;
  while (existing.some(r => r['場次ID']===sessionId)) sessionId = sessionId.split('-').slice(0,-1).join('-') + '-' + suffix++;

  const h = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const row = new Array(h.length).fill('');
  const set = (k,v) => { const i=h.indexOf(k); if(i>=0) row[i]=v; };

  set('場次ID', sessionId);
  set('場次名稱', data.name||'');
  set('活動類型', data.type||'市集');
  set('場次說明', data.intro||'');
  set('活動日期', data.dateStart||'');
  set('活動結束日期', data.dateEnd||'');
  set('活動開始時間', data.timeStart||data.time||'');
  set('活動結束時間', data.timeEnd||'');
  set('城市', data.city||'');
  set('場地名稱', data.venue||'');
  set('場地圖連結', data.mapUrl||'');
  set('攤位費', data.fee||0);
  set('計費方式', data.feeMode||'場次');
  set('保證金', data.deposit||500);
  set('攤位數上限', data.limit||30);
  set('付款截止日', data.deadline||'');
  set('基本配備說明', data.basicEquip||'');
  set('開放攤商', data.openVendor?'是':'否');
  set('開放體驗老師', data.openTeacher?'是':'否');
  set('開放民眾體驗', data.openPublic?'是':'否');
  set('開放合作夥伴', data.openPartner?'是':'否');
  set('開放主題活動', data.openTheme?'是':'否');
  set('開放百貨寄賣', data.openDept?'是':'否');
  set('開放明火申報', data.openFire===false?'否':'是');
  set('開放用電申報', data.openPower===false?'否':'是');
  set('主題活動項目', (data.themeItems||[]).join(','));
  set('主辦單位', data.organizer||'');
  set('表單模組', data.modules||'{}');
  set('自訂欄位', data.customFields||'[]');
  set('協辦單位', data.coOrganizer||'');
  set('場地方', data.venue_org||'');
  // 設備預設金額（後台可覆蓋）
  const defaultPrices = {
    '帳篷':800, '椅子':20, '桌':350,
    '野餐墊':50, '桌布':50, '電':100,
    '燈':50, '陽傘':450
  };
  ['帳篷','椅子','桌','野餐墊','桌布','電','燈','陽傘'].forEach(k => {
    set(k+'提供', data['equip_'+k]?'是':'否');
    // 後台有填就用填的，沒填用預設值
    const price = data['price_'+k] ? parseInt(data['price_'+k]) : defaultPrices[k];
    set(k+'價格', price);
  });
  set('狀態', '報名中');
  sheet.appendRow(row);

  // 批次建立子場
  if (data.subSessions?.length) {
    const subSheet = getSheet('子場設定');
    data.subSessions.forEach(s => {
      subSheet.appendRow([genId('S'), sessionId, s.name, s.fee||data.fee||0, s.deposit||500, s.limit||30, 0, '報名中']);
    });
  }
  // 批次建立位子
  if (data.positions?.length) setupPositions({ sessionId, positions: data.positions });

  notifyAdmin(`📅 新場次\n${data.name} ${data.dateStart}`);
  return { success: true, sessionId };
}

// ══════════════════════════════════════════════════════════════
// 合作單位
// ══════════════════════════════════════════════════════════════
function getPartners() {
  return { partners: rows(getSheet('合作單位')).map(r => ({
    id: r['合作單位ID']||'', name: r['單位名稱']||'',
    type: r['合作類型']||'', contact: r['聯絡人']||'',
    phone: r['電話']||'', email: r['Email']||'',
    taxId: r['統一編號']||'', address: r['地址']||'',
    note: r['備註']||'',
  }))};
}
function savePartner(data) {
  const sheet = getSheet('合作單位');
  const id = genId('P');
  sheet.appendRow([id, data.name||'', data.type||'', data.contact||'',
    data.phone||'', data.email||'', data.taxId||'', data.address||'', data.note||'', new Date()]);
  return { success: true, id };
}
function deletePartner(data) {
  const sheet = getSheet('合作單位');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  for (let i=1; i<allData.length; i++) {
    if (allData[i][h.indexOf('合作單位ID')]===data.id) { sheet.deleteRow(i+1); return { success: true }; }
  }
  return { success: false };
}

// ══════════════════════════════════════════════════════════════
// 管理員
// ══════════════════════════════════════════════════════════════
function adminLogin(email) {
  if (!email) return { authorized: false };
  const allSessions = getAllSessionsForDashboard().sessions;
  if (email === getProp('ADMIN_EMAIL')) {
    return { authorized: true, role: 'superadmin', sessions: allSessions };
  }
  const staff = rows(getSheet('管理員設定')).find(r => r['Email']===email);
  if (!staff) return { authorized: false };
  const sessionIds = String(staff['負責場次']||'').split(',').map(s=>s.trim());
  return { authorized: true, role: 'staff', sessions: allSessions.filter(s=>sessionIds.includes(s.id)) };
}

function addStaff(data) {
  const sheet = getSheet('管理員設定');
  const existing = rows(sheet).find(r => r['Email']===data.email);
  if (existing) {
    const allData = sheet.getDataRange().getValues();
    const h = allData[0];
    for (let i=1; i<allData.length; i++) {
      if (allData[i][h.indexOf('Email')]===data.email) {
        sheet.getRange(i+1,h.indexOf('負責場次')+1).setValue((data.sessionIds||[]).join(','));
        return { success: true };
      }
    }
  }
  sheet.appendRow([data.email,'staff',(data.sessionIds||[]).join(','),'',new Date()]);
  return { success: true };
}

function removeStaff(data) {
  const sheet = getSheet('管理員設定');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  for (let i=1; i<allData.length; i++) {
    if (allData[i][h.indexOf('Email')]===data.email) { sheet.deleteRow(i+1); return { success: true }; }
  }
  return { success: false };
}

// ══════════════════════════════════════════════════════════════
// 收支
// ══════════════════════════════════════════════════════════════
function saveExpenses(data) {
  const sheet = getSheet('場次設定');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  const map = {'expense_venue':'場地費','expense_staff':'人事費','expense_insurance':'保險費',
    'expense_marketing':'行銷費用','expense_cleaning':'清潔費','expense_transport':'交通費',
    'expense_food':'餐飲費','expense_equip_cost':'設備成本','expense_other':'其他支出'};
  for (let i=1; i<allData.length; i++) {
    if (allData[i][h.indexOf('場次ID')]===data.sessionId) {
      Object.entries(data.expenses||{}).forEach(([k,v]) => {
        const col = h.indexOf(map[k]); if(col>=0) sheet.getRange(i+1,col+1).setValue(v);
      });
      return { success: true };
    }
  }
  return { success: false };
}

function saveIncomes(data) {
  const sheet = getSheet('場次設定');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  const map = {'income_ticket':'門票收入','income_sponsor':'贊助商費用','income_rental':'場地轉租收入','income_other':'其他收入'};
  for (let i=1; i<allData.length; i++) {
    if (allData[i][h.indexOf('場次ID')]===data.sessionId) {
      Object.entries(data.incomes||{}).forEach(([k,v]) => {
        const col = h.indexOf(map[k]); if(col>=0) sheet.getRange(i+1,col+1).setValue(v);
      });
      return { success: true };
    }
  }
  return { success: false };
}

// ══════════════════════════════════════════════════════════════
// 退款
// ══════════════════════════════════════════════════════════════
function applyRefund(data) {
  const sheet = getSheet('報名記錄');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  for (let i=1; i<allData.length; i++) {
    if (allData[i][h.indexOf('報名ID')]===data.regId) {
      const remark = (allData[i][h.indexOf('備註')]||'') + '\n[退款申請] '+data.reason+' '+new Date().toLocaleString('zh-TW');
      sheet.getRange(i+1,h.indexOf('備註')+1).setValue(remark);
      notifyAdmin(`💰 退款申請\n${allData[i][h.indexOf('品牌名稱')]}\n原因：${data.reason}`);
      try { GmailApp.sendEmail(allData[i][h.indexOf('Email')], '【退款申請確認】兔彼樂', '您的退款申請已收到，主辦將於3個工作日內回覆。\n\n兔彼樂共創活動 敬上'); } catch(e) {}
      return { success: true };
    }
  }
  return { success: false };
}

// ══════════════════════════════════════════════════════════════
// 點數
// ══════════════════════════════════════════════════════════════
function addPoints(data) { return addPointsByEmail(data.email, parseInt(data.points)||1, data.sessionId, data.reason); }
function addPointsByEmail(email, pts, sessionId, reason) {
  const sheet = getSheet('攤商會員');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  for (let i=1; i<allData.length; i++) {
    if (allData[i][h.indexOf('Email')]===email) {
      const newPts = (parseInt(allData[i][h.indexOf('累積點數')])||0) + pts;
      sheet.getRange(i+1,h.indexOf('累積點數')+1).setValue(newPts);
      getSheet('點數記錄').appendRow([genId('PT'), allData[i][h.indexOf('攤商ID')], allData[i][h.indexOf('品牌名稱')], sessionId||'','', pts, reason, new Date(), newPts]);
      return { success: true, newPoints: newPts };
    }
  }
  return { success: false };
}

// ══════════════════════════════════════════════════════════════
// 綠界金流（框架，串接時填入 Properties）
// ══════════════════════════════════════════════════════════════
function ecpayCallback(data) {
  const orderId = data.MerchantTradeNo || data.orderId;
  if (!orderId) return { success: false };
  const sheet = getSheet('報名記錄');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  for (let i=1; i<allData.length; i++) {
    if (allData[i][h.indexOf('訂單編號')]===orderId) {
      sheet.getRange(i+1,h.indexOf('付款狀態')+1).setValue('已付款');
      sheet.getRange(i+1,h.indexOf('付款時間')+1).setValue(new Date().toLocaleString('zh-TW'));
      sheet.getRange(i+1,h.indexOf('實收金額')+1).setValue(data.TradeAmt||data.amount||0);
      const session = getSessionById(allData[i][h.indexOf('場次ID')]);
      const hasPos = rows(getSheet('百貨位子')).some(p=>p['場次ID']===allData[i][h.indexOf('場次ID')]);
      if (hasPos) {
        try {
          GmailApp.sendEmail(allData[i][h.indexOf('Email')],
            '【請選擇攤位】'+(session?.['場次名稱']||''),
            allData[i][h.indexOf('品牌名稱')]+'您好，付款已確認！請登入選擇攤位：\n'+getProp('SITE_URL')+'\n\n兔彼樂共創活動 敬上');
        } catch(e) {}
      }
      notifyAdmin('✅ 付款\n'+allData[i][h.indexOf('品牌名稱')]+'\n'+session?.['場次名稱']+'\nNT$'+(data.TradeAmt||''));
      return { success: true };
    }
  }
  return { success: false };
}

// ══════════════════════════════════════════════════════════════
// LINE Login 框架
// ══════════════════════════════════════════════════════════════
function lineCallback(data) {
  const clientId = getProp('LINE_LOGIN_CLIENT_ID');
  const clientSecret = getProp('LINE_LOGIN_CLIENT_SECRET');
  if (!clientId) return { success: false, message: 'LINE Login 未設定' };
  try {
    const res = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/token', {
      method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
      payload:`grant_type=authorization_code&code=${data.code}&redirect_uri=${encodeURIComponent(data.redirectUri)}&client_id=${clientId}&client_secret=${clientSecret}`
    });
    const token = JSON.parse(res.getContentText());
    if (!token.access_token) return { success: false };
    let email = '';
    if (token.id_token) {
      const parts = token.id_token.split('.');
      if (parts.length>=2) {
        const p = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString());
        email = p.email||'';
      }
    }
    return { success: true, email };
  } catch(e) { return { success: false, message: 'LINE 登入失敗' }; }
}

// ══════════════════════════════════════════════════════════════
// 通知
// ══════════════════════════════════════════════════════════════
function notifyAdmin(msg) {
  const token = getProp('LINE_TOKEN');
  const adminId = getProp('LINE_ADMIN_ID');
  if (!token || !adminId) { Logger.log('LINE通知：'+msg); return; }
  getSheet('每日通知佇列').appendRow([genId('N'),'admin',getProp('ADMIN_EMAIL'),'','',msg,new Date(),'']);
}

function sendConfirmEmail(data, session, regId, status) {
  try {
    GmailApp.sendEmail(data.email,
      (status==='備取'?'【備取確認】':'【報名成功】')+(session['場次名稱']||''),
      `${data.brand||data.name} 您好，\n\n報名已送出！\n場次：${session['場次名稱']}\n報名編號：${regId}\n${status==='備取'?'\n目前名額已滿，已列入備取，有空缺優先通知。\n':''}\n主辦審核後通知，請耐心等候。\n\n兔彼樂共創活動 敬上`
    );
  } catch(e) {}
}

function sendAcceptEmail(regRow, h, session, booth) {
  try {
    const email = regRow[h.indexOf('Email')];
    const brand = regRow[h.indexOf('品牌名稱')];
    const total = regRow[h.indexOf('應付總額')];
    const deadline = session ? fmt(session['付款截止日']) : '';
    GmailApp.sendEmail(email,
      `【錄取通知】${session?.['場次名稱']||''}${booth?' 攤位'+booth:''}`,
      `${brand} 您好，恭喜錄取！\n\n場次：${session?.['場次名稱']||''}\n日期：${session?fmt(session['活動日期']):''}\n${booth?'攤位：'+booth+'\n':''}應付：NT$${total}\n截止：${deadline}\n\n⚠️ 請於截止日前付款，逾時自動取消。\n\n兔彼樂共創活動 敬上`
    );
  } catch(e) {}
}

function sendDailySummary() {
  const sheet = getSheet('每日通知佇列');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  const sentCol = h.indexOf('已發送');
  const msgCol = h.indexOf('內容');
  const pending = allData.slice(1).filter(r=>!r[sentCol]);
  if (!pending.length) return;
  const token = getProp('LINE_TOKEN');
  const adminId = getProp('LINE_ADMIN_ID');
  if (token && adminId) {
    try {
      UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push',{
        method:'POST',
        headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
        payload:JSON.stringify({to:adminId,messages:[{type:'text',text:'📋 每日摘要\n─\n'+pending.map(r=>r[msgCol]).join('\n─\n')}]})
      });
    } catch(e) {}
  }
  for (let i=1; i<allData.length; i++) {
    if (!allData[i][sentCol]) sheet.getRange(i+1,sentCol+1).setValue(new Date());
  }
}

function dailyScheduler() { sendDailySummary(); checkDeadlines(); checkReminders(); }

function checkDeadlines() {
  const today = new Date(); today.setHours(0,0,0,0);
  const sessions = rows(getSheet('場次設定'));
  const regs = rows(getSheet('報名記錄'));
  const queue = {};
  sessions.forEach(s => {
    if (!s['付款截止日']) return;
    const dl = new Date(s['付款截止日']); dl.setHours(0,0,0,0);
    const diff = Math.round((dl-today)/86400000);
    if (diff===1||diff===3) {
      regs.filter(r=>r['場次ID']===s['場次ID']&&r['審核狀態']==='錄取'&&r['付款狀態']==='未付款').forEach(r=>{
        if (!queue[r['Email']]) queue[r['Email']]=[];
        queue[r['Email']].push(s['場次名稱']+'（'+diff+'天後截止）');
      });
    }
  });
  Object.entries(queue).forEach(([email, items]) => {
    try { GmailApp.sendEmail(email,'【付款提醒】兔彼樂','以下場次即將截止：\n\n'+items.join('\n')+'\n\n兔彼樂共創活動 敬上'); } catch(e) {}
  });
}

function checkReminders() {
  const today = new Date(); today.setHours(0,0,0,0);
  rows(getSheet('場次設定')).forEach(s => {
    if (!s['活動日期']) return;
    const d = new Date(s['活動日期']); d.setHours(0,0,0,0);
    if (Math.round((d-today)/86400000)!==3) return;
    rows(getSheet('報名記錄')).filter(r=>r['場次ID']===s['場次ID']&&r['付款狀態']==='已付款').forEach(r=>{
      try { GmailApp.sendEmail(r['Email'],'【出攤提醒】'+s['場次名稱'],r['品牌名稱']+'您好，3天後活動！\n攤位：'+(r['攤位編號']||'待確認')+'\n場地：'+s['城市']+' '+s['場地名稱']+'\n\n兔彼樂共創活動 敬上'); } catch(e) {}
    });
  });
}

function getWeeklyCheckin() {
  const today = new Date(); today.setHours(0,0,0,0);
  const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate()+7);
  const sessions = rows(getSheet('場次設定')).filter(s=>{
    if (!s['活動日期']) return false;
    const d = new Date(s['活動日期']); d.setHours(0,0,0,0);
    return d>=today && d<=weekEnd;
  });
  const regs = rows(getSheet('報名記錄'));
  return { sessions: sessions.map(s=>{
    const sr = regs.filter(r=>r['場次ID']===s['場次ID']&&r['付款狀態']==='已付款');
    return { id:s['場次ID'], name:s['場次名稱'], date:fmt(s['活動日期']),
      total:sr.length, arrived:sr.filter(r=>r['報到狀態']==='已報到').length,
      notArrived:sr.filter(r=>r['報到狀態']==='未報到').length,
      depositPending:sr.filter(r=>r['清場狀態']==='已清場'&&r['押金退款狀態']==='未退').length };
  })};
}

// ══════════════════════════════════════════════════════════════
// 試算表初始化（執行一次）
// ══════════════════════════════════════════════════════════════
function setupSpreadsheet() {
  const ss = SpreadsheetApp.openById(getProp('SPREADSHEET_ID'));
  const configs = {
    '場次設定': ['場次ID','場次名稱','活動類型','場次說明','活動日期','活動結束日期','活動開始時間','活動結束時間','城市','場地名稱','場地圖連結','攤位費','保證金','攤位數上限','付款截止日','基本配備說明','開放攤商','開放體驗老師','開放民眾體驗','開放合作夥伴','開放主題活動','開放百貨寄賣','主題活動項目','位子清單','主辦單位','協辦單位','場地方','帳篷提供','帳篷價格','椅子提供','椅子價格','桌提供','桌價格','野餐墊提供','野餐墊價格','桌布提供','桌布價格','電提供','電價格','燈提供','燈價格','陽傘提供','陽傘價格','開放明火申報','開放用電申報','表單模組','自訂欄位','場地費','人事費','保險費','行銷費用','清潔費','交通費','餐飲費','設備成本','其他支出','門票收入','贊助商費用','場地轉租收入','其他收入','狀態'],
    '子場設定': ['子場ID','場次ID','子場名稱','攤位費','保證金','名額','已報名數','狀態'],
    '攤商會員': ['攤商ID','品牌名稱','個人姓名','Email','手機號碼','所在地區','FB連結','IG連結','累積點數','累積場次','違規次數','黑名單','建立時間','最後更新'],
    '報名記錄': ['報名ID','場次ID','場次名稱','子場ID','攤商ID','品牌名稱','Email','手機號碼','身份類型','攤位類別','販售內容','加購-帳篷','加購-椅子','加購-桌','加購-野餐墊','加購-桌布','加購-電','加購-燈','加購-陽傘','明火使用','用電需求','用電說明','攤位數量','贈品意願','贈品內容','體驗提案','合作提案','互惠內容','報價金額','主題活動項目','百貨位子','百貨費用明細','參與者姓名','大人人數','小孩人數','小孩年齡','飲食需求','無障礙需求','攤位費','加購費用','保證金','應付總額','訂單編號','審核狀態','攤位編號','付款狀態','付款時間','實收金額','報到狀態','進場時間','清場狀態','退場時間','押金退款狀態','押金退款時間','違規記錄','報名時間','備註'],
    '黑名單': ['攤商ID','品牌名稱','Email','列入原因','列入時間','是否可解除','備註'],
    '點數記錄': ['記錄ID','攤商ID','品牌名稱','場次ID','場次名稱','點數異動','異動原因','異動時間','異動後餘額'],
    '管理員設定': ['Email','角色','負責場次','品牌名稱','新增時間'],
    '合作單位': ['合作單位ID','單位名稱','合作類型','聯絡人','電話','Email','統一編號','地址','備註','建立時間'],
    '百貨位子': ['位子ID','場次ID','位子名稱','抽成比例','區域','狀態','佔用攤商ID','佔用品牌','設定時間'],
    '公告欄': ['公告ID','標籤','標題','內容','連結','連結文字','發布時間','發布者'],
    '每日通知佇列': ['通知ID','類型','收件Email','場次ID','場次名稱','內容','排程時間','已發送'],
  };

  Object.entries(configs).forEach(([sheetName, headers]) => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) { sheet = ss.insertSheet(sheetName); Logger.log('建立：'+sheetName); }
    const existing = sheet.getLastColumn()>0 ? sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0] : [];
    headers.forEach(h => {
      if (!existing.includes(h)) {
        sheet.getRange(1, existing.length+1).setValue(h);
        existing.push(h);
      }
    });
    sheet.getRange(1,1,1,sheet.getLastColumn()).setFontWeight('bold').setBackground('#E8F5E9');
  });

  // 修正現有場次
  const sesSheet = ss.getSheetByName('場次設定');
  if (sesSheet) {
    const d = sesSheet.getDataRange().getValues();
    const h = d[0];
    const defaultPrices = {'帳篷':800,'椅子':20,'桌':350,'野餐墊':50,'桌布':50,'電':100,'燈':50,'陽傘':450};
    for (let i=1; i<d.length; i++) {
      if (!d[i][h.indexOf('場次ID')]) continue;
      if (!d[i][h.indexOf('活動類型')]) sesSheet.getRange(i+1,h.indexOf('活動類型')+1).setValue('市集');
      if (!d[i][h.indexOf('開放攤商')]) sesSheet.getRange(i+1,h.indexOf('開放攤商')+1).setValue('是');
      if (!d[i][h.indexOf('開放民眾體驗')]) sesSheet.getRange(i+1,h.indexOf('開放民眾體驗')+1).setValue('是');
      if (!d[i][h.indexOf('狀態')]) sesSheet.getRange(i+1,h.indexOf('狀態')+1).setValue('報名中');
      if (!d[i][h.indexOf('開放明火申報')]) sesSheet.getRange(i+1,h.indexOf('開放明火申報')+1).setValue('是');
      if (!d[i][h.indexOf('開放用電申報')]) sesSheet.getRange(i+1,h.indexOf('開放用電申報')+1).setValue('是');
      // 補上設備預設金額（空白才補）
      Object.entries(defaultPrices).forEach(([k,v]) => {
        const col = h.indexOf(k+'價格');
        if(col>=0 && !d[i][col]) sesSheet.getRange(i+1,col+1).setValue(v);
      });
    }
  }

  Logger.log('✅ 試算表初始化完成！');
}

// ══════════════════════════════════════════════════════════════
// 綠界金流串接
// ══════════════════════════════════════════════════════════════

// 建立付款連結（前台呼叫）
function createPaymentUrl(data) {
  const regId = data.regId;
  const sessionId = data.sessionId;

  // 取得報名資料
  const regs = rows(getSheet('報名記錄'));
  const reg = regs.find(r => r['報名ID'] === regId);
  if (!reg) return { success: false, message: '找不到報名記錄' };
  if (reg['付款狀態'] === '已付款') return { success: false, message: '此訂單已付款' };

  const session = getSessionById(sessionId);
  const amount = parseInt(reg['應付總額']) || 0;
  if (amount <= 0) return { success: false, message: '金額錯誤' };

  const merchantId = getProp('ECPAY_MERCHANT_ID');
  const hashKey = getProp('ECPAY_HASH_KEY');
  const hashIV = getProp('ECPAY_HASH_IV');
  const scriptUrl = getProp('SITE_URL') || 'https://ndiangrace-create.github.io/tuibile';
  const returnUrl = 'https://script.google.com/macros/s/AKfycbz34vXdofbWxMBSKVkDxsvSjLwI_TPlFdX420bXDmxDbNGe5cXcG2RzeeoUsGySI8Ipjw/exec';

  // 訂單編號（綠界限制20碼英數）
  const orderId = reg['訂單編號'] || ('YE' + Date.now().toString().slice(-14));

  // 商品名稱（純英文避免 encode 問題）
  const itemName = 'Event Registration Fee';

  // 組合參數（按照綠界規格）
  const tradeDate = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss');
  const params = {
    MerchantID: merchantId,
    MerchantTradeNo: orderId,
    MerchantTradeDate: tradeDate,
    PaymentType: 'aio',
    TotalAmount: parseInt(amount),
    TradeDesc: 'Tuibile Event Registration',
    ItemName: itemName,
    ReturnURL: returnUrl,
    ClientBackURL: scriptUrl,
    OrderResultURL: scriptUrl + '?paid=1',
    ChoosePayment: 'ALL',
    EncryptType: 1,
    NeedExtraPaidInfo: 'N',
    Remark: (regId||'').replace(/[^a-zA-Z0-9\-]/g,'').substr(0,20),
  };

  // Debug：記錄實際參數（上線後可移除）
  Logger.log('實際送出參數: ' + JSON.stringify(params));

  // 計算 CheckMacValue
  params.CheckMacValue = calcCheckMacValue(params, hashKey, hashIV);
  Logger.log('實際 CheckMacValue: ' + params.CheckMacValue);

  // 組合表單 HTML（POST 方式送出）
  const formHtml = buildEcpayForm(params, merchantId === '3098138');

  // 更新訂單編號回試算表（確保一致）
  updateRegField(regId, { '訂單編號': orderId });

  return { success: true, formHtml, orderId, amount };
}

// 計算 CheckMacValue
function calcCheckMacValue(params, hashKey, hashIV) {
  // 1. 排除 CheckMacValue，按 key 字母排序（不分大小寫）
  const sortedKeys = Object.keys(params)
    .filter(k => k !== 'CheckMacValue')
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  // 2. 組合字串
  let str = 'HashKey=' + hashKey;
  sortedKeys.forEach(k => {
    str += '&' + k + '=' + params[k];
  });
  str += '&HashIV=' + hashIV;

  // 3. URL Encode（綠界規格：使用 .NET URLEncode 方式）
  str = dotNetUrlEncode(str);

  // 4. 轉小寫
  str = str.toLowerCase();

  // 5. MD5
  const md5 = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    str,
    Utilities.Charset.UTF_8
  );
  return md5.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('').toUpperCase();
}

// 模擬 Python urllib.parse.quote_plus 行為（綠界官方 SDK 用法）
function dotNetUrlEncode(str) {
  return encodeURIComponent(str)
    // encodeURIComponent 不 encode 這些字元，但 quote_plus 會
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
    .replace(/~/g, '%7E')
    // 空格：encodeURIComponent 轉成 %20，quote_plus 轉成 +
    .replace(/%20/g, '+');
}

// 建立綠界付款表單
function buildEcpayForm(params, isProduction) {
  const actionUrl = isProduction
    ? 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5'
    : 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';

  const inputs = Object.entries(params)
    .map(([k, v]) => `<input type="hidden" name="${k}" value="${v}">`)
    .join('');

  return `<form id="ecpayForm" method="post" action="${actionUrl}">${inputs}</form>
<script>document.getElementById('ecpayForm').submit();</script>`;
}

// doGet 加入 createPaymentUrl
// （已在 handleWrite 中處理）

// ══ 測試 CheckMacValue（在 Apps Script 執行 testCheckMac 查看結果）══
function testCheckMac() {
  const hashKey = getProp('ECPAY_HASH_KEY');
  const hashIV = getProp('ECPAY_HASH_IV');
  
  const params = {
    ChoosePayment: 'ALL',
    ClientBackURL: 'https://ndiangrace-create.github.io/tuibile',
    EncryptType: 1,
    ItemName: 'Test',
    MerchantID: getProp('ECPAY_MERCHANT_ID'),
    MerchantTradeDate: '2026/05/28 10:00:00',
    MerchantTradeNo: 'YE20260528TEST1',
    NeedExtraPaidInfo: 'N',
    OrderResultURL: 'https://ndiangrace-create.github.io/tuibile?paid=1',
    PaymentType: 'aio',
    Remark: 'test',
    ReturnURL: 'https://script.google.com/macros/s/AKfycbz34vXdofbWxMBSKVkDxsvSjLwI_TPlFdX420bXDmxDbNGe5cXcG2RzeeoUsGySI8Ipjw/exec',
    TotalAmount: 100,
    TradeDesc: 'Tuibile Event Registration',
  };
  
  const sortedKeys = Object.keys(params).sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  let raw = 'HashKey=' + hashKey;
  sortedKeys.forEach(k => { raw += '&' + k + '=' + params[k]; });
  raw += '&HashIV=' + hashIV;
  
  Logger.log('原始字串: ' + raw);
  
  const encoded = dotNetUrlEncode(raw).toLowerCase();
  Logger.log('Encoded: ' + encoded);
  
  const mac = calcCheckMacValue(params, hashKey, hashIV);
  Logger.log('CheckMacValue: ' + mac);
  Logger.log('HashKey used: ' + hashKey);
  Logger.log('HashIV used: ' + hashIV);
}

// ══════════════════════════════════════════════════════════════
// LINE Pay 串接
// ══════════════════════════════════════════════════════════════
function createLinePayUrl(data) {
  const regId = data.regId;
  const sessionId = data.sessionId;

  const regs = rows(getSheet('報名記錄'));
  const reg = regs.find(r => r['報名ID'] === regId);
  if (!reg) return { success: false, message: '找不到報名記錄' };
  if (reg['付款狀態'] === '已付款') return { success: false, message: '此訂單已付款' };

  const amount = parseInt(reg['應付總額']) || 0;
  if (amount <= 0) return { success: false, message: '金額錯誤' };

  const channelId = getProp('LINEPAY_CHANNEL_ID');
  const channelSecret = getProp('LINEPAY_CHANNEL_SECRET');
  const siteUrl = getProp('SITE_URL') || 'https://ndiangrace-create.github.io/tuibile';
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbz34vXdofbWxMBSKVkDxsvSjLwI_TPlFdX420bXDmxDbNGe5cXcG2RzeeoUsGySI8Ipjw/exec';

  const orderId = reg['訂單編號'] || ('LP' + Date.now().toString().slice(-14));
  const session = getSessionById(sessionId);

  // LINE Pay Request API
  const body = {
    amount: amount,
    currency: 'TWD',
    orderId: orderId,
    packages: [{
      id: regId.replace(/[^a-zA-Z0-9]/g,'').substr(0,20),
      amount: amount,
      products: [{
        name: (session?.['場次名稱'] || 'Event Registration').substr(0,50),
        quantity: 1,
        price: amount
      }]
    }],
    redirectUrls: {
      confirmUrl: scriptUrl + '?action=linePayConfirm',
      cancelUrl: siteUrl + '?linepay=cancel'
    }
  };

  const bodyStr = JSON.stringify(body);
  const nonce = Utilities.getUuid().replace(/-/g,''); // 移除 - 確保格式一致
  const uri = '/v3/payments/request';
  // LINE Pay v3 簽章：channelSecret + URI + requestBody + nonce
  const message = channelSecret + uri + bodyStr + nonce;
  const hmacBytes = Utilities.computeHmacSha256Signature(
    Utilities.newBlob(message, 'UTF-8').getBytes(),
    Utilities.newBlob(channelSecret, 'UTF-8').getBytes()
  );
  const signature = Utilities.base64Encode(hmacBytes);

  try {
    const res = UrlFetchApp.fetch('https://api-pay.line.me/v3/payments/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LINE-ChannelId': String(channelId),
        'X-LINE-Authorization-Nonce': nonce,
        'X-LINE-Authorization': signature,
      },
      payload: bodyStr,
      muteHttpExceptions: true,
    });

    const result = JSON.parse(res.getContentText());
    Logger.log('LINE Pay response: ' + JSON.stringify(result));

    if (result.returnCode === '0000') {
      const paymentUrl = result.info.paymentUrl.web;
      const transactionId = result.info.transactionId;
      // 儲存 transactionId 和 orderId
      updateRegField(regId, { '訂單編號': orderId, '備註': (reg['備註']||'') + ' LP_TXN:' + transactionId });
      return { success: true, paymentUrl, orderId };
    } else {
      return { success: false, message: 'LINE Pay 錯誤：' + result.returnMessage };
    }
  } catch(e) {
    Logger.log('LINE Pay error: ' + e.message);
    return { success: false, message: '連線失敗：' + e.message };
  }
}

// LINE Pay 付款確認（付款完成後 LINE Pay 呼叫此處）
function linePayConfirm(e) {
  const transactionId = e.parameter.transactionId;
  const orderId = e.parameter.orderId;
  if (!transactionId || !orderId) return out({ success: false });

  const channelId = getProp('LINEPAY_CHANNEL_ID');
  const channelSecret = getProp('LINEPAY_CHANNEL_SECRET');

  // 找報名記錄
  const regs = rows(getSheet('報名記錄'));
  const reg = regs.find(r => r['訂單編號'] === orderId);
  if (!reg) return out({ success: false, message: '找不到訂單' });

  const amount = parseInt(reg['應付總額']) || 0;
  const uri = '/v3/payments/' + transactionId + '/confirm';
  const body = JSON.stringify({ amount, currency: 'TWD' });
  const nonce = Utilities.getUuid().replace(/-/g,'');
  const message = channelSecret + uri + body + nonce;
  const hmacBytes = Utilities.computeHmacSha256Signature(
    Utilities.newBlob(message, 'UTF-8').getBytes(),
    Utilities.newBlob(channelSecret, 'UTF-8').getBytes()
  );
  const signature = Utilities.base64Encode(hmacBytes);

  try {
    const res = UrlFetchApp.fetch('https://api-pay.line.me' + uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LINE-ChannelId': String(channelId),
        'X-LINE-Authorization-Nonce': nonce,
        'X-LINE-Authorization': signature,
      },
      payload: body,
      muteHttpExceptions: true,
    });
    const result = JSON.parse(res.getContentText());
    if (result.returnCode === '0000') {
      // 付款成功
      updateRegField(reg['報名ID'], {'付款狀態':'已付款','付款時間':new Date().toLocaleString('zh-TW'),'實收金額':amount});
      // 發選位通知
      const session = getSessionById(reg['場次ID']);
      const hasPos = rows(getSheet('百貨位子')).some(p=>p['場次ID']===reg['場次ID']);
      if (hasPos) {
        try { GmailApp.sendEmail(reg['Email'],'【請選擇攤位】'+(session?.["場次名稱"]||''),reg['品牌名稱']+'您好，付款已確認！請登入選擇攤位：'+getProp('SITE_URL')); } catch(err){}
      }
      notifyAdmin('✅ LINE Pay 付款\n'+reg['品牌名稱']+'\n'+(session?.["場次名稱"]||'')+'\nNT$'+amount);
      // 跳回前台
      return HtmlService.createHtmlOutput('<script>window.location.href="'+getProp('SITE_URL')+'?paid=1"</script>');
    }
  } catch(e) { Logger.log('LINE Pay confirm error: '+e.message); }
  return out({ success: false });
}

// ══ 測試 LINE Pay 簽章（Apps Script 執行 testLinePay 查看結果）══
function testLinePay() {
  const channelId = getProp('LINEPAY_CHANNEL_ID');
  const channelSecret = getProp('LINEPAY_CHANNEL_SECRET');
  
  Logger.log('Channel ID: ' + channelId);
  Logger.log('Channel Secret 長度: ' + channelSecret.length);
  
  const nonce = Utilities.getUuid().replace(/-/g,'');
  const uri = '/v3/payments/request';
  const body = JSON.stringify({
    amount: 1,
    currency: 'TWD',
    orderId: 'TEST' + Date.now(),
    packages: [{
      id: 'test001',
      amount: 1,
      products: [{ name: 'Test', quantity: 1, price: 1 }]
    }],
    redirectUrls: {
      confirmUrl: 'https://ndiangrace-create.github.io/tuibile?paid=1',
      cancelUrl: 'https://ndiangrace-create.github.io/tuibile'
    }
  });
  
  const message = channelSecret + uri + body + nonce;
  const hmacBytes = Utilities.computeHmacSha256Signature(
    Utilities.newBlob(message, 'UTF-8').getBytes(),
    Utilities.newBlob(channelSecret, 'UTF-8').getBytes()
  );
  const signature = Utilities.base64Encode(hmacBytes);
  
  Logger.log('Nonce: ' + nonce);
  Logger.log('Signature: ' + signature);
  
  try {
    const res = UrlFetchApp.fetch('https://api-pay.line.me/v3/payments/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LINE-ChannelId': String(channelId),
        'X-LINE-Authorization-Nonce': nonce,
        'X-LINE-Authorization': signature,
      },
      payload: body,
      muteHttpExceptions: true,
    });
    const result = JSON.parse(res.getContentText());
    Logger.log('回應: ' + JSON.stringify(result));
    if(result.returnCode === '0000') {
      Logger.log('✅ LINE Pay 成功！付款網址: ' + result.info.paymentUrl.web);
    } else {
      Logger.log('❌ LINE Pay 錯誤: ' + result.returnMessage);
    }
  } catch(e) {
    Logger.log('❌ 連線失敗: ' + e.message);
  }
}

// 取消報名
function cancelRegistration(data) {
  const regId = data.regId;
  const reason = data.reason || '主辦取消';

  const sheet = getSheet('報名記錄');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];

  for(let i = 1; i < allData.length; i++) {
    if(allData[i][h.indexOf('報名ID')] === regId) {
      const email = allData[i][h.indexOf('Email')];
      const brand = allData[i][h.indexOf('品牌名稱')];
      const sessionName = allData[i][h.indexOf('場次名稱')];
      const deposit = parseInt(allData[i][h.indexOf('保證金')]) || 0;
      const paid = allData[i][h.indexOf('付款狀態')] === '已付款';

      // 更新狀態
      sheet.getRange(i+1, h.indexOf('審核狀態')+1).setValue('取消');
      sheet.getRange(i+1, h.indexOf('付款狀態')+1).setValue(paid ? '已取消待退款' : '未付款');
      const remark = (allData[i][h.indexOf('備註')]||'') + '\n[取消] ' + reason + ' ' + new Date().toLocaleString('zh-TW');
      sheet.getRange(i+1, h.indexOf('備註')+1).setValue(remark);

      // 寄取消通知信給攤商
      try {
        const refundNote = paid ?
          '\n\n💰 退費政策：\n活動前20日以上：扣NT$100後退還\n活動前10日：扣NT$500後退還\n活動前7日：退50%\n活動前5日內：不退費\n客服LINE：https://lin.ee/6twRqyS' : '';
        GmailApp.sendEmail(email,
          '【報名取消通知】' + sessionName,
          brand + ' 您好，\n\n您的報名已被取消。\n場次：' + sessionName + '\n取消原因：' + reason + refundNote + '\n\n如有疑問請聯繫主辦。\n\n兔彼樂共創活動 敬上'
        );
      } catch(e) {}

      notifyAdmin('❌ 取消報名\n' + brand + '\n' + sessionName + '\n原因：' + reason);
      return { success: true };
    }
  }
  return { success: false, message: '找不到報名記錄' };
}

// ══ 公告欄 ══
function getAnnouncements() {
  const rows_ = rows(getSheet('公告欄')).reverse(); // 最新在前
  return { announcements: rows_.map(r=>({
    id: r['公告ID']||'', tag: r['標籤']||'最新',
    title: r['標題']||'', content: r['內容']||'',
    url: r['連結']||'', urlText: r['連結文字']||'查看詳情',
    time: r['發布時間'] ? String(r['發布時間']).substr(0,10) : '',
  }))};
}
function saveAnnouncement(data) {
  const sheet = getSheet('公告欄');
  const id = genId('ANN');
  sheet.appendRow([id, data.tag||'最新', data.title||'', data.content||'',
    data.url||'', data.urlText||'查看詳情', new Date(), data.by||'admin']);
  return { success: true, id };
}
function deleteAnnouncement(data) {
  const sheet = getSheet('公告欄');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  for(let i=1;i<allData.length;i++){
    if(allData[i][h.indexOf('公告ID')]===data.id){ sheet.deleteRow(i+1); return {success:true}; }
  }
  return {success:false};
}

// ══ 場次管理 ══
function copySession(data) {
  const sheet = getSheet('場次設定');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  for(let i=1; i<allData.length; i++){
    if(allData[i][h.indexOf('場次ID')] === data.sessionId){
      const row = [...allData[i]];
      const newId = 'K' + Date.now().toString().slice(-8) + '-COPY';
      row[h.indexOf('場次ID')] = newId;
      // 場次名稱加「(複製)」
      row[h.indexOf('場次名稱')] = (row[h.indexOf('場次名稱')]||'') + '（複製）';
      row[h.indexOf('狀態')] = '草稿';
      sheet.appendRow(row);
      return { success: true, newId };
    }
  }
  return { success: false, message: '找不到場次' };
}

function updateSessionStatus(data) {
  const sheet = getSheet('場次設定');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  for(let i=1; i<allData.length; i++){
    if(allData[i][h.indexOf('場次ID')] === data.sessionId){
      sheet.getRange(i+1, h.indexOf('狀態')+1).setValue(data.status);
      return { success: true };
    }
  }
  return { success: false };
}

function deleteSession(data) {
  const sheet = getSheet('場次設定');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  for(let i=1; i<allData.length; i++){
    if(allData[i][h.indexOf('場次ID')] === data.sessionId){
      sheet.deleteRow(i+1);
      return { success: true };
    }
  }
  return { success: false };
}

function batchResendEmail(data) {
  const sessionId = data.sessionId;
  const session = getSessionById(sessionId);
  const regs = rows(getSheet('報名記錄')).filter(r =>
    r['場次ID'] === sessionId &&
    r['審核狀態'] === '錄取' &&
    r['付款狀態'] !== '已付款'
  );
  let sent = 0;
  regs.forEach(reg => {
    try {
      sendAcceptEmail(
        Object.values(reg),
        Object.keys(reg),
        session,
        reg['攤位編號']||''
      );
      sent++;
    } catch(e) {}
  });
  return { success: true, sent };
}

function getStaffList() {
  const sheet = getSheet('管理員設定');
  const staff = rows(sheet).map(r => ({
    email: r['Email']||'',
    role: r['角色']||'staff',
    sessions: r['負責場次']||'全部',
  }));
  // 加上超級管理員
  const adminEmail = getProp('ADMIN_EMAIL');
  if(adminEmail && !staff.find(s=>s.email===adminEmail)){
    staff.unshift({email:adminEmail, role:'superadmin', sessions:'全部'});
  }
  return { staff };
}

// ══ 更新場次 ══
function updateSession(data) {
  if(!data.sessionId) return {success:false, message:'缺少sessionId'};
  const sheet = getSheet('場次設定');
  const allData = sheet.getDataRange().getValues();
  const h = allData[0];
  for(let i=1; i<allData.length; i++){
    if(allData[i][h.indexOf('場次ID')] !== data.sessionId) continue;
    const set = (k,v) => {
      const col = h.indexOf(k);
      if(col >= 0) sheet.getRange(i+1, col+1).setValue(v);
    };
    set('場次名稱', data.name||'');
    set('活動類型', data.type||'市集');
    set('場次說明', data.intro||'');
    set('活動日期', data.dateStart||'');
    set('活動結束日期', data.dateEnd||'');
    set('活動開始時間', data.timeStart||'');
    set('活動結束時間', data.timeEnd||'');
    set('城市', data.city||'');
    set('場地名稱', data.venue||'');
    set('場地圖連結', data.mapUrl||'');
    set('攤位費', parseInt(data.fee)||0);
    set('計費方式', data.feeMode||'場次');
    set('保證金', parseInt(data.deposit)||500);
    set('名額上限', parseInt(data.limit)||30);
    set('付款截止日', data.deadline||'');
    set('主辦單位', data.organizer||'');
  set('表單模組', data.modules||'{}');
  set('自訂欄位', data.customFields||'[]');
    set('協辦單位', data.coOrganizer||'');
    set('開放明火申報', data.openFire!==false?'是':'否');
    set('開放用電申報', data.openPower!==false?'是':'否');
    set('開放攤商', data.openVendor?'是':'否');
    set('開放百貨寄賣', data.openDept?'是':'否');
    const defaultPrices = {'帳篷':800,'椅子':20,'桌':350,'野餐墊':50,'桌布':50,'電':100,'燈':50,'陽傘':450};
    ['帳篷','椅子','桌','野餐墊','桌布','電','燈','陽傘'].forEach(k=>{
      set(k+'提供', data['equip_'+k]?'是':'否');
      set(k+'價格', data['price_'+k]?parseInt(data['price_'+k]):defaultPrices[k]);
    });
    return {success:true};
  }
  return {success:false, message:'找不到場次'};
}
