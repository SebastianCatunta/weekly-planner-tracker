import { messages } from "../messages/es.js";

// 001/RF-7.4
// Message for the loading states. When the schedule is ready it shows nothing.
export default function LoadNotice({ status }) {
  if (status === "loading") return <p role="status">{messages.loading}</p>;
  if (status === "failed") return <p role="alert">{messages.loadFailed}</p>;
  return null;
}
