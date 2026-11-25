import test from "node:test";
import assert from "node:assert/strict";
import {demoQuestions,evaluateAttempt,isComplete,normalizeNumber} from "./mathora-exam-core.mjs";

test("full correct answer gets six demo points",()=>{
 const a={Q01:"C",Q02:["D","S","D","D"],Q03:"7"};
 assert.equal(isComplete(a),true);
 assert.deepEqual(evaluateAttempt(a).earned,6);
 assert.equal(evaluateAttempt(a).mistakes.length,0);
});
test("wrong TF substatement is individually remediated",()=>{
 const a={Q01:"A",Q02:["D","D","D","D"],Q03:"8"};
 const r=evaluateAttempt(a);
 assert.equal(r.earned,3);
 assert.deepEqual(r.mistakes.map(e=>[e.id,e.part]),[["Q01",null],["Q02",1],["Q03",null]]);
});
test("no answer is not silently accepted as correct",()=>{
 assert.equal(isComplete({}),false);
 assert.equal(evaluateAttempt({}).earned,0);
});
test("decimal comma and invalid answer checks",()=>{
 assert.equal(normalizeNumber("7,0"),7);
 assert.equal(normalizeNumber("7/1"),null);
 assert.equal(normalizeNumber("7abc"),null);
 assert.equal(evaluateAttempt({Q01:"C",Q02:["D","S","D","D"],Q03:"7,0"}).earned,6);
});
