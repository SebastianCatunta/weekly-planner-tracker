import { messages } from "./messages/es.js";
import WeeklyGrid from "./components/WeeklyGrid.jsx";

function App() {
  return (
    <>
      <header className="app-header">
        <h1>{messages.appName}</h1>
      </header>
      <main className="app-main">
        <WeeklyGrid />
      </main>
    </>
  );
}

export default App;
