/* MATHORA Creative Quality Gate V1: deterministic triage, not novelty proof.
 * Browser global MathoraCreativeGate; CommonJS export for Node tests.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.MathoraCreativeGate=api;
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const knownFamilies=Object.freeze([
  {
    id:'NESTED_CUBIC_X3_MINUS_3X',
    label:'Hợp hàm bậc ba Chebyshev quen thuộc',
    test:function(statement){
      const s=String(statement||'').toLowerCase()
        .replace(/\s+/g,'').replace(/\\left|\\right/g,'')
        .replace(/\{/g,'').replace(/\}/g,'')
        .replace(/\\,/g,'').replace(/−/g,'-');
      const cubic=/(?:f\(x\)=|f\(x\):=)?x(?:\^3|\^\{3\})-3x/.test(s);
      const nested=/f\(f\(x\)\)(?:=|\\equiv)/.test(s);
      return cubic&&nested;
    }
  }
]);
function field(p,key,min){
  const v=p&&p[key];
  return typeof v==='string'&&v.trim().length>=min;
}
function sourceIsUnverified(v){
 const s=String(v||'').toLowerCase();
 return !s||/chưa\s+(xác minh|đối chiếu|kiểm)|not\s+(verified|checked)|unknown|không có nguồn|chưa có nguồn/.test(s);
}
function inspect(payload){
 const p=payload?.result||payload?.draft?.result||payload||{};
 const blockers=[],warnings=[];
 if(!field(p,'statement_latex',12))blockers.push('Thiếu đề bài đầy đủ.');
 if(!field(p,'solution_latex',25))blockers.push('Thiếu lời giải có thể kiểm chứng.');
 if(!field(p,'answer_latex',1))blockers.push('Chưa có đáp án hoặc kết luận.');
 if(!field(p,'creative_core',45))blockers.push('Chưa mô tả được hạt nhân biến đổi cấu trúc khác bài nguồn.');
 if(!field(p,'alternative_paths',30))blockers.push('Chưa phân tích phương án sáng tạo khác và lý do loại.');
 if(!field(p,'shortcut_risk',25))blockers.push('Chưa kiểm tra nguy cơ có cách giải tắt đơn giản.');
 if(!field(p,'proof_risk',25))blockers.push('Chưa đánh giá điểm yếu lập luận và trường hợp biên.');
 if(!field(p,'difficulty_rationale',30))blockers.push('Chưa có căn cứ về độ khó HSG.');
 if(Array.isArray(payload?.blockers)&&payload.blockers.length)
   blockers.push('Bản nháp AI còn báo lỗi hoặc thiếu minh chứng.');
 const matches=knownFamilies.filter(x=>x.test(p.statement_latex)).map(x=>({id:x.id,label:x.label}));
 if(matches.length)blockers.push('Cấu trúc trùng họ bài toán quen thuộc đã nhận diện: '+matches.map(x=>x.label).join(', ')+'.');
 if(sourceIsUnverified(p.source_check))warnings.push('Chưa đối chiếu nguồn bên ngoài; không được kết luận tính mới.');
 else warnings.push('AI khai đã đối chiếu nguồn; giáo viên vẫn phải kiểm tra tài liệu và đối chiếu thực tế.');
 warnings.push('Không thể xác nhận tính mới chỉ từ kết quả tạo bởi AI hoặc so khớp mẫu tự động.');
 const status=matches.length?'REJECT_COMMON_PATTERN':blockers.length?'NEEDS_REVISION':'RESEARCH_REVIEW_REQUIRED';
 return {status,blockers,warnings,knownPatternMatches:matches,
   noveltyVerified:false,teacherApproved:false,studentReleaseAllowed:false,
   requiredChecks:['Giải độc lập','Phản biện Toán','Đối chiếu nguồn','Kiểm tra độ khó và Casio','Giáo viên duyệt']};
}
function makeStudentDraft(payload){
 const review=inspect(payload);
 if(review.blockers.length)throw Error('Bài đang bị chặn: '+review.blockers.join(' '));
 // A student-facing publication is deliberately unavailable in client-side gate.
 throw Error('Chưa thể xuất đề giao học sinh: cần duyệt và lưu trạng thái ở Backend có xác thực.');
}
return Object.freeze({inspect,makeStudentDraft,knownFamilies});
});
