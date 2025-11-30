"use client";

import React, { useState } from "react";

interface PipelineStage {
  stage: string;
  expert: string;
  status: 'pending' | 'processing' | 'complete';
}

const PIPELINE_STAGES: PipelineStage[] = [
  { stage: 'Fetching Zillow Data', expert: 'Data Extraction', status: 'pending' },
  { stage: 'Researching Property', expert: 'Research Expert', status: 'pending' },
  { stage: 'Real Estate Agent Review', expert: 'Top 1% Agent (30 yrs)', status: 'pending' },
  { stage: 'Copywriting Enhancement', expert: 'Master Copywriter', status: 'pending' },
  { stage: 'Narrative Polish', expert: 'Best-Selling Novelist', status: 'pending' },
  { stage: 'Editorial Review', expert: 'Editor-in-Chief', status: 'pending' },
  { stage: 'Final Hollywood Polish', expert: 'Script Polisher', status: 'pending' },
];

export default function ZillowRewriter() {
  const [zillowUrl, setZillowUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [stages, setStages] = useState<PipelineStage[]>(PIPELINE_STAGES);
  const [currentStageIndex, setCurrentStageIndex] = useState(-1);

  const resetPipeline = () => {
    setStages(PIPELINE_STAGES.map(s => ({ ...s, status: 'pending' })));
    setCurrentStageIndex(-1);
  };

  const updateStage = (index: number, status: 'pending' | 'processing' | 'complete') => {
    setStages(prev => prev.map((stage, i) =>
      i === index ? { ...stage, status } : stage
    ));
    if (status === 'processing') {
      setCurrentStageIndex(index);
    }
  };

  const handleRewrite = async () => {
    if (!zillowUrl.trim()) {
      setError("Please enter a Zillow URL");
      return;
    }

    if (!zillowUrl.includes('zillow.com')) {
      setError("Please enter a valid Zillow listing URL");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    resetPipeline();

    try {
      // Simulate pipeline progress
      updateStage(0, 'processing');

      const response = await fetch("/api/zillow-rewrite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ zillowUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rewrite listing");
      }

      // Simulate stage completions
      for (let i = 0; i < stages.length; i++) {
        updateStage(i, 'processing');
        await new Promise(resolve => setTimeout(resolve, 800));
        updateStage(i, 'complete');
      }

      const data = await response.json();
      setResult(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      resetPipeline();
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.rewritten) return;

    try {
      await navigator.clipboard.writeText(result.rewritten);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = result.rewritten;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartOver = () => {
    setZillowUrl("");
    setResult(null);
    setError("");
    resetPipeline();
  };

  return (
    <div
      style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily:
          "system-ui,-apple-system,Segoe UI,Roboto,Inter,Helvetica,Arial,sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <h1
          style={{
            fontSize: 48,
            fontWeight: 800,
            marginBottom: 12,
            background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          AI Listing Description Rewriter
        </h1>
        <p style={{ fontSize: 18, color: "#64748b", maxWidth: 700, margin: "0 auto", lineHeight: 1.6 }}>
          Transform any Zillow listing into compelling copy that makes buyers say<br/>
          <strong style={{ color: "#0f172a" }}>"I need to see this property right now!"</strong>
        </p>
      </div>

      {/* Input Section */}
      {!result && (
        <div style={{ maxWidth: 700, margin: "0 auto 40px" }}>
          <label
            style={{
              display: "block",
              fontSize: 15,
              fontWeight: 600,
              color: "#334155",
              marginBottom: 12,
            }}
          >
            Enter Zillow Listing URL
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              type="url"
              value={zillowUrl}
              onChange={(e) => setZillowUrl(e.target.value)}
              placeholder="https://www.zillow.com/homedetails/..."
              disabled={loading}
              style={{
                flex: 1,
                height: 52,
                borderRadius: 12,
                border: "2px solid #e2e8f0",
                padding: "0 16px",
                fontSize: 15,
                fontFamily: "inherit",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#0f172a"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
            <button
              onClick={handleRewrite}
              disabled={loading || !zillowUrl.trim()}
              style={{
                height: 52,
                borderRadius: 12,
                border: "none",
                padding: "0 32px",
                background: loading || !zillowUrl.trim() ? "#cbd5e1" : "#0f172a",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: loading || !zillowUrl.trim() ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Processing..." : "Rewrite Listing"}
            </button>
          </div>

          <p style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>
            Paste any Zillow listing URL and our AI will extract all data and rewrite the description
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto 24px",
            padding: 16,
            borderRadius: 12,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Pipeline Progress */}
      {loading && (
        <div style={{ maxWidth: 700, margin: "0 auto 40px" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#334155", marginBottom: 20 }}>
            Expert Pipeline Progress
          </h3>
          <div style={{ display: "grid", gap: 12 }}>
            {stages.map((stage, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 16,
                  borderRadius: 10,
                  background: stage.status === 'complete' ? '#f0fdf4' :
                             stage.status === 'processing' ? '#fef3c7' : '#f8fafc',
                  border: `2px solid ${
                    stage.status === 'complete' ? '#10b981' :
                    stage.status === 'processing' ? '#f59e0b' : '#e2e8f0'
                  }`,
                  transition: "all 0.3s",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: stage.status === 'complete' ? '#10b981' :
                               stage.status === 'processing' ? '#f59e0b' : '#cbd5e1',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {stage.status === 'complete' ? '✓' :
                   stage.status === 'processing' ? '⟳' : index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                    {stage.stage}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {stage.expert}
                  </div>
                </div>
                {stage.status === 'processing' && (
                  <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
                    Processing...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: "grid", gap: 24 }}>
          {/* Property Info Card */}
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#334155", marginBottom: 16 }}>
              Property Information
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, fontSize: 14 }}>
              {result.propertyData && (
                <>
                  <div><strong>Address:</strong> {result.propertyData.address}</div>
                  <div><strong>Price:</strong> {result.propertyData.price}</div>
                  <div><strong>Beds:</strong> {result.propertyData.beds}</div>
                  <div><strong>Baths:</strong> {result.propertyData.baths}</div>
                  <div><strong>Sq Ft:</strong> {result.propertyData.sqft}</div>
                  <div><strong>Year Built:</strong> {result.propertyData.yearBuilt}</div>
                </>
              )}
            </div>
          </div>

          {/* Before/After Comparison */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Original */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#334155", marginBottom: 12 }}>
                Original Zillow Description
              </h3>
              <div
                style={{
                  padding: 20,
                  borderRadius: 12,
                  border: "2px solid #e2e8f0",
                  background: "#fff",
                  minHeight: 300,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#475569",
                  whiteSpace: "pre-wrap",
                }}
              >
                {result.original || "No original description available"}
              </div>
            </div>

            {/* Rewritten */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#334155", marginBottom: 12 }}>
                AI-Enhanced Description ✨
              </h3>
              <div
                style={{
                  padding: 20,
                  borderRadius: 12,
                  border: "2px solid #10b981",
                  background: "#f0fdf4",
                  minHeight: 300,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#0f172a",
                  whiteSpace: "pre-wrap",
                }}
              >
                {result.rewritten}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleCopy}
              style={{
                height: 48,
                borderRadius: 12,
                border: "none",
                padding: "0 32px",
                background: copied ? "#10b981" : "#0f172a",
                color: "#fff",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {copied ? "✓ Copied!" : "Copy New Description"}
            </button>

            <button
              onClick={handleStartOver}
              style={{
                height: 48,
                borderRadius: 12,
                border: "2px solid #e2e8f0",
                padding: "0 32px",
                background: "#fff",
                color: "#64748b",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* How It Works */}
      {!loading && !result && (
        <div
          style={{
            maxWidth: 900,
            margin: "60px auto 0",
            padding: 32,
            borderRadius: 16,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            How It Works
          </h3>
          <div style={{ display: "grid", gap: 16, fontSize: 14, color: "#475569", lineHeight: 1.7 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>1.</span>
              <div>
                <strong>Data Extraction:</strong> We pull every detail from the Zillow listing - specs, features, photos, and the original description
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>2.</span>
              <div>
                <strong>Research:</strong> AI searches for additional property highlights without hallucinating
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>3.</span>
              <div>
                <strong>5-Expert Pipeline:</strong> Your listing passes through:
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  <li>Top 1% Real Estate Agent (30 years exp)</li>
                  <li>Master Copywriter (advertising & persuasion)</li>
                  <li>Best-Selling Novelist (gripping storytelling)</li>
                  <li>Editor-in-Chief (excitement & polish)</li>
                  <li>Hollywood Script Polisher (final touches)</li>
                </ul>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>4.</span>
              <div>
                <strong>Result:</strong> A description that's exciting, professional, unique, and makes buyers want to see the property NOW
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
