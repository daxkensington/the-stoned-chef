export const COOKIE_NAME = "sc_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days
export const UNAUTHED_ERR_MSG = "Please login (10001)";
export const NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// ── Online ordering kill switch ──────────────────────────────────────────────
// Online ordering was switched OFF on 2026-08-23. The truck still trades in
// person, so the menu, hours, address and schema.org data stay published — only
// the till closes. Flip this to true to reopen; every ordering surface reads it.
//
// `orders.place` refuses on the server whatever the UI renders: the Square
// charge happens server-side, so a hidden button is not a closed till.
export const ONLINE_ORDERING_ENABLED = false;

export const ORDERING_CLOSED_HEADING = "Online ordering is closed";
export const ORDERING_CLOSED_MSG =
  "We're not taking online orders right now. The truck is still open daily 11:00 AM – 7:00 PM at 45 Dundas St, Deseronto — come order at the window.";
