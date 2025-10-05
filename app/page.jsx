"use client";
import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";

export default function Page() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [showRaw, setShowRaw] = useState(false);

  const resetUI = () => {
    setResponse(null);
    setError("");
    setExpandedIds(new Set());
    setShowRaw(false);
  };

  const handleSubmit = async () => {
    if (!query.trim()) {
      setError("Please enter a topic (e.g., Procurement).");
      return;
    }
    setLoading(true);
    resetUI();
    try {
      const res = await fetch("/api/compareFromSources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: query.trim() }),
      });

      const data = await res.json().catch(() => null);
      console.log("API response:", data);
      if (!res.ok) {
        const msg =
          (data && (data.error || data.message)) || `API error (${res.status})`;
        setResponse(data);
        setError(msg);
      } else {
        setResponse(data);
        if (!data || data.success === false) {
          setError(
            data?.message || data?.error || "No usable response returned."
          );
        }
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set([...prev]);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setExpandAll = (on = true) => {
    if (!response?.summaries?.length) return;
    if (on) {
      setExpandedIds(new Set(response.summaries.map((s) => s.bookId)));
    } else {
      setExpandedIds(new Set());
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.warn("Copy failed", e);
    }
  };

  const downloadJSON = (obj, name = "comparison.json") => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const parseComparisonSections = (text = "") => {
    const out = {
      similarities: null,
      differences: null,
      unique: null,
      raw: text,
    };
    if (!text || typeof text !== "string") return out;

    const simRe =
      /\*\*(Similarities|Similar themes|Commonalities)\*\*[:\s]*([\s\S]*?)(?=\*\*(Differences|Unique|Unique Views|Unique Points)\*\*|$)/i;
    const diffRe =
      /\*\*(Differences|Contrasts)\*\*[:\s]*([\s\S]*?)(?=\*\*(Unique|Unique Views|Unique Points)\*\*|$)/i;
    const uniqRe =
      /\*\*(Unique Points|Unique Views|Unique)\*\*[:\s]*([\s\S]*)/i;

    const sim = text.match(simRe);
    const diff = text.match(diffRe);
    const uniq = text.match(uniqRe);

    out.similarities = sim?.[2]?.trim() ?? null;
    out.differences = diff?.[2]?.trim() ?? null;
    out.unique = uniq?.[2]?.trim() ?? null;

    return out;
  };

  const parsedComparison = useMemo(
    () => parseComparisonSections(response?.comparison ?? ""),
    [response?.comparison]
  );

  const bookCount = response?.matchedBooks ?? response?.matchedBooksCount ?? 0;
  const hasSummaries =
    Array.isArray(response?.summaries) && response.summaries.length > 0;

  const SkeletonCard = () => (
    <div className="animate-pulse border border-gray-200 rounded-lg p-4 bg-white">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center">
      <div className="w-full max-w-6xl">
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900">
            Standards Comparison
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Compare topics across PMBOK®, ISO 21500/21502, PRINCE2®, and other
            sources.
          </p>
        </header>

        <div className="mb-6">
          <div className="flex gap-3">
            <input
              aria-label="topic"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Enter topic (e.g., Procurement)"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-lg bg-blue-600 text-white px-5 py-3 font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Analyzing…" : "Compare"}
            </button>
            <button
              onClick={() => {
                setQuery("");
                setError("");
                setResponse(null);
              }}
              className="rounded-lg bg-white border px-4 py-3 text-sm"
            >
              Clear
            </button>
          </div>
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        </div>

        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="font-medium">Matches:</span>
            <span className="px-2 py-1 bg-white border rounded">
              {bookCount}
            </span>
            {response && (
              <button
                onClick={() => setShowRaw((s) => !s)}
                className="ml-3 text-xs px-3 py-1 rounded border bg-white hover:bg-gray-50"
              >
                {showRaw ? "Hide raw" : "Show raw"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setExpandAll(true)}
              className="text-sm px-3 py-1 rounded bg-white border hover:bg-gray-50"
            >
              Expand all
            </button>
            <button
              onClick={() => setExpandAll(false)}
              className="text-sm px-3 py-1 rounded bg-white border hover:bg-gray-50"
            >
              Collapse all
            </button>

            <div className="border-l h-6 mx-2" />

            <button
              onClick={() => response && copyText(response.comparison ?? "")}
              disabled={!response}
              className="text-sm px-3 py-1 rounded bg-white border hover:bg-gray-50 disabled:opacity-50"
            >
              Copy comparison
            </button>

            <button
              onClick={() =>
                response &&
                downloadJSON(response, `${query || "comparison"}.json`)
              }
              disabled={!response}
              className="text-sm px-3 py-1 rounded bg-white border hover:bg-gray-50 disabled:opacity-50"
            >
              Download JSON
            </button>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {response && response.success && (
          <main className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-3">Book Summaries</h2>

              {hasSummaries ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {response.summaries.map((s) => {
                    const expanded = expandedIds.has(s.bookId);
                    return (
                      <article
                        key={s.bookId}
                        className="bg-white rounded-lg border shadow-sm p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm break-words">
                              {s.title}
                            </h3>
                            <div
                              className="text-xs text-slate-500 mt-1 truncate"
                              title={s.bookId}
                            >
                              {s.bookId}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => toggleExpand(s.bookId)}
                              aria-expanded={expanded}
                              className="px-2 py-1 rounded border text-sm bg-white hover:bg-gray-50"
                              title={expanded ? "Collapse" : "Expand"}
                            >
                              {expanded ? "−" : "+"}
                            </button>
                            <button
                              onClick={() => copyText(s.summary)}
                              className="px-2 py-1 rounded border text-xs bg-white hover:bg-gray-50"
                              title="Copy summary"
                            >
                              Copy
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 text-sm text-slate-700 whitespace-pre-line">
                          {expanded
                            ? s.summary
                            : s.summary.length > 220
                            ? s.summary.slice(0, 220) + "…"
                            : s.summary}
                        </div>

                        {expanded &&
                          (s.matches || s.full_content || s.sectionText) && (
                            <div className="mt-3 p-3 bg-slate-50 rounded text-sm text-slate-700">
                              {s.matches?.map?.((m, i) => (
                                <div key={i} className="mb-2">
                                  <div className="font-medium">
                                    {m.title || m.sectionId}
                                  </div>
                                  <div className="text-xs whitespace-pre-line">
                                    {m.content || m.full || m.text}
                                  </div>
                                </div>
                              ))}
                              {s.full_content && (
                                <div className="whitespace-pre-line">
                                  {s.full_content}
                                </div>
                              )}
                            </div>
                          )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white p-4 rounded border text-sm text-slate-600">
                  No summaries available.
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">
                Comparison Analysis
              </h2>

              <div className="bg-white border rounded-lg p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-sm font-medium text-slate-700">
                      Cross-Standard Comparison
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Analyzing {bookCount} project management standards
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => copyText(response.comparison ?? "")}
                      className="px-3 py-1.5 rounded border bg-white text-sm hover:bg-gray-50"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() =>
                        downloadJSON(
                          { comparison: response.comparison },
                          `${query || "comparison"}-text.json`
                        )
                      }
                      className="px-3 py-1.5 rounded border bg-white text-sm hover:bg-gray-50"
                    >
                      Download
                    </button>
                  </div>
                </div>

                {(parsedComparison.similarities ||
                  parsedComparison.differences ||
                  parsedComparison.unique) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16 pb-6 border-b">
                    {parsedComparison.similarities && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                          <span>✓</span> Similarities
                        </h4>
                        <div className="prose prose-sm max-w-none text-slate-700">
                          <ReactMarkdown>
                            {parsedComparison.similarities}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {parsedComparison.differences && (
                      <div>
                        <h4 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-2">
                          <span>⚡</span> Differences
                        </h4>
                        <div className="prose prose-sm max-w-none text-slate-700">
                          <ReactMarkdown>
                            {parsedComparison.differences}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {parsedComparison.unique && (
                      <div>
                        <h4 className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
                          <span>★</span> Unique Points
                        </h4>
                        <div className="prose prose-sm max-w-none text-slate-700">
                          <ReactMarkdown>
                            {parsedComparison.unique}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">
                    Full Comparison Text
                  </h4>
                  <div className="prose prose-sm max-w-none text-slate-700 bg-slate-50 p-4 rounded">
                    <ReactMarkdown>
                      {response.comparison || "No comparison text available."}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </section>

            {showRaw && (
              <section>
                <h3 className="text-sm font-semibold mb-2">
                  Raw JSON Response
                </h3>
                <pre className="bg-slate-900 text-green-400 text-xs p-4 rounded overflow-auto max-h-96 shadow-inner">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </section>
            )}
          </main>
        )}

        {response && !response.success && (
          <div className="bg-white rounded-lg border border-red-200 mt-6 p-4 shadow-sm">
            <h3 className="font-semibold text-red-700 flex items-center gap-2">
              <span>⚠</span> API Error
            </h3>
            <p className="text-sm text-slate-700 mt-2">
              {response.message ?? response.error ?? "Unknown error occurred"}
            </p>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-800">
                Show raw response
              </summary>
              <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-auto max-h-60 border">
                {JSON.stringify(response, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {!response && !loading && !error && (
          <div className="mt-8 text-center">
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Start Your Comparison
              </h3>
              <p className="text-sm text-slate-600">
                Try entering a topic like <strong>Procurement</strong>,{" "}
                <strong>Risk Management</strong>, or{" "}
                <strong>Quality Control</strong> to compare how different PM
                standards approach it.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
