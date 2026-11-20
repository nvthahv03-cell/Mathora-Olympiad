/* MATHORA · Olympiad Creative Pro: isolated UI, existing session bridge */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const T=(tag,value)=>{const e=document.createElement(tag);if(value!==undefined)e.textContent=String(value);return e;};
let output=null,lastInput=null,figureRequested=false,independentResult=null,independentBusy=false;const reviewResults={};
const html='<section class="panel" id="maOlympiadPro"><div class="row between"><h2>Sáng tạo đề HSG chuyên sâu</h2><span class="pill gold">NGHIÊN CỨU</span></div><p class="tiny muted">Tạo bài toán có nút thắt thực chất, lời giải độc lập và bản LaTeX. Giáo viên duyệt trước khi sử dụng.</p><div class="grid two"><div class="field"><label for="maProTopic">Chuyên đề</label><input id="maProTopic" maxlength="160" placeholder="Ví dụ: Mũ – lôgarit và cực trị"></div><div class="field"><label for="maProLevel">Độ khó</label><select id="maProLevel"><option>Nâng cao HSG thành phố</option><option selected>Rất khó HSG thành phố</option><option>Thử thách chuyên sâu</option></select></div></div><div class="grid two"><div class="field"><label for="maProFormat">Dạng câu hỏi</label><select id="maProFormat"><option>Tự luận có chứng minh</option><option>Trả lời ngắn (tối đa 4 ký tự)</option><option>Trắc nghiệm nhiều lựa chọn</option><option>Đúng / Sai có lập luận</option></select></div><div class="field"><label for="maProFocus">Định hướng nâng độ khó</label><select id="maProFocus"><option>Nâng chiều sâu lập luận</option><option>Phân tích tham số và trường hợp biên</option><option>Đảo điều kiện và xây phản ví dụ</option><option>Liên kết nhiều cấu trúc trong CT2018</option></select></div></div><div class="field" style="margin:12px 0"><label for="maProInput">Đề gốc / yêu cầu sáng tạo / phạm vi được học</label><textarea id="maProInput" rows="4" maxlength="1800" placeholder="Nêu cấu trúc muốn khai thác, điều kiện, giới hạn kiến thức, dạng đáp án..."></textarea></div><label class="ma-pro-check"><input type="checkbox" id="maProNeedFigure"> Yêu cầu bài toán có hình vẽ / mô hình thực tế</label><div class="row"><button class="btn" id="maProRun" type="button">Tạo bài toán chuyên sâu</button><button class="btn secondary" id="maProCopyPrompt" type="button">Sao chép yêu cầu AI</button></div><p class="tiny muted" role="status" id="maProStatus">Đầu ra chưa được kiểm định hoặc phê duyệt.</p><div id="maProResult"></div></section>';
const policy=[
'ĐÓNG VAI: Hội đồng sáng tạo và phản biện đề HSG Toán 12. Chỉ tạo một bài toán có chiều sâu, không chỉ đổi số, không vượt yêu cầu cần đạt CTGDPT 2018.',
'BẮT BUỘC: mô tả nút thắt cấu trúc, không thay số hoặc kéo dài phép tính rồi gán khó. Trước khi trả đề: tự tìm lời giải ngắn để kiểm tra mức khó ảo; chứng minh mọi biến đổi và điều kiện tương đương, xét tham số và biên. Nêu rõ điểm chưa chứng minh, phản ví dụ nếu có. Nhận định Casio giải tắt được đến đâu; chưa xác nhận tính mới khi không có nguồn gốc để đối chiếu. Không dùng kiến thức vượt CT2018 như một yêu cầu bắt buộc.',
'Đầu ra CHỈ một JSON, không markdown: {"status":"READY_FOR_HUMAN_REVIEW hoặc NEEDS_REVIEW","blockers":[],"result":{"title":"...","statement_latex":"...","solution_latex":"...","short_solution_latex":"...","answer_latex":"...","difficulty_rationale":"...","novelty_rationale":"...","casio_assessment":"...","curriculum_evidence":"...","needs_figure":false,"figure_prompt":"...","tikz_code":""}}.',
'Các trường *_latex phải là LaTeX chuẩn, dùng \\( ... \\) hoặc \\[ ... \\] cho công thức; không dùng ký hiệu ASCII thay toán. Nếu hình vẽ cần thiết: needs_figure=true, figure_prompt mô tả nhãn, quan hệ, kích thước, góc nhìn chính xác; không tự bịa giả thiết. Nếu thiếu chứng minh hoặc dữ liệu, ghi blockers; không tự duyệt, không ghi Kho.'
].join('\n');
function prompt(){const topic=$('maProTopic').value.trim(),desc=$('maProInput').value.trim();if(!topic||!desc)throw Error('Cần nhập chuyên đề và yêu cầu sáng tạo.');return policy+'\nCHUYÊN ĐỀ: '+topic+'\nMỨC KHÓ: '+$('maProLevel').value+'\nDẠNG CÂU HỎI: '+$('maProFormat').value+'\nCHIỀU SÂU CẦN KHAI THÁC: '+$('maProFocus').value+'\nDỮ KIỆN / YÊU CẦU: '+desc+'\nBẮT BUỘC CÓ HÌNH: '+($('maProNeedFigure').checked?'CÓ; phải có figure_prompt đủ dữ kiện':'chỉ khi cần thiết');}
function say(s){$('maProStatus').textContent=s;}
async function copy(s){if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(s);return;}const t=T('textarea');t.value=s;document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();if(!ok)throw Error('Sao chép không thành công.');}
function source(p){return p?.result||p?.draft?.result||p;}
function valid(p){return ['statement_latex','solution_latex'].every(k=>{
 const v=p?.[k];if(typeof v!=='string'||v.trim().length<=10||v.includes('```'))return false;
 let depth=0;for(const ch of v){if(ch==='{')depth++;if(ch==='}')depth--;if(depth<0)return false;}
 const count=t=>v.split(t).length-1;
 return depth===0&&count('\\(')===count('\\)')&&count('\\[')===count('\\]');
});}
function tex(p){return ['\\documentclass[12pt,a4paper]{article}','\\usepackage[T5]{fontenc}','\\usepackage[utf8]{inputenc}','\\usepackage[vietnamese]{babel}','\\usepackage{amsmath,amssymb,geometry}','\\geometry{margin=2.2cm}','\\begin{document}','\\begin{center}\\Large MATHORA OLYMPIAD\\\\ Nghiên cứu – chưa duyệt\\end{center}','\\section*{Đề bài}',p.statement_latex,'\\section*{Lời giải}',p.solution_latex,'\\section*{Lời giải ngắn}',p.short_solution_latex||'Chưa có.','\\section*{Đáp án}',p.answer_latex||'Chưa có.','\\end{document}'].join('\n\n');}
function download(content){const b=new Blob([content],{type:'text/plain;charset=utf-8'}),a=T('a');a.href=URL.createObjectURL(b);a.download='MATHORA_HSG_BAN_NHAP.tex';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
function figure(p){return ['VẼ HÌNH TOÁN HỌC CHUẨN MATHORA','ĐỀ BÀI:',p.statement_latex||'','GỢI Ý DỰNG HÌNH (CHƯA KIỂM ĐỊNH):',p.figure_prompt||'Chưa có.','YÊU CẦU: Hình rõ nét, đúng quan hệ, vị trí và nhãn; không tự bổ sung dữ kiện, số đo, dấu góc vuông hay tỷ lệ. Hình không gian cần nét khuất/nét thấy; thực tế cần đơn vị. Nếu thiếu dữ kiện phải chỉ rõ. Xuất SVG/TikZ nếu làm được. Giáo viên kiểm tra hình trước khi dùng.'].join('\n\n');}
function render(payload){output=payload;independentResult=null;for(const k of Object.keys(reviewResults))delete reviewResults[k];const p=source(payload),host=$('maProResult');host.replaceChildren();const state=payload?.status||'CHƯA ĐÁNH GIÁ';const warnings=payload?.blockers||[];host.append(T('h3','Bản nháp AI · '+state));if(warnings.length)host.append(T('p','Cần kiểm tra: '+warnings.join('; ')));
for(const [label,key] of [['Đề bài (LaTeX)','statement_latex'],['Lời giải (LaTeX)','solution_latex'],['Lời giải nhanh','short_solution_latex'],['Đánh giá độ khó','difficulty_rationale'],['Tính mới','novelty_rationale'],['Casio','casio_assessment'],['CTGDPT 2018','curriculum_evidence']]){if(typeof p[key]!=='string'||!p[key])continue;const box=T('div');box.className='ma-pro-field';box.append(T('strong',label),T('pre',p[key]));host.append(box);}
const actions=T('div');actions.className='row';const create=(title,fn)=>{const b=T('button',title);b.type='button';b.className='btn secondary small';b.onclick=fn;actions.append(b);return b;};
create('Sao chép đề + lời giải',async()=>{try{await copy([p.statement_latex,p.solution_latex].join('\n\n'));say('Đã sao chép đề và lời giải.');}catch(e){say(String(e));}});
const e=create('Xuất LaTeX (.tex)',()=>download(tex(p)));e.disabled=!valid(p)||warnings.length>0||(figureRequested&&!p.figure_prompt);
if(figureRequested||p.needs_figure===true||p.figure_prompt)create('Sao chép prompt vẽ hình',async()=>{try{await copy(figure(p));say('Đã sao chép prompt dựng hình.');}catch(err){say(String(err));}});
create('Sao chép JSON',async()=>{try{await copy(JSON.stringify({status:'RESEARCH_ONLY',teacherApproved:false,payload},null,2));say('Đã sao chép JSON.');}catch(err){say(String(err));}});
host.append(actions);
 const reviewPanel=T('div');reviewPanel.id='maProReviews';reviewPanel.className='ma-pro-reviews';
 const reviewTitle=T('h3','Kiểm định chuyên sâu');reviewPanel.append(reviewTitle);
 const proofInfo=T('p','Trước khi phản biện, yêu cầu Gemini giải lại độc lập chỉ từ đề bài (không gửi lời giải gốc). Một mô hình có thể lặp lại lỗi; kết quả không thay thế thẩm định của giáo viên.');proofInfo.className='tiny muted';reviewPanel.append(proofInfo);
 const independentBtn=T('button','Giải độc lập · Không xem lời giải gốc');independentBtn.type='button';independentBtn.className='btn secondary small';independentBtn.id='maProIndependentBtn';independentBtn.addEventListener('click',()=>runIndependent(independentBtn));
 reviewPanel.append(independentBtn);const independentOut=T('div');independentOut.id='maProIndependentResult';reviewPanel.append(independentOut);
 const stateLine=T('p');stateLine.id='maProAuditStatus';stateLine.className='tiny muted';reviewPanel.append(stateLine);
 const names=[['review_math','1. Toán học'],['review_curriculum','2. CTGDPT 2018'],['review_novelty','3. Tính mới & Casio']];
 const buttons=T('div');buttons.className='row';
 for(const [phase,label] of names){const b=T('button',label);b.type='button';b.className='btn secondary small';b.addEventListener('click',()=>runReview(phase,b));buttons.append(b);}
 reviewPanel.append(buttons);host.append(reviewPanel);updateAuditStatus();
 if(!valid(p))host.append(T('p','Chưa đủ trường LaTeX hoặc có dấu hiệu sai cú pháp; khóa xuất .tex.'));if(figureRequested&&!p.figure_prompt)host.append(T('p','Bài yêu cầu hình vẽ nhưng AI chưa cung cấp prompt dựng hình; khóa xuất .tex.'));host.append(T('p','Lưu ý: Mã LaTeX chưa được biên dịch thử; lời giải và tính mới chưa được giáo viên nghiệm thu.'));
}
function updateAuditStatus(){
 const target=$('maProAuditStatus');if(!target)return;
 const done=['review_math','review_curriculum','review_novelty'].filter(k=>!!reviewResults[k]).length;
 const issues=Object.entries(reviewResults).filter(([,v])=>v?.status!=='READY_FOR_HUMAN_REVIEW'||(Array.isArray(v?.blockers)&&v.blockers.length));
 const verdict=independentResult?'Có lời giải AI độc lập':'Chưa có lời giải độc lập';
 const independentOk=independentResult?.status==='READY_FOR_HUMAN_REVIEW'&&(!Array.isArray(independentResult?.blockers)||independentResult.blockers.length===0)&&typeof independentResult?.result?.solution_latex==='string'&&independentResult.result.solution_latex.trim().length>10;const state=independentOk&&done===3&&!issues.length?'Đã đủ bước thử bằng AI; KHÔNG đồng nghĩa bài toán đúng hoặc được duyệt.':'Chưa đủ minh chứng để xem là ứng viên nghiệm thu.';
 target.textContent=verdict+' · Phản biện '+done+'/3 · '+state;
}
async function runIndependent(btn){
 if(!output||!lastInput||independentBusy)return;
 const p=source(output);
 if(!p||typeof p.statement_latex!=='string'||p.statement_latex.trim().length<10){say('Thiếu đề bài hợp lệ để giải độc lập.');return;}
 const challenge=[
  'MCCS – GIẢI ĐỘC LẬP KIỂM CHỨNG TOÁN HSG.',
  'Chỉ dựa vào ĐỀ BÀI bên dưới, không được yêu cầu lời giải gốc.',
  'Giải bằng hai hướng nếu có thể. Kiểm tra miền xác định, trường hợp biên, tính khả thi và cách giải ngắn nhất.',
  'Không tuyên bố đã kiểm chứng bằng công cụ tính toán nếu thực tế chưa sử dụng.',
  'Trả về JSON với status, blockers và result gồm solution_latex, short_solution_latex, answer_latex, critical_conditions, difficulty_assessment, possible_errors.',
  'Nếu thiếu dữ kiện hoặc không chứng minh được, ghi NEEDS_REVIEW và blocker cụ thể.',
  'ĐỀ BÀI (LaTeX):',p.statement_latex
 ].join('\n');
 if(challenge.length>6000){say('Đề quá dài cho kiểm chứng độc lập.');return;}
 independentBusy=true;btn.disabled=true;say('Đang giải độc lập, không gửi lời giải gốc...');
 try{
  const r=await window.MathoraBridge.mccsCall('mccsExecute',{
    commandId:'MCCS-06',topic:lastInput.topic,sourceId:'',phase:'propose',request:challenge
  });
  if(r.service!=='MATHORA_MCCS'||r.status!=='RESEARCH_ONLY'||r.teacherApproved!==false||r.stored!==false||r.approved!==false||!r.payload)
   throw Error('Phản hồi kiểm định không đúng hợp đồng MCCS.');
  independentResult=r.payload;
  const root=$('maProIndependentResult');
  if(!root)return;
  root.replaceChildren();
  const panel=T('details');panel.open=true;panel.className='ma-pro-review-card';
  panel.append(T('summary','Lời giải độc lập (AI, chưa xác minh)'));
  const details=r.payload?.result||r.payload;
  for(const [k,label] of [['solution_latex','Lời giải'],['short_solution_latex','Cách giải ngắn'],['answer_latex','Đáp án'],['critical_conditions','Điều kiện then chốt'],['possible_errors','Rủi ro sai sót']]){
    if(!details[k])continue;
    const section=T('div');section.className='ma-pro-field';
    section.append(T('strong',label),T('pre',typeof details[k]==='string'?details[k]:JSON.stringify(details[k],null,2)));
    panel.append(section);
  }
  const sourceAnswer=String(p.answer_latex||'').trim(),independentAnswer=String(details.answer_latex||'').trim();
  if(sourceAnswer&&independentAnswer&&sourceAnswer!==independentAnswer)
   panel.append(T('p','Cảnh báo: Hai đáp án biểu diễn khác nhau. Cần giáo viên đối chiếu tính tương đương; không mặc định là sai.','notice'));
  if(Array.isArray(r.payload.blockers)&&r.payload.blockers.length)
   panel.append(T('p','AI độc lập báo lỗi: '+r.payload.blockers.join('; '),'notice'));
  root.append(panel);
  updateAuditStatus();say('Đã nhận lời giải AI độc lập. Chưa xác nhận đúng; hãy đối chiếu với bản gốc.');
 }catch(e){say('Giải độc lập chưa hoàn tất: '+String(e.message||e));}
 finally{independentBusy=false;btn.disabled=false;}
}
async function runReview(phase,btn){if(!output||!lastInput)return;const draftJson=JSON.stringify(output);if(draftJson.length>16000){say('Bản nháp quá dài để gửi phản biện.');return;}btn.disabled=true;say('Đang phản biện: '+phase+'...');try{const r=await window.MathoraBridge.mccsCall('mccsExecute',{commandId:'MCCS-05',topic:lastInput.topic,sourceId:'',request:lastInput.request,phase,draftJson});if(r.service!=='MATHORA_MCCS'||r.phase!==phase||r.status!=='RESEARCH_ONLY'||r.teacherApproved!==false||r.stored!==false||r.approved!==false||!r.payload)throw Error('Phản hồi phản biện không hợp lệ.');reviewResults[phase]=r.payload;updateAuditStatus();const card=T('details');card.open=true;card.className='ma-pro-review-card';card.append(T('summary',phase+' · '+(r.payload.status||'CHƯA XÁC ĐỊNH')));const pre=T('pre',JSON.stringify(r.payload,null,2));card.append(pre);$('maProReviews').append(card);say('Đã nhận phản biện '+phase+'. Giáo viên cần kiểm tra từng nhận xét.');}catch(e){say('Vòng phản biện chưa hoàn tất: '+String(e.message||e));}finally{btn.disabled=false;}}
async function run(){const b=$('maProRun');if(b.disabled)return;let request;try{request=prompt();if(request.length>6000)throw Error('Yêu cầu quá dài.');}catch(e){say(e.message);return;}
b.disabled=true;say('Đang gọi Gemini qua Backend MCCS...');
try{if(!window.MathoraBridge?.mccsCall)throw Error('Chưa có kết nối tài khoản giáo viên.');const r=await window.MathoraBridge.mccsCall('mccsExecute',{commandId:'MCCS-05',topic:$('maProTopic').value.trim(),sourceId:'',phase:'propose',request});if(r.service!=='MATHORA_MCCS'||r.status!=='RESEARCH_ONLY'||r.teacherApproved!==false||r.stored!==false||r.approved!==false||!r.payload)throw Error('Phản hồi không đúng hợp đồng MCCS.');lastInput={topic:$('maProTopic').value.trim(),request};figureRequested=$('maProNeedFigure').checked;render(r.payload);say('Đã có bản nháp. Cần giáo viên kiểm định lời giải, độ khó và LaTeX.');}catch(e){say('Chưa hoàn tất: '+(e.message||e));}finally{b.disabled=false;}}
function mount(){const root=$('mccsInlineRuntime')||$('ecosystemMccs');if(!root||$('maOlympiadPro'))return;root.insertAdjacentHTML('afterend',html);$('maProRun').addEventListener('click',run);$('maProCopyPrompt').addEventListener('click',async()=>{try{await copy(prompt());say('Đã sao chép yêu cầu AI.');}catch(e){say(e.message||String(e));}});}
new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true});mount();
})();