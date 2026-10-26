import { messages } from "./messages/es.js";
import LoadNotice from "./components/LoadNotice.jsx";
import WeeklyGrid from "./components/WeeklyGrid.jsx";
import ActivityForm from "./components/ActivityForm.jsx";
import { useActivities } from "./hooks/useActivities.js";

// 001/RF-1.1, 001/RF-5.1, 001/RF-6.1, 001/RF-7.4
// While loading or after a failed load only the notice is shown: an empty grid would look like
// a schedule with no activities.
function App() {
  const { status, activities } = useActivities();

  return (
    <>
      <header className="app-header">
        <h1>{messages.appName}</h1>
      </header>
      <main className="app-main">
        <LoadNotice status={status} />
        <div className="app-layout">
          {status === "ready" && <WeeklyGrid activities={activities} />}
          <ActivityForm />
        </div>
      </main>
    </>
  );
}

export default App;
