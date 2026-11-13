// MATHORA V1 bridge unit tests — mock only. Run: node test_bridge.js
// This does NOT establish Apps Script, Sheets, Gemini or STAGING integration.
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const path = require('path');
let called = [];
const owner = 'O'.repeat(30), teacher = 'T'.repeat(30);
const props={MATHORA_DB_ID:'SHEET_TEST_1234567890',MATHORA_GEMINI_KEY:'GEMINI',MATHORA_V1_TEST_MODE:'NO',MATHORA_V1_TEST_DB_ID:'SHEET_TEST_1234567890'};
const env = {
  maAuthorized_:(k,n)=>k===(n==='MATHORA_OWNER_KEY'?owner:teacher),
  MA:{VERSION:'2.3'}, maProp_:(k)=>props[k]||'',
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
// Mutation gates must fail closed before any side effects.
assert.equal(run(teacher,'generateDraft',{scope:'test'}).ok,false);
assert.equal(run(owner,'approveProblem',{id:'fake'}).ok,false);
assert.equal(called.length,0);
props.MATHORA_V1_TEST_MODE='YES';
props.MATHORA_V1_TEST_DB_ID='DIFFERENT_TEST_ID_123';
assert.equal(run(teacher,'stageDraft',{problem:{short_answer:'10'}}).ok,false);
assert.equal(called.length,0);
props.MATHORA_V1_TEST_DB_ID=props.MATHORA_DB_ID;
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
console.log('19/19: PASS MÔ PHỎNG BRIDGE (không gọi Backend / Gemini / Google Sheets).');
