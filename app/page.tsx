"use client";

import { useState, useEffect } from "react";

const PROCESSING_STAGES = [
  { icon: "🔍", title: "Researching Your Property", subtitle: "Analyzing recent listings & property details", funFact: "Did you know? Properties with detailed descriptions sell 30% faster." },
  { icon: "🏘️", title: "Mapping the Neighborhood", subtitle: "Finding nearby amenities & attractions", funFact: "Fun fact: Mentioning nearby parks increases buyer interest by 25%." },
  { icon: "📊", title: "Analyzing Comparables", subtitle: "Reviewing recently sold properties", funFact: "Insight: The best listings borrow winning elements from successful nearby sales." },
  { icon: "🏆", title: "Real Estate Expert Review", subtitle: "30 years of experience at work", funFact: "Pro tip: Top agents focus on lifestyle benefits, not just features." },
  { icon: "✍️", title: "Master Copywriter Enhancement", subtitle: "Crafting irresistible sales copy", funFact: "Secret: Action-oriented language creates urgency and drives faster decisions." },
  { icon: "📖", title: "Narrative Polish", subtitle: "Adding storytelling magic", funFact: "Psychology: Emotional connections drive 70% of home buying decisions." },
  { icon: "✂️", title: "Final Edit & Optimization", subtitle: "Perfecting every word", funFact: "Goal: Maximum impact in exactly 1000 characters." },
  { icon: "✨", title: "Hollywood Polish", subtitle: "Adding that final wow factor", funFact: "Almost there! Your irresistible listing is being finalized." },
];

export default function Home() {
  // Form fields
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [description, setDescription] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Cycle through stages during loading
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setCurrentStageIndex((prev) => (prev + 1) % PROCESSING_STAGES.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleSubmit = async () => {
    // Validation
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!address.trim()) {
      setError("Please enter the property address");
      return;
    }
    if (!description.trim()) {
      setError("Please enter the current listing description");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setCurrentStageIndex(0);

    try {
      const response = await fetch("/api/listing-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          address,
          unit,
          price,
          beds,
          baths,
          sqft,
          description,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rewrite listing");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.description) {
      navigator.clipboard.writeText(result.description);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setResult(null);
    setAddress("");
    setUnit("");
    setPrice("");
    setBeds("");
    setBaths("");
    setSqft("");
    setDescription("");
  };

  // Show result view
  if (result) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: 24 }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderRadius: 16, padding: 32, color: "white", textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Your AI-Enhanced Description is Ready!</h2>
            <p style={{ fontSize: 16, opacity: 0.9 }}>Also sent to <strong>{email}</strong> • {result.characterCount || 0} characters</p>
          </div>

          <div style={{ background: "#fff", border: "2px solid #e2e8f0", borderRadius: 16, padding: 32, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1e293b" }}>📝 Your New Listing Description</h3>
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? "#10b981" : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {copied ? "✓ Copied!" : "📋 Copy to Clipboard"}
              </button>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 24, fontSize: 16, lineHeight: 1.7, color: "#334155", whiteSpace: "pre-wrap" }}>
              {result.description}
            </div>
          </div>

          <button
            onClick={handleReset}
            style={{
              width: "100%",
              background: "white",
              color: "#3b82f6",
              border: "2px solid #3b82f6",
              borderRadius: 12,
              padding: 16,
              fontSize: 18,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ✨ Rewrite Another Listing
          </button>
        </div>
      </div>
    );
  }

  // Show loading view
  if (loading) {
    const stage = PROCESSING_STAGES[currentStageIndex];
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 500, textAlign: "center", color: "white" }}>
          <div style={{ fontSize: 80, marginBottom: 24, animation: "bounce 1s infinite" }}>{stage.icon}</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{stage.title}</h2>
          <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 24 }}>{stage.subtitle}</p>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: 20 }}>
            <p style={{ fontSize: 14, fontStyle: "italic" }}>💡 {stage.funFact}</p>
          </div>
          <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 8 }}>
            {PROCESSING_STAGES.map((_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === currentStageIndex ? "white" : "rgba(255,255,255,0.3)" }} />
            ))}
          </div>
          <style dangerouslySetInnerHTML={{ __html: `@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }` }} />
        </div>
      </div>
    );
  }

  // Show form view
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: 24 }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", color: "white", marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>🏠 AI Listing Rewriter</h1>
          <p style={{ fontSize: 18, opacity: 0.9 }}>Transform your listing description with AI-powered copywriting</p>
        </div>

        {/* Form Card */}
        <div style={{ background: "white", borderRadius: 20, padding: 32, boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 16, marginBottom: 24, color: "#dc2626" }}>
              ⚠️ {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              Your Email <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              style={{ width: "100%", padding: 14, fontSize: 16, border: "2px solid #e5e7eb", borderRadius: 10, boxSizing: "border-box" }}
            />
          </div>

          {/* Address */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              Property Address <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Chicago, IL 60601"
              style={{ width: "100%", padding: 14, fontSize: 16, border: "2px solid #e5e7eb", borderRadius: 10, boxSizing: "border-box" }}
            />
          </div>

          {/* Unit (optional) */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              Unit/Apt # <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="2B"
              style={{ width: "100%", padding: 14, fontSize: 16, border: "2px solid #e5e7eb", borderRadius: 10, boxSizing: "border-box" }}
            />
          </div>

          {/* Property Details Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Price</label>
              <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$450,000" style={{ width: "100%", padding: 12, fontSize: 14, border: "2px solid #e5e7eb", borderRadius: 8, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Beds</label>
              <input type="text" value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="3" style={{ width: "100%", padding: 12, fontSize: 14, border: "2px solid #e5e7eb", borderRadius: 8, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Baths</label>
              <input type="text" value={baths} onChange={(e) => setBaths(e.target.value)} placeholder="2" style={{ width: "100%", padding: 12, fontSize: 14, border: "2px solid #e5e7eb", borderRadius: 8, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Sq Ft</label>
              <input type="text" value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="1,500" style={{ width: "100%", padding: 12, fontSize: 14, border: "2px solid #e5e7eb", borderRadius: 8, boxSizing: "border-box" }} />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              Current Listing Description <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste your current MLS listing description here..."
              rows={6}
              style={{ width: "100%", padding: 14, fontSize: 16, border: "2px solid #e5e7eb", borderRadius: 10, resize: "vertical", boxSizing: "border-box" }}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: 18,
              fontSize: 18,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ✨ Generate AI-Enhanced Description
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", marginTop: 16 }}>
            Your enhanced description will be emailed to you and displayed here
          </p>
        </div>
      </div>
    </div>
  );
}
