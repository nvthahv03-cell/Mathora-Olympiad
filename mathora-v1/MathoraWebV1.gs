/**
 * MATHORA WEB V1 | Giao dien tren Apps Script
 * Phu thuoc MATHORA.gs V2.3. Khong sua cac module da PASS.
 * Teacher/owner key la co che thu nghiem, khong an toan cho ung dung cong khai nhieu nguoi.
 */
function mathoraV1Ui(){
  return HtmlService.createHtmlOutputFromFile('MathoraWebV1')
    .setTitle('MATHORA OLYMPIAD | Quy trinh that V1')
    .addMetaTag('viewport','width=device-width,initial-scale=1');
}
function mathoraV1Dispatch_(request){
  try{
    if(!request||typeof request!=='object'||Array.isArray(request))throw Error('Yeu cau khong hop le.');
    const action=String(request.action||'');
    const owner=maAuthorized_(request.key,'MATHORA_OWNER_KEY');
    const teacher=owner||maAuthorized_(request.key,'MATHORA_TEACHER_KEY');
    if(!teacher)return {ok:false,error:'Khong co quyen. Kiem tra ma truy cap giao vien/chu so huu.'};
    const payload=request.payload&&typeof request.payload==='object'&&!Array.isArray(request.payload)?request.payload:{};
    if(JSON.stringify(payload).length>80000)throw Error('Du lieu gui len qua lon.');
    switch(action){
      case 'health':return {ok:true,service:'MATHORA',backend:MA.VERSION,role:owner?'owner':'teacher',dbConfigured:!!maProp_('MATHORA_DB_ID'),aiConfigured:!!maProp_('MATHORA_GEMINI_KEY'),note:'Co cau hinh khong dong nghia da kiem thu ket noi.'};
      case 'generateDraft':return maGenerate_(payload);
      case 'stageDraft':
        if(!payload.problem||!String(payload.problem.short_answer||'').trim())return {ok:false,error:'Can dap an tra loi ngan truoc khi luu STAGING.'};
        return maSave_({problem:payload.problem,source:'WEB_V1_TEACHER'});
      case 'listPending':return ma23ListPending_({status:payload.status===undefined?'WAITING_HUMAN':payload.status,limit:payload.limit||40});
      case 'getPending':return ma23GetPending_({id:payload.id});
      case 'rejectPending':if(!owner)return {ok:false,error:'Chi owner duoc tu choi.'};return ma23RejectPending_({id:payload.id,reason:payload.reason});
      case 'attestPending':if(!owner)return {ok:false,error:'Chi owner duoc xac nhan minh chung.'};return ma23AttestPending_({id:payload.id,expectedHash:payload.expectedHash,humanReviewed:payload.humanReviewed===true,evidence:payload.evidence});
      case 'listKho':return maList_({status:payload.status||'',limit:payload.limit||40});
      case 'getProblem':return maGet_({id:payload.id});
      case 'approveProblem':if(!owner)return {ok:false,error:'Chi owner duoc duyet.'};return maApprove_({id:payload.id,expectedVersion:payload.expectedVersion,expectedHash:payload.expectedHash,humanReviewed:payload.humanReviewed===true,reviewNote:payload.reviewNote});
      case 'listExamEligible':return ma23ListExamEligible_({limit:payload.limit||40});
      default:return {ok:false,error:'Thao tac chua duoc ho tro.'};
    }
  }catch(ex){return {ok:false,error:String(ex&&ex.message||ex).slice(0,350)};}
}
function mathoraV1Bridge(request){
  try{return JSON.parse(JSON.stringify(mathoraV1Dispatch_(request)));}
  catch(ex){return {ok:false,error:String(ex&&ex.message||ex).slice(0,350)};}
}
