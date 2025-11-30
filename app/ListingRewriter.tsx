"use client";

import React, { useState } from "react";

type RewriteStyle = "professional" | "luxury" | "family-friendly" | "investment";

const STYLE_OPTIONS: { value: RewriteStyle | ""; label: string }[] = [
  { value: "", label: "Standard" },
  { value: "professional", label: "Professional" },
  { value: "luxury", label: "Luxury" },
  { value: "family-friendly", label: "Family-Friendly" },
  { value: "investment", label: "Investment Focus" },
];

export default function ListingRewriter() {
  const [original, setOriginal] = useState("");
  const [rewritten, setRewritten] = useState("");
  const [style, setStyle] = useState<RewriteStyle | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleRewrite = async () => {
    if (!original.trim()) {
      setError("Please enter a listing description");
      return;
    }

    setLoading(true);
    setError("");
    setRewritten("");

    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: original,
          style: style || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rewrite description");
      }

      const data = await response.json();
      setRewritten(data.rewritten);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!rewritten) return;

    try {
      await navigator.clipboard.writeText(rewritten);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = rewritten;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleClear = () => {
    setOriginal("");
    setRewritten("");
    setError("");
  };

  return (
    <div
      style={{
        maxWidth: 1200,
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
            fontSize: 42,
            fontWeight: 800,
            marginBottom: 12,
            color: "#0f172a",
          }}
        >
          Listing Description Rewriter
        </h1>
        <p style={{ fontSize: 18, color: "#64748b", maxWidth: 600, margin: "0 auto" }}>
          Transform your basic listing description into compelling copy that drives
          buyer interest
        </p>
      </div>

      {/* Style selector */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 600,
            color: "#334155",
            marginBottom: 8,
          }}
        >
          Writing Style
        </label>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as RewriteStyle | "")}
          style={{
            width: "100%",
            maxWidth: 300,
            height: 44,
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            padding: "0 14px",
            fontSize: 15,
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {STYLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Input/Output Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: rewritten ? "1fr 1fr" : "1fr",
          gap: 24,
          marginBottom: 24,
        }}
      >
        {/* Original Description */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: 14,
              fontWeight: 600,
              color: "#334155",
              marginBottom: 8,
            }}
          >
            Original Description
          </label>
          <textarea
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            placeholder="Paste your current listing description here..."
            style={{
              width: "100%",
              minHeight: 300,
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: 16,
              fontSize: 15,
              lineHeight: 1.6,
              fontFamily: "inherit",
              resize: "vertical",
              background: "#fff",
            }}
          />
        </div>

        {/* Rewritten Description */}
        {rewritten && (
          <div>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                color: "#334155",
                marginBottom: 8,
              }}
            >
              Rewritten Description
            </label>
            <div
              style={{
                position: "relative",
                minHeight: 300,
                borderRadius: 12,
                border: "2px solid #10b981",
                padding: 16,
                fontSize: 15,
                lineHeight: 1.6,
                background: "#f0fdf4",
                whiteSpace: "pre-wrap",
              }}
            >
              {rewritten}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={handleRewrite}
          disabled={loading || !original.trim()}
          style={{
            height: 48,
            borderRadius: 12,
            border: "none",
            padding: "0 28px",
            background: loading || !original.trim() ? "#cbd5e1" : "#0f172a",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: loading || !original.trim() ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {loading ? "Rewriting..." : "Rewrite Description"}
        </button>

        {rewritten && (
          <>
            <button
              onClick={handleCopy}
              style={{
                height: 48,
                borderRadius: 12,
                border: "1px solid #10b981",
                padding: "0 28px",
                background: copied ? "#10b981" : "#fff",
                color: copied ? "#fff" : "#10b981",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {copied ? "Copied!" : "Copy Rewritten"}
            </button>

            <button
              onClick={handleClear}
              style={{
                height: 48,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                padding: "0 28px",
                background: "#fff",
                color: "#64748b",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Clear & Start Over
            </button>
          </>
        )}
      </div>

      {/* Tips */}
      <div
        style={{
          marginTop: 40,
          padding: 20,
          borderRadius: 12,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
        }}
      >
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#334155",
            marginBottom: 12,
          }}
        >
          Tips for best results:
        </h3>
        <ul
          style={{
            fontSize: 14,
            color: "#64748b",
            lineHeight: 1.8,
            paddingLeft: 20,
            margin: 0,
          }}
        >
          <li>Include key property details (beds, baths, sq ft, lot size)</li>
          <li>Mention unique features and recent upgrades</li>
          <li>Note the neighborhood or location highlights</li>
          <li>Add any special amenities or selling points</li>
          <li>The AI will enhance your content while keeping factual accuracy</li>
        </ul>
      </div>
    </div>
  );
}
