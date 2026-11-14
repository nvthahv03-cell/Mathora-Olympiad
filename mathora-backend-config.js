/* MATHORA – cau hinh cong khai. Khong dua API key, teacher/owner key vao file nay. */
window.MATHORA_BACKEND_CONFIG = Object.freeze({
  endpoint: "https://script.google.com/macros/s/AKfycbwJVgZj04G1gWfdTzt-3lJlcXBLJW6Z7-zCbK-s99DzNy_-PAcvZwhtrALyz2QvTDolyw/exec",
  healthUrl: "https://script.google.com/macros/s/AKfycbwJVgZj04G1gWfdTzt-3lJlcXBLJW6Z7-zCbK-s99DzNy_-PAcvZwhtrALyz2QvTDolyw/exec?action=health",
  expectedService: "MATHORA",
  expectedVersion: "2.3-controlled-staging",
  connectionStatus: "DIRECT_GAS_AUTH_PENDING",
  googleClientId: "", // Google OAuth Web Client ID cong khai (khong phai secret)
  writeEnabled: false,
  note: "Frontend GitHub Pages POST text/plain truc tiep Apps Script V2.3. Yeu cau doPost xac thuc Google ID token va Google OAuth Web Client ID. Chua PASS tich hop."
});
