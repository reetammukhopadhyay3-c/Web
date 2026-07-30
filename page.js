"use client";

import { useEffect, useState, useCallback } from "react";

const CHANNEL_LABELS = {
  tech: "Tech · Hacker News",
  social: "Social · Reddit",
  code: "Code · GitHub",
};

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/trending", { cache: "no-store" });
      if (!res.ok) throw new Error("Feed unavailable");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError("Live feed is unreachable right now. Retrying shortly.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 3 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  const allItems = data
    ? [
        ...(data.channels.tech || []),
        ...(data.channels.social || []),
        ...(data.channels.code || []),
      ]
    : [];

  return (
    <div className="page">
      <header className="header">
        <div className="eyebrow">
          <span className="dot" />
          Live · updates every 3 minutes
        </div>
        <h1 className="title">Pulse Board</h1>
        <p className="subtitle">
          One read on what&rsquo;s rising right now across tech news, code,
          and social — pulled live, ranked as it stands this minute.
        </p>
      </header>

      <div className="ticker-shell">
        <div className="ticker-track">
          {[...allItems, ...allItems].map((item, i) => (
            <span className="ticker-item" key={i}>
              <span className="tag">{item.source}</span>
              {item.title}
            </span>
          ))}
          {allItems.length === 0 && (
            <span className="ticker-item">Gathering the latest signal…</span>
          )}
        </div>
      </div>

      <main className="board">
        {["tech", "social", "code"].map((key) => (
          <section className="channel" key={key} data-key={key}>
            <div className="channel-head">
              <span className="channel-name">{CHANNEL_LABELS[key]}</span>
              <span className="channel-count">
                {data?.channels?.[key]?.length ?? 0} tracked
              </span>
            </div>

            {loading && <p className="state-msg">Loading live feed…</p>}
            {!loading && error && <p className="state-msg">{error}</p>}
            {!loading &&
              !error &&
              (data?.channels?.[key]?.length ?? 0) === 0 && (
                <p className="state-msg">Nothing came through this cycle.</p>
              )}

            {!loading &&
              data?.channels?.[key]?.map((item) => (
                <article className="item" key={`${key}-${item.rank}`}>
                  <span className="rank">{String(item.rank).padStart(2, "0")}</span>
                  <div className="item-body">
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.title}
                    </a>
                    {item.desc && <p className="item-desc">{item.desc}</p>}
                    <p className="item-meta">{item.meta}</p>
                  </div>
                </article>
              ))}
          </section>
        ))}
      </main>

      <footer className="footer">
        <span>Sources: Hacker News API · Reddit · GitHub Trending</span>
        <span>
          {data?.generatedAt ? `Last pulled ${timeAgo(data.generatedAt)}` : ""}
        </span>
      </footer>
    </div>
  );
}
