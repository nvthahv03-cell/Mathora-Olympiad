/* MATHORA MCCS — PUBLIC LAB SETTINGS ONLY. NEVER place API keys or teacher tokens here.
 * A separate authorized teacher/admin must deploy MCCS_LAB.gs first.
 * Leave enabled:false until sign-in, endpoint permissions and cross-origin POST pass.
 */
window.MCCS_LAB_CONFIG=Object.freeze({
  enabled:false,
  endpoint:"",
  googleClientId:"",
  service:"MCCS_LAB",
  expectedVersion:"mccs-lab-1.0",
  note:"Gemini live execution is disabled until standalone LAB backend and verified Google login are configured."
});
