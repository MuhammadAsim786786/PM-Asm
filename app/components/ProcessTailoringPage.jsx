"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * ProcessTailoringPage
 * - Full component that renders scenario selection, generates tailored process,
 *   shows metadata, markdown (styled), citations & reference map.
 */
export default function ProcessTailoringPage() {
  const [selectedScenario, setSelectedScenario] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scenarios = [
    {
      id: "software",
      name: "Custom Software Development Project",
      description: "Well-defined requirements, <6 months, <7 team members",
      icon: "💻",
      color: "blue",
    },
    {
      id: "innovation",
      name: "Innovative Product Development Project",
      description: "R&D-heavy, uncertain outcomes, ~1 year duration",
      icon: "🚀",
      color: "purple",
    },
    {
      id: "government",
      name: "Large Government Project",
      description: "Civil, electrical, and IT components, 2-year duration",
      icon: "🏛️",
      color: "green",
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-50 border-blue-200 hover:bg-blue-100",
      purple: "bg-purple-50 border-purple-200 hover:bg-purple-100",
      green: "bg-green-50 border-green-200 hover:bg-green-100",
    };
    return colors[color] || colors.blue;
  };

  async function handleGenerateProcess(scenarioId) {
    setLoading(true);
    setError("");
    setResponse(null);
    setSelectedScenario(scenarioId);

    try {
      const res = await fetch("/api/generateTailoredProcess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: scenarioId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || `API error (${res.status})`);
      } else {
        setResponse(data);
        if (!data?.success) setError(data?.error || "Failed to generate process");
      }
    } catch (err) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  const copyProcess = async () => {
    if (!response?.process) return;
    try {
      await navigator.clipboard.writeText(response.process);
      // small UX hint — could add toast; kept minimal to match your code style
    } catch (e) {
      console.warn("Copy failed", e);
    }
  };

  const downloadProcess = () => {
    if (!response?.process) return;
    const blob = new Blob([response.process], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedScenario || "process"}-process-design.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Rich custom renderers for react-markdown
  const mdComponents = {
    h1: ({ children }) => (
      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-6 mb-4">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <div className="mt-6 mb-4">
        <h2 className="text-2xl font-semibold text-slate-800 border-l-4 border-indigo-400 pl-4">
          {children}
        </h2>
      </div>
    ),
    h3: ({ children }) => {
      const txt = String(children).toLowerCase();
      if (txt.includes("decision gate")) {
        return (
          <div className="mt-4 mb-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <strong className="text-yellow-800">🔔 {children}</strong>
          </div>
        );
      }
      if (txt.includes("phase")) {
        return (
          <h3 className="mt-4 mb-2 text-xl font-semibold text-slate-800">
            {children}
          </h3>
        );
      }
      return <h3 className="mt-3 mb-2 text-lg font-medium text-slate-800">{children}</h3>;
    },
    p: ({ children }) => (
      <p className="text-sm md:text-base text-slate-700 leading-relaxed mb-3">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside space-y-1 ml-4 mb-3">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside space-y-1 ml-4 mb-3">{children}</ol>
    ),
    li: ({ children }) => <li className="text-sm text-slate-700">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
    code: ({ inline, children }) =>
      inline ? (
        <code className="px-1 py-[0.1rem] rounded bg-slate-100 text-xs font-mono">{children}</code>
      ) : (
        <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 overflow-x-auto text-sm font-mono">
          <code>{children}</code>
        </pre>
      ),
    hr: () => <div className="my-6 border-t border-slate-200" />,
    table: ({ children }) => (
      <div className="overflow-x-auto my-4 rounded-lg border bg-white">
        <table className="min-w-full text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
    th: ({ children }) => (
      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">{children}</th>
    ),
    td: ({ children }) => <td className="px-3 py-2 text-sm text-slate-600">{children}</td>,
  };

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3">
            Phase 2: Process Proposal & Tailoring
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Generate tailored project processes with evidence-based recommendations from PMBOK 7, PRINCE2, and ISO standards.
          </p>
        </header>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {!response && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => handleGenerateProcess(scenario.id)}
                className={`${getColorClasses(scenario.color)} border-2 rounded-xl p-6 transition-all shadow-sm hover:shadow-md text-left`}
                aria-label={`Generate process for ${scenario.name}`}
              >
                <div className="text-5xl mb-4">{scenario.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{scenario.name}</h3>
                <p className="text-sm text-slate-600 mb-4">{scenario.description}</p>
                <div className="w-full">
                  <span className="inline-block w-full text-center bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Generate Process →
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-xl shadow-md border p-8 text-center">
            <div className="animate-spin mx-auto rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
            <p className="text-slate-600">Generating tailored process with citations from PMBOK, PRINCE2, and ISO...</p>
          </div>
        )}

        {response && response.success && (
          <div className="bg-white rounded-xl shadow-md border p-6 space-y-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{response.scenarioName}</h2>
                <p className="text-sm text-slate-600 mt-1">Tailored process design with standards citations</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyProcess}
                  className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                >
                  Copy
                </button>
                <button
                  onClick={downloadProcess}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
                >
                  Download
                </button>
                <button
                  onClick={() => {
                    setResponse(null);
                    setSelectedScenario("");
                    setError("");
                  }}
                  className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                >
                  Back
                </button>
              </div>
            </div>

            {response.metadata && (
              <div className="bg-slate-50 border rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 mb-2">📊 Project Metadata</h3>
                <p className="text-sm text-slate-700 mb-2">
                  <strong>Context:</strong> {response.metadata.context}
                </p>
                <p className="text-sm text-slate-700 mb-2">
                  <strong>Deliverable:</strong> {response.metadata.deliverable}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(response.metadata.characteristics || []).map((c, i) => (
                    <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-slate-500 mt-3">
                  <strong>Sections Used:</strong> {response.metadata.sectionsUsed} | <strong>Books Loaded:</strong> {response.metadata.booksLoaded}
                </div>
              </div>
            )}

            <div className="prose prose-slate max-w-none border-t pt-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {response.process || ""}
              </ReactMarkdown>
            </div>

            {response.citations?.length > 0 && (
              <div className="mt-8 p-4 bg-slate-50 rounded-lg border">
                <h3 className="text-lg font-semibold mb-3 text-slate-800">📚 Standards Citations</h3>
                <div className="space-y-2">
                  {response.citations.map((c, idx) => (
                    <div key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="font-medium text-blue-700 min-w-[120px]">{c.standard}</span>
                      <div>
                        <div className="text-xs text-slate-600">Section: {c.section}</div>
                        <div className="text-sm">{c.reference}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {response.referenceMap?.length > 0 && (
              <div className="mt-8 p-4 bg-indigo-50 rounded-lg border">
                <h3 className="text-lg font-semibold mb-3 text-indigo-800">🔍 Reference Map</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {response.referenceMap.map((ref) => (
                    <div key={ref.id} className="bg-white border rounded-lg p-3 shadow-sm hover:shadow transition">
                      <h4 className="font-semibold text-slate-800 text-sm">{ref.book}</h4>
                      <p className="text-xs text-slate-600 mb-1">Section {ref.section}: {ref.title}</p>
                      <div className="flex flex-wrap gap-1">
                        {(ref.keywords || []).slice(0, 6).map((kw, i) => (
                          <span key={i} className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px]">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
