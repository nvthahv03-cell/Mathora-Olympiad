/**
 * MATHORA - Sua sai bang tu luan V1
 * Sidecar module for existing Apps Script project. Requires:
 * maDb_() / maAccountSession_() from MATHORA_V23_ACCOUNTS_READY.gs.
 * No doGet/doPost here. Teacher issues assignment after trusted grading.
 * No image/AI uploads in this phase; text submissions only.
 */
const MA_REMEDIATION_ACTIONS=['remAssign','remMyTasks','remSubmit','remTeacherTasks','remReview','remHistory'];
const MA_REMED_TASK_HEADERS=['TaskID','Student','QuestionID','QuestionType','Prompt','WrongParts','AssignedAt','AssignedBy','Status','UpdatedAt','RevisionCount','Feedback'];
const MA_REMED_SUB_HEADERS=['SubmissionID','TaskID','Student','Revision','SubmittedAt','Solution','State'];
function maRemGuardText_(raw,max,label,required){
  const val=String(raw===undefined||raw===null?'':raw).trim();
  if(required&&!val)throw Error('Thiếu '+label);
  if(val.length>max)throw Error(label+' vượt giới hạn '+max+' ký tự.');
  return val;
}
function maRemCell_(str){const v=String(str??'');return /^[=+\-@\t\r]/.test(v)?("'"+v):v;}
function maRemSheet_(name,headers){
  const db=maDb_();let sheet=db.getSheetByName(name);
  if(!sheet){sheet=db.insertSheet(name);}
  if(sheet.getLastRow()===0){sheet.appendRow(headers);sheet.setFrozenRows(1);}
  if(sheet.getLastColumn()<headers.length)throw Error('Cấu trúc sheet không hợp lệ.');
  const found=sheet.getRange(1,1,1,headers.length).getValues()[0];
  if(headers.some((v,i)=>found[i]!==v))throw Error('Tiêu đề sheet '+name+' không khớp phiên bản.');
  return sheet;
}
function maRemTasks_(){return maRemSheet_('MATHORA_REMED_TASKS',MA_REMED_TASK_HEADERS);}
function maRemSubs_(){return maRemSheet_('MATHORA_REMED_SUBMISSIONS',MA_REMED_SUB_HEADERS);}
function maRemRows_(sheet,cols,maxRows){
  const n=sheet.getLastRow()-1;
  if(n>maxRows)throw Error('Số hồ sơ quá lớn. Cần phân trang trước khi vận hành.');
  return n?sheet.getRange(2,1,n,cols).getValues():[];
}
function maRemIdentity_(identity,roles){
  if(!identity||!roles.includes(String(identity.role||'')))throw Error('Phiên đăng nhập không đủ quyền.');
  return String(identity.username||'').toLowerCase();
}
function maRemTask_(id){
  const sheet=maRemTasks_(),records=maRemRows_(sheet,MA_REMED_TASK_HEADERS.length,20000);
  const i=records.findIndex(row=>String(row[0])===id);
  return i<0?null:{sheet,row:i+2,values:records[i]};
}
function maRemAssign_(p,identity){
  const teacher=maRemIdentity_(identity,['teacher','admin']);
  const student=maRemGuardText_(p.student,100,'tài khoản học sinh',true).toLowerCase();
  if(!/^[a-z0-9._-]{2,100}$/.test(student))throw Error('Tên tài khoản học sinh không hợp lệ.');
  const account=maAccountFind_(student);
  if(!account||String(account.values[2])!=='student'||String(account.values[5])!=='ACTIVE')
    throw Error('Chưa có tài khoản học sinh đang hoạt động.');
  const questionId=maRemGuardText_(p.questionId,100,'mã câu',true);
  const questionType=maRemGuardText_(p.questionType,10,'loại câu',true);
  if(!['mc','tf','short'].includes(questionType))throw Error('Loại câu không hỗ trợ.');
  const prompt=maRemGuardText_(p.prompt,8000,'nội dung câu hỏi',true);
  const parts=questionType==='tf'?maRemGuardText_(p.wrongParts,15,'các ý sai',true):'';
  if(questionType==='tf'&&!/^[abcd](,[abcd]){0,3}$/.test(parts))throw Error('Danh sách ý sai không hợp lệ.');
  const now=new Date(),id=Utilities.getUuid();
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    maRemTasks_().appendRow([id,maRemCell_(student),maRemCell_(questionId),questionType,
      maRemCell_(prompt),parts,now,teacher,'OPEN',now,0,'']);
  }finally{lock.releaseLock();}
  return {ok:true,taskId:id,status:'OPEN'};
}
function maRemMyTasks_(p,identity){
  const student=maRemIdentity_(identity,['student']);
  const rows=maRemRows_(maRemTasks_(),MA_REMED_TASK_HEADERS.length,20000)
    .filter(row=>String(row[1]).toLowerCase()===student);
  return {ok:true,tasks:rows.map(row=>({
    taskId:row[0],questionId:row[2],kind:row[3],prompt:row[4],wrongParts:row[5],
    assignedAt:row[6],status:row[8],updatedAt:row[9],revisionCount:row[10],feedback:row[11]
  }))};
}
function maRemSubmit_(p,identity){
  const student=maRemIdentity_(identity,['student']);
  const id=maRemGuardText_(p.taskId,100,'mã yêu cầu',true);
  const solution=maRemGuardText_(p.solution,16000,'lời giải',true);
  if(solution.length<10)throw Error('Bài giải tự luận cần ít nhất 10 ký tự.');
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const task=maRemTask_(id);
    if(!task||String(task.values[1]).toLowerCase()!==student)throw Error('Không tìm thấy yêu cầu sửa sai của học sinh.');
    const status=String(task.values[8]);
    if(!['OPEN','NEEDS_REVISION'].includes(status))
      throw Error('Bài đã nộp hoặc đã duyệt; không được ghi đè.');
    const revision=Number(task.values[10]||0)+1;
    maRemSubs_().appendRow([Utilities.getUuid(),id,student,revision,new Date(),maRemCell_(solution),'SUBMITTED']);
    task.sheet.getRange(task.row,9,1,3).setValues([['SUBMITTED',new Date(),revision]]);
    return {ok:true,taskId:id,revision,status:'SUBMITTED'};
  }finally{lock.releaseLock();}
}
function maRemTeacherTasks_(p,identity){
  const teacher=maRemIdentity_(identity,['teacher','admin']);
  const student=maRemGuardText_(p.student,100,'tài khoản học sinh',false).toLowerCase();
  const rows=maRemRows_(maRemTasks_(),MA_REMED_TASK_HEADERS.length,20000)
    .filter(row=>(!student||String(row[1]).toLowerCase()===student)&&
      (identity.role==='admin'||String(row[7])===teacher));
  return {ok:true,tasks:rows.map(row=>({
    taskId:row[0],student:row[1],questionId:row[2],kind:row[3],
    status:row[8],updatedAt:row[9],revisionCount:row[10],feedback:row[11]
  }))};
}
function maRemReview_(p,identity){
  const teacher=maRemIdentity_(identity,['teacher','admin']);
  const id=maRemGuardText_(p.taskId,100,'mã yêu cầu',true);
  const decision=maRemGuardText_(p.decision,30,'kết luận',true);
  if(!['APPROVED','NEEDS_REVISION'].includes(decision))throw Error('Kết luận không hợp lệ.');
  const feedback=maRemGuardText_(p.feedback,3000,'nhận xét',decision==='NEEDS_REVISION');
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const task=maRemTask_(id);
    if(!task)throw Error('Không tìm thấy yêu cầu.');
    if(String(task.values[8])!=='SUBMITTED')throw Error('Chỉ được duyệt khi đã nộp lời giải.');
    // Teachers may only review tasks they assigned; admin can review any.
    if(identity.role!=='admin'&&String(task.values[7])!==teacher)throw Error('Giáo viên không phụ trách yêu cầu này.');
    task.sheet.getRange(task.row,9).setValue(decision);
    task.sheet.getRange(task.row,10).setValue(new Date());
    task.sheet.getRange(task.row,12).setValue(maRemCell_(feedback));
    return {ok:true,taskId:id,status:decision};
  }finally{lock.releaseLock();}
}
function maRemHistory_(p,identity){
  const username=maRemIdentity_(identity,['student','teacher','admin']);
  const id=maRemGuardText_(p.taskId,100,'mã yêu cầu',true);
  const task=maRemTask_(id);
  if(!task)throw Error('Không tìm thấy yêu cầu.');
  if(identity.role==='student'&&String(task.values[1]).toLowerCase()!==username)
    throw Error('Không có quyền xem bài làm.');
  if(identity.role==='teacher'&&String(task.values[7])!==username)
    throw Error('Không có quyền xem bài làm.');
  const rows=maRemRows_(maRemSubs_(),MA_REMED_SUB_HEADERS.length,50000)
    .filter(row=>String(row[1])===id);
  return {ok:true,taskId:id,submissions:rows.map(row=>({
    revision:row[3],submittedAt:row[4],solution:row[5],status:row[6]
  }))};
}
function maRemRoute_(action,p,identity){
  try{
    switch(action){
      case 'remAssign':return maRemAssign_(p,identity);
      case 'remMyTasks':return maRemMyTasks_(p,identity);
      case 'remSubmit':return maRemSubmit_(p,identity);
      case 'remTeacherTasks':return maRemTeacherTasks_(p,identity);
      case 'remReview':return maRemReview_(p,identity);
      case 'remHistory':return maRemHistory_(p,identity);
      default:return {ok:false,error:'Action sửa sai không được hỗ trợ.'};
    }
  }catch(e){return {ok:false,error:String(e&&e.message||e).slice(0,240)};}
}
