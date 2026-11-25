import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../backend/'+p,import.meta.url),'utf8');
function env(){
 const sheets=new Map();let id=0;
 class R{
  constructor(sh,r,c,n,m){Object.assign(this,{sh,r,c,n,m});}
  getValues(){return Array.from({length:this.n},(_,i)=>Array.from({length:this.m},(_,j)=>this.sh.rows[this.r+i-1]?.[this.c+j-1]??''));}
  setValue(v){this.sh.rows[this.r-1]??=[];this.sh.rows[this.r-1][this.c-1]=v;}
  setValues(v){for(let i=0;i<v.length;i++)for(let j=0;j<v[i].length;j++){this.sh.rows[this.r+i-1]??=[];this.sh.rows[this.r+i-1][this.c+j-1]=v[i][j];}}
 }
 class S{
  constructor(){this.rows=[];}
  getLastRow(){return this.rows.length;}
  getLastColumn(){return Math.max(0,...this.rows.map(r=>r.length));}
  setFrozenRows(){}
  appendRow(r){this.rows.push([...r]);}
  getRange(r,c,n=1,m=1){return new R(this,r,c,n,m);}
 }
 const db={getSheetByName:n=>sheets.get(n)||null,insertSheet:n=>{const sh=new S();sheets.set(n,sh);return sh;}};
 const context=vm.createContext({
  maDb_:()=>db,
  maAccountFind_:n=>n==='student1'?{values:['student1','Student','student','','','ACTIVE']}:null,
  Utilities:{getUuid:()=>String(++id)},
  LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
  Date,JSON,Array,Object,Number,String,Map,Set,Error
 });
 vm.runInContext(read('MATHORA_REMEDIATION_V1.gs'),context);
 vm.runInContext(read('MATHORA_EXAMS_V1.gs'),context);
 const call=(a,p={},identity={username:'teacher1',role:'teacher'})=>JSON.parse(JSON.stringify(context.maExamRoute_(a,p,identity)));
 return {call,sheets,rem:(a,p,identity)=>JSON.parse(JSON.stringify(context.maRemRoute_(a,p,identity)))};
}
const questions=[
 {id:'Q1',kind:'mc',prompt:'Chọn x',choices:['1','2','3','4'],correct:'C'},
 {id:'Q2',kind:'tf',prompt:'Xét đúng sai',statements:['a','b','c','d'],correct:['D','S','D','D']},
 {id:'Q3',kind:'short',prompt:'Tính I',correct:'7'}
];
test('teacher creates; only admin publishes; answers never exposed',()=>{
 const {call}=env();
 const made=call('examCreate',{title:'Đề thử',questions});
 assert.equal(made.status,'DRAFT');
 assert.equal(call('examPublish',{examId:made.examId}).ok,false);
 assert.equal(call('examList',{}, {username:'student1',role:'student'}).exams.length,0);
 assert.equal(call('examPublish',{examId:made.examId}, {username:'admin',role:'admin'}).status,'ACTIVE');
 const student={username:'student1',role:'student'};
 const fetched=call('examGet',{examId:made.examId},student);
 assert.equal(fetched.ok,true);
 assert.equal(JSON.stringify(fetched).includes('"correct"'),false);
 assert.equal(call('examGet',{examId:made.examId}, {username:'student2',role:'student'}).ok,true);
});
test('exam submit grades 0.25/TF scale/0.5 and automatically creates one task per wrong question',()=>{
 const {call,rem}=env();
 const id=call('examCreate',{title:'Đề thử',questions}).examId;
 call('examPublish',{examId:id},{username:'admin',role:'admin'});
 const student={username:'student1',role:'student'};
 const result=call('examSubmit',{examId:id,answers:{Q1:'C',Q2:['D','S','D','S'],Q3:'8'}},student);
 assert.equal(result.score,0.75); // 0.25 + 0.5 + 0
 assert.equal(result.maxScore,1.75);
 assert.deepEqual(result.wrongQuestionIds,['Q2','Q3']);
 const assigned=rem('remMyTasks',{},student).tasks;
 assert.equal(assigned.length,2);
 const tf=assigned.find(t=>t.kind==='tf');
 assert.equal(tf.wrongParts,'d');
 assert.match(tf.prompt,/a\) a/);
 assert.match(tf.prompt,/d\) d/);
 assert.equal(call('examSubmit',{examId:id,answers:{Q1:'C',Q2:['D','S','D','D'],Q3:'7'}},student).ok,false);
 assert.equal(call('examResults',{examId:id},student).results[0].score,0.75);
});
test('TF zero to four correct earns exactly teacher scale',()=>{
 for(const [num,score] of [0,0.1,0.25,0.5,1].entries()){
  const {call}=env();
  const id=call('examCreate',{title:'Kiểm thử',questions}).examId;
  call('examPublish',{examId:id},{username:'admin',role:'admin'});
  const answers={Q1:'A',Q2:['D','S','D','D'].map((right,i)=>i<num?right:['S','D','S','S'][i]),Q3:'8'};
  const result=call('examSubmit',{examId:id,answers},{username:'student1',role:'student'});
  assert.equal(result.score,score);
 }
});
test('reject incomplete answers, duplicate question IDs and invalid non-number key',()=>{
 const {call}=env();
 assert.equal(call('examCreate',{title:'Bad',questions:[questions[0],questions[0]]}).ok,false);
 assert.equal(call('examCreate',{title:'Bad',questions:[{...questions[2],correct:'1/2'}]}).ok,false);
 const id=call('examCreate',{title:'Valid',questions}).examId;
 call('examPublish',{examId:id},{username:'admin',role:'admin'});
 assert.equal(call('examSubmit',{examId:id,answers:{Q1:'C',Q2:['D'],Q3:'7'}},{username:'student1',role:'student'}).ok,false);
 assert.equal(call('examResults',{examId:id},{username:'student1',role:'student'}).results.length,0);
});
