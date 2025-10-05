"use client";
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function ProjectPlanPage() {
  const [formData, setFormData] = useState({
    teamSize: "",
    projectName: "",
    department: "",
    projectType: "",
    duration: "",
    budget: "",
    methodology: "",
    additionalDetails: "",
  });
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState("");

  useEffect(() => {
    setEditedPlan(response?.plan ?? "");
  }, [response?.plan]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.teamSize || !formData.projectName || !formData.department) {
      setError(
        "Please fill in all required fields (Team Size, Project Name, Department)"
      );
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const res = await fetch("/api/generatePlan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || `API error (${res?.status})`);
        setResponse(data);
      } else {
        setResponse(data);
        if (!data?.success) {
          setError(data?.error || "Failed to generate plan");
        }
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      teamSize: "",
      projectName: "",
      department: "",
      projectType: "",
      duration: "",
      budget: "",
      methodology: "",
      additionalDetails: "",
    });
    setResponse(null);
    setError("");
    setEditing(false);
    setEditedPlan("");
  };

  const copyPlan = async () => {
    if (response?.plan) {
      try {
        await navigator.clipboard.writeText(response.plan);
      } catch (e) {
        console.warn("Copy failed", e);
      }
    }
  };

  const downloadPlan = () => {
    if (response?.plan) {
      const blob = new Blob([response.plan], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formData.projectName || "project"}-plan.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  };

  const startEdit = () => {
    setEditedPlan(response?.plan ?? "");
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditedPlan(response?.plan ?? "");
    setEditing(false);
  };
  const saveEdit = () => {
    setResponse((prev) => ({ ...(prev || {}), plan: editedPlan }));
    setEditing(false);
  };

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-purple-50 to-pink-100 flex items-start">
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form Card (plain Tailwind, no shadcn) */}
        <div className="bg-white rounded-2xl shadow-md border p-6">
          <div className="mb-3">
            <h2 className="text-2xl font-extrabold text-slate-900">Project Plan Generator</h2>
            <p className="text-sm text-slate-600 mt-1">Generate a customized project management plan based on your team and project details</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Team Size <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="teamSize"
                value={formData.teamSize}
                onChange={handleChange}
                placeholder="e.g., 5"
                min="1"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Project Name <span className="text-red-500">*</span></label>
              <input
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                placeholder="e.g., Mobile App Development"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Department <span className="text-red-500">*</span></label>
              <input
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g., IT, Marketing, Operations"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Project Type</label>
              <select
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select type</option>
                <option value="software">Software Development</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="marketing">Marketing Campaign</option>
                <option value="research">Research & Development</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Duration (months)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g., 6"
                  min="1"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Budget Range</label>
                <input
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="e.g., $50,000 - $100,000"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Preferred Methodology</label>
              <select
                name="methodology"
                value={formData.methodology}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select methodology</option>
                <option value="agile">Agile</option>
                <option value="waterfall">Waterfall</option>
                <option value="hybrid">Hybrid</option>
                <option value="scrum">Scrum</option>
                <option value="kanban">Kanban</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Additional Details</label>
              <textarea
                name="additionalDetails"
                value={formData.additionalDetails}
                onChange={handleChange}
                placeholder="Any specific requirements, constraints, or goals..."
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-semibold hover:bg-purple-700 disabled:opacity-60"
              >
                {loading ? "Generating..." : "Generate Plan"}
              </button>

              <button
                onClick={handleReset}
                className="rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Reset
              </button>
            </div>

            <div className="text-xs text-slate-500 mt-3">Tip: fill required fields marked with *</div>
          </div>
        </div>

        {/* Right: Generated Plan Card (plain Tailwind) */}
        <div className="bg-white rounded-2xl shadow-md border p-6 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-semibold text-slate-800">Generated Plan</h3>
              <p className="text-sm text-slate-600 mt-1">Preview and lightly edit the plan before copying or downloading.</p>
            </div>

            <div className="flex items-center gap-2">
              {response?.plan && !loading && (
                <>
                  <button onClick={copyPlan} className="text-xs px-3 py-1.5 rounded border bg-white hover:bg-gray-50">Copy</button>
                  <button onClick={downloadPlan} className="text-xs px-3 py-1.5 rounded border bg-white hover:bg-gray-50">Download</button>

                  {!editing ? (
                    <button onClick={startEdit} className="text-xs px-3 py-1.5 rounded bg-indigo-600 text-white">Edit</button>
                  ) : (
                    <>
                      <button onClick={saveEdit} className="text-xs px-3 py-1.5 rounded bg-green-600 text-white">Save</button>
                      <button onClick={cancelEdit} className="text-xs px-3 py-1.5 rounded border bg-white">Cancel</button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading && (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6 mb-4"></div>
              </div>
            )}

            {response?.plan && !loading && (
              <div className="prose max-w-none text-slate-700">
                {editing ? (
                  <textarea
                    value={editedPlan}
                    onChange={(e) => setEditedPlan(e.target.value)}
                    rows={16}
                    className="w-full rounded-lg border border-gray-200 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <ReactMarkdown>{response.plan}</ReactMarkdown>
                )}
              </div>
            )}

            {!response && !loading && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-sm text-slate-600">Fill in the form and click Generate Plan to create your customized project management plan</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
