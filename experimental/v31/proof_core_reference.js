/* MATHORA V3.1 mathematical theorem reference — read README before use.
 * NOT the complete Apps Script installable module. DO NOT DEPLOY.
 */
'use strict';
const SIGNATURE='SYM_EXP__CUBIC_THREE_T_GT2__DISCRIMINANT_BOUNDARY';
function validParams(p){
  if(!p||p.family!=='SYM_EXP_DEPRESSED_CUBIC_SIX')throw Error('UNVERIFIED_FAMILY');
  if(!Number.isSafeInteger(p.base)||p.base<2||p.base>5)throw Error('BAD_BASE');
  if(!Number.isSafeInteger(p.d)||p.d<2||p.d>6)throw Error('BAD_D');
  if(!Number.isSafeInteger(p.mMin)||p.mMin< -30||p.mMin> -1)throw Error('BAD_MIN');
  if(!Number.isSafeInteger(p.mMax)||p.mMax<1||p.mMax>30)throw Error('BAD_MAX');
  return {family:p.family,base:p.base,d:p.d,mMin:p.mMin,mMax:p.mMax};
}
function sixSolutions(d,m){return Number.isSafeInteger(d)&&Number.isSafeInteger(m)&&m<0&&27*m*m<4*d**6;}
function createCandidate(raw){
  const p=validParams(raw),ms=[];
  for(let m=p.mMin;m<=p.mMax;m++)if(sixSolutions(p.d,m))ms.push(m);
  const A=p.d+2;
  const certificate={signature:SIGNATURE,params:p,validMs:ms,answer:String(ms.length),
    theorem:'6 distinct x iff m<0 and 27m^2<4d^6'};
  return {certificate,statement:'Let t=b^x+b^(-x), u=t-(d+2); u^3-d^2u+m=0; count m giving exactly 6 real x.',
    short_answer:String(ms.length),stageAllowed:false,hsgCertified:false};
}
function verifyCandidate(item){
  try{
    if(!item||!item.certificate)throw Error('NO_CERTIFICATE');
    const expected=createCandidate(item.certificate.params);
    if(JSON.stringify(item)!==JSON.stringify(expected))throw Error('TAMPERED_OR_NOT_CANONICAL');
    return {ok:true,status:'PROVEN_WITHIN_SUPPORTED_TEMPLATE',stageAllowed:false,hsgCertified:false};
  }catch(e){return {ok:false,status:'UNVERIFIED',reason:String(e.message),stageAllowed:false,hsgCertified:false};}
}
function auditNovelty(item,priorSignatures=[]){
  const v=verifyCandidate(item);
  if(!v.ok)return {status:'BLOCKED_UNVERIFIED',stageAllowed:false};
  const repeat=priorSignatures.includes(SIGNATURE);
  return {status:repeat?'REPEATED_STRUCTURE':'PROOF_OK_AWAITING_ACADEMIC_REVIEW',
    stageAllowed:false,difficulty:'UNRATED_FOR_CITY_HSG',
    casioRisk:'MEDIUM_TO_HIGH_ON_FINITE_INTERVAL',
    recommendation:repeat?'REJECT_AS_NEW_CREATION':'TEACHER_REVIEW_ONLY'};
}
function testV31Reference(){
  const p={family:'SYM_EXP_DEPRESSED_CUBIC_SIX',base:2,d:2,mMin:-10,mMax:10};
  const c=createCandidate(p); if(c.short_answer!=='3'||c.certificate.validMs.join(',')!=='-3,-2,-1')throw Error('COUNT');
  if(!verifyCandidate(c).ok)throw Error('CERT');
  if(auditNovelty(c,[SIGNATURE]).status!=='REPEATED_STRUCTURE')throw Error('NOVELTY');
  const bad=JSON.parse(JSON.stringify(c));bad.short_answer='4';
  if(verifyCandidate(bad).ok)throw Error('TAMPER');
  for(let d=2;d<=6;d++)for(let m=-30;m<=30;m++){
    if(sixSolutions(d,m)!==(m<0&&27*m*m<4*d**6))throw Error('CRITERION');
  }
  return {ok:true,stageAllowed:false};
}
