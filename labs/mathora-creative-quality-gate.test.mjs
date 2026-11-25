import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const gate=require('./mathora-creative-quality-gate.js');
function candidate(overrides={}){
 return {result:{
  statement_latex:'Tìm tham số m để phương trình g(x)=m có đúng 2 nghiệm thực.',
  solution_latex:'Bước 1 xét đạo hàm. Bước 2 phân tích điều kiện, sau đó kết luận đầy đủ.',
  answer_latex:'m=1',
  creative_core:'Khai thác một cấu trúc đảo điều kiện và phân tầng số nghiệm có chứng minh.',
  alternative_paths:'Đã so sánh hai hướng biến đổi cấu trúc và lý do loại hướng quen thuộc.',
  shortcut_risk:'Đã xét khả năng dùng đồ thị và cách giải tắt để phản biện độ khó.',
  proof_risk:'Đã xét miền xác định, tính tương đương và tất cả trường hợp biên.',
  difficulty_rationale:'Nút thắt chính yêu cầu phân tích tham số, chặn được cách thử số.',
  source_check:'CHƯA XÁC MINH tính mới.',
  ...overrides
 }};
}
test('reject known nested cubic f(f(x))=m even if AI praises it',()=>{
 const result=gate.inspect(candidate({statement_latex:'Cho f(x)=x^3-3x. Tìm m để f(f(x))=m có đúng 5 nghiệm.'}));
 assert.equal(result.status,'REJECT_COMMON_PATTERN');
 assert.equal(result.studentReleaseAllowed,false);
 assert.ok(result.knownPatternMatches.some(x=>x.id==='NESTED_CUBIC_X3_MINUS_3X'));
});
test('reject x^{3} variant',()=>{
 const result=gate.inspect(candidate({statement_latex:'f(x)=x^{3}-3x, f(f(x))=m'}));
 assert.equal(result.status,'REJECT_COMMON_PATTERN');
});
test('block missing mathematical and structural evidence',()=>{
 const result=gate.inspect(candidate({creative_core:'mới',solution_latex:'chưa giải',source_check:''}));
 assert.equal(result.status,'NEEDS_REVISION');
 assert.ok(result.blockers.some(x=>x.includes('hạt nhân')));
 assert.ok(result.blockers.some(x=>x.includes('lời giải')));
});
test('novelty unverified even with AI self-reported sources',()=>{
 const result=gate.inspect(candidate({source_check:'Tôi đã tìm kiếm, bài hoàn toàn mới trên thế giới.'}));
 assert.equal(result.status,'RESEARCH_REVIEW_REQUIRED');
 assert.equal(result.noveltyVerified,false);
 assert.equal(result.teacherApproved,false);
 assert.equal(result.studentReleaseAllowed,false);
 assert.throws(()=>gate.makeStudentDraft(candidate()),/duyệt/);
});
test('AI blockers trigger revision',()=>{
 const result=gate.inspect({...candidate(),blockers:['Chưa kiểm tra nghiệm biên']});
 assert.equal(result.status,'NEEDS_REVISION');
});
