"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const PROCESSING_STAGES = [
  { icon: "\u270d\ufe0f", title: "Crafting Your Descriptions", subtitle: "Three expert writers working in parallel", funFact: "Each variation uses a different writing style to give you real options." },
  { icon: "\u2728", title: "Final Polish", subtitle: "Perfecting every word", funFact: "Almost there! Your three listing descriptions are being finalized." },
];

// Before/After example data
const EXAMPLE_BEFORE = `Solid brick 2-flat in Uptown. First floor unit has 3 beds 1 bath. Second floor is 2 beds 1 bath. Full basement. 2 car garage. Separate utilities. Good rental history. Near CTA Red Line. Needs some updating but great bones. Sold as-is.`;

const EXAMPLE_AFTER = `Rare Uptown 2-flat with separate utilities and a two-car garage on a tree-lined block steps from the CTA Red Line. The first-floor three-bedroom, one-bath unit draws morning light through the original double-hung windows, while hardwood floors run room to room. Upstairs, a quieter two-bedroom, one-bath layout sits above it all with long sightlines toward Montrose Avenue. Solid brick construction throughout keeps this building standing as firmly as the day it was built, and the full unfinished basement opens up storage or future build-out space below grade. Rental history is consistent and the separate utility setup means each tenant handles their own. The garage sits off the alley, wide enough for two cars with room left over. Uptown itself continues to draw new restaurants, coffee shops, and renovation activity without losing the neighborhood feel that longtime residents value. This is a property for a buyer who sees the upside in good bones and wants to bring their own plans to the table. Sold as-is and priced to reflect the opportunity.`;

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
  const [selectedVariation, setSelectedVariation] = useState<'professional' | 'fun' | 'balanced'>('balanced');

  // Cycle through stages during loading
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setCurrentStageIndex((prev) => (prev + 1) % PROCESSING_STAGES.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleSubmit = async () => {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to rewrite listing");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = result?.variations?.[selectedVariation] || result?.description;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
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

  const handleRegenerate = () => {
    setResult(null);
    handleSubmit();
  };

  // Show result view
  if (result) {
    const variations = result.variations || { professional: result.description, fun: result.description, balanced: result.description };
    const currentDescription = variations[selectedVariation];
    const variationTabs = [
      { key: 'professional' as const, label: 'Professional', icon: '\ud83d\udcbc', desc: 'Formal & sophisticated' },
      { key: 'balanced' as const, label: 'Balanced', icon: '\u2696\ufe0f', desc: 'Best of both worlds' },
      { key: 'fun' as const, label: 'Engaging', icon: '\u2728', desc: 'Warm & inviting' },
    ];

    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #012f66 0%, #023d85 100%)", padding: 24 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderRadius: 16, padding: 32, color: "white", textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{"\u2713"}</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Your AI-Enhanced Descriptions are Ready!</h2>
            <p style={{ fontSize: 16, opacity: 0.9 }}>3 variations also sent to <strong>{email}</strong></p>
          </div>

          {/* Variation Tabs */}
          <div style={{ background: "#fff", border: "2px solid #e2e8f0", borderRadius: 16, padding: 32, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#023d85" }}>Choose Your Style</h3>
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? "#10b981" : "#012f66",
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
                {copied ? "Copied!" : "Copy to Clipboard"}
              </button>
            </div>

            {/* Tab buttons */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              {variationTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedVariation(tab.key)}
                  style={{
                    flex: 1,
                    padding: "16px 12px",
                    border: selectedVariation === tab.key ? "2px solid #012f66" : "2px solid #e2e8f0",
                    borderRadius: 12,
                    background: selectedVariation === tab.key ? "#e6f0fa" : "#fff",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{tab.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: selectedVariation === tab.key ? "#012f66" : "#023d85" }}>{tab.label}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{tab.desc}</div>
                </button>
              ))}
            </div>

            {/* Description display */}
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 24, fontSize: 16, lineHeight: 1.7, color: "#334155", whiteSpace: "pre-wrap" }}>
              {currentDescription}
            </div>
            <div style={{ marginTop: 12, textAlign: "right", fontSize: 13, color: "#64748b" }}>
              {currentDescription?.length || 0} characters
            </div>
          </div>

          {/* Original Description */}
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#94a3b8", marginBottom: 12 }}>Your Original Description</h3>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "#64748b", whiteSpace: "pre-wrap" }}>
              {description}
            </p>
            <div style={{ marginTop: 8, textAlign: "right", fontSize: 12, color: "#475569" }}>
              {description.length} characters
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleRegenerate}
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #012f66 0%, #0284c7 100%)",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Regenerate (Same Listing)
            </button>
            <button
              onClick={handleReset}
              style={{
                flex: 1,
                background: "white",
                color: "#012f66",
                border: "2px solid #012f66",
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              New Listing
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading view
  if (loading) {
    const stage = PROCESSING_STAGES[currentStageIndex];
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #012f66 0%, #023d85 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 500, textAlign: "center", color: "white" }}>
          <div style={{ fontSize: 80, marginBottom: 24, animation: "bounce 1s infinite" }}>{stage.icon}</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{stage.title}</h2>
          <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 24 }}>{stage.subtitle}</p>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 20 }}>
            <p style={{ fontSize: 14, fontStyle: "italic", color: "#94a3b8" }}>{stage.funFact}</p>
          </div>
          <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 8 }}>
            {PROCESSING_STAGES.map((_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === currentStageIndex ? "#38bdf8" : "rgba(255,255,255,0.2)" }} />
            ))}
          </div>
          <style dangerouslySetInnerHTML={{ __html: `@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }` }} />
        </div>
      </div>
    );
  }

  // Show main landing page with form
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #012f66 0%, #023d85 100%)" }}>
      {/* Hero Section */}
      <section style={{ padding: "40px 24px 32px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <Image src="/logo.png" alt="Listing Rewriter - AI-powered listing descriptions" width={600} height={105} priority style={{ margin: "0 auto 24px" }} />
        <p style={{
          fontSize: 18,
          color: "#94a3b8",
          maxWidth: 600,
          margin: "0 auto 32px",
          lineHeight: 1.6
        }}>
          Paste your listing description and get three professionally rewritten variations in seconds. Free to use, no account needed.
        </p>
      </section>

      {/* Main Form Card */}
      <section style={{ padding: "0 24px 40px", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ background: "white", borderRadius: 20, padding: 32, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 16, marginBottom: 24, color: "#dc2626" }}>
              {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#023d85", marginBottom: 8 }}>
              Your Email <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              style={{ width: "100%", padding: 14, fontSize: 16, border: "2px solid #e2e8f0", borderRadius: 10, boxSizing: "border-box", color: "#1e293b", background: "white" }}
            />
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>
              We&apos;ll email you all three variations for easy reference
            </p>
          </div>

          {/* Address */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#023d85", marginBottom: 8 }}>
              Property Address <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Chicago, IL 60601"
              style={{ width: "100%", padding: 14, fontSize: 16, border: "2px solid #e2e8f0", borderRadius: 10, boxSizing: "border-box", color: "#1e293b", background: "white" }}
            />
          </div>

          {/* Unit (optional) */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#023d85", marginBottom: 8 }}>
              Unit/Apt # <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="2B"
              style={{ width: "100%", padding: 14, fontSize: 16, border: "2px solid #e2e8f0", borderRadius: 10, boxSizing: "border-box", color: "#1e293b", background: "white" }}
            />
          </div>

          {/* Property Details Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }} className="property-details-grid">
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#023d85", marginBottom: 6 }}>Price</label>
              <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$450,000" style={{ width: "100%", padding: 12, fontSize: 14, border: "2px solid #e2e8f0", borderRadius: 8, boxSizing: "border-box", color: "#1e293b", background: "white" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#023d85", marginBottom: 6 }}>Beds</label>
              <input type="text" value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="3" style={{ width: "100%", padding: 12, fontSize: 14, border: "2px solid #e2e8f0", borderRadius: 8, boxSizing: "border-box", color: "#1e293b", background: "white" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#023d85", marginBottom: 6 }}>Baths</label>
              <input type="text" value={baths} onChange={(e) => setBaths(e.target.value)} placeholder="2" style={{ width: "100%", padding: 12, fontSize: 14, border: "2px solid #e2e8f0", borderRadius: 8, boxSizing: "border-box", color: "#1e293b", background: "white" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#023d85", marginBottom: 6 }}>Sq Ft</label>
              <input type="text" value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="1,500" style={{ width: "100%", padding: 12, fontSize: 14, border: "2px solid #e2e8f0", borderRadius: 8, boxSizing: "border-box", color: "#1e293b", background: "white" }} />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#023d85", marginBottom: 8 }}>
              Current Listing Description <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste your current MLS listing description here..."
              rows={6}
              style={{ width: "100%", padding: 14, fontSize: 16, border: "2px solid #e2e8f0", borderRadius: 10, resize: "vertical", boxSizing: "border-box", color: "#1e293b", background: "white" }}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #012f66 0%, #0284c7 100%)",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: 18,
              fontSize: 18,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(14, 165, 233, 0.4)",
            }}
          >
            Generate 3 AI-Enhanced Descriptions
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", marginTop: 16 }}>
            Free to use. Results delivered instantly and emailed to you.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ padding: "60px 24px", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: "white", textAlign: "center", marginBottom: 12 }}>
            How It Works
          </h2>
          <p style={{ color: "#94a3b8", textAlign: "center", marginBottom: 48, fontSize: 16 }}>
            Three simple steps to a listing that sells
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24 }}>
            {[
              { step: "1", icon: "\ud83d\udccb", title: "Paste Your Listing", desc: "Enter your property details and current description" },
              { step: "2", icon: "\ud83e\udd16", title: "AI Rewrites It 3 Ways", desc: "Three distinct writing styles generate in parallel so you get real options" },
              { step: "3", icon: "\u2728", title: "Copy & Go", desc: "Pick the variation you like, copy it, and paste it into your MLS" },
            ].map((item) => (
              <div key={item.step} style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: 16,
                padding: 28,
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.1)",
              }}>
                <div style={{
                  fontSize: 40,
                  marginBottom: 16,
                  background: "rgba(14, 165, 233, 0.15)",
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  {item.icon}
                </div>
                <div style={{
                  color: "#38bdf8",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 8,
                  letterSpacing: "0.05em",
                }}>
                  STEP {item.step}
                </div>
                <h3 style={{ color: "white", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: "white", textAlign: "center", marginBottom: 12 }}>
            See the Difference
          </h2>
          <p style={{ color: "#94a3b8", textAlign: "center", marginBottom: 48, fontSize: 16 }}>
            Real transformation from a Chicago 2-flat listing
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {/* Before */}
            <div style={{
              background: "rgba(239, 68, 68, 0.1)",
              borderRadius: 16,
              padding: 24,
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}>
              <div style={{
                display: "inline-block",
                background: "#ef4444",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 12px",
                borderRadius: 6,
                marginBottom: 16,
              }}>
                BEFORE
              </div>
              <p style={{ color: "#fecaca", fontSize: 15, lineHeight: 1.8 }}>
                {EXAMPLE_BEFORE}
              </p>
              <div style={{ marginTop: 16, color: "#f87171", fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>Issues:</span> Choppy sentences, no flow, reads like a checklist
              </div>
            </div>

            {/* After */}
            <div style={{
              background: "rgba(16, 185, 129, 0.1)",
              borderRadius: 16,
              padding: 24,
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }}>
              <div style={{
                display: "inline-block",
                background: "#10b981",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 12px",
                borderRadius: 6,
                marginBottom: 16,
              }}>
                AFTER
              </div>
              <p style={{ color: "#86efac", fontSize: 15, lineHeight: 1.8 }}>
                {EXAMPLE_AFTER}
              </p>
              <div style={{ marginTop: 16, color: "#34d399", fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>Result:</span> Flows naturally, highlights benefits, sounds human
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ padding: "60px 24px 80px", textAlign: "center" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "white", marginBottom: 16 }}>
          Ready to Transform Your Listings?
        </h2>
        <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: 16 }}>
          Paste your description above and get three pro-quality rewrites in seconds
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            background: "#012f66",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "14px 32px",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(14, 165, 233, 0.4)",
          }}
        >
          Get Started Free
        </button>
      </section>

      {/* Footer */}
      <footer style={{ padding: "24px", borderTop: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          &copy; 2026 DJP3 Consulting Inc. Powered by AI.
        </p>
      </footer>
    </div>
  );
}
