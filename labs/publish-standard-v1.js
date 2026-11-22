/* MATHORA Publish Standard V1 · formatted academic reading + safe copy
 * Never approves or stores results; Word Equation remains explicitly unavailable.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const text=(tag,content,cls)=>{const e=document.createElement(tag);if(content!=null)e.textContent=String(content);if(cls)e.className=cls;return e;};
let current=null,mathLoading=null;
function copy(value){
 if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(value);
 const e=text('textarea');e.value=value;e.style.position='fixed';e.style.opacity='0';
 document.body.append(e);e.select();const ok=document.execCommand('copy');e.remove();
 if(!ok)throw Error('Trình duyệt không cho phép sao chép.');return Promise.resolve();
}
function status(msg){const e=$('maPublishStatus');if(e)e.textContent=msg;}
function latexDocument(p){
 const lines=[
 '\\documentclass[12pt,a4paper]{article}',
 '\\usepackage[utf8]{inputenc}',
 '\\usepackage[T5]{fontenc}',
 '\\usepackage[vietnamese]{babel}',
 '\\usepackage{amsmath,amssymb,amsthm,geometry}',
 '\\geometry{margin=2.3cm}',
 '\\begin{document}',
 '\\begin{center}\\Large\\bfseries MATHORA OLYMPIAD\\\\[4pt]\\normalsize BẢN NGHIÊN CỨU – CHƯA DUYỆT\\end{center}',
 '\\section*{Đề bài}',p.statement_latex||'',
 '\\section*{Điều kiện}',p.conditions_latex||'Không có điều kiện bổ sung.',
 '\\section*{Lời giải}',p.solution_latex||'',
 '\\section*{Lời giải ngắn}',p.short_solution_latex||p.fast_solution_latex||'Chưa có.',
 '\\section*{Đáp án}',p.answer_latex||p.short_answer||'Chưa có.',
 '\\end{document}'
 ];return lines.join('\n\n');
}
function exportTex(p){
 const blob=new Blob([latexDocument(p)],{type:'application/x-tex;charset=utf-8'});
 const a=text('a');a.href=URL.createObjectURL(blob);a.download='MATHORA_BAN_NHAP.tex';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
function formatRaw(value){
 // TeX is interpreted only by MathJax; never insert AI HTML.
 return String(value||'').trim().replace(/\r\n?/g,'\n');
}
function addBlock(parent,name,raw){
 if(!raw)return;const section=text('section',null,'ma-publish-section');
 section.append(text('h4',name));const body=text('div',formatRaw(raw),'ma-publish-math');
 body.style.whiteSpace='pre-wrap';section.append(body);parent.append(section);
}
function button(label,fn,disabled){
 const b=text('button',label,'btn secondary small');b.type='button';b.disabled=!!disabled;b.addEventListener('click',fn);return b;
}
function mathJax(){
 if(window.MathJax?.typesetPromise)return Promise.resolve(window.MathJax);
 if(mathLoading)return mathLoading;
 window.MathJax={
  tex:{inlineMath:[['\\(','\\)'],['$','$']],displayMath:[['\\[','\\]'],['$$','$$']],processEscapes:true},
  options:{skipHtmlTags:['script','noscript','style','textarea','pre','code']},
  startup:{typeset:false}
 };
 mathLoading=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
  script.async=true;script.referrerPolicy='no-referrer';
  script.onload=()=>window.MathJax?.typesetPromise?resolve(window.MathJax):reject(Error('MathJax chưa khởi tạo.'));
  script.onerror=()=>reject(Error('Không tải được thư viện hiển thị công thức. Kiểm tra kết nối Internet.'));
  document.head.append(script);
 }).catch(err=>{mathLoading=null;throw err;});
 return mathLoading;
}
function verifySchema(p){
 const errors=[];
 for(const key of ['statement_latex','solution_latex']){
  if(typeof p[key]!=='string'||!p[key].trim())errors.push('Thiếu '+key);
 }
 if(p.needs_figure===true&&!String(p.figure_prompt||'').trim())errors.push('Thiếu prompt hình vẽ.');
 return errors;
}
function show(payload){
 const host=$('maPublishHost');if(!host)return;
 const p=payload?.result||payload;
 if(!p||typeof p!=='object')return;
 current=p;host.replaceChildren();
 const head=text('div',null,'ma-publish-head');head.append(text('h3','Bản đọc đẹp · Công thức Toán'));
 head.append(text('span','BẢN NHÁP · CHƯA DUYỆT','pill gold'));host.append(head);
 const toolbar=text('div',null,'row ma-publish-toolbar');
 const copyAction=(label,value)=>toolbar.append(button(label,async()=>{
  try{await copy(value);status('Đã sao chép: '+label+'.');}
  catch(e){status('Chưa sao chép được: '+String(e.message||e));}
 }));
 if(p.statement_latex)copyAction('Copy đề',p.statement_latex);
 if(p.solution_latex)copyAction('Copy lời giải',p.solution_latex);
 copyAction('Copy toàn bộ',[p.statement_latex,p.solution_latex,p.short_solution_latex||p.fast_solution_latex,p.answer_latex].filter(Boolean).join('\n\n'));
 copyAction('Copy LaTeX',latexDocument(p));
 if(p.figure_prompt||p.needs_figure)copyAction('Copy prompt hình',p.figure_prompt||'AI chưa cung cấp prompt. Yêu cầu giáo viên bổ sung và kiểm định giả thiết.');
 const schemaErrors=verifySchema(p);
 if(Array.isArray(payload?.blockers)&&payload.blockers.length)schemaErrors.push('AI báo '+payload.blockers.length+' vấn đề cần sửa.');
 toolbar.append(button('Tải LaTeX (.tex)',()=>{exportTex(p);status('Đã tạo file LaTeX nguồn; chưa xác nhận biên dịch.');},!!schemaErrors.length));
 const word=button('Word Equation · Chưa hỗ trợ',()=>{},true);word.title='Không xuất Word chứa công thức thô. Chỉ mở khi có bộ chuyển TeX→OMML được kiểm thử.';toolbar.append(word);
 host.append(toolbar);
 const statusLine=text('p','Đang hiển thị nguồn LaTeX; nếu MathJax tải được, công thức sẽ được định dạng.','tiny muted');
 statusLine.id='maPublishStatus';statusLine.setAttribute('role','status');host.append(statusLine);
 const body=text('div',null,'ma-publish-paper');host.append(body);
 addBlock(body,'Đề bài',p.statement_latex);
 addBlock(body,'Điều kiện',p.conditions_latex);
 addBlock(body,'Lời giải chi tiết',p.solution_latex);
 addBlock(body,'Lời giải ngắn',p.short_solution_latex||p.fast_solution_latex);
 addBlock(body,'Đáp án',p.answer_latex||p.short_answer);
 if(p.figure_prompt)addBlock(body,'Prompt hình vẽ · cần giáo viên kiểm tra',p.figure_prompt);
 if(schemaErrors.length)host.append(text('p','Chưa đủ đầu ra: '+schemaErrors.join('; '),'notice'));
 host.append(text('p','Lưu ý: Hình thức hiển thị không chứng minh lời giải đúng; chưa kiểm định toán học và chưa duyệt xuất bản.','tiny muted'));
 const active=host;
 mathJax().then(math=>{
  if(active!==$('maPublishHost')||current!==p)return;
  return math.typesetPromise([body]).then(()=>status('Đã định dạng công thức bằng MathJax. Chưa xác nhận biên dịch .tex hoặc Word Equation.'));
 }).catch(err=>status('Chưa hiển thị được công thức đẹp: '+String(err.message||err)+'. Vẫn có thể sao chép LaTeX nguồn.'));
}
document.addEventListener('mathora:creative-result',event=>show(event.detail));
})();