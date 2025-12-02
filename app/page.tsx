"use client";

import { useState, useEffect } from "react";

const PROCESSING_STAGES = [
  { icon: "🔍", title: "Researching Your Property", subtitle: "Analyzing recent listings & property details", funFact: "Did you know? Properties with detailed descriptions sell 30% faster." },
  { icon: "🏘️", title: "Mapping the Neighborhood", subtitle: "Finding nearby amenities & attractions", funFact: "Fun fact: Mentioning nearby parks increases buyer interest by 25%." },
  { icon: "📊", title: "Analyzing Comparables", subtitle: "Reviewing recently sold properties", funFact: "Insight: The best listings borrow winning elements from successful nearby sales." },
  { icon: "✍️", title: "AI Copywriter at Work", subtitle: "Crafting your compelling description", funFact: "Secret: Action-oriented language creates urgency and drives faster decisions." },
  { icon: "✨", title: "Final Polish", subtitle: "Perfecting every word", funFact: "Almost there! Your irresistible listing is being finalized." },
];

// Before/After example data - Real AI-generated result from Uptown Chicago 2-flat
const EXAMPLE_BEFORE = `Solid brick 2-flat in Uptown. First floor unit has 3 beds 1 bath. Second floor is 2 beds 1 bath. Full basement. 2 car garage. Separate utilities. Good rental history. Near CTA Red Line. Needs some updating but great bones. Sold as-is.`;

const EXAMPLE_AFTER = `Discover a timeless 1910 brick 2-flat nestled in the heart of Uptown, where vintage architecture meets modern convenience. This property, with its recently updated kitchen and bathrooms, blends charm and functionality. Picture mornings in the sunlit first-floor unit, where hardwood floors echo with history and stories. Separate utilities and a solid rental history make this a fantastic investment opportunity. Just a short stroll to the CTA Red Line, you'll enjoy easy commutes and vibrant city life at your doorstep. Indulge in the culinary delights of The Chicago Diner or savor a coffee at nearby Cafe Cito. Families will appreciate the proximity to Ravenswood Elementary and Amundsen High School, while Welles and Horner Parks offer green escapes for leisure and play. A new HVAC system ensures comfort year-round. This home is sold as-is, inviting you to infuse your personal touch and continue its storied legacy. Secure your slice of Chicago's rich tapestry with this captivating property.`;

interface User {
  id: string;
  email: string;
  credits: number;
}

export default function Home() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showAuthForm, setShowAuthForm] = useState(false);

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

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Cycle through stages during loading
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setCurrentStageIndex((prev) => (prev + 1) % PROCESSING_STAGES.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleAuth = async () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Email and password are required");
      return;
    }

    setAuthLoading(true);
    setAuthError("");

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Save to state and localStorage
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      setEmail(data.user.email);
      setAuthEmail("");
      setAuthPassword("");
      setShowAuthForm(false);
    } catch (err: any) {
      setAuthError(err.message || 'Something went wrong');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setEmail("");
  };

  const handleSubmit = async () => {
    // Validation for non-logged-in users
    if (!user && (!email.trim() || !email.includes("@"))) {
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

    // Check credits for logged-in users
    if (user && user.credits < 1) {
      setError("No credits remaining. Please contact us for more credits during the testing period.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setCurrentStageIndex(0);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/listing-rewrite", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: user ? user.email : email,
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

      // Update credits in local state if logged in
      if (user && data.creditsRemaining !== undefined) {
        const updatedUser = { ...user, credits: data.creditsRemaining };
        setUser(updatedUser);
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      }
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

  // Show result view
  if (result) {
    const variations = result.variations || { professional: result.description, fun: result.description, balanced: result.description };
    const currentDescription = variations[selectedVariation];
    const variationTabs = [
      { key: 'professional' as const, label: 'Professional', icon: '💼', desc: 'Formal & sophisticated' },
      { key: 'balanced' as const, label: 'Balanced', icon: '⚖️', desc: 'Best of both worlds' },
      { key: 'fun' as const, label: 'Engaging', icon: '✨', desc: 'Warm & inviting' },
    ];

    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #012f66 0%, #023d85 100%)", padding: 24 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {/* Header with credits */}
          {user && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px", color: "white" }}>
                Credits: <strong>{user.credits}</strong>
              </div>
            </div>
          )}

          <div style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderRadius: 16, padding: 32, color: "white", textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Your AI-Enhanced Description is Ready!</h2>
            <p style={{ fontSize: 16, opacity: 0.9 }}>3 variations sent to <strong>{user?.email || email}</strong></p>
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

          <button
            onClick={handleReset}
            style={{
              width: "100%",
              background: "white",
              color: "#012f66",
              border: "2px solid #012f66",
              borderRadius: 12,
              padding: 16,
              fontSize: 18,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Rewrite Another Listing
          </button>
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
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === currentStageIndex ? "#012f66" : "rgba(255,255,255,0.2)" }} />
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
      {/* Navigation */}
      <nav style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ color: "white", fontWeight: 700, fontSize: 20 }}>
          <span style={{ color: "#012f66" }}>Kale</span> Listing AI
        </div>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              color: "white",
              fontSize: 14,
              fontWeight: 500,
            }}>
              {user.credits} Credit{user.credits !== 1 ? 's' : ''}
            </div>
            <button
              onClick={handleLogout}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "8px 16px", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthForm(true)}
            style={{ background: "#012f66", border: "none", borderRadius: 8, padding: "10px 20px", color: "white", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
          >
            Login / Sign Up
          </button>
        )}
      </nav>

      {/* Hero Section */}
      <section style={{ padding: "60px 24px 40px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{
          display: "inline-block",
          background: "rgba(1, 47, 102, 0.15)",
          color: "#38bdf8",
          fontSize: 13,
          fontWeight: 600,
          padding: "6px 14px",
          borderRadius: 20,
          marginBottom: 20
        }}>
          Beta Testing - 5 Free Credits on Signup
        </div>
        <h1 style={{
          fontSize: "clamp(32px, 5vw, 52px)",
          fontWeight: 800,
          color: "white",
          lineHeight: 1.1,
          marginBottom: 20
        }}>
          Transform Boring Listings Into <span style={{ color: "#012f66" }}>Buyer Magnets</span>
        </h1>
        <p style={{
          fontSize: 18,
          color: "#94a3b8",
          maxWidth: 600,
          margin: "0 auto 32px",
          lineHeight: 1.6
        }}>
          Our AI analyzes your property, researches the neighborhood, and crafts compelling descriptions that sell homes faster.
        </p>
      </section>

      {/* Auth Card (if not logged in and wants to auth) */}
      {!user && showAuthForm && (
        <div style={{ maxWidth: 440, margin: "0 auto 32px", padding: "0 24px" }}>
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <button
                onClick={() => setAuthMode('login')}
                style={{
                  flex: 1,
                  padding: 12,
                  border: "none",
                  borderRadius: 8,
                  background: authMode === 'login' ? "#012f66" : "#f1f5f9",
                  color: authMode === 'login' ? "white" : "#64748b",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode('register')}
                style={{
                  flex: 1,
                  padding: 12,
                  border: "none",
                  borderRadius: 8,
                  background: authMode === 'register' ? "#012f66" : "#f1f5f9",
                  color: authMode === 'register' ? "white" : "#64748b",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Sign Up
              </button>
            </div>

            {authError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, marginBottom: 16, color: "#dc2626", fontSize: 14 }}>
                {authError}
              </div>
            )}

            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="Email"
              style={{ width: "100%", padding: 12, fontSize: 16, border: "2px solid #e2e8f0", borderRadius: 8, marginBottom: 12, boxSizing: "border-box" }}
            />
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Password"
              style={{ width: "100%", padding: 12, fontSize: 16, border: "2px solid #e2e8f0", borderRadius: 8, marginBottom: 16, boxSizing: "border-box" }}
            />
            <button
              onClick={handleAuth}
              disabled={authLoading}
              style={{
                width: "100%",
                padding: 14,
                background: "#012f66",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: authLoading ? "wait" : "pointer",
                opacity: authLoading ? 0.7 : 1,
              }}
            >
              {authLoading ? "Please wait..." : (authMode === 'login' ? 'Login' : 'Create Account (5 Free Credits)')}
            </button>
            <button
              onClick={() => setShowAuthForm(false)}
              style={{
                width: "100%",
                padding: 12,
                background: "transparent",
                color: "#64748b",
                border: "none",
                fontSize: 14,
                cursor: "pointer",
                marginTop: 8,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <section style={{ padding: "0 24px 40px", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ background: "white", borderRadius: 20, padding: 32, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 16, marginBottom: 24, color: "#dc2626" }}>
              {error}
            </div>
          )}

          {/* Email (only show if not logged in) */}
          {!user && !showAuthForm && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#023d85", marginBottom: 8 }}>
                Your Email <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                style={{ width: "100%", padding: 14, fontSize: 16, border: "2px solid #e2e8f0", borderRadius: 10, boxSizing: "border-box" }}
              />
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>
                <button onClick={() => { setShowAuthForm(true); setAuthMode('register'); }} style={{ background: "none", border: "none", color: "#012f66", cursor: "pointer", textDecoration: "underline", fontSize: 13, padding: 0, fontWeight: 500 }}>Create an account</button> to get 5 free credits and save your history
              </p>
            </div>
          )}

          {/* Logged in user info */}
          {user && (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <p style={{ color: "#166534", fontSize: 14, fontWeight: 500 }}>
                Logged in as <strong>{user.email}</strong> • <strong>{user.credits}</strong> credit{user.credits !== 1 ? 's' : ''} remaining
              </p>
            </div>
          )}

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
              style={{ width: "100%", padding: 14, fontSize: 16, border: "2px solid #e2e8f0", borderRadius: 10, boxSizing: "border-box" }}
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
              style={{ width: "100%", padding: 14, fontSize: 16, border: "2px solid #e2e8f0", borderRadius: 10, boxSizing: "border-box" }}
            />
          </div>

          {/* Property Details Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#023d85", marginBottom: 6 }}>Price</label>
              <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$450,000" style={{ width: "100%", padding: 12, fontSize: 14, border: "2px solid #e2e8f0", borderRadius: 8, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#023d85", marginBottom: 6 }}>Beds</label>
              <input type="text" value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="3" style={{ width: "100%", padding: 12, fontSize: 14, border: "2px solid #e2e8f0", borderRadius: 8, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#023d85", marginBottom: 6 }}>Baths</label>
              <input type="text" value={baths} onChange={(e) => setBaths(e.target.value)} placeholder="2" style={{ width: "100%", padding: 12, fontSize: 14, border: "2px solid #e2e8f0", borderRadius: 8, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#023d85", marginBottom: 6 }}>Sq Ft</label>
              <input type="text" value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="1,500" style={{ width: "100%", padding: 12, fontSize: 14, border: "2px solid #e2e8f0", borderRadius: 8, boxSizing: "border-box" }} />
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
              style={{ width: "100%", padding: 14, fontSize: 16, border: "2px solid #e2e8f0", borderRadius: 10, resize: "vertical", boxSizing: "border-box" }}
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
            Generate AI-Enhanced Description
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", marginTop: 16 }}>
            {user ? `Uses 1 credit. You have ${user.credits} remaining.` : "Your enhanced description will be emailed to you"}
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
              { step: "1", icon: "📋", title: "Paste Your Listing", desc: "Enter your property details and current description" },
              { step: "2", icon: "🤖", title: "AI Works Its Magic", desc: "Our AI researches comps, neighborhood, and crafts compelling copy" },
              { step: "3", icon: "✨", title: "Get Your New Description", desc: "Receive an optimized listing ready to copy and paste" },
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
                  color: "#012f66",
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
            Real transformation from a recent listing
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
              <p style={{ color: "#fca5a5", fontSize: 15, lineHeight: 1.7 }}>
                {EXAMPLE_BEFORE}
              </p>
              <div style={{ marginTop: 16, color: "#f87171", fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>Issues:</span> Generic, lacks emotion, no storytelling
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
              <p style={{ color: "#6ee7b7", fontSize: 15, lineHeight: 1.7 }}>
                {EXAMPLE_AFTER}
              </p>
              <div style={{ marginTop: 16, color: "#34d399", fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>Result:</span> Compelling, emotional, drives action
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
          Sign up now and get 5 free credits to try it out
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
          © 2024 Kale Realty. Powered by AI.
        </p>
      </footer>
    </div>
  );
}
