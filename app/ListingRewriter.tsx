"use client";

import React, { useState } from "react";

interface PipelineStage {
  stage: string;
  expert: string;
  status: 'pending' | 'processing' | 'complete';
}

const PIPELINE_STAGES: PipelineStage[] = [
  { stage: 'Researching Property', expert: 'Research Expert', status: 'pending' },
  { stage: 'Real Estate Agent Review', expert: 'Top 1% Agent (30 yrs)', status: 'pending' },
  { stage: 'Copywriting Enhancement', expert: 'Master Copywriter', status: 'pending' },
  { stage: 'Narrative Polish', expert: 'Best-Selling Novelist', status: 'pending' },
  { stage: 'Editorial Review', expert: 'Editor-in-Chief', status: 'pending' },
  { stage: 'Final Hollywood Polish', expert: 'Script Polisher', status: 'pending' },
];

export default function ListingRewriter() {
  // Form fields
  const [address, setAddress] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [success, setSuccess] = useState(false);
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
    // Validation
    if (!address.trim()) {
      setError("Please enter the property address");
      return;
    }

    if (!description.trim()) {
      setError("Please enter the current listing description");
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setSuccess(false);
    resetPipeline();

    try {
      const response = await fetch("/api/listing-rewrite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          unit,
          price,
          beds,
          baths,
          sqft,
          description,
          email,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rewrite listing");
      }

      // Simulate stage completions
      for (let i = 0; i < stages.length; i++) {
        updateStage(i, 'processing');
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateStage(i, 'complete');
      }

      const data = await response.json();
      setResult(data);
      setSuccess(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      resetPipeline();
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setAddress("");
    setUnit("");
    setPrice("");
    setBeds("");
    setBaths("");
    setSqft("");
    setDescription("");
    setEmail("");
    setResult(null);
    setSuccess(false);
    setError("");
    resetPipeline();
  };

  return (
    <div
      style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1
          style={{
            fontSize: 48,
            fontWeight: 800,
            background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: 16,
          }}
        >
          AI Listing Description Rewriter
        </h1>
        <p style={{ fontSize: 18, color: "#64748b", maxWidth: 700, margin: "0 auto", lineHeight: 1.6 }}>
          Transform any listing description into compelling copy that makes buyers say<br/>
          <strong style={{ color: "#0f172a" }}>"I need to see this property right now!"</strong>
        </p>
      </div>

      {/* Input Form */}
      {!result && !success && (
        <div style={{ maxWidth: 800, margin: "0 auto 40px" }}>
          <div style={{ display: "grid", gap: 20, marginBottom: 24 }}>
            {/* Property Address */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 8 }}>
                  Property Address *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, City, State 12345"
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: 52,
                    borderRadius: 12,
                    border: "2px solid #e2e8f0",
                    padding: "0 16px",
                    fontSize: 15,
                    fontFamily: "inherit",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#0f172a"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 8 }}>
                  Unit # (if applicable)
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Apt 4B"
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: 52,
                    borderRadius: 12,
                    border: "2px solid #e2e8f0",
                    padding: "0 16px",
                    fontSize: 15,
                    fontFamily: "inherit",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#0f172a"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                />
              </div>
            </div>

            {/* Property Details Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 8 }}>
                  Price
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="$500,000"
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: 52,
                    borderRadius: 12,
                    border: "2px solid #e2e8f0",
                    padding: "0 16px",
                    fontSize: 15,
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#0f172a"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 8 }}>
                  Beds
                </label>
                <input
                  type="text"
                  value={beds}
                  onChange={(e) => setBeds(e.target.value)}
                  placeholder="3"
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: 52,
                    borderRadius: 12,
                    border: "2px solid #e2e8f0",
                    padding: "0 16px",
                    fontSize: 15,
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#0f172a"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 8 }}>
                  Baths
                </label>
                <input
                  type="text"
                  value={baths}
                  onChange={(e) => setBaths(e.target.value)}
                  placeholder="2"
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: 52,
                    borderRadius: 12,
                    border: "2px solid #e2e8f0",
                    padding: "0 16px",
                    fontSize: 15,
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#0f172a"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 8 }}>
                  Sq Ft
                </label>
                <input
                  type="text"
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  placeholder="2,000"
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: 52,
                    borderRadius: 12,
                    border: "2px solid #e2e8f0",
                    padding: "0 16px",
                    fontSize: 15,
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#0f172a"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                />
              </div>
            </div>

            {/* Current Description */}
            <div>
              <label style={{ display: "block", fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 8 }}>
                Current Listing Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Paste your current listing description here..."
                disabled={loading}
                rows={8}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: "2px solid #e2e8f0",
                  padding: "16px",
                  fontSize: 15,
                  fontFamily: "inherit",
                  outline: "none",
                  resize: "vertical",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#0f172a"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: 15, fontWeight: 600, color: "#334155", marginBottom: 8 }}>
                Your Email (to receive the rewritten description) *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                style={{
                  width: "100%",
                  height: 52,
                  borderRadius: 12,
                  border: "2px solid #e2e8f0",
                  padding: "0 16px",
                  fontSize: 15,
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#0f172a"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
              />
            </div>
          </div>

          <button
            onClick={handleRewrite}
            disabled={loading || !address.trim() || !description.trim() || !email.trim()}
            style={{
              width: "100%",
              height: 56,
              borderRadius: 12,
              border: "none",
              background: loading || !address.trim() || !description.trim() || !email.trim() ? "#cbd5e1" : "#0f172a",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: loading || !address.trim() || !description.trim() || !email.trim() ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Processing..." : "Generate My Listing Description"}
          </button>

          <p style={{ fontSize: 13, color: "#64748b", marginTop: 12, textAlign: "center" }}>
            We'll email you the AI-enhanced description within 5 minutes
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto 40px",
            padding: 20,
            borderRadius: 12,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Pipeline Visualization */}
      {loading && (
        <div style={{ maxWidth: 900, margin: "0 auto 40px" }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, textAlign: "center" }}>
            AI Processing Pipeline
          </h3>
          <div style={{ display: "grid", gap: 16 }}>
            {stages.map((stage, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: 20,
                  borderRadius: 12,
                  background: stage.status === 'complete' ? '#f0fdf4' : stage.status === 'processing' ? '#eff6ff' : '#f8fafc',
                  border: `2px solid ${stage.status === 'complete' ? '#86efac' : stage.status === 'processing' ? '#60a5fa' : '#e2e8f0'}`,
                  transition: "all 0.3s",
                }}
              >
                <div style={{ marginRight: 16 }}>
                  {stage.status === 'complete' && <div style={{ fontSize: 24 }}>✓</div>}
                  {stage.status === 'processing' && <div style={{ fontSize: 24 }}>⚙️</div>}
                  {stage.status === 'pending' && <div style={{ fontSize: 24, opacity: 0.3 }}>○</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{stage.stage}</div>
                  <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>{stage.expert}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && !loading && (
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto 40px",
            padding: 32,
            borderRadius: 16,
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#fff",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
            Success! Check Your Email
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 20 }}>
            Our AI team has crafted your listing description through our 5-expert pipeline.
            You'll receive the final result at <strong>{email}</strong> within the next 5 minutes.
          </p>
          <p style={{ fontSize: 14, opacity: 0.9 }}>
            Property: {address}
          </p>
          <button
            onClick={handleStartOver}
            style={{
              marginTop: 24,
              height: 48,
              borderRadius: 12,
              border: "2px solid #fff",
              padding: "0 32px",
              background: "transparent",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.color = "#10b981";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#fff";
            }}
          >
            Rewrite Another Listing
          </button>
        </div>
      )}
    </div>
  );
}
