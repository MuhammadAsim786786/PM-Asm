"use client";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

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

  const handleGenerateProcess = async (scenarioId) => {
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
        if (!data?.success)
          setError(data?.error || "Failed to generate process");
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const downloadProcess = () => {
    if (response?.process) {
      const blob = new Blob([response.process], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedScenario}-process-design.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  };

  const copyProcess = async () => {
    if (response?.process) {
      try {
        await navigator.clipboard.writeText(response.process);
      } catch (e) {
        console.warn("Copy failed", e);
      }
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-50 border-blue-200 hover:bg-blue-100",
      purple: "bg-purple-50 border-purple-200 hover:bg-purple-100",
      green: "bg-green-50 border-green-200 hover:bg-green-100",
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3">
            Phase 2: Process Proposal & Tailoring
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Generate tailored project processes for three specific scenarios,
            with evidence-based recommendations from PMBOK 7, PRINCE2, and ISO
            standards.
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
              <div
                key={scenario.id}
                className={`${getColorClasses(
                  scenario.color
                )} border-2 rounded-xl p-6 transition-all cursor-pointer shadow-sm hover:shadow-md`}
                onClick={() => handleGenerateProcess(scenario.id)}
              >
                <div className="text-5xl mb-4">{scenario.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {scenario.name}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {scenario.description}
                </p>
                <button className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Generate Process →
                </button>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-xl shadow-md border p-8 text-center">
            <div className="animate-spin mx-auto rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-600">
              Generating tailored process with citations from PMBOK, PRINCE2,
              and ISO...
            </p>
          </div>
        )}

        {response && response.success && (
          <div className="bg-white rounded-xl shadow-md border p-6 space-y-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {response.scenarioName}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Tailored process design with standards citations
                </p>
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
                  }}
                  className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                >
                  Back
                </button>
              </div>
            </div>

            {response.metadata && (
              <div className="bg-slate-50 border rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 mb-2">
                  📊 Project Metadata
                </h3>
                <p className="text-sm text-slate-700 mb-2">
                  <strong>Context:</strong> {response.metadata.context}
                </p>
                <p className="text-sm text-slate-700 mb-2">
                  <strong>Deliverable:</strong> {response.metadata.deliverable}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {response.metadata.characteristics.map((c, i) => (
                    <span
                      key={i}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-slate-500 mt-3">
                  <strong>Sections Used:</strong>{" "}
                  {response.metadata.sectionsUsed} |{" "}
                  <strong>Books Loaded:</strong> {response.metadata.booksLoaded}
                </div>
              </div>
            )}

            <div className="prose prose-slate max-w-none border-t pt-6">
              <ReactMarkdown>{response.process}</ReactMarkdown>
            </div>

            {response.citations?.length > 0 && (
              <div className="mt-8 p-4 bg-slate-50 rounded-lg border">
                <h3 className="text-lg font-semibold mb-3 text-slate-800">
                  📚 Standards Citations
                </h3>
                <div className="space-y-2">
                  {response.citations.map((c, idx) => (
                    <div key={idx} className="text-sm text-slate-700">
                      <span className="font-medium text-blue-700">
                        {c.standard}
                      </span>
                      : {c.reference}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {response.referenceMap?.length > 0 && (
              <div className="mt-8 p-4 bg-indigo-50 rounded-lg border">
                <h3 className="text-lg font-semibold mb-3 text-indigo-800">
                  🔍 Reference Map
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {response.referenceMap.map((ref) => (
                    <div
                      key={ref.id}
                      className="bg-white border rounded-lg p-3 shadow-sm hover:shadow transition"
                    >
                      <h4 className="font-semibold text-slate-800 text-sm">
                        {ref.book}
                      </h4>
                      <p className="text-xs text-slate-600 mb-1">
                        Section {ref.section}: {ref.title}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {ref.keywords.slice(0, 6).map((kw, i) => (
                          <span
                            key={i}
                            className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px]"
                          >
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
