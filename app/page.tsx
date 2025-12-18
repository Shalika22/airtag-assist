import Chat from "@/components/Chat";
import ThemeToggle from "@/components/ThemeToggle";

export default function Page() {
  return (
    <main className="container">
      <header className="hero">
        <div>
          <h1 className="title">AirTag Assistant</h1>
          <p className="subtitle">Ask questions about Apple AirTags. Answers are grounded in a small knowledge base and include citations.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          <ThemeToggle />
        </div>
      </header>

      <div className="panel">
        <Chat />
      </div>

      <footer className="footer">
        Tip: press <span className="kbd">Enter</span> to send. This demo refuses out-of-scope requests and unsafe tracking/stalking questions.
      </footer>
    </main>
  );
}


