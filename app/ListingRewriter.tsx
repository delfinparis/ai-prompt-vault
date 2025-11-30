"use client";

import React, { useState, useEffect } from "react";

interface ProcessingStage {
  icon: string;
  title: string;
  subtitle: string;
  funFact: string;
}

const PROCESSING_STAGES: ProcessingStage[] = [
  {
    icon: "🔍",
    title: "Researching Your Property",
    subtitle: "Analyzing recent listings & property details",
    funFact: "Did you know? Properties with detailed descriptions sell 30% faster than generic listings."
  },
  {
    icon: "🏘️",
    title: "Mapping the Neighborhood",
    subtitle: "Finding nearby amenities & attractions",
    funFact: "Fun fact: Mentioning nearby parks increases buyer interest by 25%."
  },
  {
    icon: "📊",
    title: "Analyzing Comparables",
    subtitle: "Reviewing recently sold properties",
    funFact: "Insight: The best listings borrow winning elements from successful nearby sales."
  },
  {
    icon: "🏆",
    title: "Real Estate Expert Review",
    subtitle: "30 years of experience at work",
    funFact: "Pro tip: Top agents focus on lifestyle benefits, not just features."
  },
  {
    icon: "✍️",
    title: "Master Copywriter Enhancement",
    subtitle: "Crafting irresistible sales copy",
    funFact: "Secret: Action-oriented language creates urgency and drives faster decisions."
  },
  {
    icon: "📖",
    title: "Narrative Polish",
    subtitle: "Adding storytelling magic",
    funFact: "Psychology: Emotional connections drive 70% of home buying decisions."
  },
  {
    icon: "✂️",
    title: "Editorial Perfection",
    subtitle: "Every word earns its place",
    funFact: "Quality over quantity: The average buyer spends just 15 seconds reading a listing."
  },
  {
    icon: "🎬",
    title: "Hollywood Final Polish",
    subtitle: "Adding that wow factor",
    funFact: "Magic: We're optimizing to hit exactly 1,000 characters for maximum impact!"
  }
];

const MAX_QUERIES = 2;

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
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [queryCount, setQueryCount] = useState(0);

  // Cycle through stages during loading
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setCurrentStageIndex((prev) => (prev + 1) % PROCESSING_STAGES.length);
      }, 4000); // Change stage every 4 seconds
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleRewrite = async () => {
    // Check query limit
    if (queryCount >= MAX_QUERIES) {
      setError(`You've reached the limit of ${MAX_QUERIES} queries. Please contact us for more access.`);
      return;
    }

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
    setCurrentStageIndex(0);

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

      const data = await response.json();
      setResult(data);
      setSuccess(true);
      setQueryCount(prev => prev + 1);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
            disabled={loading || !address.trim() || !description.trim() || !email.trim() || queryCount >= MAX_QUERIES}
            style={{
              width: "100%",
              height: 56,
              borderRadius: 12,
              border: "none",
              background: loading || !address.trim() || !description.trim() || !email.trim() || queryCount >= MAX_QUERIES ? "#cbd5e1" : "#0f172a",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: loading || !address.trim() || !description.trim() || !email.trim() || queryCount >= MAX_QUERIES ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Processing..." : queryCount >= MAX_QUERIES ? "Limit Reached" : "Generate My Listing Description"}
          </button>

          <p style={{ fontSize: 13, color: "#64748b", marginTop: 12, textAlign: "center" }}>
            {queryCount >= MAX_QUERIES ?
              `You've used all ${MAX_QUERIES} free queries. Contact us for more access.` :
              `We'll email you the AI-enhanced description within 5 minutes (${queryCount}/${MAX_QUERIES} uses)`
            }
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

      {/* Animated Processing Interstitial */}
      {loading && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.95)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(10px)"
        }}>
          <div style={{
            maxWidth: 600,
            padding: 40,
            textAlign: "center",
            color: "#fff"
          }}>
            {/* Animated Icon */}
            <div style={{
              fontSize: 80,
              marginBottom: 24,
              animation: "bounce 2s infinite",
              display: "inline-block"
            }}>
              {PROCESSING_STAGES[currentStageIndex].icon}
            </div>

            {/* Stage Title */}
            <h2 style={{
              fontSize: 32,
              fontWeight: 700,
              marginBottom: 12,
              color: "#fff"
            }}>
              {PROCESSING_STAGES[currentStageIndex].title}
            </h2>

            {/* Stage Subtitle */}
            <p style={{
              fontSize: 18,
              color: "#94a3b8",
              marginBottom: 32
            }}>
              {PROCESSING_STAGES[currentStageIndex].subtitle}
            </p>

            {/* Fun Fact */}
            <div style={{
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: 12,
              padding: 20,
              marginBottom: 32
            }}>
              <div style={{ fontSize: 14, color: "#60a5fa", marginBottom: 8, fontWeight: 600 }}>
                💡 INSIDER TIP
              </div>
              <div style={{ fontSize: 15, color: "#e2e8f0", lineHeight: 1.6 }}>
                {PROCESSING_STAGES[currentStageIndex].funFact}
              </div>
            </div>

            {/* Progress Indicator */}
            <div style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              marginTop: 24
            }}>
              {PROCESSING_STAGES.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: index === currentStageIndex ? 32 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: index === currentStageIndex ? "#3b82f6" : "rgba(255, 255, 255, 0.2)",
                    transition: "all 0.3s"
                  }}
                />
              ))}
            </div>

            {/* Estimated time */}
            <p style={{
              fontSize: 13,
              color: "#64748b",
              marginTop: 24
            }}>
              This usually takes 45-60 seconds...
            </p>
          </div>

          {/* CSS Animation */}
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes bounce {
                0%, 100% {
                  transform: translateY(0);
                }
                50% {
                  transform: translateY(-20px);
                }
              }
            `
          }} />
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
