/* MATHORA – cau hinh cong khai. Khong dua API key, teacher/owner key vao file nay. */
window.MATHORA_BACKEND_CONFIG = Object.freeze({
  endpoint: "https://script.google.com/macros/s/AKfycbwJVgZj04G1gWfdTzt-3lJlcXBLJW6Z7-zCbK-s99DzNy_-PAcvZwhtrALyz2QvTDolyw/exec",
  healthUrl: "https://script.google.com/macros/s/AKfycbwJVgZj04G1gWfdTzt-3lJlcXBLJW6Z7-zCbK-s99DzNy_-PAcvZwhtrALyz2QvTDolyw/exec?action=health",
  expectedService: "MATHORA",
  expectedVersion: "2.3-controlled-staging",
  connectionStatus: "PENDING_VERIFICATION",
  gatewayUrl: "", // URL Cloudflare Worker trusted gateway, public origin only
  googleClientId: "", // Google OAuth Web Client ID (public identifier, not secret)
  writeEnabled: false,
  note: "Frontend GitHub Pages; Backend Apps Script V2.3. Chua kich hoat cac thao tac POST truoc khi co xac thuc phia may chu va kiem thu CORS."
});
