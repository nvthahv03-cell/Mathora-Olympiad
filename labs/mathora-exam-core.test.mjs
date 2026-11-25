import test from "node:test";
import assert from "node:assert/strict";
import {demoQuestions,evaluateAttempt,isComplete,normalizeNumber,scoreTrueFalse,TRUE_FALSE_POINTS} from "./mathora-exam-core.mjs";

test("full correct answer gets 1.75 points",()=>{
 const a={Q01:"C",Q02:["D","S","D","D"],Q03:"7"};
 assert.equal(isComplete(a),true);
 assert.deepEqual(evaluateAttempt(a).earned,1.75);
 assert.equal(evaluateAttempt(a).mistakes.length,0);
});
test("wrong TF substatement is individually remediated",()=>{
 const a={Q01:"A",Q02:["D","D","D","D"],Q03:"8"};
 const r=evaluateAttempt(a);
 assert.equal(r.earned,0.5);
 assert.deepEqual(r.mistakes.map(e=>[e.id,e.part]),[["Q01",null],["Q02",1],["Q03",null]]);
});
test("true-false scoring scale 0,1,2,3,4 correct statements",()=>{
 const right=["D","S","D","D"];
 const wrong=["S","D","S","S"];
 for(const [count,expected] of TRUE_FALSE_POINTS.entries()){
   const given=right.map((v,i)=>i<count?v:wrong[i]);
   const result=scoreTrueFalse(right,given);
   assert.equal(result.correctCount,count);
   assert.equal(result.points,expected);
 }
 assert.equal(scoreTrueFalse(right,[]).points,0);
 assert.throws(()=>scoreTrueFalse(["D","S"],[]));
});
test("MCQ and short answer weigh 0.25 and 0.5 exactly",()=>{
 const onlyMC=evaluateAttempt({Q01:"C",Q02:["S","D","S","S"],Q03:"8"});
 assert.equal(onlyMC.earned,0.25);
 const onlyShort=evaluateAttempt({Q01:"A",Q02:["S","D","S","S"],Q03:"7"});
 assert.equal(onlyShort.earned,0.5);
 assert.equal(onlyMC.total,1.75);
 assert.equal(evaluateAttempt({Q01:"C",Q02:["D","S","D","S"],Q03:"7"}).earned,1.25);
});
test("no answer is not silently accepted as correct",()=>{
 assert.equal(isComplete({}),false);
 assert.equal(evaluateAttempt({}).earned,0);
});
test("decimal comma and invalid answer checks",()=>{
 assert.equal(normalizeNumber("7,0"),7);
 assert.equal(normalizeNumber("7/1"),null);
 assert.equal(normalizeNumber("7abc"),null);
 assert.equal(evaluateAttempt({Q01:"C",Q02:["D","S","D","D"],Q03:"7,0"}).earned,1.75);
});
