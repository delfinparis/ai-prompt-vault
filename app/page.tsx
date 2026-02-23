"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { spaceGrotesk } from "./fonts";

const PROCESSING_STAGES = [
  { icon: "\u270d\ufe0f", title: "Crafting Your Description", subtitle: "Our AI is rewriting your listing", funFact: "We analyze your original and rewrite it with better flow, structure, and appeal." },
  { icon: "\ud83d\udd0d", title: "Checking Every Detail", subtitle: "Making sure nothing was left out", funFact: "We verify that every feature you mentioned appears in the final description." },
  { icon: "\u2728", title: "Final Polish", subtitle: "Perfecting every word", funFact: "Almost there! Your new listing description is being finalized." },
];

const TONE_OPTIONS = [
  { value: "professional", label: "Professional", description: "Clear, confident MLS-ready copy" },
  { value: "luxury", label: "Luxury Editorial", description: "Elevated vocabulary, architectural detail" },
  { value: "direct", label: "Practical / Direct", description: "Facts-first, minimal flair" },
  { value: "warm", label: "Warm & Casual", description: "Friendly, neighborhood-focused" },
  { value: "investment", label: "Investment-Focused", description: "Returns, rental income, potential" },
];

const BANNED_WORD_SUGGESTIONS = [
  "nestled",
  "entertainer's dream",
  "sun-kissed",
  "charming retreat",
  "moments from",
  "turnkey",
];

// Before/After example data
const EXAMPLE_BEFORE = `Solid brick 2-flat in Uptown. First floor unit has 3 beds 1 bath. Second floor is 2 beds 1 bath. Full basement. 2 car garage. Separate utilities. Good rental history. Near CTA Red Line. Needs some updating but great bones. Sold as-is.`;

const EXAMPLE_AFTER = `Solid brick 2-flat near the CTA Red Line in Uptown with separate utilities and a two-car garage. The first-floor unit offers three bedrooms and one bath, while the second floor holds a two-bedroom, one-bath layout above. A full basement sits below grade for additional flexibility. Rental history has been consistent, and the separate utility arrangement keeps operating costs straightforward for each unit. The building needs updating, but the brick construction and underlying structure remain sound. Sold as-is and priced to reflect the opportunity.`;

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
  const [optInTips, setOptInTips] = useState(true);
  const [tone, setTone] = useState("professional");
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [bannedWordInput, setBannedWordInput] = useState("");

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
          optInTips,
          tone,
          bannedWords,
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
    const textToCopy = result?.description;
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
    setTone("professional");
    setBannedWords([]);
    setBannedWordInput("");
  };

  const handleRegenerate = () => {
    setResult(null);
    handleSubmit();
  };

  // Show result view
  if (result) {
    const rewrittenDescription = result.description;

    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #012f66 0%, #023d85 100%)", padding: 24 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderRadius: 16, padding: 32, color: "white", textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{"\u2713"}</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Your AI-Enhanced Description is Ready!</h2>
            <p style={{ fontSize: 16, opacity: 0.9 }}>Also sent to <strong>{email}</strong></p>
          </div>

          {/* Rewritten Description */}
          <div style={{ background: "#fff", border: "2px solid #e2e8f0", borderRadius: 16, padding: 32, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#023d85" }}>Your New Listing Description</h3>
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

            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 24, fontSize: 16, lineHeight: 1.7, color: "#334155", whiteSpace: "pre-wrap" }}>
              {rewrittenDescription}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <p style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
                AI-generated — review for accuracy before posting to MLS
              </p>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                {rewrittenDescription?.length || 0} characters
              </span>
            </div>
          </div>

          {/* Original Description */}
          <div style={{ background: "#fff", border: "2px solid #e2e8f0", borderRadius: 16, padding: 32, marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "#023d85", marginBottom: 20 }}>Your Original Description</h3>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 24, fontSize: 16, lineHeight: 1.7, color: "#334155", whiteSpace: "pre-wrap" }}>
              {description}
            </div>
            <div style={{ marginTop: 12, textAlign: "right", fontSize: 13, color: "#64748b" }}>
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
      <section style={{ padding: "40px 24px 16px", textAlign: "center", maxWidth: 900, margin: "0 auto" }}>
        <Image src="/logo.png" alt="Listing Rewriter - AI-powered listing descriptions" width={984} height={232} priority style={{ display: "block", margin: "0 auto 24px", width: "70%", height: "auto" }} />
        <h1 className={spaceGrotesk.className} style={{
          fontSize: "clamp(28px, 7vw, 48px)",
          fontWeight: 700,
          color: "white",
          lineHeight: 1.1,
          marginBottom: 16,
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
        }}>
          Tired of Crummy AI Listing Descriptions?
        </h1>
        <p style={{
          fontSize: 16,
          color: "#94a3b8",
          maxWidth: 600,
          margin: "0 auto",
          lineHeight: 1.6,
        }}>
          Most AI tools hallucinate features and sound robotic. This one only uses the facts you provide, avoids cliched MLS language, and transforms your notes into polished, flowing prose.
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
              We&apos;ll email you the rewritten description for easy reference
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

          {/* Tone Selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#023d85", marginBottom: 8 }}>
              Writing Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              style={{ width: "100%", padding: 14, fontSize: 16, border: "2px solid #e2e8f0", borderRadius: 10, boxSizing: "border-box", color: "#1e293b", background: "white", cursor: "pointer", appearance: "auto" }}
            >
              {TONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>
              {TONE_OPTIONS.find((o) => o.value === tone)?.description}
            </p>
          </div>

          {/* Banned Words */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#023d85", marginBottom: 8 }}>
              Words to Avoid <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span>
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {BANNED_WORD_SUGGESTIONS.filter((w) => !bannedWords.includes(w)).map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => bannedWords.length < 20 && setBannedWords([...bannedWords, word])}
                  style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 20, padding: "6px 14px", fontSize: 13, color: "#475569", cursor: "pointer" }}
                >
                  + {word}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, maxWidth: "100%", overflow: "hidden" }}>
              <input
                type="text"
                value={bannedWordInput}
                onChange={(e) => setBannedWordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && bannedWordInput.trim() && bannedWords.length < 20) {
                    e.preventDefault();
                    setBannedWords([...bannedWords, bannedWordInput.trim()]);
                    setBannedWordInput("");
                  }
                }}
                placeholder="Type a word or phrase to ban..."
                style={{ flex: 1, minWidth: 0, padding: 12, fontSize: 14, border: "2px solid #e2e8f0", borderRadius: 10, boxSizing: "border-box", color: "#1e293b", background: "white" }}
              />
              <button
                type="button"
                onClick={() => {
                  if (bannedWordInput.trim() && bannedWords.length < 20) {
                    setBannedWords([...bannedWords, bannedWordInput.trim()]);
                    setBannedWordInput("");
                  }
                }}
                style={{ background: "#012f66", color: "white", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                Add
              </button>
            </div>
            {bannedWords.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {bannedWords.map((word, i) => (
                  <span
                    key={i}
                    style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 20, padding: "5px 12px", fontSize: 13, color: "#dc2626", display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    {word}
                    <button
                      type="button"
                      onClick={() => setBannedWords(bannedWords.filter((_, j) => j !== i))}
                      style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", padding: 0, fontSize: 16, lineHeight: 1 }}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Opt-in checkbox */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 24, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={optInTips}
              onChange={(e) => setOptInTips(e.target.checked)}
              style={{ marginTop: 3, width: 18, height: 18, accentColor: "#012f66", cursor: "pointer" }}
            />
            <span style={{ fontSize: 14, color: "#64748b", lineHeight: 1.4 }}>
              Send me weekly listing tips and market insights
            </span>
          </label>

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
            Generate AI-Enhanced Description
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", marginTop: 16 }}>
            Free to use. Result delivered instantly and emailed to you.
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
              { step: "1", icon: "\ud83d\udccb", title: "Paste Your Listing", desc: "Paste your address, specs, and current description" },
              { step: "2", icon: "\ud83e\udd16", title: "AI Rewrites It", desc: "AI restructures your description using only the facts you provided" },
              { step: "3", icon: "\u2728", title: "Copy & Go", desc: "Review, copy, and paste directly into your MLS" },
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
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
          Ready to Try It?
        </h2>
        <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: 16 }}>
          Free to use, no account needed. Results in seconds.
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
