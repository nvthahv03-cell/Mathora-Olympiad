/**
 * MATHORA OLYMPIAD | BACKEND V2.3 + TAI KHOAN SHEETS - 14/11/2026
 * Nguon: tep MATHORA.gs thầy gửi ngày 14/11/2026.
 * Thay doi co chu dich: bo sung login / logout / session + kiem tra vai tro; giu nguyen nghiep vu.
 * Phan nghiep vu Gemini/STAGING/Kho/kiem dinh giu nguyen.
 * Khong can Google OAuth Client ID. Tao tai khoan qua Script Properties va khoi tao Sheet.
 */
/**
 * MATHORA OLYMPIAD | BACKEND V2.3 - KHO CO KIEM SOAT
 * Thay thế DUNG tep MATHORA.gs / Code.gs cua Backend V1.
 * Giu nguyen MATHORA_DB_ID, MATHORA_GEMINI_KEY, MATHORA_TEACHER_KEY,
 * MATHORA_OWNER_KEY va cac sheet/hang da co. KHONG su dung OpenAI API.
 *
 * NGUYEN TAC: MOI bai moi/ban sua chi vao STAGING. Khong co duong ghi
 * truc tiep vao MATHORA_PROBLEMS. Giao vien (owner) phai tham dinh va
 * cung cap minh chung truoc khi chuyen sang Kho DRAFT_REVIEWED, sau do
 * moi co the duyet APPROVED. Chung nhan = xac nhan cua NGUOI DUYET,
 * khong phai phep chung minh tu dong cua chuong trinh.
 *
 * Bao mat: khoa teacher/owner la PROTOTYPE; can SSO/identity that truoc
 * khi mo web app cho nhieu nguoi. Khong truyen key trong URL / log.
 */
const MA = {
  VERSION:'2.3-controlled-staging', SHEET:'MATHORA_PROBLEMS', AUDIT:'MATHORA_AUDIT',
  STAGING:'MATHORA_STAGING', MAX_PROMPT:12000, MAX_RECORD:45000,
  MAX_STAGE_SCAN:3000, MAX_KHO_SCAN:3000,
  COMP:['Tư duy và lập luận toán học','Mô hình hóa toán học','Giải quyết vấn đề toán học','Giao tiếp toán học','Sử dụng công cụ, phương tiện học toán'],
  HEAD:['ID','Phiên bản','Ngày tạo','Ngày sửa','Trạng thái','Tiêu đề','Nội dung JSON','SHA256','Người tạo','Người duyệt','Ngày duyệt'],
  STAGE_HEAD:['ID','Ngày tạo','Ngày sửa','Trạng thái','Nguồn','Mã bài gốc','Phiên bản gốc','SHA256 nguồn','Nội dung JSON','Người gửi','Nhận xét thẩm định','Mã bài Kho','Mã phiên AI']
};
function maJson_(v){return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON);}
function maProp_(name){return PropertiesService.getScriptProperties().getProperty(name)||'';}
function maAuthorized_(input,name){const expected=maProp_(name),given=String(input||'');return expected.length>=24&&given.length===expected.length&&given===expected;}
/**
 * Xac thuc Google ID token cho GitHub Pages - thuc hien TREN MAY CHU Apps Script.
 * Script Properties (cong khai client ID, allowlist luu o Script Properties):
 *   MATHORA_WEB_CLIENT_ID
 *   MATHORA_WEB_OWNER_EMAILS
 *   MATHORA_WEB_TEACHER_EMAILS
 * Khong luu key Gemini/owner/teacher trong Frontend GitHub Pages.
 */
function maWebGoogleAuth_(idToken){
  const denied={owner:false,teacher:false};
  const token=String(idToken||'');
  if(!token)return denied;
  if(token.length>5000||!/^[A-Za-z0-9._-]+$/.test(token))throw Error('Google ID token không hợp lệ.');
  const clientId=maProp_('MATHORA_WEB_CLIENT_ID');
  if(!clientId||!clientId.endsWith('.apps.googleusercontent.com'))
    throw Error('Chưa cấu hình MATHORA_WEB_CLIENT_ID.');
  let response;
  try{
    response=UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(token),
      {method:'get',muteHttpExceptions:true,followRedirects:false});
  }catch(err){throw Error('Không thể xác minh tài khoản Google.');}
  if(response.getResponseCode()!==200)throw Error('Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn.');
  let info;
  try{info=JSON.parse(response.getContentText());}
  catch(err){throw Error('Phản hồi xác thực Google không hợp lệ.');}
  if(String(info.aud||'')!==clientId||
     !['accounts.google.com','https://accounts.google.com'].includes(String(info.iss||''))||
     (info.email_verified!==true&&info.email_verified!=='true')||
     !Number.isFinite(Number(info.exp))||Number(info.exp)*1000<=Date.now())
    throw Error('Không xác thực được ID token Google.');
  const email=String(info.email||'').trim().toLowerCase();
  if(!email||email.length>256)throw Error('Email đăng nhập không hợp lệ.');
  const allowed=name=>String(maProp_(name)||'').split(/[,;\n]/)
    .map(v=>v.trim().toLowerCase()).filter(Boolean).includes(email);
  const owner=allowed('MATHORA_WEB_OWNER_EMAILS');
  const teacher=owner||allowed('MATHORA_WEB_TEACHER_EMAILS');
  if(!teacher)throw Error('Tài khoản chưa được phân quyền MATHORA.');
  return {owner,teacher};
}

function doGet(e){const action=String((e&&e.parameter&&e.parameter.action)||'health');
  if(action!=='health')return maJson_({ok:false,error:'Chỉ hỗ trợ POST có xác thực cho hồ sơ.'});
  return maJson_({ok:true,service:'MATHORA',version:MA.VERSION,aiConfigured:!!maProp_('MATHORA_GEMINI_KEY'),dbConfigured:!!maProp_('MATHORA_DB_ID'),
    note:'Đã cấu hình không đồng nghĩa AI/đề Toán đã được kiểm định.'});}
function doPost(e){try{
  const raw=String((e&&e.postData&&e.postData.contents)||'{}');if(raw.length>100000)throw Error('Yêu cầu quá lớn.');
  const p=JSON.parse(raw),action=String(p.action||'');
  if(action==='login')return maJson_(maAccountLogin_(p));
  if(action==='logout')return maJson_(maAccountLogout_(p));
  const identity=p.sessionToken?maAccountSession_(p.sessionToken):null;
  if(p.sessionToken&&!identity)return maJson_({ok:false,error:'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'});
  const permission=identity?maAccountPermission_(identity,action,p):null;
  const webIdentity=identity?{owner:false,teacher:false}:maWebGoogleAuth_(p.idToken);
  const owner=identity?permission.owner:(webIdentity.owner||maAuthorized_(p.key,'MATHORA_OWNER_KEY'));
  const teacher=identity?permission.teacher:(owner||webIdentity.teacher||maAuthorized_(p.key,'MATHORA_TEACHER_KEY'));
  const student=identity&&permission.student;
  if(!teacher&&!student)return maJson_({ok:false,error:'Tài khoản chưa được cấp quyền thực hiện nghiệp vụ này.'});
  if(student&&!['listExamEligible','getProblem'].includes(action))
    return maJson_({ok:false,error:'Học sinh không có quyền truy cập nghiệp vụ giáo viên.'});
  let result;
  switch(action){
    case 'generateProblem': result=maGenerate_(p); break;
    case 'saveToKho': result=maSave_(p); break; // CHỈ GHI STAGING
    case 'updateProblem': result=maUpdate_(p); break; // CHỈ GHI STAGING
    case 'listKho': result=maList_(p); break;
    case 'getProblem': result=student?permission.studentResult:maGet_(p); break;
    case 'listExamEligible': result=ma23ListExamEligible_(p); break;
    case 'approveProblem': result=owner?maApprove_(p):{ok:false,error:'Chỉ quản trị được duyệt.'}; break;
    case 'listPending': result=ma23ListPending_(p); break;
    case 'getPending': result=ma23GetPending_(p); break;
    case 'attestPending': result=owner?ma23AttestPending_(p):{ok:false,error:'Chỉ quản trị được xác nhận chứng cứ.'}; break;
    case 'rejectPending': result=owner?ma23RejectPending_(p):{ok:false,error:'Chỉ quản trị được từ chối hồ sơ.'}; break;
    default: result={ok:false,error:'Action không được hỗ trợ.'};
  }
  return maJson_(Object.assign({},result,{authenticatedRole:identity?identity.role:(owner?'admin':'teacher')}));
}catch(err){return maJson_({ok:false,error:String(err&&err.message||err).slice(0,240)});}}
function maDb_(){const id=maProp_('MATHORA_DB_ID');if(!id)throw Error('Thiếu MATHORA_DB_ID');return SpreadsheetApp.openById(id);}
function maSheet_(name,headers){const db=maDb_();let sheet=db.getSheetByName(name);
  if(!sheet){sheet=db.insertSheet(name);}if(sheet.getLastRow()===0){sheet.appendRow(headers);sheet.setFrozenRows(1);}
  return sheet;}
function maStore_(){return maSheet_(MA.SHEET,MA.HEAD);}
function ma23StageSheet_(){return maSheet_(MA.STAGING,MA.STAGE_HEAD);}
function maAudit_(action,id,details){const sh=maSheet_(MA.AUDIT,['Ngày','Thao tác','ID','Chi tiết']);
  sh.appendRow([new Date(),action,id,JSON.stringify(details||{}).slice(0,1000)]);}
function maDigest_(obj){const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(obj));
  return bytes.map(b=>('0'+(b<0?b+256:b).toString(16)).slice(-2)).join('');}
function maValidate_(o){if(!o||typeof o!=='object'||Array.isArray(o))throw Error('Hồ sơ không hợp lệ.');
  if(!String(o.statement||'').trim()||!String(o.solution||'').trim())throw Error('Thiếu đề bài hoặc lời giải.');
  if(!o.curriculum||!String(o.curriculum.learning_outcome||'').trim())throw Error('Thiếu yêu cầu cần đạt.');
  if(!MA.COMP.includes(o.primary_competency)||!String(o.competency_evidence||'').trim())throw Error('Thiếu năng lực trọng tâm/minh chứng.');
  ['conditions','casio_assessment','difficulty_analysis','origin'].forEach(k=>{if(!String(o[k]||'').trim())throw Error('Thiếu '+k);});
  if(o.short_answer!==undefined)ma23ShortAnswer_(o.short_answer);
  if(JSON.stringify(o).length>MA.MAX_RECORD)throw Error('Hồ sơ quá dài.');return o;}
function ma23ShortAnswer_(value){const s=String(value==null?'':value).trim().replace(',','.');
  if(s.length>4||!/^[-+]?\d+(?:\.\d+)?(?:\/\d+)?$/.test(s))throw Error('Đáp án trả lời ngắn không hợp lệ hoặc dài quá 4 ký tự.');
  if(s.includes('/')){const parts=s.split('/').map(Number);if(parts.length!==2||parts[1]===0)throw Error('Mẫu số đáp án bằng 0.');}
  return s;}
function ma23SameAnswer_(left,right){const a=ma23ShortAnswer_(left),b=ma23ShortAnswer_(right);
  const asFrac=s=>{const x=s.split('/');return x.length===2?Number(x[0])/Number(x[1]):Number(x[0]);};
  return asFrac(a)===asFrac(b);}
function ma23Norm_(s){return String(s||'').normalize('NFC').toLowerCase().replace(/\s+/g,' ').trim();}
function ma23Summary_(problem){return ma23Norm_(problem.statement)+'\n'+ma23Norm_(problem.conditions);}
function ma23Unique_(problem,excludeId){
  const sh=maStore_(),last=sh.getLastRow();if(last-1>MA.MAX_KHO_SCAN)throw Error('Kho quá lớn để kiểm tra trùng cơ bản; cần công cụ chuyên dụng.');
  const target=ma23Summary_(problem);if(last<2)return {ok:true,checked:0};
  const rows=sh.getRange(2,1,last-1,7).getValues();
  for(const row of rows){if(String(row[0])===String(excludeId||''))continue;
    try{const obj=JSON.parse(String(row[6]));if(ma23Summary_(obj)===target)return {ok:false,id:String(row[0])};}catch(err){}
  }return {ok:true,checked:rows.length};
}
function ma23WorkflowId_(o,p){return String(((o.pro_review||{}).workflow_id)||p.jobId||'').trim().slice(0,120);}
function ma23Lock_(){const lock=LockService.getScriptLock();lock.waitLock(20000);return lock;}
function ma23Stage_(p){const problem=maValidate_(p.problem),hash=maDigest_(problem),workflow=ma23WorkflowId_(problem,p),
  parent=ma23CellText_(String(p.parentId||'')),origin=ma23CellText_(String(p.source||'AI_OR_TEACHER').slice(0,80)),sh=ma23StageSheet_();
  // Bao ve tinh nhat quan cua workflow. Moi phien chi co mot noi dung co dinh.
  const lock=ma23Lock_();try{
    const last=sh.getLastRow();if(last-1>MA.MAX_STAGE_SCAN)throw Error('Vượt giới hạn tạm lưu; cần lưu trữ/lọc dữ liệu.');
    if(last>=2){const rows=sh.getRange(2,1,last-1,MA.STAGE_HEAD.length).getValues();
      for(const r of rows){
        if(workflow&&String(r[12])===workflow){
          if(String(r[7])===hash)return {ok:true,id:String(r[0]),status:String(r[3]),storedIn:'STAGING',reused:true};
          throw Error('Phiên sáng tạo đã gửi hồ sơ khác; không tự ghi đè.');
        }
        if(!workflow&&!parent&&String(r[7])===hash&&String(r[3])==='WAITING_HUMAN')
          return {ok:true,id:String(r[0]),status:'WAITING_HUMAN',storedIn:'STAGING',reused:true};
      }
    }
    const id='MS-'+Utilities.getUuid(),now=new Date();
    sh.appendRow([id,now,now,'WAITING_HUMAN',origin,parent,Number(p.expectedVersion)||'',hash,
      JSON.stringify(problem),'teacher','','',ma23CellText_(workflow)]);
    maAudit_('STAGE_ONLY',id,{source:origin,workflow,hash,parent});
    return {ok:true,id,status:'WAITING_HUMAN',storedIn:'STAGING',savedToKho:false};
  }finally{lock.releaseLock();}
}
// Chu ky tuong thich cu cho cac ham tao 1 bai: khong ghi Kho neu chua qua tham dinh.
function maSave_(p){return ma23Stage_(Object.assign({source:'LEGACY_GENERATE'},p));}
function ma23FindStagedByWorkflow_(workflow){if(!workflow)return null;const sh=ma23StageSheet_(),n=sh.getLastRow();
  if(n<2)return null;if(n-1>MA.MAX_STAGE_SCAN)throw Error('Staging quá lớn để tìm phiên.');
  const rows=sh.getRange(2,1,n-1,MA.STAGE_HEAD.length).getValues();
  for(let i=rows.length-1;i>=0;i--)if(String(rows[i][12])===String(workflow))
    return {id:String(rows[i][0]),status:String(rows[i][3]),hash:String(rows[i][7]),khoId:String(rows[i][11]||'')};
  return null;}
function ma23FindStage_(id){const sh=ma23StageSheet_(),n=sh.getLastRow();if(n<2)throw Error('Chưa có hồ sơ chờ duyệt.');
  if(n-1>MA.MAX_STAGE_SCAN)throw Error('Staging vượt giới hạn tra cứu an toàn.');
  const ids=sh.getRange(2,1,n-1,1).getDisplayValues(),i=ids.findIndex(r=>r[0]===id);
  if(i<0)throw Error('Không tìm thấy mã hồ sơ STAGING.');
  const row=i+2;return {sh,row,values:sh.getRange(row,1,1,MA.STAGE_HEAD.length).getValues()[0]};}
function ma23ListPending_(p){const sh=ma23StageSheet_(),n=sh.getLastRow();if(n<2)return {ok:true,items:[]};
  if(n-1>MA.MAX_STAGE_SCAN)throw Error('Staging vượt giới hạn.');
  const rows=sh.getRange(2,1,n-1,MA.STAGE_HEAD.length).getValues(),limit=Math.min(100,Math.max(1,Number(p.limit)||30));
  const target=String(p.status||'WAITING_HUMAN');
  return {ok:true,items:rows.filter(r=>!target||r[3]===target).slice(-limit).reverse().map(r=>({id:r[0],createdAt:r[1],
    status:r[3],source:r[4],sourceHash:r[7],workflowId:r[12],originalId:r[5],khoId:r[11]}))};}
function ma23GetPending_(p){const f=ma23FindStage_(String(p.id||'')),r=f.values,problem=JSON.parse(String(r[8]));
  if(maDigest_(problem)!==String(r[7]))throw Error('Hồ sơ STAGING bị thay đổi ngoài quy trình.');
  return {ok:true,id:r[0],status:r[3],version:r[6],sourceHash:r[7],source:r[4],problem,
    reviewerNotes:r[10]||'',khoId:r[11]||''};}
function ma23Evidence_(p,problem,sourceHash,pendingId){const e=p.evidence||{};
  if(p.humanReviewed!==true||e.mathVerified!==true||e.curriculumVerified!==true||e.independentAnswerVerified!==true||e.originalityReviewed!==true)
    throw Error('Người thẩm định phải xác nhận Toán học, CT2018, đáp án độc lập và rà soát trùng.');
  const min={reviewer:5,proof:70,curriculumCrosswalk:55,difficultyEvidence:45,originalitySearch:35,casioReview:25,reviewNote:15};
  Object.keys(min).forEach(k=>{if(String(e[k]||'').trim().length<min[k])throw Error('Thiếu minh chứng thẩm định: '+k);});
  if(!ma23SameAnswer_(problem.short_answer,e.independentAnswer))throw Error('Đáp án độc lập không khớp đáp án bài toán.');
  // Day la XAC NHAN THU CONG cua owner, khong phai chung nhan tinh dung cua AI.
  return {status:'HUMAN_ATTESTED',reviewer:String(e.reviewer).slice(0,120),reviewedAt:new Date().toISOString(),
    sourceHash,pendingId,independentAnswer:String(e.independentAnswer),mathProof:String(e.proof),
    curriculumCrosswalk:String(e.curriculumCrosswalk),difficultyEvidence:String(e.difficultyEvidence),
    originalitySearch:String(e.originalitySearch),casioReview:String(e.casioReview),
    reviewNote:String(e.reviewNote),mathVerified:true,curriculumVerified:true,
    independentAnswerVerified:true,originalityReviewed:true,ownerAttested:true,
    externalOriginalityGuaranteed:false};
}
function ma23FindKhoByPending_(pendingId){const sh=maStore_(),n=sh.getLastRow();if(n<2)return null;
  if(n-1>MA.MAX_KHO_SCAN)throw Error('Kho vượt giới hạn tra cứu trùng.');
  const rows=sh.getRange(2,1,n-1,MA.HEAD.length).getValues();
  for(let i=rows.length-1;i>=0;i--){try{const o=JSON.parse(String(rows[i][6]));
    if(o.human_validation&&o.human_validation.pendingId===pendingId)return {id:rows[i][0],hash:rows[i][7],version:rows[i][1],status:rows[i][4]};
  }catch(err){}}
  return null;
}
function ma23CellText_(s){s=String(s||'');return /^[=+@\-]/.test(s)?"'"+s:s;}
function ma23AttestPending_(p){const pendingId=String(p.id||'');if(!pendingId)throw Error('Thiếu mã hồ sơ cần thẩm định.');
  const lock=ma23Lock_();try{
    const f=ma23FindStage_(pendingId),r=f.values,already=ma23FindKhoByPending_(pendingId);
    if(already){if(r[3]!=='PROMOTED'){f.sh.getRange(f.row,4).setValue('PROMOTED');f.sh.getRange(f.row,12).setValue(already.id);}
      return {ok:true,id:already.id,status:already.status,alreadyCommitted:true};}
    if(r[3]!=='WAITING_HUMAN')throw Error('Hồ sơ không còn chờ thẩm định.');
    const original=JSON.parse(String(r[8]));if(maDigest_(original)!==String(r[7]))throw Error('Hồ sơ nguồn đã bị sửa ngoài quy trình.');
    if(String(p.expectedHash||'')!==String(r[7]))throw Error('SHA256 hồ sơ đã thay đổi; cần mở lại bản mới.');
    const evidence=ma23Evidence_(p,original,String(r[7]),pendingId);
    const sourceId=String(r[5]||'');const unique=ma23Unique_(original,sourceId);
    if(!unique.ok)throw Error('Trùng nguyên văn với mã Kho '+unique.id+'; không ghi Kho.');
    const obj=Object.assign({},original,{human_validation:evidence});
    if(obj.curriculum)obj.curriculum=Object.assign({},obj.curriculum,{verification:'human_attested'});
    maValidate_(obj);
    const data=JSON.stringify(obj),digest=maDigest_(obj),now=new Date(),sh=maStore_();
    let id,version;
    if(sourceId){const old=maFind_(sourceId),v=old.values;
      if(Number(v[1])!==Number(r[6]))throw Error('Bản gốc đã thay đổi phiên bản; không áp dụng sửa đổi cũ.');
      id=sourceId;version=Number(v[1])+1;
      sh.getRange(old.row,2,1,10).setValues([[version,v[2],now,'DRAFT_REVIEWED',ma23CellText_(obj.title||'Bài toán'),data,digest,v[8],'','']]);
      maAudit_('PROMOTE_REVIEWED_REVISION',id,{pendingId,version,digest,reviewer:evidence.reviewer});
    }else{
      id='MP-'+Utilities.getUuid();version=1;
      sh.appendRow([id,version,now,now,'DRAFT_REVIEWED',ma23CellText_(obj.title||'Bài toán'),data,digest,
        'human-reviewed','','']);
      maAudit_('PROMOTE_REVIEWED_NEW',id,{pendingId,version,digest,reviewer:evidence.reviewer});
    }
    // Co the phuc hoi neu bi dut ngay sau ghi Kho: ma23FindKhoByPending_ nhan dien pendingId.
    f.sh.getRange(f.row,4).setValue('PROMOTED');
    f.sh.getRange(f.row,11,1,2).setValues([[ma23CellText_(evidence.reviewNote),id]]);
    f.sh.getRange(f.row,3).setValue(now);
    return {ok:true,id,status:'DRAFT_REVIEWED',version,hash:digest,originalPending:pendingId,
      approvedForExam:false};
  }finally{lock.releaseLock();}
}
function ma23RejectPending_(p){const id=String(p.id||''),note=String(p.reason||'').trim();if(note.length<15)throw Error('Phải ghi lý do từ chối.');
  const lock=ma23Lock_();try{const f=ma23FindStage_(id),r=f.values;
    if(r[3]!=='WAITING_HUMAN')throw Error('Không thể từ chối hồ sơ ở trạng thái hiện tại.');
    f.sh.getRange(f.row,4).setValue('REJECTED');f.sh.getRange(f.row,11).setValue(ma23CellText_(note.slice(0,1000)));
    f.sh.getRange(f.row,3).setValue(new Date());maAudit_('REJECT_STAGED',id,{note:note.slice(0,500)});
    return {ok:true,id,status:'REJECTED'};
  }finally{lock.releaseLock();}}
function maFind_(id){const sh=maStore_(),n=sh.getLastRow();if(n<2)throw Error('Kho trống.');
  if(n-1>MA.MAX_KHO_SCAN)throw Error('Kho vượt ngưỡng tra cứu; cần lập chỉ mục.');
  const ids=sh.getRange(2,1,n-1,1).getDisplayValues(),i=ids.findIndex(r=>r[0]===id);
  if(i<0)throw Error('Không tìm thấy bài toán trong Kho.');
  const row=i+2;return {s:sh,row,values:sh.getRange(row,1,1,MA.HEAD.length).getValues()[0]};}
function ma23VerifiedRecord_(row){if(!row||String(row[4])!=='APPROVED')return false;
  try{const obj=JSON.parse(String(row[6]));if(maDigest_(obj)!==String(row[7]))return false;
    const e=obj.human_validation||{};return e.status==='HUMAN_ATTESTED'&&e.ownerAttested===true&&
      e.mathVerified===true&&e.curriculumVerified===true&&e.independentAnswerVerified===true&&e.originalityReviewed===true;
  }catch(err){return false;}}
function maGet_(p){const f=maFind_(String(p.id||'')),r=f.values,problem=JSON.parse(String(r[6]));
  const intact=maDigest_(problem)===String(r[7]);
  return {ok:true,id:r[0],version:r[1],status:r[4],hash:r[7],intact,problem};}
function maList_(p){const sh=maStore_(),n=sh.getLastRow();if(n<2)return {ok:true,items:[]};
  if(n-1>MA.MAX_KHO_SCAN)throw Error('Kho quá lớn; cần phân trang thực tế.');
  const desired=String(p.status||''),limit=Math.min(100,Math.max(1,Number(p.limit)||30));
  const rows=sh.getRange(2,1,n-1,MA.HEAD.length).getValues();
  return {ok:true,items:rows.filter(r=>!desired||r[4]===desired).slice(-limit).reverse()
    .map(r=>({id:r[0],version:r[1],status:r[4],title:r[5],hash:r[7],updatedAt:r[3]}))};}
function ma23ListExamEligible_(p){const sh=maStore_(),n=sh.getLastRow();if(n<2)return {ok:true,items:[]};
  if(n-1>MA.MAX_KHO_SCAN)throw Error('Kho quá lớn; cần phân trang xác minh.');
  const limit=Math.min(100,Math.max(1,Number(p.limit)||100));
  const rows=sh.getRange(2,1,n-1,MA.HEAD.length).getValues();
  return {ok:true,items:rows.filter(ma23VerifiedRecord_).slice(-limit).reverse()
    .map(r=>({id:r[0],version:r[1],status:r[4],title:r[5],hash:r[7],updatedAt:r[3]}))};}
function maUpdate_(p){const id=String(p.id||''),expected=Number(p.expectedVersion),problem=maValidate_(p.problem);
  const old=maFind_(id);if(expected!==Number(old.values[1]))return {ok:false,error:'Xung đột phiên bản: phải tải bài mới nhất.'};
  if(String(p.expectedHash||'')!==String(old.values[7]))return {ok:false,error:'Hash bản gốc thay đổi, cần tải lại.'};
  return ma23Stage_({problem,parentId:id,expectedVersion:expected,source:'REVISION'});}
function maApprove_(p){const id=String(p.id||''),version=Number(p.expectedVersion),hash=String(p.expectedHash||''),
  note=String(p.reviewNote||'').trim();
  if(p.humanReviewed!==true||note.length<15)return {ok:false,error:'Owner phải xác nhận thẩm định và ghi nhận xét đầy đủ.'};
  const lock=ma23Lock_();try{const f=maFind_(id),row=f.values;
    if(Number(row[1])!==version||String(row[7])!==hash)return {ok:false,error:'Bản ghi/phiên bản đã thay đổi; cần duyệt lại.'};
    if(row[4]!=='DRAFT_REVIEWED')return {ok:false,error:'Chỉ bản DRAFT_REVIEWED có chứng cứ mới được duyệt.'};
    const obj=JSON.parse(String(row[6]));if(maDigest_(obj)!==hash)return {ok:false,error:'Hồ sơ bị sửa ngoài quy trình.'};
    const cert=obj.human_validation||{};
    if(cert.status!=='HUMAN_ATTESTED'||!cert.pendingId||cert.ownerAttested!==true||
       cert.mathVerified!==true||cert.curriculumVerified!==true||cert.independentAnswerVerified!==true||cert.originalityReviewed!==true)
      return {ok:false,error:'Thiếu hồ sơ thẩm định có nguồn gốc xác nhận.'};
    f.s.getRange(f.row,5).setValue('APPROVED');
    f.s.getRange(f.row,10,1,2).setValues([[ma23CellText_(cert.reviewer),new Date()]]);
    maAudit_('OWNER_APPROVE',id,{version,hash,reviewer:cert.reviewer,note:note.slice(0,500)});
    return {ok:true,id,status:'APPROVED',version};
  }finally{lock.releaseLock();}}
// Sinh mot bai AI ho so JSON; khong tu luu Kho. Uu tien Flash-Lite chinh trong project.
function maGenerate_(p){const scope=String(p.scope||'').trim(),outcome=String(p.learningOutcome||'').trim(),competence=String(p.competency||'').trim();
  if(scope.length<12||scope.length>MA.MAX_PROMPT||!outcome||!MA.COMP.includes(competence))throw Error('Thiếu phạm vi, YCCĐ hoặc năng lực trọng tâm.');
  const key=maProp_('MATHORA_GEMINI_KEY');if(!key)return {ok:false,error:'Chưa cấu hình Gemini.'};
  const model=maProp_('MATHORA_GEMINI_MODEL')||'gemini-3.1-flash-lite';
  if(!/^[a-zA-Z0-9._-]+$/.test(model))throw Error('Tên model không hợp lệ.');
  const prompt='MATHORA soạn MỘT bài Toán HSG lớp 12. Phạm vi: '+scope+'; yêu cầu cần đạt GV dự kiến: '+outcome+
    '; năng lực trọng tâm: '+competence+'. Trả JSON duy nhất: {"title":"...","statement":"...","conditions":"...",'+
    '"curriculum":{"grade":"12","strand":"...","topic":"...","learning_outcome":"...","verification":"unverified"},'+
    '"primary_competency":"'+competence+'","competency_evidence":"...","solution":"...",'+
    '"alternative_solution":"...","casio_assessment":"...","difficulty_analysis":"...","key_insight":"...",'+
    '"origin":"AI draft","variants":[],"review_notes":"Chưa thẩm định."}. Đủ điều kiện, lời giải, điểm khóa tư duy và cách giải ngắn. KHÔNG tự gắn VDC đạt hoặc không trùng tuyệt đối.';
  const url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent';
  const res=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',headers:{'x-goog-api-key':key},
    payload:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',temperature:0.35,maxOutputTokens:4800}}),
    muteHttpExceptions:true});
  if(res.getResponseCode()!==200)return {ok:false,error:'Gemini HTTP '+res.getResponseCode()+'; không phát sinh bản ghi.'};
  const j=JSON.parse(res.getContentText()),cand=(j.candidates||[])[0]||{};
  if(cand.finishReason&&cand.finishReason!=='STOP')return {ok:false,error:'Gemini dừng '+cand.finishReason+'; không lưu.'};
  const txt=(((cand.content||{}).parts)||[]).map(x=>x.text||'').join('');
  let obj;try{obj=JSON.parse(txt);}catch(e){return {ok:false,error:'Gemini trả JSON chưa hợp lệ.'};}
  obj.curriculum=obj.curriculum||{};obj.curriculum.verification='unverified';obj.primary_competency=competence;
  maValidate_(obj);return {ok:true,provider:'Gemini',model,status:'UNVERIFIED_AI_DRAFT',problem:obj,saved:false};}

/** KIEM THU PURE: KHONG GOI API, KHONG DOC/GHI SHEETS. */
function mathoraV23KiemThuCongNoiBo(){let pass=0;const ck=(b,msg)=>{if(!b)throw Error('FAIL V2.3 '+msg);pass++;};
  ck(ma23ShortAnswer_('10')==='10','đáp án 2 chữ số');
  ck(ma23SameAnswer_('1/2','0.5'),'đáp án phân số/thập phân');
  let bad=false;try{ma23ShortAnswer_('12345');}catch(e){bad=true;}ck(bad,'chặn đáp án dài');
  bad=false;try{ma23ShortAnswer_('3/0');}catch(e){bad=true;}ck(bad,'chặn mẫu số 0');
  ck(ma23Norm_('  ĐỀ  số 1  ')==='đề số 1','chuẩn hoá văn bản');
  const fake={statement:'S1',conditions:'C1'};ck(ma23Summary_(fake)==='s1\nc1','vân tay nội dung');
  ck(ma23CellText_('=SUM(A1)')==="'=SUM(A1)",'chặn công thức trong ô');
  ck(ma23VerifiedRecord_([null,null,null,null,'APPROVED',null,'{}','x'])===false,'không tin APPROVED thiếu bằng chứng');
  ck(MA.STAGING==='MATHORA_STAGING'&&MA.SHEET==='MATHORA_PROBLEMS','tách kho và staging');
  Logger.log('MATHORA V2.3: '+pass+'/'+pass+' kiểm thử thuần đạt; KHÔNG API/KHÔNG KHO.');
  return {ok:true,passed:pass,apiCalled:false,readWriteSheets:false};
}

/**
 * MATHORA OLYMPIAD — đăng nhập tài khoản trong Google Sheets.
 * Không lưu mật khẩu thô vào Sheets hoặc GitHub.
 *
 * Cách kích hoạt: thay MATHORA.gs bằng bản tích hợp có doPost gọi maAccountDispatch_.
 * Script Properties (chỉ đặt khi khởi tạo):
 *   MATHORA_BOOTSTRAP_ADMIN_PASSWORD
 *   MATHORA_BOOTSTRAP_STUDENT_PASSWORD
 *
 * Khởi tạo: chạy maAccountsInitializeFromProperties() một lần từ Apps Script,
 * chức năng tự xóa hai thuộc tính mật khẩu sau khi tạo tài khoản.
 */
const MA_ACCOUNT_SHEET='MATHORA_USERS';
const MA_ACCOUNT_AUDIT='MATHORA_ACCOUNT_AUDIT';
const MA_ACCOUNT_HEADERS=['Username','Họ tên','Vai trò','Salt','PasswordHmac','Trạng thái','Ngày tạo','Lần đăng nhập cuối'];
const MA_ACCOUNT_CACHE_TTL=21600; // 6 giờ, có thể hết hạn sớm do eviction
const MA_ACCOUNT_LOGIN_LIMIT=5;
const MA_ACCOUNT_SESSION_PREFIX='mathora_session_';
const MA_ACCOUNT_LOCK_PREFIX='mathora_login_';

function maAccountSheet_(){
  return maSheet_(MA_ACCOUNT_SHEET,MA_ACCOUNT_HEADERS);
}
function maAccountDigest_(value){
  const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value));
  return bytes.map(b=>('0'+(b<0?b+256:b).toString(16)).slice(-2)).join('');
}
function maAccountPepper_(){
  const prop=PropertiesService.getScriptProperties();
  let pepper=prop.getProperty('MATHORA_PASSWORD_PEPPER');
  if(!pepper){pepper=Utilities.getUuid()+Utilities.getUuid()+Utilities.getUuid();prop.setProperty('MATHORA_PASSWORD_PEPPER',pepper);}
  return pepper;
}
function maAccountHmac_(password,salt){
  const bytes=Utilities.computeHmacSha256Signature(String(salt)+':'+String(password),maAccountPepper_());
  return bytes.map(b=>('0'+(b<0?b+256:b).toString(16)).slice(-2)).join('');
}
function maAccountEquals_(a,b){
  a=String(a||'');b=String(b||'');let n=a.length^b.length;
  for(let i=0;i<Math.max(a.length,b.length);i++)n|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);
  return n===0;
}
function maAccountCleanUser_(username){
  const user=String(username||'').trim().toLowerCase();
  if(!/^[a-z0-9._-]{3,50}$/.test(user))throw Error('Tên đăng nhập chưa hợp lệ.');
  return user;
}
function maAccountRole_(role){
  const r=String(role||'').trim().toLowerCase();
  if(!['admin','teacher','student'].includes(r))throw Error('Vai trò không hợp lệ.');
  return r;
}
function maAccountFind_(username){
  const sh=maAccountSheet_(),count=sh.getLastRow()-1;
  if(count>5000)throw Error('Danh sách tài khoản quá lớn.');
  if(count<1)return null;
  const rows=sh.getRange(2,1,count,MA_ACCOUNT_HEADERS.length).getValues();
  const index=rows.findIndex(r=>String(r[0]).toLowerCase()===username);
  return index<0?null:{sh,row:index+2,values:rows[index]};
}
function maAccountAudit_(name,user,detail){
  const sh=maSheet_(MA_ACCOUNT_AUDIT,['Thời gian','Sự kiện','Tài khoản','Ghi chú']);
  sh.appendRow([new Date(),name,user,String(detail||'').slice(0,160)]);
}
function maAccountsInitializeFromProperties(){
  const props=PropertiesService.getScriptProperties();
  const adminPass=props.getProperty('MATHORA_BOOTSTRAP_ADMIN_PASSWORD')||'';
  const studentPass=props.getProperty('MATHORA_BOOTSTRAP_STUDENT_PASSWORD')||'';
  if(!adminPass||!studentPass)throw Error('Chưa đặt hai mật khẩu khởi tạo trong Script Properties.');
  if(String(adminPass).length<4||String(studentPass).length<4)throw Error('Mật khẩu thử nghiệm không hợp lệ.');
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    maAccountPepper_();
    const sh=maAccountSheet_();
    const defs=[['admin','Quản trị MATHORA','admin',adminPass],['mathora','Học sinh thử nghiệm','student',studentPass]];
    const created=[];
    for(const [username,displayName,role,password] of defs){
      if(maAccountFind_(username))continue; // Không ghi đè người dùng hiện có
      const salt=Utilities.getUuid()+Utilities.getUuid();
      sh.appendRow([username,displayName,role,salt,maAccountHmac_(password,salt),'ACTIVE',new Date(),'']);
      created.push(username);
    }
    props.deleteProperty('MATHORA_BOOTSTRAP_ADMIN_PASSWORD');
    props.deleteProperty('MATHORA_BOOTSTRAP_STUDENT_PASSWORD');
    maAccountAudit_('BOOTSTRAP_ACCOUNTS','SYSTEM','created='+created.join(','));
    return {ok:true,created,accountsSheet:MA_ACCOUNT_SHEET,note:'Đã xóa các mật khẩu khởi tạo khỏi Script Properties; Sheet chỉ lưu HMAC.'};
  }finally{lock.releaseLock();}
}
function maAccountLogin_(p){
  const username=maAccountCleanUser_(p.username);
  const role=String(p.role||'').trim().toLowerCase();
  if(!['teacher','student'].includes(role))return {ok:false,error:'Vui lòng chọn Giáo viên hoặc Học sinh.'};
  const password=String(p.password||'');
  if(password.length<1||password.length>256)return {ok:false,error:'Tên đăng nhập hoặc mật khẩu không đúng.'};
  const cache=CacheService.getScriptCache();
  const failKey=MA_ACCOUNT_LOCK_PREFIX+maAccountDigest_(username).slice(0,30);
  const failures=Number(cache.get(failKey)||0);
  if(failures>=MA_ACCOUNT_LOGIN_LIMIT)return {ok:false,error:'Tài khoản bị tạm khóa do nhập sai nhiều lần. Thử lại sau.'};
  const record=maAccountFind_(username);
  const row=record&&record.values;
  const valid=!!row && String(row[5])==='ACTIVE' &&
      (role==='teacher'?['teacher','admin'].includes(String(row[2])):String(row[2])==='student') &&
      maAccountEquals_(maAccountHmac_(password,row[3]),row[4]);
  if(!valid){
    cache.put(failKey,String(failures+1),900);
    return {ok:false,error:'Tên đăng nhập, mật khẩu hoặc vai trò không đúng.'};
  }
  cache.remove(failKey);
  const token=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');
  const tokenKey=MA_ACCOUNT_SESSION_PREFIX+maAccountDigest_(token);
  const identity={username,displayName:String(row[1]),role:String(row[2]),issuedAt:Date.now()};
  cache.put(tokenKey,JSON.stringify(identity),MA_ACCOUNT_CACHE_TTL);
  record.sh.getRange(record.row,8).setValue(new Date());
  maAccountAudit_('LOGIN_OK',username,identity.role);
  return {ok:true,sessionToken:token,authenticatedRole:identity.role,username,displayName:identity.displayName,expiresIn:MA_ACCOUNT_CACHE_TTL};
}
function maAccountSession_(token){
  const value=String(token||'');
  if(!/^[a-f0-9]{96}$/.test(value))return null;
  const raw=CacheService.getScriptCache().get(MA_ACCOUNT_SESSION_PREFIX+maAccountDigest_(value));
  if(!raw)return null;
  try{
    const identity=JSON.parse(raw);
    const record=maAccountFind_(maAccountCleanUser_(identity.username));
    if(!record||String(record.values[5])!=='ACTIVE'||String(record.values[2])!==String(identity.role))return null;
    if(Date.now()-Number(identity.issuedAt)>MA_ACCOUNT_CACHE_TTL*1000)return null;
    return identity;
  }catch(err){return null;}
}
function maAccountLogout_(p){
  const token=String(p.sessionToken||'');
  if(/^[a-f0-9]{96}$/.test(token))CacheService.getScriptCache().remove(MA_ACCOUNT_SESSION_PREFIX+maAccountDigest_(token));
  return {ok:true};
}
function maAccountPermission_(identity,action,p){
  const role=String(identity.role||'');
  if(role==='admin')return {owner:true,teacher:true,student:false};
  if(role==='teacher')return {owner:false,teacher:true,student:false};
  if(role==='student'){
    if(action==='listExamEligible')return {owner:false,teacher:false,student:true};
    if(action==='getProblem'){
      const info=maGet_(p);
      if(info.ok===true&&info.status==='APPROVED'&&info.intact===true)return {owner:false,teacher:false,student:true,studentResult:info};
      return {owner:false,teacher:false,student:false};
    }
  }
  return {owner:false,teacher:false,student:false};
}

