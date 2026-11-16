# MATHORA V3.1 — Proof-First Creative Pilot (NOT PRODUCTION)

**Status: independent mathematics pilot, DO NOT MERGE INTO MAIN.** The live V2.6 Apps Script and main-site login/STAGING are unchanged.

The full Apps Script package **MATHORA_V31_PROOF_FIRST_CREATIVE_PILOT.zip** was delivered separately in the conversation. This GitHub draft contains an independently runnable JavaScript reference of its mathematical theorem, plus an audit design note; it is **not** the entire Apps Script installable package.

## New verified theorem
For b>1, integer d>=2, A=d+2, t=b^x+b^(-x)>=2 and u=t-A>=-d, the equation u^3-d²u+m=0 has exactly **six distinct real x** iff **m<0 and 27m²<4d^6**. With b=2,d=2,m in [-10,10] valid m are -3,-2,-1 and the answer to **"how many?"** is **3**.

Proof: 3 distinct u-roots are equivalent to 27m²<4d^6. Since the derivative's first local maximum occurs at u=-d/sqrt(3) with positive value, H(-d)=m<0 is equivalent to the leftmost root being strictly greater than -d. Three u>-d yield 3 pairs ±x.

## Quality controls
* A certificate is checked by rebuilding the problem from canonical parameters. An arbitrary AI answer receives UNVERIFIED.
* Distinct parameter values are NOT distinct mathematical structures. Signature: SYM_EXP__CUBIC_THREE_T_GT2__DISCRIMINANT_BOUNDARY.
* Shortest solution is considered; Casio brute-force can be a shortcut on bounded intervals.
* Difficulty is UNRATED_FOR_CITY_HSG; teacher must review.
* stageAllowed=false; there is NO server route, no data writes, no permissions changed.

## Verified in separate delivered pilot
V3.0: TEST11 1564, TEST12 16, TEST13 5700; V3.1: TEST14 1284, TEST15 20. Independent cubic-root numerical spot-check: 305 cases, no mismatch. These are NOT live Apps Script test results for V3.1.

Do not promote until the full .gs has run in the existing Apps Script project, independent academic review is performed, and a secure versioned API is designed.