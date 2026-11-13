// MATHORA V1 bridge unit tests — mock only. Run: node test_bridge.js
// This does NOT establish Apps Script, Sheets, Gemini or STAGING integration.
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const path = require('path');
let called = [];
const owner = 'O'.repeat(30), teacher = 'T'.repeat(30);
const env = {
  maAuthorized_:(k,n)=>k===(n==='MATHORA_OWNER_KEY'?owner:teacher),
  MA:{VERSION:'2.3'}, maProp_:(k)=>k==='MATHORA_DB_ID'?'DB':k==='MATHORA_GEMINI_KEY'?'GEMINI':'',
  maGenerate_:()=>{called.push('generate');return {ok:true,problem:{statement:'demo'}};},
  maSave_:()=>{called.push('stage');return {ok:true,id:'TEST-1',storedIn:'STAGING'};},
  ma23ListPending_:()=>({ok:true,items:[]}),
  ma23GetPending_:()=>({ok:true,problem:{}}),
  ma23RejectPending_:()=>{called.push('reject');return {ok:true};},
  ma23AttestPending_:()=>{called.push('attest');return {ok:true};},
  maList_:()=>({ok:true,items:[]}),
  maGet_:()=>({ok:true,problem:{}}),
  maApprove_:()=>{called.push('approve');return {ok:true};},
  ma23ListExamEligible_:()=>({ok:true,items:[]})
};
vm.createContext(env);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../MathoraWebV1.gs'),'utf8'),env);
const run=(key,action,payload={})=>env.mathoraV1Bridge({key,action,payload});
assert.equal(run('wrong','listPending').ok,false);
assert.equal(run(teacher,'health').role,'teacher');
assert.equal(run(owner,'health').role,'owner');
assert.equal(run(teacher,'approveProblem').ok,false);
assert.equal(run(teacher,'attestPending').ok,false);
assert.equal(run(teacher,'rejectPending').ok,false);
assert.equal(run(teacher,'stageDraft',{problem:{statement:'x'}}).ok,false);
assert.equal(run(teacher,'stageDraft',{problem:{statement:'x',short_answer:'10'}}).ok,true);
assert.equal(run(owner,'approveProblem').ok,true);
assert.equal(run(owner,'attestPending').ok,true);
assert.equal(run(owner,'rejectPending').ok,true);
assert.equal(run(owner,'noSuchAction').ok,false);
assert.equal(run(teacher,'generateDraft',{scope:'demo'}).ok,true);
assert.deepEqual(called,['stage','approve','attest','reject','generate']);
console.log('14/14: PASS MÔ PHỎNG BRIDGE (không gọi Backend / Gemini / Google Sheets).');
