/* MATHORA V2.3 Direct Apps Script panel — no owner/teacher key stored in GitHub.
   User login via Google ID token; server verifies token before privileged actions. */
(function(){
'use strict';
const cfg=()=>window.MATHORA_BACKEND_CONFIG||{};
let identityToken='',authRole='',activeDraft=null,selectedPending=null,selectedKho=null;
let mountedNode=null,working=false,googleReady=false;
const $=id=>document.getElementById(id);
const make=(tag,text)=>{let x=document.createElement(tag);if(text!==undefined)x.textContent=String(text);return x};
const validEndpoint=()=>{try{const u=new URL(String(cfg().endpoint||''));return u.protocol==='https:'&&u.hostname==='script.google.com'&&/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(u.pathname)&&!u.search&&!u.hash;}catch{return false}};
const hasSetup=()=>validEndpoint() && String(cfg().googleClientId||'').endsWith('.apps.googleusercontent.com');
const apiUrl=()=>String(cfg().endpoint||'').replace(/\/$/,'');
function setStatus(msg,kind){const e=$('mgState');if(!e)return;e.textContent=msg;e.dataset.kind=kind||'';}
function jtext(id,obj){const e=$(id);if(e)e.textContent=typeof obj==='string'?obj:JSON.stringify(obj,null,2);}
function value(id){return String($(id)?.value||'').trim();}
function validateDraft(p){if(!p||typeof p!=='object'||Array.isArray(p))throw Error('Bản nháp phải là đối tượng JSON.');if(!String(p.statement||'').trim()||!String(p.solution||'').trim())throw Error('Thiếu đề bài hoặc lời giải.');if(!/^[-+]?\d+(?:\.\d+)?(?:\/\d+)?$/.test(String(p.short_answer||''))||String(p.short_answer||'').length>4)throw Error('short_answer phải là đáp số từ 1 đến 4 ký tự hợp lệ.');}
async function gasRequest(payload){
 if(!validEndpoint())throw Error('Đường dẫn Apps Script /exec chưa hợp lệ.');
 // HVA-EDOS pattern: simple CORS POST — avoids JSON content-type preflight.
 // GAS must authenticate idToken server-side; never include teacher/owner key.
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),65000);
 try {
   const response=await fetch(apiUrl(),{
     method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},
     body:JSON.stringify(payload),signal:controller.signal,redirect:'follow',cache:'no-store'
   });
   if(!response.ok)throw Error('HTTP '+response.status+' khi kết nối Apps Script.');
   let result;try{result=await response.json()}catch{throw Error('Apps Script không trả JSON hợp lệ hoặc bị chặn CORS.');}
   return result;
 }catch(err){
   if(err.name==='AbortError')throw Error('Apps Script không phản hồi trong 65 giây.');
   if(err instanceof TypeError)throw Error('Không đọc được phản hồi Apps Script: kiểm tra quyền Web App và CORS. Không có dữ liệu nào được xác nhận đã ghi.');
   throw err;
 }finally{clearTimeout(timer)}
}
async function api(action,body={}){
 if(!hasSetup())throw Error('Chưa cấu hình Google OAuth Client ID và Apps Script. Không gửi khóa bí mật từ GitHub.');
 if(!identityToken)throw Error('Đăng nhập Google bằng tài khoản đã được chủ sở hữu cấp quyền.');
 const data={action,...body,idToken:identityToken};
 delete data.key;delete data.role;delete data.authenticatedRole;
 const result=await gasRequest(data);
 if(!result||result.ok!==true)throw Error(result?.error||'Backend từ chối yêu cầu.');
 authRole=String(result.authenticatedRole||authRole||'');
 return result;
}
async function health(){
 if(!validEndpoint())throw Error('Đường dẫn Backend không hợp lệ.');
 const u=apiUrl()+'?action=health';
 const res=await fetch(u,{method:'GET',redirect:'follow',cache:'no-store'});
 if(!res.ok)throw Error('Health HTTP '+res.status);
 const d=await res.json();
 if(d.ok!==true||d.service!=='MATHORA')throw Error('Health không khớp dịch vụ MATHORA.');
 return d;
}
async function busy(fn){
 if(working)return;working=true;document.querySelectorAll('#mathoraGateway button.mg-write').forEach(x=>x.disabled=true);
 try{await fn()}catch(err){setStatus(err.message||String(err),'error')}
 finally{working=false;document.querySelectorAll('#mathoraGateway button.mg-write').forEach(x=>x.disabled=!identityToken);}
}
function field(id,label,text='',type='textarea'){
 const wrap=make('label');wrap.className='mg-field';const cap=make('span',label);wrap.appendChild(cap);
 const ctl=make(type==='textarea'?'textarea':'input');ctl.id=id;if(type!=='textarea')ctl.type=type;ctl.value=text;wrap.appendChild(ctl);return wrap;
}
function button(text,fn,{write=false,danger=false}={}){
 const b=make('button',text);b.type='button';b.className='mg-btn'+(write?' mg-write':'')+(danger?' mg-danger':'');b.disabled=write&&!identityToken;b.addEventListener('click',()=>busy(fn));return b;
}
function gridButtons(container,...buttons){let w=make('div');w.className='mg-actions';for(const b of buttons)w.appendChild(b);container.appendChild(w);}
function showProblem(p,host){
 host.replaceChildren();
 if(!p){host.textContent='Chưa có nội dung.';return;}
 let title=make('h4',p.title||'Bài toán');host.appendChild(title);
 for(const [key,label] of [['statement','Đề bài'],['conditions','Điều kiện'],['short_answer','Đáp án ngắn'],['solution','Lời giải'],['alternative_solution','Cách giải khác'],['casio_assessment','Phản biện Casio'],['difficulty_analysis','Đánh giá độ khó']]){
 if(p[key]){host.appendChild(make('strong',label));let pre=make('pre',p[key]);pre.className='mg-pre';host.appendChild(pre);}
 }
}
function makeSection(title){
 const sec=make('section');sec.className='mg-card';sec.appendChild(make('h3',title));return sec;
}
function connectSection(root){
 const sec=makeSection('Kết nối trực tiếp Apps Script V2.3');
 const message=make('p',hasSetup()?'Đã có URL Apps Script và Client ID. Đăng nhập Google để Backend kiểm tra quyền tài khoản.':'Đã có URL Apps Script. Để kích hoạt nghiệp vụ cần bổ sung Google OAuth Client ID công khai và cơ chế xác thực idToken phía Apps Script. Chưa gửi yêu cầu ghi dữ liệu.');
 message.className='mg-subtle';sec.appendChild(message);
 const auth=make('div');auth.id='mgAuth';sec.appendChild(auth);
 const link=make('a','Mở health Apps Script trong tab riêng');link.href=cfg().healthUrl||'#';link.target='_blank';link.rel='noopener noreferrer';sec.appendChild(link);
 gridButtons(sec,
   button('Kiểm tra Backend /health',async()=>{
     const d=await health();
     setStatus('Backend phản hồi: '+d.service+' · '+d.version+'. AI: '+(d.aiConfigured?'đã khai báo':'chưa khai báo')+'; Sheets: '+(d.dbConfigured?'đã khai báo':'chưa khai báo')+'. Đây chưa phải PASS nghiệp vụ.','success');
   }),
   button('Đăng xuất khỏi MATHORA',async()=>{identityToken='';authRole='';setStatus('Đã xóa token khỏi bộ nhớ phiên.');render();})
 );
 if(hasSetup()){
   const googleBox=make('div');googleBox.id='mgGoogleLogin';sec.appendChild(googleBox);
 }
 root.appendChild(sec);
 if(hasSetup())prepareGoogleLogin();
}
function prepareGoogleLogin(){
 if(!hasSetup())return;
 if(window.google?.accounts?.id){googleReady=true;window.google.accounts.id.initialize({client_id:cfg().googleClientId,callback:r=>{identityToken=String(r.credential||'');authRole='';setStatus('Đã nhận phiên đăng nhập Google. Apps Script sẽ kiểm tra quyền ở lần gọi API.','success');render();}});window.google.accounts.id.renderButton($('mgGoogleLogin'),{theme:'outline',size:'large',text:'signin_with',shape:'rectangular'});return;}
 if(googleReady)return;googleReady=true;
 const script=make('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.onload=()=>{googleReady=false;prepareGoogleLogin()};script.onerror=()=>setStatus('Không tải được dịch vụ đăng nhập Google.','error');document.head.appendChild(script);
}
function draftSection(root){
 const sec=makeSection('1. Gemini tạo bản nháp → lưu STAGING');
 sec.appendChild(make('p','Chỉ tạo bản nháp chưa kiểm định. Không đưa vào Kho nếu chưa có minh chứng thẩm định độc lập.'));
 sec.appendChild(field('mgScope','Phạm vi sáng tạo Toán học','Mũ – lôgarit kết hợp đạo hàm, giải quyết bài toán HSG 12; ưu tiên chiều sâu suy luận.'));
 sec.appendChild(field('mgOutcome','Yêu cầu cần đạt CT GDPT 2018','Vận dụng đạo hàm để giải quyết bài toán liên quan đến hàm số mũ và lôgarit, cần giáo viên đối chiếu chương trình.'));
 let label=make('label');label.className='mg-field';label.appendChild(make('span','Năng lực trọng tâm'));
 let comp=make('select');comp.id='mgCompetence';
 for(const v of ['Tư duy và lập luận toán học','Mô hình hóa toán học','Giải quyết vấn đề toán học','Giao tiếp toán học','Sử dụng công cụ, phương tiện học toán']){let o=make('option',v);o.value=v;comp.appendChild(o)}label.appendChild(comp);sec.appendChild(label);
 let draftField=field('mgDraft','Bản nháp JSON (giáo viên rà soát, bổ sung short_answer)','');draftField.querySelector('textarea').rows=9;sec.appendChild(draftField);
 gridButtons(sec,
 button('Tạo một bản nháp bằng Gemini',async()=>{
 const r=await api('generateProblem',{scope:value('mgScope'),learningOutcome:value('mgOutcome'),competency:value('mgCompetence')});
 activeDraft=r.problem; $('mgDraft').value=JSON.stringify(activeDraft,null,2);
 setStatus('Gemini đã sinh bản nháp chưa thẩm định. Chưa ghi Sheets.','success');
 },{write:true}),
 button('Ghi bản nháp vào STAGING (chỉ môi trường được phép)',async()=>{
 const p=JSON.parse(value('mgDraft'));validateDraft(p);
 if(!window.confirm('Ghi hồ sơ vào Google Sheets STAGING qua Gateway? Chỉ thực hiện khi đã xác minh dữ liệu TEST.'))return;
 const r=await api('saveToKho',{problem:p});setStatus('Hồ sơ STAGING: '+r.id+' · '+r.status+'. Chưa được APPROVED.','success');
 },{write:true})
 );
 root.appendChild(sec);
}
function pendingSection(root){
 const sec=makeSection('2. Hồ sơ chờ thẩm định → xác minh độc lập');
 let list=make('div');list.id='mgPendingList';sec.appendChild(list);
 let detail=make('div');detail.id='mgPendingDetail';sec.appendChild(detail);
 gridButtons(sec,button('Tải hồ sơ WAITING_HUMAN',async()=>{
 const r=await api('listPending',{status:'WAITING_HUMAN',limit:30});list.replaceChildren();detail.replaceChildren();
 if(!r.items.length){list.appendChild(make('p','Không có hồ sơ chờ thẩm định.'));return;}
 for(const it of r.items)list.appendChild(button(it.id+' — '+it.status,async()=>{
 const p=await api('getPending',{id:it.id});selectedPending=p;renderPending(detail,p);
 }));
 }));
 root.appendChild(sec);
}
function renderPending(host,record){
 host.replaceChildren();if(!record)return;
 const problemHost=make('div');showProblem(record.problem,problemHost);host.appendChild(problemHost);
 host.appendChild(make('p','SHA256 nguồn: '+record.sourceHash));
 if(authRole==='teacher'){host.appendChild(make('p','Tài khoản giáo viên chỉ xem; thao tác xác nhận thuộc Chủ sở hữu.'));return;}
 if(authRole!=='owner'){host.appendChild(make('p','Quyền chủ sở hữu phải được xác minh phía Gateway trước khi thẩm định.'));return;}
 let ev=make('div');ev.className='mg-review';
 for(const [id,label] of [
 ['mgReviewer','Người thẩm định (≥5 ký tự)'],
 ['mgAnswer','Đáp án độc lập (≤4 ký tự)'],
 ['mgProof','Chứng minh tự kiểm tra Toán học (≥70 ký tự)'],
 ['mgCurriculum','Đối chiếu chương trình (≥55 ký tự)'],
 ['mgDifficulty','Phân tích độ khó (≥45 ký tự)'],
 ['mgOriginality','Tra cứu trùng lặp (≥35 ký tự)'],
 ['mgCasio','Phản biện Casio (≥25 ký tự)'],
 ['mgNotes','Nhận xét (≥15 ký tự)']])ev.appendChild(field(id,label,'',id==='mgReviewer'||id==='mgAnswer'?'text':'textarea'));
 const checks=[['mgMathOk','Đã kiểm tra toán học'],['mgCurrOk','Đã đối chiếu CT2018'],['mgAnswerOk','Đã giải độc lập'],['mgOriginOk','Đã rà soát trùng lặp']];
 for(const [id,label] of checks){let l=make('label');l.className='mg-check';let x=make('input');x.type='checkbox';x.id=id;l.append(x,make('span',label));ev.appendChild(l)}
 host.appendChild(ev);
 gridButtons(host,
 button('Xác nhận chứng cứ → DRAFT_REVIEWED',async()=>{
 const evidence={reviewer:value('mgReviewer'),independentAnswer:value('mgAnswer'),proof:value('mgProof'),curriculumCrosswalk:value('mgCurriculum'),difficultyEvidence:value('mgDifficulty'),originalitySearch:value('mgOriginality'),casioReview:value('mgCasio'),reviewNote:value('mgNotes'),mathVerified:$('mgMathOk').checked,curriculumVerified:$('mgCurrOk').checked,independentAnswerVerified:$('mgAnswerOk').checked,originalityReviewed:$('mgOriginOk').checked};
 if(!window.confirm('Xác nhận đã thực hiện kiểm tra thực tế, chịu trách nhiệm về minh chứng và đưa bài vào DRAFT_REVIEWED?'))return;
 const r=await api('attestPending',{id:record.id,expectedHash:record.sourceHash,humanReviewed:true,evidence});
 setStatus('Đã ghi quyết định '+r.id+' · '+r.status+'. Chưa APPROVED.','success');
 },{write:true}),
 button('Từ chối hồ sơ',async()=>{
 const reason=window.prompt('Lý do từ chối (ít nhất 15 ký tự)');if(reason===null)return;if(reason.trim().length<15)throw Error('Lý do cần ít nhất 15 ký tự.');
 const r=await api('rejectPending',{id:record.id,reason});setStatus('Đã từ chối hồ sơ '+r.id,'success');
 },{write:true,danger:true})
 );
}
function khoSection(root){
 const sec=makeSection('3. Kho đã thẩm định và bài đủ điều kiện sử dụng');
 const list=make('div');list.id='mgKhoList';sec.appendChild(list);
 const detail=make('div');detail.id='mgKhoDetail';sec.appendChild(detail);
 gridButtons(sec,
 button('Bài DRAFT_REVIEWED',async()=>await loadKho('DRAFT_REVIEWED')),
 button('Bài APPROVED',async()=>await loadKho('APPROVED')),
 button('Bài đủ điều kiện ra đề',async()=>await loadKho('EXAM_ELIGIBLE'))
 );
 async function loadKho(status){
 const r=await api(status==='EXAM_ELIGIBLE'?'listExamEligible':'listKho',status==='EXAM_ELIGIBLE'?{limit:50}:{status,limit:50});
 list.replaceChildren();detail.replaceChildren();if(!r.items.length){list.textContent='Không có bài ở trạng thái '+status+'.';return;}
 for(const item of r.items){
 list.appendChild(button((item.title||item.id)+' — '+item.status,async()=>{
 const o=await api('getProblem',{id:item.id});selectedKho=o;detail.replaceChildren();detail.appendChild(make('p',o.id+' v'+o.version+' — '+o.status+' · SHA256 '+o.hash));
 const x=make('div');showProblem(o.problem,x);detail.appendChild(x);
 if(authRole==='owner'&&o.status==='DRAFT_REVIEWED'&&o.intact===true){
 detail.appendChild(field('mgApproveNote','Nhận xét quyết định cuối (≥15 ký tự)',''));
 gridButtons(detail,button('Phê duyệt APPROVED',async()=>{
 const note=value('mgApproveNote');if(note.length<15)throw Error('Nhận xét phải có ít nhất 15 ký tự.');
 if(!window.confirm('Xác nhận phê duyệt hồ sơ này vào Kho sau khi đã kiểm tra phiên bản, hash và minh chứng?'))return;
 const out=await api('approveProblem',{id:o.id,expectedVersion:o.version,expectedHash:o.hash,humanReviewed:true,reviewNote:note});
 setStatus('Đã phê duyệt '+out.id+' · '+out.status,'success');
 },{write:true}));
 }
 }));
 }
 }
 root.appendChild(sec);
}
function render(){
 if(!mountedNode||!mountedNode.isConnected)return;
 mountedNode.replaceChildren();
 let head=make('div');head.className='mg-title';head.appendChild(make('h2','Kết nối trực tiếp MATHORA V2.3'));
 const status=make('p');status.id='mgState';status.textContent='Giao diện GitHub Pages; Gemini và Kho chỉ hoạt động sau khi Apps Script xác thực Google và kiểm tra phân quyền.';head.appendChild(status);mountedNode.appendChild(head);
 connectSection(mountedNode);
 draftSection(mountedNode);pendingSection(mountedNode);khoSection(mountedNode);
}
function mount(){
 const view=$('view');if(!view||!$('aiHealth')){mountedNode=null;return;}
 if($('mathoraGateway'))return;
 const container=make('div');container.id='mathoraGateway';container.className='mg-root';
 view.insertBefore(container,view.firstChild);mountedNode=container;render();
}
const css=make('style');
css.textContent='.mg-root{font-family:inherit;margin-bottom:18px}.mg-title{background:#eaf4f4;border:1px solid #bcdddd;border-radius:14px;padding:12px 16px}.mg-title h2{margin:0 0 5px}.mg-title p{margin:0;font-size:13px}.mg-card{background:#fff;border:1px solid #d9e4eb;border-radius:13px;padding:16px;margin:12px 0;box-shadow:0 4px 16px #123a5608}.mg-card h3{margin:0 0 9px;font-size:18px}.mg-card p,.mg-subtle{font-size:13px;color:#607385}.mg-field{display:block;margin:12px 0}.mg-field>span{display:block;font-weight:650;font-size:13px;margin-bottom:5px}.mg-field textarea,.mg-field input,.mg-field select{width:100%;padding:10px;border:1px solid #aebfcd;border-radius:8px;font:inherit;background:#fff;color:#17334d}.mg-field textarea{min-height:75px;resize:vertical}.mg-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.mg-btn{background:#007e83;color:#fff;border:0;border-radius:9px;padding:9px 12px;cursor:pointer;font:600 13px inherit}.mg-btn.mg-danger{background:#a73e51}.mg-btn:disabled{opacity:.45;cursor:not-allowed}.mg-check{display:flex;gap:8px;align-items:flex-start;margin:7px 0}.mg-pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:320px;overflow:auto;padding:9px;background:#f4f7fa;border:1px solid #dae5ea;border-radius:8px;font-size:13px}.mg-card a{display:inline-block;margin:8px 0;color:#006582}#mgState[data-kind=error]{color:#b13640;font-weight:650}#mgState[data-kind=success]{color:#086960;font-weight:650}@media(max-width:690px){.mg-card{padding:12px}.mg-btn{width:100%}}';
document.head.appendChild(css);
const observer=new MutationObserver(()=>mount());observer.observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('DOMContentLoaded',mount);mount();
window.MathoraBridge={mount,configured:hasSetup};
})();