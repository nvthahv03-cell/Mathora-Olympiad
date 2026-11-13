# MATHORA OLYMPIAD — Apps Script integration V1 (development)

> **Work in progress; not deployed.** This directory is isolated from the legacy MathSphere `main` branch.

## Architecture
- Google Apps Script: Gemini calls, mathematical validation, human attestation, publishing controls.
- Google Sheets: draft, staging, review and approved problem records.
- `MathoraWebV1.gs`: whitelisted bridge to pre-existing Backend V2.3 functions.
- `MathoraWebV1.html`: required client HTML committed alongside the bridge. Deployment and end-to-end verification are **not yet complete**.

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
Repository rename confirmed; development branch created; bridge committed. The Apps Script bridge and HTML interface are committed. Supporting local tests are not yet committed. No production deployment or end-to-end PASS.

## Quy trình bắt buộc từ Kim Quy Pro (13/11/2026)

- [Quy trình quản lý mã nguồn, triển khai và nghiệm thu V1.0](docs/QUY_TRINH_KIM_QUY_PRO_V1.md)
- [Sổ trạng thái và hồ sơ module](docs/SO_THEO_DOI_MODULE.md)

Quy trình này là chuẩn quản trị phiên bản từ thời điểm tiếp nhận; mọi trạng thái PASS/LOCKED phải có bằng chứng phù hợp. Không sửa nhánh main hoặc triển khai production khi chưa nghiệm thu.
