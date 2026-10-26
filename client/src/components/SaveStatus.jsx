import { messages } from "../messages/es.js";

// 001/RF-2.5
// "Saving" icon while the activity is being saved, a different "saved" icon when it is done.
export default function SaveStatus({ status }) {
  if (status === "saving") {
    return (
      <svg className="save-status save-status-saving" role="img" aria-label={messages.saveStatus.saving} viewBox="0 0 24 24" width="20" height="20">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="42 16" />
      </svg>
    );
  }
  if (status === "saved") {
    return (
      <svg className="save-status save-status-saved" role="img" aria-label={messages.saveStatus.saved} viewBox="0 0 24 24" width="20" height="20">
        <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return null;
}
