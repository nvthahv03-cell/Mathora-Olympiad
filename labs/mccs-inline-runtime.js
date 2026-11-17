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
<h3 style="margin-top:16px">Kết quả thực thi</h3>
<pre id="mccsAiResult" style="white-space:pre-wrap;overflow-wrap:anywhere;max-height:480px;overflow:auto;background:#f5f8fa;border:1px solid #dbe7eb;border-radius:10px;padding:13px">Chưa có phản hồi Gemini để đánh giá.</pre>
<div class="notice" style="margin-top:12px">Không tự phê duyệt sản phẩm. Trạng thái luôn RESEARCH_ONLY cho tới khi giáo viên thẩm định theo quy trình MATHORA.</div>
</section>`;
function write(s){const e=byId('mccsMessage');if(e)e.textContent=s;}
function controls(){
 if(byId('mccsCheck'))byId('mccsCheck').disabled=state.busy;
 if(byId('mccsGenerate'))byId('mccsGenerate').disabled=state.busy||!state.ready;
 document.querySelectorAll('[data-mccs-review]').forEach(btn=>btn.disabled=state.busy||!state.ready||!state.draft);
}
function renderResult(){
 const host=byId('mccsAiResult');if(!host)return;
 host.textContent=JSON.stringify({
  status:'RESEARCH_ONLY',teacherApproved:false,stored:false,
  draft:state.draft?.payload||null,reviews:state.reviews,
  completed_review_rounds:phases.filter(([id])=>!!state.reviews[id]).length
 },null,2);
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
 document.querySelectorAll('[data-mccs-review]').forEach(btn=>
   btn.addEventListener('click',()=>execute(btn.dataset.mccsReview)));
 controls();
}
const observer=new MutationObserver(mount);
observer.observe(document.documentElement,{childList:true,subtree:true});
mount();
})();
