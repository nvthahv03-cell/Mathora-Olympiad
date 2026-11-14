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
