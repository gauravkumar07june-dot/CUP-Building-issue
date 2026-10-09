// CUP Building Issue Register - settings. This is the only website file you need to edit.
window.CUP_CONFIG = {
  // Paste the Web app URL from Google Apps Script here (it ends with /exec).
  // While this is empty the site runs in DEMO mode: issues stay in your own browser only.
  apiUrl: "",

  // Shown on the sign-in screen. The real check is ALLOWED_DOMAIN in Code.gs.
  emailDomain: "lntecc.com",

  // CUP completion target (YYYY-MM-DD)
  targetDate: "2026-12-31",

  departments: ["HVAC", "PHE", "FPS", "FMCS I&C", "FMCS PLC & RIO", "Electrical MV", "Electrical LV", "Chiller",
    "Cooling Tower", "CDA", "LSS", "Security System", "IT & Telecom", "Elevator", "UG & Trestle", "Civil & Structure",
    "Architecture", "Design / Engineering", "Procurement", "Planning", "QA/QC", "EHS", "Client / Consultant", "Management"]
};
