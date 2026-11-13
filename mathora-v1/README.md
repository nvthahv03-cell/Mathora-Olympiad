# MATHORA OLYMPIAD — Apps Script integration V1 (development)

> **Work in progress; not deployed.** This directory is isolated from the legacy MathSphere `main` branch.

## Architecture
- Google Apps Script: Gemini calls, mathematical validation, human attestation, publishing controls.
- Google Sheets: draft, staging, review and approved problem records.
- `MathoraWebV1.gs`: whitelisted bridge to pre-existing Backend V2.3 functions.
- `MathoraWebV1.html`: required client HTML **not yet committed to this branch**. Do not deploy bridge alone.

## Backend prerequisites
Preserve existing `MATHORA.gs` V2.3, `MathoraSangTaoPro.gs` V2.3.1 and `MathoraKiemDinhDaThucV2.gs`.
In an Apps Script **test copy**, add to existing `doGet` handler:
```js
if(action==='app')return mathoraV1Ui();
```
Do **not** replace `doGet` wholesale.

## Security and acceptance
Never publish API keys, teacher/owner keys or student data in GitHub. Existing teacher/owner key authentication is a prototype, not production SSO. A public GAS deployment must undergo access-control review.

Release requires: complete HTML committed; syntax/contract checks; isolated GAS deployment; real Gemini + Sheets smoke test; teacher/owner authorization tests; a blocked draft staying blocked; audited human approval to official bank.

## Status (2026-11-13)
Repository rename confirmed; development branch created; bridge committed. The full five-file package is available separately in the conversation, but has **not** yet been entirely committed. No production deployment or end-to-end PASS.
