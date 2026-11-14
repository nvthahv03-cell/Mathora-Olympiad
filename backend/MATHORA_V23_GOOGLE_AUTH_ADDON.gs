/**
 * MATHORA V2.3 | XAC THUC GOOGLE ID TOKEN, KHONG CAN CLOUDFLARE
 *
 * Day la HAM BO SUNG vao project Apps Script dang chay, KHONG phai mot doPost khac.
 * Cac Script Properties:
 *   MATHORA_WEB_CLIENT_ID: 123...apps.googleusercontent.com
 *   MATHORA_WEB_OWNER_EMAILS: dia chi email owner, cach nhau bang dau phay
 *   MATHORA_WEB_TEACHER_EMAILS: email giao vien, cach nhau bang dau phay
 *
 * Phai ap dung thay doi nho trong doPost theo docs/MATHORA_DIRECT_AUTH_V23.md.
 * Khong dua owner key, teacher key, Gemini key, OAuth client secret vao GitHub.
 */
function maWebGoogleAuth_(idToken) {
  const anonymous={owner:false,teacher:false};
  const token=String(idToken||'');
  if(!token)return anonymous; // Ho tro cac client cu da co key, KHONG thay key la browser credential.
  if(token.length>5000||!/^[A-Za-z0-9._-]+$/.test(token))throw Error('Google ID token khong hop le.');
  const clientId=maProp_('MATHORA_WEB_CLIENT_ID');
  if(!clientId||!clientId.endsWith('.apps.googleusercontent.com'))
    throw Error('Apps Script chua cau hinh MATHORA_WEB_CLIENT_ID.');
  let res;
  try{
    res=UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(token),
      {method:'get',muteHttpExceptions:true,followRedirects:false});
  }catch(err){throw Error('Khong xac minh duoc Google ID token.');}
  if(res.getResponseCode()!==200)throw Error('Google ID token da het han hoac khong hop le.');
  let info;
  try{info=JSON.parse(res.getContentText());}catch(err){throw Error('Khong doc duoc ket qua xac thuc Google.');}
  if(String(info.aud||'')!==clientId||
     !['accounts.google.com','https://accounts.google.com'].includes(String(info.iss||''))||
     info.email_verified!==true&&info.email_verified!=='true')
    throw Error('Khong xac thuc duoc tai khoan Google.');
  // tokeninfo verifies signature, issuer and expiry; check exp once more fail-closed.
  if(!Number.isFinite(Number(info.exp))||Number(info.exp)*1000<=Date.now())
    throw Error('Google ID token da het han.');
  const email=String(info.email||'').trim().toLowerCase();
  if(!email||email.length>256)throw Error('Email tai khoan khong hop le.');
  function emailSet(name) {
    return String(maProp_(name)||'').split(/[,;\n]/).map(x=>x.trim().toLowerCase()).filter(Boolean);
  }
  const owner=emailSet('MATHORA_WEB_OWNER_EMAILS').includes(email);
  const teacher=owner||emailSet('MATHORA_WEB_TEACHER_EMAILS').includes(email);
  if(!teacher)throw Error('Tai khoan chua duoc cap quyen MATHORA.');
  return {owner,teacher};
}
