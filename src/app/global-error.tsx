"use client";

// Rendered when the root layout itself fails, so it must include <html> and <body>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fbfbf9", color: "#17151f" }}>
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div>
            <h1 style={{ fontSize: 28, margin: 0 }}>We hit a snag</h1>
            <p style={{ color: "#6b6880", marginTop: 8 }}>Please refresh the page. If the problem continues, contact support.</p>
            <button
              onClick={reset}
              style={{ marginTop: 20, padding: "10px 18px", borderRadius: 12, border: 0, background: "#5b3df5", color: "#fff", fontWeight: 600, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
