/**
 * MATHORA Training Round 1 — Gemini LAB smoke test.
 * Thêm như tệp .gs RIÊNG trong một bản sao Apps Script (không sửa Backend V2.6).
 * Không doPost/doGet; không ghi Sheets/Cache/STAGING; không gọi hàm phê duyệt.
 * Chỉ gọi khi GV chủ động chạy mathoraTrainingR1Test01() trong trình biên tập.
 * 1 lần chạy = 1 Gemini request. Không log API key hoặc dữ liệu bí mật.
 */
function mathoraTrainingR1Test01() {
  return mathoraTrainingR1Run_('T01');
}
function mathoraTrainingR1Test06() {
  return mathoraTrainingR1Run_('T06');
}
function mathoraTrainingR1Run_(id) {
  var cases = {
    T01: {
      question: 'Trong tứ diện ABCD biết AB vuông góc CD. Hãy dùng GEO3-001 để chứng minh AD vuông góc BC.',
      expected: 'BÁC BỎ vì thiếu AC vuông góc BD.'
    },
    T06: {
      question: 'Một bài toán camera đã cho sẵn tất cả tọa độ, phương trình tia và mặt đất; chỉ yêu cầu tính giao điểm. Chấm năng lực mô hình hóa VDC được không?',
      expected: 'KHÔNG tự gắn VDC mô hình hóa vì HS không lập hay kiểm định mô hình.'
    }
  };
  var test = cases[id];
  if (!test) throw Error('Chỉ hỗ trợ T01 hoặc T06 trong bản smoke test.');
  var key = PropertiesService.getScriptProperties().getProperty('MATHORA_GEMINI_KEY');
  var model = PropertiesService.getScriptProperties().getProperty('MATHORA_GEMINI_MODEL') || 'gemini-3.1-flash-lite';
  if (!key) throw Error('Chưa có MATHORA_GEMINI_KEY trong Apps Script LAB.');
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw Error('Tên model không hợp lệ.');
  var knowledge = [
    'Vai trò: Trợ lý nghiên cứu MATHORA, không đoán hoặc tự phong PASS.',
    'Bổ đề GEO3-001: Trong tứ diện ABCD, nếu AB vuông góc CD VÀ AC vuông góc BD thì AD vuông góc BC.',
    'Chứng minh: AB·CD − AC·BD + AD·BC = 0. Thiếu một giả thiết thì không suy ra kết luận.',
    'Mô hình hóa: có bối cảnh thực tế không đủ; phải có hành vi thiết lập hoặc kiểm định mô hình do HS thực hiện.',
    'CT2018: kiểm tra phạm vi nội dung đã học trước kỳ thi; không tự nhận kiến thức ngoài chương trình là bắt buộc.',
    'Đáp ngắn gọn, lập luận theo kiến thức phổ thông. Trả về JSON: {"conclusion":"...","reasoning":"...","status":"RESEARCH_ONLY"}.'
  ].join('\n');
  var payload = JSON.stringify({
    contents: [{parts:[{text: knowledge + '\n\nTÌNH HUỐNG: ' + test.question}]}],
    generationConfig: {responseMimeType:'application/json',temperature:0,maxOutputTokens:700}
  });
  var url='https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
  var res=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',
    headers:{'x-goog-api-key':key},payload:payload,muteHttpExceptions:true});
  if(res.getResponseCode()!==200)
    throw Error('Gemini HTTP '+res.getResponseCode()+' — không lưu kết quả.');
  var obj=JSON.parse(res.getContentText());
  var candidate=(obj.candidates||[])[0]||{};
  var parts=((candidate.content||{}).parts||[]);
  var raw=parts.map(function(p){return p.text||'';}).join('');
  var answer;
  try{answer=JSON.parse(raw);}catch(e){answer={parse_error:true,raw_excerpt:raw.slice(0,400)};}
  var out={test:id,model:model,expected:test.expected,actual:answer,
    verdict:'PENDING_HUMAN_REVIEW',geminiCalls:1,sheetWrites:0};
  Logger.log(JSON.stringify(out));
  return out;
}
