/* MCCS Inline Runtime · MATHORA V2.6 session bridge
 * No separate page, credentials or Gemini key in browser.
 * The production endpoint may NOT yet include MCCS actions; fail closed.
 */
(function(){
'use strict';
const phases=[
 ['review_math','Vòng 1 · Toán học'],
 ['review_curriculum','Vòng 2 · CT2018 – Ma trận'],
 ['review_novelty','Vòng 3 · Tính mới – Casio']
];
const state={ready:false,busy:false,draft:null,reviews:{},events:[],sourceSignature:null};
const byId=id=>document.getElementById(id);
const html=`<section class="panel" id="mccsInlineRuntime" style="margin-top:16px">
<div class="row between"><h2>Trợ lý MCCS · Kiểm thử AI trực tiếp</h2><span class="pill gold">LAB · Chờ nghiệm thu</span></div>
<p class="tiny muted">Dùng phiên đăng nhập MATHORA_USERS hiện tại. Kiểm tra Backend trước khi chạy; kết quả chỉ phục vụ nghiên cứu, không ghi STAGING/Kho.</p>
<div class="row" style="margin:12px 0">
<button type="button" class="btn secondary small" id="mccsCheck">Kiểm tra Backend MCCS</button>
<button type="button" class="btn small" id="mccsGenerate" disabled>Thực hiện lệnh AI</button>
<button type="button" class="btn secondary small" id="mccsExport">Xuất hồ sơ kiểm thử</button>
</div>
<p id="mccsMessage" role="status" aria-live="polite" class="tiny muted">Chưa kiểm tra kết nối MCCS. Các nút AI đang khóa.</p>
<div class="divider"></div>
<h3>Phản biện ba vòng</h3>
<p class="tiny muted">Ba lượt gọi Gemini với vai trò chuyên môn khác nhau. Cần bản nháp trước, và Backend có giới hạn tần suất giữa các lượt.</p>
<div class="row" id="mccsReviewActions">
<button type="button" class="btn secondary small" data-mccs-review="review_math" disabled>1. Toán học</button>
<button type="button" class="btn secondary small" data-mccs-review="review_curriculum" disabled>2. CT2018 – Ma trận</button>
<button type="button" class="btn secondary small" data-mccs-review="review_novelty" disabled>3. Tính mới – Casio</button>
</div>
<div class="row between" style="margin-top:18px"><h3 style="margin:0">Kết quả AI</h3><div class="row"><button type="button" class="btn secondary small" id="mccsCopyText" disabled>Sao chép nội dung</button><button type="button" class="btn ghost small" id="mccsCopyJson" disabled>Sao chép JSON</button></div></div>
<p id="mccsCopyFeedback" class="tiny muted" role="status" aria-live="polite" style="margin:7px 0"></p>
<div id="mccsReadable" class="mccs-readable">Chưa có kết quả. Thầy chọn lệnh và bấm “Thực hiện lệnh AI”.</div>
<details class="mccs-technical"><summary>Xem dữ liệu kỹ thuật (JSON)</summary><pre id="mccsAiResult">Chưa có phản hồi Gemini để đánh giá.</pre></details>
<div class="notice" style="margin-top:12px">Không tự phê duyệt sản phẩm. Trạng thái luôn RESEARCH_ONLY cho tới khi giáo viên thẩm định theo quy trình MATHORA.</div>
</section>`;
function write(s){const e=byId('mccsMessage');if(e)e.textContent=s;}
function controls(){
 if(byId('mccsCheck'))byId('mccsCheck').disabled=state.busy;
 if(byId('mccsGenerate'))byId('mccsGenerate').disabled=state.busy||!state.ready;
 document.querySelectorAll('[data-mccs-review]').forEach(btn=>btn.disabled=state.busy||!state.ready||!state.draft);
}
function resultObject(){
 return {status:'RESEARCH_ONLY',teacherApproved:false,stored:false,
  draft:state.draft?.payload||null,reviews:state.reviews,
  completed_review_rounds:phases.filter(([id])=>!!state.reviews[id]).length};
}
function resultText(){
 const lines=['MATHORA OLYMPIAD · HỒ SƠ PHẢN BIỆN','Trạng thái: NGHIÊN CỨU – CHƯA ĐƯỢC GIÁO VIÊN DUYỆT',''];
 const sections=[['BẢN NHÁP',state.draft?.payload],...phases.map(([id,title])=>[title,state.reviews[id]])];
 for(const [name,payload] of sections){
  if(!payload)continue;
  lines.push('── '+name+' ──');
  const r=payload.result||{};
  const q=r.cau_hoi||r.question||r.problem||'';
  if(q)lines.push('Đề bài: '+String(q));
  const p=r.phan_bien||r.phan_bien_noi_dung||r;
  for(const [label,keys] of [
   ['Kết luận',['ket_luan','conclusion']],
   ['Lập luận / lời giải',['chung_minh','chung_minh_ngan_nhat','solution']],
   ['Điều kiện / giới hạn',['dieu_kien_bien','conditions']],
   ['Tính mới',['phan_tich_tinh_moi','diem_moi']],
   ['Độ khó',['phan_tich_do_kho']],
   ['Casio',['phan_tich_casio']],
   ['Đối chiếu cấu trúc',['nhan_dien_trung_cau_truc']]
  ]){
   const val=keys.map(k=>p?.[k]??r?.[k]).find(v=>typeof v==='string'&&v.trim());
   if(val)lines.push(label+': '+val);
  }
  if(Array.isArray(payload.blockers)&&payload.blockers.length){
   lines.push('Điểm cần sửa:');payload.blockers.forEach((b,i)=>lines.push('  '+(i+1)+'. '+b));
  }
  lines.push('');
 }
 return lines.join('\n').trim();
}
function renderResult(){
 const host=byId('mccsAiResult'),readable=byId('mccsReadable');
 if(!host||!readable)return;
 host.textContent=JSON.stringify(resultObject(),null,2);
 readable.replaceChildren();
 const sections=[['Bản nháp AI',state.draft?.payload],...phases.map(([id,title])=>[title,state.reviews[id]])];
 for(const [label,payload] of sections){
  if(!payload)continue;
  const card=document.createElement('section');card.className='mccs-result-card';
  const h=document.createElement('h4');h.textContent=label;card.appendChild(h);
  const r=payload.result||{};
  const p=r.phan_bien||r.phan_bien_noi_dung||r;
  const rows=[
   ['Đề bài',r.cau_hoi||r.question||r.problem],
   ['Kết luận',p?.ket_luan||p?.conclusion],
   ['Lời giải / lập luận',p?.chung_minh||p?.chung_minh_ngan_nhat||p?.solution],
   ['Điều kiện',p?.dieu_kien_bien],
   ['Tính mới',r.phan_tich_tinh_moi||p?.diem_moi],
   ['Độ khó',r.phan_tich_do_kho],
   ['Casio',r.phan_tich_casio]
  ];
  let any=false;
  rows.forEach(([name,value])=>{
   if(typeof value!=='string'||!value.trim())return;
   any=true;const d=document.createElement('div');d.className='mccs-result-row';
   const strong=document.createElement('strong');strong.textContent=name;
   const valueNode=document.createElement('p');valueNode.textContent=value;
   d.append(strong,valueNode);card.appendChild(d);
  });
  if(Array.isArray(payload.blockers)&&payload.blockers.length){
   any=true;const warning=document.createElement('div');warning.className='mccs-result-warning';
   const title=document.createElement('strong');title.textContent='Cần chỉnh sửa';
   const list=document.createElement('ul');
   payload.blockers.forEach(msg=>{const li=document.createElement('li');li.textContent=String(msg);list.appendChild(li);});
   warning.append(title,list);card.appendChild(warning);
  }
  if(!any){const d=document.createElement('p');d.className='muted tiny';d.textContent='Chi tiết nằm trong dữ liệu JSON.';card.appendChild(d);}
  readable.appendChild(card);
 }
 const hasData=!!state.draft||Object.keys(state.reviews).length>0;
 if(!hasData)readable.textContent='Chưa có kết quả AI.';
 ['mccsCopyText','mccsCopyJson'].forEach(id=>{const btn=byId(id);if(btn)btn.disabled=!hasData;});
}
async function copyToClipboard(text){
 if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return;}
 const el=document.createElement('textarea');el.value=text;el.setAttribute('readonly','');el.style.position='fixed';el.style.opacity='0';
 document.body.appendChild(el);el.select();
 const ok=document.execCommand('copy');el.remove();if(!ok)throw Error('Trình duyệt từ chối sao chép.');
}
async function copyResult(type){
 const target=byId('mccsCopyFeedback');
 if(!state.draft){if(target)target.textContent='Chưa có kết quả để sao chép.';return;}
 try{
  await copyToClipboard(type==='json'?JSON.stringify(resultObject(),null,2):resultText());
  if(target)target.textContent=type==='json'?'Đã sao chép JSON.':'Đã sao chép nội dung dễ đọc.';
 }catch(err){if(target)target.textContent='Chưa sao chép được: '+String(err.message||err);}
}
async function request(action,payload){
 const bridge=window.MathoraBridge;
 if(!bridge||typeof bridge.mccsCall!=='function')
   throw Error('Cầu nối phiên đăng nhập MATHORA chưa được tải.');
 return bridge.mccsCall(action,payload);
}
function input(){
 const $=byId;
 const commandId=$('ecosystemCmd')?.value||'';
 const topic=$('ecosystemTopic')?.value.trim()||'';
 const sourceId=$('ecosystemSource')?.value.trim()||'';
 const requestText=$('ecosystemRequest')?.value.trim()||'';
 if(!/^MCCS-(0[0-9]|1[0-7])$/.test(commandId))throw Error('Chưa chọn mã lệnh MCCS hợp lệ.');
 if(!requestText||requestText.length>6000)throw Error('Nhập yêu cầu toán học, tối đa 6000 ký tự.');
 if(topic.length>180||sourceId.length>100)throw Error('Tên chuyên đề hoặc mã nguồn quá dài.');
 return {commandId,topic,sourceId,request:requestText};
}
function signature(i){return JSON.stringify(i);}
async function check(){
 if(state.busy)return;
 state.busy=true;controls();write('Đang xác minh Backend MCCS qua phiên đăng nhập...');
 try{
  const result=await request('mccsRegistry',{});
  if(result?.service!=='MATHORA_MCCS'||!Array.isArray(result.commands)||
     result.commands.length!==18||!Array.isArray(result.phases)||
     !phases.every(([id])=>result.phases.includes(id)))
    throw Error('Endpoint chưa hỗ trợ đầy đủ MCCS V2.6 hoặc trả sai cấu trúc.');
  state.ready=true;
  write('Đã xác nhận '+String(result.version)+', 18 lệnh MCCS và 3 pha phản biện. Có thể thử Gemini; chưa PASS năng lực AI.');
 }catch(err){
  state.ready=false;state.draft=null;state.reviews={};
  write('CHƯA KẾT NỐI: '+String(err.message||err)+'. Cần triển khai Backend V2.6 MCCS LAB và kiểm tra quyền/CORS.');
 }finally{state.busy=false;controls();}
}
async function execute(phase){
 if(!state.ready||state.busy)return;
 let i;try{i=input();}catch(err){write(String(err.message||err));return;}
 const sig=signature(i);
 if(phase!=='propose'&&(!state.draft||state.sourceSignature!==sig)){
  write('Yêu cầu đã thay đổi hoặc chưa có nháp tương ứng. Chạy lại “Thực hiện lệnh AI” trước khi phản biện.');return;
 }
 const args={...i,phase};
 if(phase!=='propose'){
  args.draftJson=JSON.stringify(state.draft.payload);
  if(args.draftJson.length>16000){write('Bản nháp vượt 16000 ký tự; chưa thể phản biện.');return;}
 }
 state.busy=true;controls();write('Đang gọi Gemini: '+phase+'. Chưa có kết quả.');
 try{
  const result=await request('mccsExecute',args);
  if(result?.service!=='MATHORA_MCCS'||result.phase!==phase||
      result.commandId!==i.commandId||result.status!=='RESEARCH_ONLY'||
      result.teacherApproved!==false||result.stored!==false||result.approved!==false||
      !result.payload||typeof result.payload!=='object')
    throw Error('Phản hồi Backend không đúng hợp đồng MCCS LAB; không nhận bản nháp.');
  if(phase==='propose'){
   state.draft=result;state.reviews={};state.sourceSignature=sig;
  }else state.reviews[phase]=result.payload;
  state.events.push({phase,commandId:i.commandId,at:new Date().toISOString(),
    model:String(result.model||'unknown'),payload:result.payload});
  renderResult();
  write('Đã nhận '+phase+'. Cần giáo viên kiểm tra lập luận, đáp án và tính mới; chưa PASS.');
 }catch(err){write('CHƯA HOÀN TẤT '+phase+': '+String(err.message||err));}
 finally{state.busy=false;controls();}
}
function exportLog(){
 const obj={app:'MATHORA_MCCS_LAB',status:'RESEARCH_ONLY',
  teacherApproved:false,createdAt:new Date().toISOString(),
  reviewsCompleted:phases.filter(([p])=>!!state.reviews[p]).length,
  events:state.events};
 const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);
 a.download='MATHORA_MCCS_KIEM_THU.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(a.href),1500);
}
function mount(){
 const root=byId('ecosystemMccs');
 if(!root||byId('mccsInlineRuntime'))return;
 root.insertAdjacentHTML('afterend',html);
 // Leaving/reopening workspace must not silently assume prior authenticated endpoint.
 state.ready=false;state.draft=null;state.reviews={};state.sourceSignature=null;state.events=[];
 byId('mccsCheck').addEventListener('click',check);
 byId('mccsGenerate').addEventListener('click',()=>execute('propose'));
 byId('mccsExport').addEventListener('click',exportLog);
 byId('mccsCopyText').addEventListener('click',()=>copyResult('text'));
 byId('mccsCopyJson').addEventListener('click',()=>copyResult('json'));
 document.querySelectorAll('[data-mccs-review]').forEach(btn=>
   btn.addEventListener('click',()=>execute(btn.dataset.mccsReview)));
 controls();
}
const observer=new MutationObserver(mount);
observer.observe(document.documentElement,{childList:true,subtree:true});
mount();
})();
