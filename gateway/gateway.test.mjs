/** MATHORA Gateway smoke test — no Apps Script/Gemini/Sheets calls.
 * Run from project root: node --test gateway/gateway.test.mjs
 * All emails and keys below are fake test fixtures.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './cloudflare-worker.mjs';

const ORIGIN='https://nvthahv03-cell.github.io';
const GAS='https://script.google.com/macros/s/AKfycbwJVgZj04G1gWfdTzt-3lJlcXBLJW6Z7-zCbK-s99DzNy_-PAcvZwhtrALyz2QvTDolyw/exec';
const base=()=>({
  ALLOWED_ORIGIN:ORIGIN,GOOGLE_CLIENT_ID:'test-id.apps.googleusercontent.com',
  GAS_ENDPOINT:GAS, OWNER_EMAILS:'owner@example.edu',
  TEACHER_EMAILS:'teacher@example.edu',GAS_OWNER_KEY:'O'.repeat(30),
  GAS_TEACHER_KEY:'T'.repeat(30),MATHORA_WRITE_ENABLED:'NO',GAS_TEST_APPROVED:'NO'
});
let forwarded=[];
const originalFetch=globalThis.fetch;
globalThis.fetch=async (url,opts={})=>{
  const u=String(url);
  if(u.startsWith('https://oauth2.googleapis.com/tokeninfo')){
    const teacher=u.includes('teacher-token'),invalid=u.includes('bad-audience');
    return new Response(JSON.stringify({aud:invalid?'different.apps.googleusercontent.com':'test-id.apps.googleusercontent.com',iss:'https://accounts.google.com',email_verified:'true',email:teacher?'teacher@example.edu':'owner@example.edu'}),{status:200});
  }
  if(u.includes('action=health'))return new Response(JSON.stringify({ok:true,version:'2.3-controlled-staging'}),{status:200});
  forwarded.push(JSON.parse(opts.body||'{}'));
  return new Response(JSON.stringify({ok:true,id:'TEST-1',status:'WAITING_HUMAN'}),{status:200});
};
const request=(action,options={})=>{
  const {origin=ORIGIN,token='owner-token',method='POST',path='/api',body={}}=options;
  return new Request('https://gateway.example'+path,{method,headers:{Origin:origin,'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:method==='POST'?JSON.stringify({action,...body}):undefined});
};
test('foreign origin denied',async()=>{assert.equal((await worker.fetch(request('listPending',{origin:'https://evil.example'}),base())).status,403)});
test('write disabled by default',async()=>{assert.equal((await worker.fetch(request('approveProblem'),base())).status,403)});
test('teacher cannot approve',async()=>{assert.equal((await worker.fetch(request('approveProblem',{token:'teacher-token'}),base())).status,403)});
test('teacher can read',async()=>{assert.equal((await worker.fetch(request('listPending',{token:'teacher-token'}),base())).status,200)});
test('test approval required',async()=>{const env=base();env.MATHORA_WRITE_ENABLED='YES';assert.equal((await worker.fetch(request('approveProblem'),env)).status,403)});
test('owner can write in explicitly approved TEST only',async()=>{const env=base();env.MATHORA_WRITE_ENABLED='YES';env.GAS_TEST_APPROVED='YES';assert.equal((await worker.fetch(request('approveProblem'),env)).status,200)});
test('browser-supplied key and role discarded',async()=>{forwarded=[];await worker.fetch(request('listKho',{body:{key:'MALICIOUS',role:'owner'}}),base());assert.equal(forwarded.at(-1).role,undefined);assert.equal(forwarded.at(-1).key,'O'.repeat(30))});
test('audience mismatch denied',async()=>{assert.equal((await worker.fetch(request('listPending',{token:'bad-audience'}),base())).status,403)});
test('CORS preflight grants configured origin',async()=>{const r=await worker.fetch(new Request('https://gateway.example/api',{method:'OPTIONS',headers:{Origin:ORIGIN}}),base());assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),ORIGIN)});
test('CORS preflight denies unlisted origin',async()=>{const r=await worker.fetch(new Request('https://gateway.example/api',{method:'OPTIONS',headers:{Origin:'https://evil.example'}}),base());assert.equal(r.status,403)});
test('health read-only accessible in new tab without Origin',async()=>{const r=await worker.fetch(new Request('https://gateway.example/health'),base());assert.equal(r.status,200);assert.equal((await r.json()).writeEnabled,false)});
test('unknown actions denied',async()=>{assert.equal((await worker.fetch(request('deleteAllData'),base())).status,400)});
test.after(()=>{globalThis.fetch=originalFetch});
