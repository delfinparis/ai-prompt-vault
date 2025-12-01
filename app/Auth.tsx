"use client";

import React, { useState } from "react";

interface AuthProps {
  onSuccess: (token: string, user: any) => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Save token to localStorage
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Call success callback
      onSuccess(data.token, data.user);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: "100%",
          background: "#fff",
          borderRadius: 20,
          padding: 48,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p style={{ fontSize: 16, color: "#64748b" }}>
            {isLogin
              ? "Sign in to access your listing rewriter"
              : "Get started with 1 free credit"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="email"
              style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                height: 48,
                padding: "0 16px",
                fontSize: 16,
                border: "2px solid #e2e8f0",
                borderRadius: 12,
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#667eea")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="password"
              style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: "100%",
                height: 48,
                padding: "0 16px",
                fontSize: 16,
                border: "2px solid #e2e8f0",
                borderRadius: 12,
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#667eea")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
            />
            {!isLogin && (
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                Must be at least 6 characters
              </p>
            )}
          </div>

          {error && (
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: "#fee2e2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                fontSize: 14,
                marginBottom: 20,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: 52,
              background: loading ? "#cbd5e1" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.2s",
              marginBottom: 16,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Toggle */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <p style={{ fontSize: 14, color: "#64748b" }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#667eea",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        {/* Benefits for new users */}
        {!isLogin && (
          <div
            style={{
              marginTop: 32,
              padding: 20,
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 12,
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, color: "#166534", marginBottom: 8 }}>
              ✓ What you get:
            </p>
            <ul style={{ fontSize: 13, color: "#15803d", margin: 0, paddingLeft: 20 }}>
              <li>1 free credit to try the tool</li>
              <li>3 expert AI variations per credit</li>
              <li>Additional credits: $4.99 each</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
