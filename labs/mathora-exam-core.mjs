// MATHORA EXAM: pure demo scoring helpers; NOT official HSG exam rules.
export const demoQuestions = Object.freeze([
  {id:"Q01",kind:"mc",topic:"Mũ và lôgarit",prompt:String.raw\`Giải phương trình \log_2(x-1)=3.\`,
    choices:["x=7","x=8","x=9","x=10"],correct:"C",
    hint:"Đừng quên điều kiện x>1. Dựa vào định nghĩa lôgarit để tìm x."},
  {id:"Q02",kind:"tf",topic:"Đạo hàm và cực trị",
    prompt:String.raw\`Cho f(x)=x^3-3x. Xét tính đúng, sai của các mệnh đề sau.\`,
    statements:[
      String.raw\`f'(x)=3x^2-3\`,
      String.raw\`f \text{ đạt cực đại tại } x=1\`,
      String.raw\`f(-1)=2\`,
      String.raw\`f \text{ đồng biến trên } (1;+\infty)\`
    ],correct:["D","S","D","D"],
    hints:["Em hãy tính đạo hàm rồi so sánh.","Hãy xét dấu f' khi x đi qua 1.","Tính f(-1) trực tiếp.","Xét dấu f' trên (1; +∞)."]},
  {id:"Q03",kind:"short",topic:"Nguyên hàm – Tích phân",
    prompt:String.raw\`I=\int_0^1 6x(1+x^2)^2\,dx.\ \text{Tính } I.\`,
    correct:"7",hint:"Nhận diện vi phân của 1+x² và áp dụng đổi biến."}
]);
export function normalizeNumber(value) {
  const str=String(value??"").trim().replace(",",".");
  if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(str)) return null;
  const n=Number(str);
  return Number.isFinite(n)?n:null;
}
export function evaluateAttempt(answers,questions=demoQuestions){
  let earned=0,total=0;const mistakes=[];
  for(const q of questions){
    if(q.kind==="mc"){
      total++;const correct=String(answers[q.id]??"").toUpperCase()===q.correct;
      if(correct) earned++;else mistakes.push({id:q.id,topic:q.topic,part:null,hint:q.hint});
    }else if(q.kind==="tf"){
      for(let i=0;i<q.correct.length;i++){
        total++;const correct=String(answers[q.id]?.[i]??"").toUpperCase()===q.correct[i];
        if(correct)earned++;else mistakes.push({id:q.id,topic:q.topic,part:i,hint:q.hints[i]});
      }
    }else if(q.kind==="short"){
      total++;const given=normalizeNumber(answers[q.id]),expected=normalizeNumber(q.correct);
      const correct=given!==null&&expected!==null&&Math.abs(given-expected)<=1e-9;
      if(correct)earned++;else mistakes.push({id:q.id,topic:q.topic,part:null,hint:q.hint});
    }else throw new Error("Unknown question kind: "+q.kind);
  }
  return {earned,total,mistakes,correctCount:total-mistakes.length};
}
export function isComplete(answers,questions=demoQuestions){
  return questions.every(q=>q.kind==="tf"
     ?q.correct.every((_,i)=>["D","S"].includes(answers[q.id]?.[i]))
     :q.kind==="mc"
       ?["A","B","C","D"].includes(String(answers[q.id]??"").toUpperCase())
       :String(answers[q.id]??"").trim()!=="");
}
