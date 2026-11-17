/**
 * MCCS — Gemini server LAB v1.0 | Google Apps Script standalone project.
 * NO anonymous execution, NO public API key, NO automatic approval.
 * Script Properties REQUIRED:
 *   MCCS_GEMINI_KEY, MCCS_GOOGLE_CLIENT_ID, MCCS_ALLOWED_EMAILS
 * OPTIONAL: MCCS_MODEL (previously tested: gemini-3.1-flash-lite).
 * Deploy in separate LAB script; do not replace existing EDOS/MATHORA endpoint.
 */
var MCCS_VERSION = "mccs-lab-1.0";
function MCCS_json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function MCCS_props_() { return PropertiesService.getScriptProperties(); }
function MCCS_error_(code, message) { return {ok:false, code:code, message:message, version:MCCS_VERSION}; }
function MCCS_id_(token) {
  if (typeof token!=="string" || token.length<50 || token.length>12000) throw new Error("MISSING_ID_TOKEN");
  var props=MCCS_props_();
  var audience=props.getProperty("MCCS_GOOGLE_CLIENT_ID");
  var allow=(props.getProperty("MCCS_ALLOWED_EMAILS")||"").split(",").map(function(s){return s.trim().toLowerCase();}).filter(String);
  if(!audience||!allow.length) throw new Error("AUTH_NOT_CONFIGURED");
  var response=UrlFetchApp.fetch("https://oauth2.googleapis.com/tokeninfo",{
    method:"post",payload:{"id_token":token},muteHttpExceptions:true,followRedirects:true
  });
  if(response.getResponseCode()!==200) throw new Error("INVALID_ID_TOKEN");
  var claims=JSON.parse(response.getContentText());
  var email=String(claims.email||"").toLowerCase();
  if(claims.aud!==audience || claims.email_verified!==true && claims.email_verified!=="true")
    throw new Error("INVALID_TOKEN_AUDIENCE_OR_EMAIL");
  if(!email || allow.indexOf(email)<0) throw new Error("NOT_AUTHORIZED");
  return email;
}
function MCCS_assertCommand_(id) {
  if(!/^MCCS-(0[0-9]|1[0-7])$/.test(String(id||""))) throw new Error("UNKNOWN_COMMAND");
}
function MCCS_requireText_(value, max) {
  if(typeof value!=="string" || !value.trim() || value.length>max) throw new Error("INVALID_INPUT");
  return value.trim();
}
function MCCS_generate_(system, prompt, temperature) {
  var props=MCCS_props_();
  var key=props.getProperty("MCCS_GEMINI_KEY");
  var model=props.getProperty("MCCS_MODEL")||"gemini-3.1-flash-lite";
  if(!key) throw new Error("GEMINI_NOT_CONFIGURED");
  if(!/^[a-zA-Z0-9_.-]+$/.test(model))throw new Error("INVALID_MODEL");
  var body={
    systemInstruction:{parts:[{text:system}]},
    contents:[{role:"user",parts:[{text:prompt}]}],
    generationConfig:{temperature:temperature,maxOutputTokens:4096,responseMimeType:"application/json"}
  };
  var url="https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent";
  var res=UrlFetchApp.fetch(url,{method:"post",contentType:"application/json",headers:{"x-goog-api-key":key},
      payload:JSON.stringify(body),muteHttpExceptions:true});
  if(res.getResponseCode()!==200)throw new Error("GEMINI_HTTP_"+res.getResponseCode());
  var data=JSON.parse(res.getContentText());
  var parts=((data.candidates||[])[0]||{}).content;
  var raw=(parts&&parts.parts||[]).map(function(p){return p.text||"";}).join("");
  if(!raw)throw new Error("EMPTY_GEMINI_RESULT");
  try{return JSON.parse(raw);}catch(e){return {status:"NEEDS_REVIEW",raw_response:raw,parse_error:true};}
}
var MCCS_CREATE_RULES_=[
 "Bạn là MATHORA MCCS LAB, trợ lý đề Toán HSG THPT. Trả về JSON hợp lệ.",
 "Không bịa nguồn, toàn văn đề, chứng minh, yêu cầu CT2018. Bản tóm tắt RAG không thay toàn văn đề.",
 "Lời giải đầy đủ, kiểm tra điều kiện, nghiệm ngoại lai, đơn vị, đối chiếu chương trình.",
 "Không tuyên bố bài mới chỉ vì đổi số. Không tự phong APPROVED/PASS.",
 "Nếu thiếu minh chứng: status=NEEDS_REVIEW, blockers nêu rõ.",
 "Trường hợp mái trụ parabol: ưu tiên chặn dưới dây cung/chặn trên tiếp tuyến; không bắt buộc tích phân chiều dài cung.",
 "Output fields: status, problem, solution, alternative_solution, competency_evidence, curriculum_review, source_trace, casio_review, blockers."
].join("\n");
var MCCS_REVIEW_MATH_=[
 "Vai trò: PHẢN BIỆN TOÁN HỌC ĐỘC LẬP, ngữ cảnh gọi riêng không có kết luận của vòng khác.",
 "Kiểm tra tồn tại, điều kiện, chứng minh, đáp án, phản ví dụ, ví dụ suy biến, hình vẽ và đơn vị.",
 "Trả JSON gồm review_type, verified_claims, errors, counterexamples, corrected_solution, decision (NEEDS_REVIEW hoặc READY_FOR_HUMAN_REVIEW).",
 "Không phê duyệt, không dựa vào kết luận của người đề xuất."
].join("\\n");
var MCCS_REVIEW_CURRICULUM_=[
 "Vai trò: PHẢN BIỆN CTGDPT 2018 VÀ KHẢO THÍ ĐỘC LẬP; ngữ cảnh gọi riêng.",
 "Đối chiếu phạm vi chương trình, thời điểm đã học (không tự giả định), yêu cầu cần đạt cụ thể, minh chứng năng lực, ma trận và khả năng chấm.",
 "Không mặc định độ dài cung bằng tích phân thuộc chương trình phổ thông; không tự gọi một bài thực tế là MHH VDC.",
 "Trả JSON gồm review_type, curriculum_flags, competency_evidence, matrix_issues, decision, blockers.",
 "Nếu không có nguồn văn bản CTGDPT 2018, ghi UNVERIFIED thay vì bịa điều khoản."
].join("\\n");
var MCCS_REVIEW_NOVELTY_=[
 "Vai trò: PHẢN BIỆN TÍNH MỚI, ĐỘ PHÂN HÓA VÀ CASIO ĐỘC LẬP; ngữ cảnh gọi riêng.",
 "So sánh cấu trúc lời giải so với các nguồn ĐÃ ĐƯỢC CẤP trong đầu vào; không tự nói đã tìm kiếm toàn bộ internet.",
 "Chỉ ra lối giải nhanh, khả năng kiểm tra bằng máy tính Casio và giá trị sáng tạo toán học; thay số không tạo tính mới.",
 "Trả JSON gồm review_type, structural_comparison, casio_shortcut_risk, difficulty_rationale, decision, blockers.",
 "Không tuyên bố chống Casio tuyệt đối hoặc hoàn toàn mới nếu chưa có log kiểm thử, đối chiếu."
].join("\\n");
function MCCS_execute_(body, email) {
 MCCS_assertCommand_(body.command_id);
 var request=MCCS_requireText_(body.request,6000);
 var topic=String(body.topic||"").slice(0,250), source=String(body.source_id||"").slice(0,150);
 var mode=String(body.mode||"propose");
 if(["propose","review3"].indexOf(mode)<0)throw new Error("INVALID_MODE");
 var context="MÃ: "+body.command_id+"\\nCHỦ ĐỀ: "+topic+"\\nNGUỒN CHƯA XÁC MINH (không được suy diễn đề gốc): "+source+"\\nYÊU CẦU GỐC:\\n"+request;
 var result,callCount;
 if(mode==="review3"){
   var draft=MCCS_requireText_(body.draft_json,18000);
   var reviewPrompt=context+"\\n\\nBẢN NHÁP CẦN PHẢN BIỆN:\\n"+draft;
   // Three entirely fresh requests with DISTINCT system instructions.
   result={
      math:MCCS_generate_(MCCS_REVIEW_MATH_,reviewPrompt,0.1),
      curriculum:MCCS_generate_(MCCS_REVIEW_CURRICULUM_,reviewPrompt,0.1),
      novelty:MCCS_generate_(MCCS_REVIEW_NOVELTY_,reviewPrompt,0.1)
   };
   callCount=3;
 }else{
   result=MCCS_generate_(MCCS_CREATE_RULES_,context,0.5);
   callCount=1;
 }
 // Never accept model self-approval as an approval gate.
 return {ok:true,service:"MCCS_LAB",version:MCCS_VERSION,mode:mode,command_id:body.command_id,
   status:"NEEDS_REVIEW",teacher_approved:false,
   reviewer_calls_separate:mode==="review3",reviewer_call_count:callCount,
   result:result,response_generated_at:new Date().toISOString()};
}
function doGet(e){return MCCS_json_({ok:true,service:"MCCS_LAB",version:MCCS_VERSION,ai_call_available:false,
  note:"Health does not prove Google sign-in or Gemini access. POST requires verified Google ID token."});}
function doPost(e) {
  try {
    if(!e||!e.postData||!e.postData.contents||e.postData.contents.length>32000)
      return MCCS_json_(MCCS_error_("BAD_REQUEST","Missing or oversize request"));
    var body=JSON.parse(e.postData.contents);
    // VERIFY before accessing or executing the model.
    var email=MCCS_id_(body.id_token);
    // Validate before spending the teacher's rate limit slot.
    MCCS_assertCommand_(body.command_id);
    MCCS_requireText_(body.request,6000);
    if(body.mode!=="propose"&&body.mode!=="review3") throw new Error("INVALID_MODE");
    if(body.mode==="review3") MCCS_requireText_(body.draft_json,18000);
    var cache=CacheService.getScriptCache();
    var rateKey="mccs-rate-"+Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,email)).slice(0,30);
    if(cache.get(rateKey))return MCCS_json_(MCCS_error_("RATE_LIMITED","Try again after the 15-second cooldown"));
    cache.put(rateKey,"1",15);
    return MCCS_json_(MCCS_execute_(body,email));
  } catch(err) {
    var msg=String(err.message||err);
    // No stack, key or full request in response or logs.
    if(/^GEMINI_HTTP_/.test(msg))return MCCS_json_(MCCS_error_("UPSTREAM_FAILURE",msg));
    var code=/^(MISSING_ID_TOKEN|AUTH_NOT_CONFIGURED|INVALID_ID_TOKEN|INVALID_TOKEN_AUDIENCE_OR_EMAIL|NOT_AUTHORIZED|UNKNOWN_COMMAND|INVALID_INPUT|INVALID_MODE|GEMINI_NOT_CONFIGURED|RATE_LIMITED|EMPTY_GEMINI_RESULT|INVALID_MODEL)$/.test(msg)?msg:"EXECUTION_ERROR";
    return MCCS_json_(MCCS_error_(code,code==="EXECUTION_ERROR"?"The server could not complete the request":msg));
  }
}
/** Pure local sanity checks inside the Apps Script editor (NO Gemini request). */
function MCCS_selfTest() {
 var ids=["MCCS-00","MCCS-17"];ids.forEach(MCCS_assertCommand_);
 var rejected=false;try{MCCS_assertCommand_("MCCS-18");}catch(e){rejected=true;}
 if(!rejected)throw new Error("command gate failed");
 if(MCCS_requireText_("  math  ",100)!=="math")throw new Error("validation failed");
 return {ok:true,tests:4,model_executed:false};
}
