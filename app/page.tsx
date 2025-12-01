"use client";

import { useState, useEffect } from "react";

const PROCESSING_STAGES = [
  { icon: "🔍", title: "Researching Your Property", subtitle: "Analyzing recent listings & property details", funFact: "Did you know? Properties with detailed descriptions sell 30% faster." },
  { icon: "🏘️", title: "Mapping the Neighborhood", subtitle: "Finding nearby amenities & attractions", funFact: "Fun fact: Mentioning nearby parks increases buyer interest by 25%." },
  { icon: "📊", title: "Analyzing Comparables", subtitle: "Reviewing recently sold properties", funFact: "Insight: The best listings borrow winning elements from successful nearby sales." },
  { icon: "✍️", title: "AI Copywriter at Work", subtitle: "Crafting your compelling description", funFact: "Secret: Action-oriented language creates urgency and drives faster decisions." },
  { icon: "✨", title: "Final Polish", subtitle: "Perfecting every word", funFact: "Almost there! Your irresistible listing is being finalized." },
];

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
      setError("No credits remaining. Please purchase more credits to continue.");
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
          {/* Header with credits */}
          {user && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 16px", color: "white" }}>
                Credits: <strong>{user.credits}</strong>
              </div>
            </div>
          )}

          <div style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderRadius: 16, padding: 32, color: "white", textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Your AI-Enhanced Description is Ready!</h2>
            <p style={{ fontSize: 16, opacity: 0.9 }}>Also sent to <strong>{user?.email || email}</strong> • {result.characterCount || 0} characters</p>
          </div>

          <div style={{ background: "#fff", border: "2px solid #e2e8f0", borderRadius: 16, padding: 32, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1e293b" }}>Your New Listing Description</h3>
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
                {copied ? "Copied!" : "Copy to Clipboard"}
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
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 500, textAlign: "center", color: "white" }}>
          <div style={{ fontSize: 80, marginBottom: 24, animation: "bounce 1s infinite" }}>{stage.icon}</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{stage.title}</h2>
          <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 24 }}>{stage.subtitle}</p>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: 20 }}>
            <p style={{ fontSize: 14, fontStyle: "italic" }}>{stage.funFact}</p>
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
        {/* Header with auth */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ color: "white" }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>AI Listing Rewriter</h1>
            <p style={{ fontSize: 14, opacity: 0.9 }}>Transform your listing with AI</p>
          </div>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 16px", color: "white" }}>
                Credits: <strong>{user.credits}</strong>
              </div>
              <button
                onClick={handleLogout}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: "8px 16px", color: "white", cursor: "pointer", fontSize: 14 }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthMode('login')}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: "8px 16px", color: "white", cursor: "pointer", fontSize: 14 }}
            >
              Login / Sign Up
            </button>
          )}
        </div>

        {/* Auth Card (if not logged in and wants to auth) */}
        {!user && (authEmail || authPassword || authError) && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <button
                onClick={() => setAuthMode('login')}
                style={{
                  flex: 1,
                  padding: 12,
                  border: "none",
                  borderRadius: 8,
                  background: authMode === 'login' ? "#667eea" : "#f1f5f9",
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
                  background: authMode === 'register' ? "#667eea" : "#f1f5f9",
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
              style={{ width: "100%", padding: 12, fontSize: 16, border: "2px solid #e5e7eb", borderRadius: 8, marginBottom: 12, boxSizing: "border-box" }}
            />
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Password"
              style={{ width: "100%", padding: 12, fontSize: 16, border: "2px solid #e5e7eb", borderRadius: 8, marginBottom: 16, boxSizing: "border-box" }}
            />
            <button
              onClick={handleAuth}
              disabled={authLoading}
              style={{
                width: "100%",
                padding: 14,
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: authLoading ? "wait" : "pointer",
                opacity: authLoading ? 0.7 : 1,
              }}
            >
              {authLoading ? "Please wait..." : (authMode === 'login' ? 'Login' : 'Create Account (1 Free Credit)')}
            </button>
          </div>
        )}

        {/* Main Form Card */}
        <div style={{ background: "white", borderRadius: 20, padding: 32, boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 16, marginBottom: 24, color: "#dc2626" }}>
              {error}
            </div>
          )}

          {/* Email (only show if not logged in) */}
          {!user && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                Your Email <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                onFocus={() => { setAuthEmail(email); setAuthError(""); }}
                style={{ width: "100%", padding: 14, fontSize: 16, border: "2px solid #e5e7eb", borderRadius: 10, boxSizing: "border-box" }}
              />
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
                Or <button onClick={() => setAuthEmail(" ")} style={{ background: "none", border: "none", color: "#667eea", cursor: "pointer", textDecoration: "underline", fontSize: 12, padding: 0 }}>create an account</button> for credits
              </p>
            </div>
          )}

          {/* Logged in user info */}
          {user && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <p style={{ color: "#166534", fontSize: 14 }}>
                Logged in as <strong>{user.email}</strong> • <strong>{user.credits}</strong> credit{user.credits !== 1 ? 's' : ''} remaining
              </p>
            </div>
          )}

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
            disabled={user ? user.credits < 1 : false}
            style={{
              width: "100%",
              background: (user && user.credits < 1) ? "#9ca3af" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: 18,
              fontSize: 18,
              fontWeight: 700,
              cursor: (user && user.credits < 1) ? "not-allowed" : "pointer",
            }}
          >
            {user && user.credits < 1 ? "No Credits - Purchase More" : "Generate AI-Enhanced Description"}
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", marginTop: 16 }}>
            {user ? `Uses 1 credit. You have ${user.credits} remaining.` : "Your enhanced description will be emailed to you"}
          </p>
        </div>
      </div>
    </div>
  );
}
