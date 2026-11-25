import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../backend/MATHORA_REMEDIATION_V1.gs',import.meta.url),'utf8');
function environment(){
 const sheets=new Map();
 class Range{
  constructor(sheet,row,col,count,cols){Object.assign(this,{sheet,row,col,count,cols});}
  getValues(){return Array.from({length:this.count},(_,i)=>Array.from({length:this.cols},(_,j)=>this.sheet.rows[this.row-1+i]?.[this.col-1+j]??''));}
  setValue(value){this.sheet.rows[this.row-1]??=[];this.sheet.rows[this.row-1][this.col-1]=value;}
  setValues(values){for(let i=0;i<values.length;i++)for(let j=0;j<values[i].length;j++){this.sheet.rows[this.row-1+i]??=[];this.sheet.rows[this.row-1+i][this.col-1+j]=values[i][j];}}
 }
 class Sheet{
  constructor(){this.rows=[];}
  getLastRow(){return this.rows.length;}
  getLastColumn(){return Math.max(0,...this.rows.map(x=>x.length));}
  appendRow(row){this.rows.push([...row]);}
  setFrozenRows(){}
  getRange(row,col,count=1,cols=1){return new Range(this,row,col,count,cols);}
 }
 const db={getSheetByName:n=>sheets.get(n)||null,insertSheet:n=>{const s=new Sheet();sheets.set(n,s);return s;}};
 const accounts={student1:['student1','HS A','student','','','ACTIVE'],student2:['student2','HS B','student','','','ACTIVE']};
 let seq=0;
 const context=vm.createContext({
  maDb_:()=>db,maAccountFind_:name=>accounts[name]?{values:accounts[name]}:null,
  Utilities:{getUuid:()=>('uuid-'+(++seq))},
  LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
  Date,Number,String,Array,Error,Map
 });
 vm.runInContext(source,context);
 return {call:(action,p={},identity={username:'teacher1',role:'teacher'})=>JSON.parse(JSON.stringify(context.maRemRoute_(action,p,identity)))};
}
test('teacher assigns; student submits; teacher returns for revision and approves',()=>{
 const {call}=environment(),teacher={username:'teacher1',role:'teacher'},student={username:'student1',role:'student'};
 const task=call('remAssign',{student:'student1',questionId:'Q02',questionType:'tf',wrongParts:'d',prompt:'Giải thích cả bốn ý'},teacher);
 assert.equal(task.ok,true);
 assert.equal(call('remMyTasks',{},student).tasks.length,1);
 assert.equal(call('remMyTasks',{}, {username:'student2',role:'student'}).tasks.length,0);
 assert.equal(call('remSubmit',{taskId:task.taskId,solution:'Em giải thích chi tiết cả bốn ý và kết luận.'},student).revision,1);
 assert.equal(call('remSubmit',{taskId:task.taskId,solution:'Nộp trùng không hợp lệ'},student).ok,false);
 assert.equal(call('remReview',{taskId:task.taskId,decision:'NEEDS_REVISION',feedback:'Cần chứng minh ý d.'},teacher).ok,true);
 assert.equal(call('remSubmit',{taskId:task.taskId,solution:'Lần hai: em bổ sung đạo hàm và xét dấu.'},student).revision,2);
 assert.equal(call('remReview',{taskId:task.taskId,decision:'APPROVED'},teacher).status,'APPROVED');
 assert.equal(call('remMyTasks',{},student).tasks[0].status,'APPROVED');
 assert.equal(call('remHistory',{taskId:task.taskId},student).submissions.length,2);
 assert.equal(call('remSubmit',{taskId:task.taskId,solution:'Lần ba không hợp lệ'},student).ok,false);
});
test('teacher sees only assigned tasks and different student cannot submit',()=>{
 const {call}=environment(),t1={username:'teacher1',role:'teacher'},t2={username:'teacher2',role:'teacher'};
 const task=call('remAssign',{student:'student1',questionId:'Q01',questionType:'mc',prompt:'Giải lại toàn bộ câu'},t1);
 assert.equal(call('remTeacherTasks',{},t2).tasks.length,0);
 assert.equal(call('remTeacherTasks',{},t1).tasks.length,1);
 assert.equal(call('remTeacherTasks',{}, {username:'admin',role:'admin'}).tasks.length,1);
 assert.equal(call('remSubmit',{taskId:task.taskId,solution:'Một lời giải đúng điều kiện đủ dài'}, {username:'student2',role:'student'}).ok,false);
 assert.equal(call('remReview',{taskId:task.taskId,decision:'APPROVED'},t2).ok,false);
 assert.equal(call('remHistory',{taskId:task.taskId},t2).ok,false);
});
test('reject invalid true-false assignments and empty solution',()=>{
 const {call}=environment(),t={username:'teacher1',role:'teacher'};
 assert.equal(call('remAssign',{student:'student1',questionId:'Q02',questionType:'tf',wrongParts:'e',prompt:'abc'},t).ok,false);
 const result=call('remAssign',{student:'student1',questionId:'Q02',questionType:'tf',wrongParts:'a',prompt:'abc'},t);
 assert.equal(call('remSubmit',{taskId:result.taskId,solution:' '},{username:'student1',role:'student'}).ok,false);
 assert.equal(call('remReview',{taskId:result.taskId,decision:'APPROVED'},t).ok,false);
});
