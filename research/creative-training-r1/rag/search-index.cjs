/**
 * MATHORA RAG Research Index V1 — PURE JS, OFFLINE.
 * Node: node rag/search-index.cjs
 * No secrets, network, user uploads or Gemini connections.
 * Summary-only records NEVER become generation-approved.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const questions = JSON.parse(fs.readFileSync(path.join(root,'questions.research-index.json'),'utf8')).records;
const sources = JSON.parse(fs.readFileSync(path.join(root,'source-manifest.json'),'utf8')).records;
const sourceById = new Map(sources.map(s=>[s.id,s]));
if(questions.length!==73||sources.length!==22) throw Error('Unexpected inventory size');
const accents = str=>String(str||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const tokens = str=>accents(str).match(/[a-z0-9]+/g)||[];
function search({query='',primary_topic='',province='',limit=10}={}) {
  const terms=[...new Set(tokens(query))];
  return questions.filter(q=>(!primary_topic||q.primary_topic_legacy===primary_topic)
   &&(!province||accents(q.locality).includes(accents(province))))
   .map(q=>{
      const hay=tokens([q.question_summary,q.structure_summary,q.primary_topic_legacy,q.secondary_topics_legacy.join(' '),q.locality].join(' '));
      const score=terms.reduce((n,t)=>n+(hay.includes(t)?1:0),0);
      return {id:q.id,score,source_id:q.source_id,locality:q.locality,academic_year:q.academic_year,question_position:q.question_position,
       topic:q.primary_topic_legacy,summary:q.question_summary,source_url:q.source_url,stage:q.stage,
       use_for_generation:q.approved_for_generation===true&&q.full_question_ingested===true&&q.rigor_verified===true};
   }).filter(x=>!terms.length||x.score>0).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,Math.max(1,Math.min(50,limit)));
}
function getForGeneration(id) {
 const q=questions.find(q=>q.id===id);
 if(!q) return {ok:false,reason:'NOT_FOUND'};
 const s=sourceById.get(q.source_id);
 if(!s) return {ok:false,reason:'UNVERIFIED_SOURCE_ID'};
 if(!q.approved_for_generation||!q.full_question_ingested||!q.rigor_verified||!s.asset_ingested)
  return {ok:false,reason:'RESEARCH_ONLY_NOT_VERIFIED',id,stage:q.stage,source_id:s.id};
 return {ok:true,record:q};
}
function selfTest(){
 const assert=require('node:assert/strict');
 assert.equal(questions.length,73);assert.equal(sources.length,22);
 assert.equal(new Set(questions.map(x=>x.id)).size,73);
 assert.equal(new Set(sources.map(x=>x.id)).size,22);
 assert.equal(search({query:'hinh chieu',limit:50}).length>0,true);
 assert.equal(search({primary_topic:'CĐ06',limit:50}).every(x=>x.topic==='CĐ06'),true);
 for(const q of questions)assert.equal(getForGeneration(q.id).ok,false,'Unverified question must be blocked');
 for(const s of sources)assert.equal(s.asset_ingested,false);
 assert.equal(sources.find(x=>x.id==='DN25v').duplicate_of,'DN25');
 assert.equal(questions.filter(x=>x.flags.includes('LEGACY_SECTION_METHOD_REVIEW')).length,2);
 return {pass:true,checks:8,sources:sources.length,questions:questions.length,for_generation:0};
}
if(require.main===module){
 console.log('SELF-TEST',JSON.stringify(selfTest()));
 console.log('SAMPLE',JSON.stringify(search({query:'hinh chieu khoang cach',limit:5}),null,2));
}
module.exports={search,getForGeneration,selfTest};
