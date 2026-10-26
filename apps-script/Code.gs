/**
 * Power to the People — sign-up receiver
 *
 * This small script runs inside your Google account. The web page posts each
 * sign-up here; the script emails it to you and adds a row to the Google Sheet
 * it lives in. The receiving address is stored here, on Google's side, so it
 * never appears in the web page.
 *
 * Setup is described in README.md (section 2). In short:
 *   1. Create a Google Sheet, open Extensions → Apps Script, paste this file.
 *   2. Check RECIPIENT below is the address that should receive sign-ups.
 *   3. Run the function sendTestEmail once from the editor (choose it in
 *      the toolbar and press Run). Google asks you to authorise the script;
 *      allow it. A test message then arrives at RECIPIENT.
 *   4. Deploy → New deployment → Web app → Execute as "Me",
 *      Who has access "Anyone" → Deploy, then copy the Web app URL.
 *   5. Paste that URL into FORM_ENDPOINT in index.html.
 */

// ---- Settings -------------------------------------------------------------

// The inbox that receives a message for every sign-up.
var RECIPIENT = "spinningplatespress@icloud.com";

// Subject line of those messages.
var SUBJECT = "New sign-up for Power to the People";

// Set to true to also send the person who signed up a short confirmation.
var SEND_CONFIRMATION = false;

// Name of the sheet tab that keeps the list. It is created if missing.
var SHEET_NAME = "Sign-ups";

// ---- Receiving a sign-up ---------------------------------------------------

function doPost(e) {
  try {
    var params = (e && e.parameter) || {};
    var email = String(params.email || "").trim();
    var honeypot = String(params["bot-field"] || "").trim();

    // A filled honeypot means a spam robot. Say "ok" and do nothing.
    if (honeypot) return respond({ ok: true });

    if (!looksLikeEmail(email)) {
      return respond({ ok: false, error: "Please enter a valid email address." });
    }

    var when = new Date();

    // Keep the list first; if the sheet is unavailable the email still goes.
    var alreadyListed = false;
    var sheetProblem = "";
    try {
      alreadyListed = recordSignup(email, when);
    } catch (err) {
      sheetProblem = String(err && err.message || err);
      console.error("Could not add the sign-up to the sheet: " + sheetProblem);
    }

    if (!looksLikeEmail(RECIPIENT)) {
      throw new Error("RECIPIENT is not a valid email address.");
    }

    MailApp.sendEmail({
      to: RECIPIENT,
      subject: SUBJECT,
      replyTo: email,
      name: "Power to the People sign-up",
      body:
        "Someone asked to be told when Power to the People is available.\n\n" +
        "Email address: " + email + "\n" +
        "Received:      " + Utilities.formatDate(when, Session.getScriptTimeZone(), "d MMMM yyyy, h:mm a") + "\n" +
        (alreadyListed ? "Note: this address was already on the list.\n" : "") +
        (sheetProblem ? "Note: it could not be added to the Google Sheet (" + sheetProblem + "). Please add it by hand.\n" : "") +
        "\nThe full list is in the Google Sheet attached to this script."
    });

    if (SEND_CONFIRMATION) {
      MailApp.sendEmail({
        to: email,
        subject: "Thank you — Power to the People",
        name: "Spinning Plates Press",
        body:
          "Thank you for your interest in Power to the People by Gillian Tompsett.\n\n" +
          "We will send you one email when the book is available to order from " +
          "Spinning Plates Press in November 2026.\n\n" +
          "If you did not sign up for this, please ignore this message."
      });
    }

    return respond({ ok: true });
  } catch (err) {
    // Tell the page it failed so the visitor is not shown "Thank you" for
    // a sign-up that was never received.
    console.error("Sign-up failed: " + (err && err.stack || err));
    return respond({ ok: false, error: "The sign-up could not be recorded." });
  }
}

/**
 * Run this once from the editor (select "sendTestEmail" in the toolbar and
 * press Run). It triggers Google's one-time authorisation prompt and sends a
 * test message to RECIPIENT, so you know email delivery works before the
 * web page is connected.
 */
function sendTestEmail() {
  if (!looksLikeEmail(RECIPIENT)) throw new Error("RECIPIENT is not a valid email address: " + RECIPIENT);
  MailApp.sendEmail({
    to: RECIPIENT,
    subject: "Test: " + SUBJECT,
    name: "Power to the People sign-up",
    body:
      "This is a test from the Power to the People sign-up script.\n\n" +
      "If you are reading it, the script is authorised and can send email to " + RECIPIENT + ".\n" +
      "Remaining daily email allowance for this account: " + MailApp.getRemainingDailyQuota() + "."
  });
  Logger.log("Test email sent to " + RECIPIENT);
}

// Browsers sometimes send a GET first; answer politely instead of erroring.
function doGet() {
  return respond({ ok: true, message: "Power to the People sign-up endpoint." });
}

// ---- Helpers ---------------------------------------------------------------

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Adds a row to the sheet. Returns true if the address was already there.
function recordSignup(email, when) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return false;                      // not attached to a sheet; skip logging
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Email address", "Date received"]);
    sheet.getRange(1, 1, 1, 2).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  var existing = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]).toLowerCase(); })
    : [];
  var duplicate = existing.indexOf(email.toLowerCase()) !== -1;
  sheet.appendRow([email, when]);
  return duplicate;
}

function respond(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
