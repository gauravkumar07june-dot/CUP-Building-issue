/**
 * CUP Building Issue Register - storage and sign-in script.
 * Paste this whole file into Extensions > Apps Script of your Google Sheet.
 * Edit the settings below, then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone).
 *
 * Sign-in: a person types their company email, this script emails them a 6-digit code,
 * and only after entering it can they see or add anything.
 */
const ALLOWED_DOMAIN = "lntecc.com";          // only emails ending with @lntecc.com can sign in
const MANAGER_EMAILS = [                       // people who can issue the FINAL DECISION
  "first.manager@lntecc.com"
];
const SESSION_DAYS = 30;                       // how long a phone/computer stays signed in

const SHEETS = {
  Issues: ["No", "RaisedOn", "Title", "Description", "RaisedBy", "Dept", "ActionFrom", "Category", "Location", "Severity", "RequiredBy", "IssueSince", "ProposedSolution", "RiskToTarget", "AISolution", "AIInfo", "ClosedOn", "ClosedBy", "RaisedByEmail"],
  Replies: ["IssueNo", "RepliedOn", "ReplyBy", "Dept", "Solution", "Email"],
  Decisions: ["IssueNo", "DecidedOn", "Decision", "ActionOwner", "TargetDate", "DecidedBy", "Email"]
};

function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, sh.getMaxRows(), SHEETS[name].length).setNumberFormat("@");
    sh.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}
function cell_(v) {
  if (Object.prototype.toString.call(v) === "[object Date]") return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  return v === null || v === undefined ? "" : String(v);
}
function rows_(name) {
  const head = SHEETS[name], v = sheet_(name).getDataRange().getValues();
  return v.slice(1).filter(function (r) { return r[0] !== ""; }).map(function (r) {
    const o = {}; head.forEach(function (h, i) { o[h] = cell_(r[i]); }); return o;
  });
}
// Text typed by users: limit length and stop it being read as a spreadsheet formula.
function safe_(s) { s = String(s === null || s === undefined ? "" : s).slice(0, 6000); return /^[=+\-@]/.test(s) ? " " + s : s; }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function findRow_(sh, no) {
  const col = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getValues();
  for (let i = 1; i < col.length; i++) if (String(col[i][0]) === String(no)) return i + 1;
  return 0;
}

/* ---------- sign-in ---------- */
function email_(s) { return String(s || "").trim().toLowerCase(); }
function allowed_(email) { return /^[a-z0-9._%+\-]+@[a-z0-9.\-]+$/.test(email) && email.slice(-(ALLOWED_DOMAIN.length + 1)) === "@" + ALLOWED_DOMAIN.toLowerCase(); }
function isManager_(email) { return MANAGER_EMAILS.map(email_).indexOf(email) >= 0; }
function requestCode_(email) {
  if (!allowed_(email)) return { ok: false, error: "not_allowed" };
  const cache = CacheService.getScriptCache();
  const sent = Number(cache.get("n:" + email) || 0);
  if (sent >= 5) return { ok: false, error: "too_many" };
  cache.put("n:" + email, String(sent + 1), 3600);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  cache.put("otp:" + email, JSON.stringify({ code: code, tries: 0 }), 600);
  MailApp.sendEmail(email, "CUP Issue Register sign-in code: " + code,
    "Your sign-in code for the CUP Building Issue Register is " + code + ".\n\nIt is valid for 10 minutes. If you did not ask for it, ignore this email.");
  return { ok: true };
}
function verifyCode_(email, code) {
  const cache = CacheService.getScriptCache(), raw = cache.get("otp:" + email);
  if (!raw || !allowed_(email)) return { ok: false, error: "code_expired" };
  const o = JSON.parse(raw);
  if (o.tries >= 5) { cache.remove("otp:" + email); return { ok: false, error: "code_expired" }; }
  if (String(code || "").trim() !== o.code) { o.tries++; cache.put("otp:" + email, JSON.stringify(o), 600); return { ok: false, error: "wrong_code" }; }
  cache.remove("otp:" + email);
  const token = Utilities.getUuid() + Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty("tok:" + token, JSON.stringify({ email: email, exp: Date.now() + SESSION_DAYS * 864e5 }));
  return { ok: true, token: token, email: email, isManager: isManager_(email) };
}
function session_(token) {
  if (!token || !/^[a-f0-9\-]{20,100}$/.test(token)) return null;
  const props = PropertiesService.getScriptProperties(), raw = props.getProperty("tok:" + token);
  if (!raw) return null;
  const o = JSON.parse(raw);
  if (o.exp < Date.now() || !allowed_(o.email)) { props.deleteProperty("tok:" + token); return null; }
  return o.email;
}
/** Optional: run this by hand from the editor to sign everyone out. */
function signEveryoneOut() {
  const props = PropertiesService.getScriptProperties();
  props.getKeys().forEach(function (k) { if (k.indexOf("tok:") === 0) props.deleteProperty(k); });
}

function doGet() { return out_({ ok: false, error: "use_the_website" }); }

function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: "bad_request" }); }
  if (b.action === "requestCode") return out_(requestCode_(email_(b.email)));
  if (b.action === "verifyCode") return out_(verifyCode_(email_(b.email), b.code));

  const me = session_(b.token);
  if (!me) return out_({ ok: false, error: "signed_out" });
  if (b.action === "signOut") { PropertiesService.getScriptProperties().deleteProperty("tok:" + b.token); return out_({ ok: true }); }
  if (b.action === "load") return out_({ ok: true, me: { email: me, isManager: isManager_(me) }, issues: rows_("Issues"), replies: rows_("Replies"), decisions: rows_("Decisions") });

  const d = b.data || {}, now = new Date().toISOString();
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (b.action === "addIssue") {
      if (!d.title || !d.desc || !d.name || !d.dept) return out_({ ok: false, error: "missing_fields" });
      const nos = rows_("Issues").map(function (r) { return Number(r.No) || 0; });
      const no = (nos.length ? Math.max.apply(null, nos) : 0) + 1;
      sheet_("Issues").appendRow([String(no), now, safe_(d.title), safe_(d.desc), safe_(d.name), safe_(d.dept), safe_(d.toDept), safe_(d.cat), safe_(d.loc), safe_(d.sev), safe_(d.needBy), safe_(d.since), safe_(d.sol), d.risk ? "Yes" : "No", "", "", "", "", me]);
      return out_({ ok: true, no: no });
    }
    if (b.action === "addReply") {
      if (!d.issueId || !d.text) return out_({ ok: false, error: "missing_fields" });
      sheet_("Replies").appendRow([String(d.issueId), now, safe_(d.name), safe_(d.dept), safe_(d.text), me]);
      return out_({ ok: true });
    }
    if (b.action === "saveDecision") {
      if (!isManager_(me)) return out_({ ok: false, error: "not_manager" });
      const sh = sheet_("Decisions"), row = findRow_(sh, d.issueId);
      const vals = [String(d.issueId), now, safe_(d.text), safe_(d.owner), safe_(d.target), safe_(d.name), me];
      if (row) sh.getRange(row, 1, 1, vals.length).setValues([vals]); else sh.appendRow(vals);
      return out_({ ok: true });
    }
    if (b.action === "patchIssue") {
      const sh = sheet_("Issues"), row = findRow_(sh, d.issueId);
      if (!row) return out_({ ok: false, error: "not_found" });
      const map = { ai: "AISolution", aiInfo: "AIInfo", closedAt: "ClosedOn", closedBy: "ClosedBy" };
      Object.keys(d.patch || {}).forEach(function (k) {
        if (map[k]) sh.getRange(row, SHEETS.Issues.indexOf(map[k]) + 1).setValue(safe_(d.patch[k]));
      });
      return out_({ ok: true });
    }
    return out_({ ok: false, error: "unknown_action" });
  } finally { lock.releaseLock(); }
}
