/**
 * MATHORA Authenticated Gateway for Cloudflare Workers.
 * GitHub Pages (public UI) -> Worker (Google ID token authorization + secret) -> Apps Script V2.3.
 * This file is SOURCE ONLY. It is not deployed by committing to GitHub.
 *
 * Secrets in Worker environment ONLY: GAS_TEACHER_KEY, GAS_OWNER_KEY.
 * Variables: GOOGLE_CLIENT_ID, GAS_ENDPOINT, TEACHER_EMAILS, OWNER_EMAILS, ALLOWED_ORIGIN.
 */
const ALLOWED_ACTIONS = new Set([
  'generateProblem','saveToKho','listKho','getProblem','listExamEligible',
  'listPending','getPending','attestPending','rejectPending','approveProblem'
]);
const OWNER_ONLY = new Set(['attestPending','rejectPending','approveProblem']);
const NO_WRITE = new Set(['listKho','getProblem','listExamEligible','listPending','getPending']);
const BODY_MAX = 85000;
const EMAIL_MAX = 256;
function json(body, status=200, origin='') {
  const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
  if (origin) { headers['Access-Control-Allow-Origin']=origin; headers['Access-Control-Allow-Methods']='GET,POST,OPTIONS'; headers['Access-Control-Allow-Headers']='Authorization,Content-Type'; headers['Access-Control-Max-Age']='600'; }
  return new Response(JSON.stringify(body),{status,headers});
}
const emailSet = value => new Set(String(value||'').split(/[,;\n]/).map(s=>s.trim().toLowerCase()).filter(Boolean));
function roles(payload, env) {
  if(!payload || payload.email_verified!==true && payload.email_verified!=='true') return null;
  if(payload.aud!==env.GOOGLE_CLIENT_ID || !['accounts.google.com','https://accounts.google.com'].includes(payload.iss))return null;
  const email=String(payload.email||'').toLowerCase().trim();
  if(!email||email.length>EMAIL_MAX) return null;
  if(emailSet(env.OWNER_EMAILS).has(email))return {role:'owner',email};
  if(emailSet(env.TEACHER_EMAILS).has(email))return {role:'teacher',email};
  return null;
}
async function verifiedRole(token, env){
  if(!token || token.length>5000 || !/^[\w.-]+$/.test(token))return null;
  const resp=await fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(token),{headers:{'Accept':'application/json'},redirect:'error'});
  if(!resp.ok)return null;
  const payload=await resp.json();
  // Google tokeninfo validates token signature, expiry and issuer; we explicitly verify aud/email/issuer.
  return roles(payload,env);
}
const ACTION_FIELDS = {
  generateProblem:['scope','learningOutcome','competency'],
  saveToKho:['problem'],
  listKho:['status','limit'],
  getProblem:['id'],
  listExamEligible:['limit'],
  listPending:['status','limit'],
  getPending:['id'],
  attestPending:['id','expectedHash','humanReviewed','evidence'],
  rejectPending:['id','reason'],
  approveProblem:['id','expectedVersion','expectedHash','humanReviewed','reviewNote']
};
function allowedBody(action, supplied){
  if(!supplied||typeof supplied!=='object'||Array.isArray(supplied))return null;
  const output={action};
  for(const key of ACTION_FIELDS[action])if(Object.prototype.hasOwnProperty.call(supplied,key))output[key]=supplied[key];
  return output;
}
function safeEndpoint(env){
  const u=new URL(String(env.GAS_ENDPOINT||''));
  if(u.protocol!=='https:'||u.hostname!=='script.google.com'||!/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(u.pathname)||u.search||u.hash)throw Error('BAD_GAS_ENDPOINT');
  return u.toString();
}
async function forward(payload, role, env){
  const endpoint=safeEndpoint(env);
  const key = role==='owner'?env.GAS_OWNER_KEY:env.GAS_TEACHER_KEY;
  if(!key || key.length<24)throw Error('MISSING_SERVER_CREDENTIALS');
  const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,key}),redirect:'follow'});
  if(!res.ok)throw Error('BACKEND_HTTP_'+res.status);
  const content=await res.text();
  if(content.length>120000)throw Error('BACKEND_RESPONSE_TOO_LARGE');
  let result;try{result=JSON.parse(content)}catch{throw Error('BACKEND_NOT_JSON');}
  if(!result||typeof result!=='object')throw Error('BACKEND_BAD_RESPONSE');
  return result;
}
export default {
  async fetch(request, env){
    const url=new URL(request.url);
    const configured=String(env.ALLOWED_ORIGIN||'').replace(/\/$/,'');
    const requestOrigin=request.headers.get('Origin')||'';
    const origin= requestOrigin===configured ? configured : '';
    if(request.method==='OPTIONS'){
      return origin?new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Max-Age':'600','Vary':'Origin'}}):json({ok:false,error:'Origin not allowed'},403);
    }
    if(url.pathname==='/health' && request.method==='GET'){
      try{
        const backend=await fetch(safeEndpoint(env)+'?action=health',{redirect:'follow'});
        if(!backend.ok)throw Error('BACKEND_HTTP_'+backend.status);
        const body=await backend.json();
        // Never expose database identifiers or sensitive settings.
        return json({ok:body.ok===true,service:'MATHORA-GATEWAY',backendVersion:body.version||'',backendReady:body.ok===true,authRequired:true,writeEnabled:env.MATHORA_WRITE_ENABLED==='YES'&&env.GAS_TEST_APPROVED==='YES'&&!!env.GAS_TEACHER_KEY&&!!env.GAS_OWNER_KEY},body.ok?200:503,origin);
      }catch(e){return json({ok:false,error:'BACKEND_HEALTH_UNAVAILABLE'},503,origin)}
    }
    if(!origin)return json({ok:false,error:'Origin not allowed'},403);
    if(url.pathname!=='/api' || request.method!=='POST')return json({ok:false,error:'Not found'},404,origin);
    const length=Number(request.headers.get('Content-Length')||0);
    if(length>BODY_MAX)return json({ok:false,error:'Request too large'},413,origin);
    const auth=request.headers.get('Authorization')||'';
    const match=/^Bearer ([A-Za-z0-9_.-]+)$/.exec(auth);
    if(!match)return json({ok:false,error:'Google sign-in required'},401,origin);
    let person;
    try{person=await verifiedRole(match[1],env)}catch{return json({ok:false,error:'Authentication unavailable'},503,origin)}
    if(!person)return json({ok:false,error:'Not authorized'},403,origin);
    let body;
    try{const raw=await request.text();if(raw.length>BODY_MAX)throw Error('SIZE');body=JSON.parse(raw)}catch{return json({ok:false,error:'Invalid JSON'},400,origin)}
    if(!body||typeof body!=='object'||!ALLOWED_ACTIONS.has(body.action))return json({ok:false,error:'Unsupported action'},400,origin);
    if(OWNER_ONLY.has(body.action)&&person.role!=='owner')return json({ok:false,error:'Owner approval required'},403,origin);
    // Never trust a client-supplied key, role, action aliases, or bypass flags.
    const payload=allowedBody(body.action,body);
    if(!payload)return json({ok:false,error:'Invalid body'},400,origin);
    if(!NO_WRITE.has(body.action) && env.MATHORA_WRITE_ENABLED!=='YES')
      return json({ok:false,error:'Write operations disabled until TEST integration approval'},403,origin);
    // Require explicit DB designation on Worker; no Apps Script DB change occurs here.
    if(!NO_WRITE.has(body.action) && (!env.GAS_TEST_APPROVED || env.GAS_TEST_APPROVED!=='YES'))
      return json({ok:false,error:'TEST backend approval required'},403,origin);
    try{
      const data=await forward(payload,person.role,env);
      return json({...data,authenticatedRole:person.role},200,origin);
    }catch(e){return json({ok:false,error:'Backend unavailable: '+String(e.message||'error').slice(0,80)},502,origin)}
  }
};
