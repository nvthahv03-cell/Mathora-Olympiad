// MATHORA EXAM: sample questions; grading weights supplied by teacher.
// The sample question set is not an official exam blueprint.
export const demoQuestions = Object.freeze([
  {id:"Q01",kind:"mc",topic:"Mũ và lôgarit",prompt:String.raw`Giải phương trình \log_2(x-1)=3.`,
    choices:["x=7","x=8","x=9","x=10"],correct:"C",
    hint:"Đừng quên điều kiện x>1. Dựa vào định nghĩa lôgarit để tìm x."},
  {id:"Q02",kind:"tf",topic:"Đạo hàm và cực trị",
    prompt:String.raw`Cho f(x)=x^3-3x. Xét tính đúng, sai của các mệnh đề sau.`,
    statements:[
      String.raw`f'(x)=3x^2-3`,
      String.raw`f \text{ đạt cực đại tại } x=1`,
      String.raw`f(-1)=2`,
      String.raw`f \text{ đồng biến trên } (1;+\infty)`
    ],correct:["D","S","D","D"],
    hints:["Em hãy tính đạo hàm rồi so sánh.","Hãy xét dấu f' khi x đi qua 1.","Tính f(-1) trực tiếp.","Xét dấu f' trên (1; +∞)."]},
  {id:"Q03",kind:"short",topic:"Nguyên hàm – Tích phân",
    prompt:String.raw`I=\int_0^1 6x(1+x^2)^2\,dx.\ \text{Tính } I.`,
    correct:"7",hint:"Nhận diện vi phân của 1+x² và áp dụng đổi biến."}
]);
export function normalizeNumber(value) {
  const str=String(value??"").trim().replace(",",".");
  if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(str)) return null;
  const n=Number(str);
  return Number.isFinite(n)?n:null;
}
export const MULTIPLE_CHOICE_POINTS=0.25;
export const SHORT_ANSWER_POINTS=0.5;
export const TRUE_FALSE_POINTS=Object.freeze([0,0.1,0.25,0.5,1]);
export function scoreTrueFalse(correctStatements,studentStatements){
  if(!Array.isArray(correctStatements)||correctStatements.length!==4)throw new Error("True/false question must have four statements");
  let correctCount=0;
  for(let i=0;i<4;i++){
    const selected=String(studentStatements?.[i]??"").toUpperCase();
    if(["D","S"].includes(selected)&&selected===String(correctStatements[i]).toUpperCase())correctCount++;
  }
  return {correctCount,points:TRUE_FALSE_POINTS[correctCount]};
}
export function evaluateAttempt(answers,questions=demoQuestions){
  let earned=0,total=0;const mistakes=[];
  for(const q of questions){
    if(q.kind==="mc"){
      total+=MULTIPLE_CHOICE_POINTS;const correct=String(answers[q.id]??"").toUpperCase()===q.correct;
      if(correct) earned+=MULTIPLE_CHOICE_POINTS;else mistakes.push({id:q.id,topic:q.topic,part:null,hint:q.hint});
    }else if(q.kind==="tf"){
      const tfResult=scoreTrueFalse(q.correct,answers[q.id]);
      total+=1;
      earned+=tfResult.points;
      for(let i=0;i<q.correct.length;i++){
        const correct=String(answers[q.id]?.[i]??"").toUpperCase()===q.correct[i];
        if(!correct)mistakes.push({id:q.id,topic:q.topic,part:i,hint:q.hints?.[i]??q.hint??"Xem lại kiến thức liên quan."});
      }
    }else if(q.kind==="short"){
      total+=SHORT_ANSWER_POINTS;const given=normalizeNumber(answers[q.id]),expected=normalizeNumber(q.correct);
      const correct=given!==null&&expected!==null&&Math.abs(given-expected)<=1e-9;
      if(correct)earned+=SHORT_ANSWER_POINTS;else mistakes.push({id:q.id,topic:q.topic,part:null,hint:q.hint});
    }else throw new Error("Unknown question kind: "+q.kind);
  }
  return {earned:Number(earned.toFixed(10)),total:Number(total.toFixed(10)),mistakes,fullyCorrectQuestions:questions.filter(q=>!mistakes.some(m=>m.id===q.id)).length};
}
// One remediation assignment per wrong question, not per wrong true/false statement.
export function buildRemediationAssignments(result,questions=demoQuestions){
  const byId=new Map(questions.map(q=>[q.id,q]));
  const grouped=new Map();
  for(const mistake of result.mistakes){
    if(!grouped.has(mistake.id)){
      const question=byId.get(mistake.id);
      if(!question)throw new Error("Missing question for remediation: "+mistake.id);
      grouped.set(mistake.id,{id:mistake.id,kind:question.kind,topic:question.topic,question,
        wrongParts:[],hint:question.kind==="tf"?"Giải thích bằng tự luận cả bốn ý a), b), c), d).":mistake.hint});
    }
    if(mistake.part!==null)grouped.get(mistake.id).wrongParts.push(mistake.part);
  }
  return [...grouped.values()];
}
export function isComplete(answers,questions=demoQuestions){
  return questions.every(q=>q.kind==="tf"
     ?q.correct.every((_,i)=>["D","S"].includes(answers[q.id]?.[i]))
     :q.kind==="mc"
       ?["A","B","C","D"].includes(String(answers[q.id]??"").toUpperCase())
       :String(answers[q.id]??"").trim()!=="");
}
