"use client";

import React, { useState, useEffect } from "react";
import ListingRewriter from "./ListingRewriter";
import { loadStripe } from "@stripe/stripe-js";

interface DashboardProps {
  user: any;
  token: string;
  onLogout: () => void;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

export default function Dashboard({ user: initialUser, token, onLogout }: DashboardProps) {
  const [user, setUser] = useState(initialUser);
  const [buyingCredits, setBuyingCredits] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Refresh user data periodically
  const refreshUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  useEffect(() => {
    // Refresh user data every 10 seconds
    const interval = setInterval(refreshUser, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const handleBuyCredits = async () => {
    setBuyingCredits(true);

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
      setBuyingCredits(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          padding: "16px 20px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              AI Listing Rewriter
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* Credits Display */}
            <div
              style={{
                padding: "8px 16px",
                background: user.credits > 0 ? "#dcfce7" : "#fee2e2",
                border: `1px solid ${user.credits > 0 ? "#bbf7d0" : "#fecaca"}`,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 24 }}>💳</span>
              <div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Credits</div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: user.credits > 0 ? "#166534" : "#991b1b",
                  }}
                >
                  {user.credits}
                </div>
              </div>
            </div>

            {/* Buy Credits Button */}
            <button
              onClick={() => setShowBuyModal(true)}
              style={{
                height: 44,
                padding: "0 20px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              Buy Credits
            </button>

            {/* User Menu */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                  {user.email}
                </div>
              </div>
              <button
                onClick={onLogout}
                style={{
                  padding: "8px 16px",
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ListingRewriter user={user} token={token} onCreditsUsed={refreshUser} />

      {/* Buy Credits Modal */}
      {showBuyModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => !buyingCredits && setShowBuyModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: 40,
              maxWidth: 500,
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
              Buy Credits
            </h2>
            <p style={{ fontSize: 16, color: "#64748b", marginBottom: 32 }}>
              Each credit generates 3 expert AI listing variations
            </p>

            {/* Quantity Selector */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: 12,
                }}
              >
                Number of Credits
              </label>
              <div style={{ display: "flex", gap: 12 }}>
                {[1, 3, 5, 10].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuantity(q)}
                    style={{
                      flex: 1,
                      padding: "16px 12px",
                      background: quantity === q ? "#667eea" : "#fff",
                      color: quantity === q ? "#fff" : "#0f172a",
                      border: `2px solid ${quantity === q ? "#667eea" : "#e2e8f0"}`,
                      borderRadius: 12,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div>{q}</div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                      ${(q * 4.99).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div
              style={{
                padding: 20,
                background: "#f8fafc",
                borderRadius: 12,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 16,
                  marginBottom: 8,
                }}
              >
                <span style={{ color: "#64748b" }}>Credits:</span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>{quantity}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 16,
                  marginBottom: 8,
                }}
              >
                <span style={{ color: "#64748b" }}>Price per credit:</span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>$4.99</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 20,
                  fontWeight: 700,
                  paddingTop: 12,
                  borderTop: "2px solid #e2e8f0",
                }}
              >
                <span style={{ color: "#0f172a" }}>Total:</span>
                <span style={{ color: "#667eea" }}>${(quantity * 4.99).toFixed(2)}</span>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowBuyModal(false)}
                disabled={buyingCredits}
                style={{
                  flex: 1,
                  height: 52,
                  background: "#fff",
                  border: "2px solid #e2e8f0",
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#64748b",
                  cursor: buyingCredits ? "not-allowed" : "pointer",
                  opacity: buyingCredits ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBuyCredits}
                disabled={buyingCredits}
                style={{
                  flex: 1,
                  height: 52,
                  background: buyingCredits
                    ? "#cbd5e1"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: buyingCredits ? "not-allowed" : "pointer",
                }}
              >
                {buyingCredits ? "Processing..." : "Continue to Checkout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
