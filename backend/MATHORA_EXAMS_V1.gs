/**
 * MATHORA EXAM V1: authenticated 3-format exams + deterministic scoring.
 * Depends on MATHORA_V23_ACCOUNTS_READY.gs and MATHORA_REMEDIATION_V1.gs.
 * This module does NOT expose answer keys in student API responses.
 * No doGet/doPost overrides. No AI scoring. No image upload.
 */
const MA_EXAM_ACTIONS=['examCreate','examPublish','examList','examGet','examSubmit','examResults'];
const MA_EXAM_HEADERS=['ExamID','Title','QuestionsJSON','Status','CreatedBy','CreatedAt','UpdatedAt'];
const MA_EXAM_ATT_HEADERS=['AttemptID','ExamID','Student','SubmittedAt','AnswersJSON','Score','MaxScore','WrongIDsJSON'];
const MA_EXAM_TF_SCORE=[0,0.1,0.25,0.5,1];
function maExamSheet_(){return maRemSheet_('MATHORA_EXAMS',MA_EXAM_HEADERS);}
function maExamAttempts_(){return maRemSheet_('MATHORA_EXAM_ATTEMPTS',MA_EXAM_ATT_HEADERS);}
function maExamFind_(examId){
  const sh=maExamSheet_(),rows=maRemRows_(sh,MA_EXAM_HEADERS.length,3000);
  const i=rows.findIndex(r=>String(r[0])===examId);
  return i<0?null:{sh,row:i+2,values:rows[i]};
}
function maExamQuestions_(raw){
  const qs=typeof raw==='string'?JSON.parse(raw):raw;
  if(!Array.isArray(qs)||qs.length<1||qs.length>80)throw Error('Đề thi phải có từ 1 đến 80 câu.');
  const ids=new Set();
  const result=qs.map(q=>{
    if(!q||typeof q!=='object'||Array.isArray(q))throw Error('Câu hỏi không hợp lệ.');
    const id=maRemGuardText_(q.id,80,'mã câu',true);
    if(!/^[A-Za-z0-9_-]{1,80}$/.test(id)||ids.has(id))throw Error('Mã câu trùng hoặc không hợp lệ.');
    ids.add(id);
    const kind=maRemGuardText_(q.kind,10,'dạng câu',true);
    const prompt=maRemGuardText_(q.prompt,5000,'đề bài',true);
    const topic=maRemGuardText_(q.topic,150,'chuyên đề',false);
    if(kind==='mc'){
      if(!Array.isArray(q.choices)||q.choices.length!==4)throw Error('Trắc nghiệm phải có bốn lựa chọn.');
      const choices=q.choices.map(v=>maRemGuardText_(v,1000,'phương án',true));
      const correct=String(q.correct||'').toUpperCase();
      if(!'ABCD'.includes(correct)||correct.length!==1)throw Error('Đáp án ABCD không hợp lệ.');
      return {id,kind,prompt,topic,choices,correct};
    }
    if(kind==='tf'){
      if(!Array.isArray(q.statements)||q.statements.length!==4)throw Error('Đúng/Sai cần bốn ý.');
      const statements=q.statements.map(v=>maRemGuardText_(v,1200,'mệnh đề',true));
      const correct=q.correct;
      if(!Array.isArray(correct)||correct.length!==4||correct.some(v=>!['D','S'].includes(v)))
        throw Error('Đáp án Đúng/Sai phải là bốn giá trị D/S.');
      return {id,kind,prompt,topic,statements,correct};
    }
    if(kind==='short'){
      const correct=maRemGuardText_(q.correct,100,'đáp số',true);
      if(!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(correct))throw Error('Đáp số mẫu phải là số hợp lệ.');
      return {id,kind,prompt,topic,correct};
    }
    throw Error('Dạng câu không được hỗ trợ.');
  });
  return result;
}
function maExamPublicQuestions_(qs){
  return qs.map(q=>{
    const {correct,...publicQuestion}=q;
    return publicQuestion;
  });
}
function maExamCreate_(p,identity){
  const teacher=maRemIdentity_(identity,['teacher','admin']);
  const title=maRemGuardText_(p.title,180,'tên đề thi',true);
  const questions=maExamQuestions_(p.questions);
  const serialized=JSON.stringify(questions);
  if(serialized.length>85000)throw Error('Đề thi quá lớn. Hãy chia thành các đề nhỏ.');
  const id=Utilities.getUuid(),now=new Date();
  maExamSheet_().appendRow([id,maRemCell_(title),serialized,'DRAFT',teacher,now,now]);
  return {ok:true,examId:id,status:'DRAFT',questions:questions.length};
}
function maExamPublish_(p,identity){
  maRemIdentity_(identity,['admin']);
  const id=maRemGuardText_(p.examId,100,'mã đề',true);
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const exam=maExamFind_(id);
    if(!exam)throw Error('Không tìm thấy đề.');
    if(String(exam.values[3])!=='DRAFT')throw Error('Đề đã phát hành hoặc không ở trạng thái dự thảo.');
    maExamQuestions_(exam.values[2]); // verify keys exist and format is valid
    exam.sh.getRange(exam.row,4).setValue('ACTIVE');
    exam.sh.getRange(exam.row,7).setValue(new Date());
    return {ok:true,examId:id,status:'ACTIVE'};
  }finally{lock.releaseLock();}
}
function maExamList_(p,identity){
  const username=maRemIdentity_(identity,['student','teacher','admin']);
  const rows=maRemRows_(maExamSheet_(),MA_EXAM_HEADERS.length,3000);
  const visible=rows.filter(r=>identity.role==='student'?r[3]==='ACTIVE':identity.role==='admin'||r[4]===username);
  const attempts=identity.role==='student'?maRemRows_(maExamAttempts_(),MA_EXAM_ATT_HEADERS.length,20000).filter(r=>r[2]===username):[];
  const completed=new Set(attempts.map(r=>r[1]));
  return {ok:true,exams:visible.map(r=>({examId:r[0],title:r[1],status:r[3],questionCount:maExamQuestions_(r[2]).length,submitted:completed.has(r[0])}))};
}
function maExamGet_(p,identity){
  const username=maRemIdentity_(identity,['student','teacher','admin']);
  const id=maRemGuardText_(p.examId,100,'mã đề',true);
  const exam=maExamFind_(id);
  if(!exam)throw Error('Không tìm thấy đề.');
  if(identity.role==='student'&&exam.values[3]!=='ACTIVE')throw Error('Đề chưa được phát hành.');
  if(identity.role==='teacher'&&exam.values[4]!==username)throw Error('Không có quyền xem đề này.');
  return {ok:true,examId:id,title:exam.values[1],status:exam.values[3],
    questions:maExamPublicQuestions_(maExamQuestions_(exam.values[2]))};
}
function maExamNum_(v){
  const s=String(v??'').trim().replace(',','.');
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)?Number(s):null;
}
function maExamGrade_(questions,answers){
  if(!answers||typeof answers!=='object'||Array.isArray(answers))throw Error('Bài thi không hợp lệ.');
  let points=0,max=0;const wrong=[];
  for(const q of questions){
    const a=answers[q.id];
    if(q.kind==='mc'){
      max+=0.25;
      if(!['A','B','C','D'].includes(a))throw Error('Chưa trả lời câu '+q.id);
      if(a===q.correct)points+=0.25;
      else wrong.push({question:q,wrongParts:[]});
    }else if(q.kind==='tf'){
      max+=1;
      if(!Array.isArray(a)||a.length!==4||a.some(v=>!['D','S'].includes(v)))
        throw Error('Chưa trả lời đủ bốn ý câu '+q.id);
      const bad=[];
      for(let i=0;i<4;i++)if(a[i]!==q.correct[i])bad.push(i);
      points+=MA_EXAM_TF_SCORE[4-bad.length];
      if(bad.length)wrong.push({question:q,wrongParts:bad});
    }else if(q.kind==='short'){
      max+=0.5;
      if(a===null||a===undefined||String(a).trim()==='')throw Error('Chưa trả lời câu '+q.id);
      const ans=maExamNum_(a),correct=maExamNum_(q.correct);
      if(ans!==null&&Number.isFinite(ans)&&Math.abs(ans-correct)<=1e-9)points+=0.5;
      else wrong.push({question:q,wrongParts:[]});
    }
  }
  return {score:Number(points.toFixed(10)),maxScore:Number(max.toFixed(10)),wrong};
}
function maExamSubmit_(p,identity){
  const student=maRemIdentity_(identity,['student']);
  const id=maRemGuardText_(p.examId,100,'mã đề',true);
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const exam=maExamFind_(id);
    if(!exam||exam.values[3]!=='ACTIVE')throw Error('Đề chưa mở hoặc không tồn tại.');
    const attempts=maRemRows_(maExamAttempts_(),MA_EXAM_ATT_HEADERS.length,20000);
    if(attempts.some(r=>r[1]===id&&r[2]===student))throw Error('Học sinh đã nộp đề này. Điểm lần đầu được giữ nguyên.');
    const questions=maExamQuestions_(exam.values[2]);
    const grade=maExamGrade_(questions,p.answers);
    const tasks=maRemTasks_(),existing=maRemRows_(tasks,MA_REMED_TASK_HEADERS.length,20000);
    const wrongIds=grade.wrong.map(w=>w.question.id);
    const now=new Date();
    // Persist original grade first; never revise it when handling remediation.
    maExamAttempts_().appendRow([Utilities.getUuid(),id,student,now,
      maRemCell_(JSON.stringify(p.answers)),grade.score,grade.maxScore,JSON.stringify(wrongIds)]);
    // Generate one task for every wrong QUESTION (not per wrong TF statement).
    for(const item of grade.wrong){
      const q=item.question;
      const questionId=id+':'+q.id;
      if(existing.some(row=>row[1]===student&&row[2]===questionId))continue;
      const parts=q.kind==='tf'?item.wrongParts.map(i=>'abcd'[i]).join(','):'';
      tasks.appendRow([Utilities.getUuid(),student,maRemCell_(questionId),q.kind,
        maRemCell_(q.prompt+(q.kind==='tf'?'\n'+q.statements.map((s,i)=>'abcd'[i]+') '+s).join('\n'):'')),
        parts,now,exam.values[4],'OPEN',now,0,'']);
    }
    return {ok:true,examId:id,score:grade.score,maxScore:grade.maxScore,
      wrongQuestionIds:wrongIds,remediationCount:wrongIds.length};
  }finally{lock.releaseLock();}
}
function maExamResults_(p,identity){
  const username=maRemIdentity_(identity,['student','teacher','admin']);
  const id=maRemGuardText_(p.examId,100,'mã đề',true);
  const exam=maExamFind_(id);
  if(!exam)throw Error('Không tìm thấy đề.');
  if(identity.role==='teacher'&&exam.values[4]!==username)throw Error('Không có quyền xem kết quả.');
  const attempts=maRemRows_(maExamAttempts_(),MA_EXAM_ATT_HEADERS.length,20000)
    .filter(row=>row[1]===id&&(identity.role!=='student'||row[2]===username));
  return {ok:true,results:attempts.map(r=>({
    attemptId:r[0],examId:id,student:r[2],submittedAt:r[3],score:r[5],maxScore:r[6],
    wrongQuestionIds:JSON.parse(r[7]||'[]')
  }))};
}
function maExamRoute_(action,p,identity){
  try{
    switch(action){
      case 'examCreate':return maExamCreate_(p,identity);
      case 'examPublish':return maExamPublish_(p,identity);
      case 'examList':return maExamList_(p,identity);
      case 'examGet':return maExamGet_(p,identity);
      case 'examSubmit':return maExamSubmit_(p,identity);
      case 'examResults':return maExamResults_(p,identity);
      default:return {ok:false,error:'Action đề thi không được hỗ trợ.'};
    }
  }catch(err){return {ok:false,error:String(err&&err.message||err).slice(0,240)};}
}
