"use client";
import React, { useState, useMemo, useEffect } from "react";
import "./AIPromptVault.css";
import { prompts as fullPrompts } from "./prompts";
import { PromptItem, buildFullPrompt, extractPlaceholders, applyReplacements, getPlaceholderHelp, simplifyJargon } from "./promptUtils";

/* ---------- Constants ---------- */
const KEY_FAVORITES = "rpv:favorites";
const KEY_COUNTS = "rpv:copyCounts";
const KEY_RECENT = "rpv:recentCopied";
const KEY_SAVED_FIELDS = "rpv:savedFields";

// Module names (descriptive, not numbered)
const MODULE_NAMES: Record<number, string> = {
  1: "Marketing & Lead Generation",
  2: "Daily Systems & Productivity",
  3: "Goals & Accountability",
  4: "Listings & Buyer Presentations",
  5: "Client Service & Follow-Up",
  6: "Finance & Business Planning",
  7: "Negotiation & Deal Strategy",
  8: "Home Search & Market Intel",
  9: "Database & Referral Engine",
  10: "Tech, AI & Marketing Automation",
  11: "AI Workflows & Automation",
  12: "Learning & Industry Resources"
};

// Tag mapping for each module
const MODULE_TAGS: Record<number, string[]> = {
  1: ["leads", "marketing", "content"],
  2: ["systems", "productivity", "workflow"],
  3: ["goals", "planning", "accountability"],
  4: ["listing", "buyer", "presentation"],
  5: ["client", "service", "followup"],
  6: ["finance", "profit", "budget"],
  7: ["negotiation", "deals", "strategy"],
  8: ["buyer", "search", "tools"],
  9: ["sphere", "community", "nurture"],
  10: ["marketing", "ads", "ai"],
  11: ["automation", "workflow", "tech"],
  12: ["learning", "research", "intel"]
};

/* ---------- Tracking ---------- */
const trackEvent = (name: string, data?: Record<string, any>) => {
  try {
    window.dispatchEvent(new CustomEvent("rpv_event", { detail: { name, ...data } }));
  } catch {}
};

/* ---------- Main Component ---------- */
export default function AIPromptVault() {
  const [search, setSearch] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copyCounts, setCopyCounts] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [savedFieldValues, setSavedFieldValues] = useState<Record<string, string>>({});
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [recentlyCopied, setRecentlyCopied] = useState<string[]>([]);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [showFavoritesView, setShowFavoritesView] = useState<boolean>(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState<number>(0);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const fieldInputRef = React.useRef<HTMLInputElement>(null);

  // Load all prompts with tags
  const allPrompts = useMemo(() => {
    return fullPrompts.flatMap((modulePrompts, moduleIdx) => {
      const moduleName = MODULE_NAMES[moduleIdx + 1] || `Module ${moduleIdx + 1}`;
      const tags = MODULE_TAGS[moduleIdx + 1] || [];
      
      return modulePrompts.map((p: any, idx: number) => ({
        ...p,
        module: moduleName,
        index: idx,
        tags,
        id: `${moduleName}-${idx}`,
      }));
    });
  }, []);

  // Load favorites & counts from localStorage
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem(KEY_FAVORITES);
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
      
      const savedCounts = localStorage.getItem(KEY_COUNTS);
      if (savedCounts) setCopyCounts(JSON.parse(savedCounts));
      
      const savedRecent = localStorage.getItem(KEY_RECENT);
      if (savedRecent) setRecentlyCopied(JSON.parse(savedRecent));
      
      const savedFields = localStorage.getItem(KEY_SAVED_FIELDS);
      if (savedFields) setSavedFieldValues(JSON.parse(savedFields));
    } catch {}
  }, []);

    // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // "/" to focus search
      if (e.key === "/" && !selectedPrompt) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // ESC to close modal or clear search
      if (e.key === "Escape") {
        if (selectedPrompt) {
          setSelectedPrompt(null);
        } else if (search || activeTag) {
          setSearch("");
          setActiveTag(null);
        }
      }
      // Enter to copy in modal (removed to avoid dependency issue)
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPrompt, search, activeTag]);

  // Search/filter prompts
  const filteredPrompts = useMemo(() => {
    let filtered = allPrompts;
    
    // Filter by active tag
    if (activeTag) {
      filtered = filtered.filter((p: any) => p.tags?.includes(activeTag));
    }
    
    // Filter by search term
    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter((p: any) => 
        p.title.toLowerCase().includes(term) ||
        p.quick?.toLowerCase().includes(term) ||
        p.tags?.some((t: string) => t.includes(term))
      );
    }
    
    return filtered;
  }, [search, activeTag, allPrompts]);

  // Hot prompts: top 5 by copy count
  const hotPrompts = useMemo(() => {
    return [...allPrompts]
      .sort((a: any, b: any) => (copyCounts[b.id] || 0) - (copyCounts[a.id] || 0))
      .slice(0, 5);
  }, [allPrompts, copyCounts]);

  // Prompts to display
  const displayPrompts = (search || activeTag) ? filteredPrompts : hotPrompts;

  // Favorite prompts
  const favoritePrompts = useMemo(() => {
    return allPrompts.filter((p: any) => favorites.includes(p.id));
  }, [favorites, allPrompts]);

  // Recently copied prompts
  const recentPrompts = useMemo(() => {
    return recentlyCopied
      .map(id => allPrompts.find((p: any) => p.id === id))
      .filter(Boolean)
      .slice(0, 3);
  }, [recentlyCopied, allPrompts]);

  // Copy handler
  const handleCopy = async (prompt: PromptItem) => {
    const fullText = buildFullPrompt(prompt);
    const finalText = applyReplacements(fullText, fieldValues);
    
    try {
      await navigator.clipboard.writeText(finalText);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 5000);
      
      // Update copy count
      const id = (prompt as any).id;
      const newCounts = { ...copyCounts, [id]: (copyCounts[id] || 0) + 1 };
      setCopyCounts(newCounts);
      localStorage.setItem(KEY_COUNTS, JSON.stringify(newCounts));
      
      // Update recently copied (keep last 10)
      const newRecent = [id, ...recentlyCopied.filter(rid => rid !== id)].slice(0, 10);
      setRecentlyCopied(newRecent);
      localStorage.setItem(KEY_RECENT, JSON.stringify(newRecent));
      
      trackEvent("prompt_copied", { title: prompt.title, module: prompt.module });
    } catch (err) {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = finalText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Toggle favorite
  const toggleFavorite = (promptId: string) => {
    const newFavs = favorites.includes(promptId)
      ? favorites.filter(id => id !== promptId)
      : [...favorites, promptId];
    
    setFavorites(newFavs);
    localStorage.setItem(KEY_FAVORITES, JSON.stringify(newFavs));
    trackEvent("favorite_toggled", { promptId, action: newFavs.includes(promptId) ? "add" : "remove" });
  };

  // Select prompt for detail view
  const selectPrompt = (prompt: PromptItem) => {
    setSelectedPrompt(prompt);
    
    // Pre-fill field values from saved fields
    const placeholders = extractPlaceholders(prompt);
    const prefilledValues: Record<string, string> = {};
    placeholders.forEach(ph => {
      if (savedFieldValues[ph]) {
        prefilledValues[ph] = savedFieldValues[ph];
      }
    });
    
    setFieldValues(prefilledValues);
    setCurrentFieldIndex(0);
    trackEvent("prompt_selected", { title: prompt.title });
  };
  
  // Update field value and save to localStorage
  const updateFieldValue = (field: string, value: string) => {
    const newFieldValues = { ...fieldValues, [field]: value };
    setFieldValues(newFieldValues);
    
    // Save to localStorage for future use
    if (value.trim()) {
      const newSavedFields = { ...savedFieldValues, [field]: value };
      setSavedFieldValues(newSavedFields);
      localStorage.setItem(KEY_SAVED_FIELDS, JSON.stringify(newSavedFields));
    }
  };

  // Focus field input when field changes
  React.useEffect(() => {
    if (selectedPrompt && fieldInputRef.current) {
      setTimeout(() => fieldInputRef.current?.focus(), 100);
    }
  }, [currentFieldIndex, selectedPrompt]);

  return (
    <div className="rpv-app rpv-container">
      {/* Header */}
      <header className="rpv-header" style={{ marginBottom: 32 }}>
        <h1 className="title" style={{ marginBottom: 8 }}>
          🏡 AI Prompt Vault
        </h1>
        <p className="subtitle" style={{ marginBottom: 24 }}>
          The best AI prompts for real estate agents. Copy, paste, close deals.
        </p>

        {/* Search Bar */}
        <div style={{ maxWidth: 640, position: "relative" }}>
          <input
            ref={searchInputRef}
            type="search"
            placeholder="What do you need help with? Try: 'listing description', 'social media', 'open house'..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rpv-search-hero"
            style={{
              width: "100%",
              fontSize: 16,
              padding: "14px 20px",
              borderRadius: "var(--radius-pill)",
              border: "2px solid #e5e7eb",
              background: "#fff",
              fontFamily: "var(--font-stack)",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 12,
              color: "var(--muted)",
              pointerEvents: "none",
            }}
          >
            Press <kbd style={{ 
              padding: "2px 6px", 
              background: "#f1f5f9", 
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600 
            }}>/</kbd> to search
          </span>
        </div>

        {/* Active filters */}
        {(activeTag || search) && (
          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Active filters:</span>
            {activeTag && (
              <button
                onClick={() => setActiveTag(null)}
                className="filter-pill"
                style={{
                  padding: "4px 10px",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--primary)",
                  color: "#fff",
                  border: "none",
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                #{activeTag} <span style={{ fontSize: 14 }}>×</span>
              </button>
            )}
            {(search || activeTag) && (
              <button
                onClick={() => {
                  setSearch("");
                  setActiveTag(null);
                }}
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </header>

      {/* Recently Copied (if exists and not searching) */}
      {recentPrompts.length > 0 && !search && !activeTag && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
            ⚡ Recently Copied
          </h2>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
            {recentPrompts.map((prompt: any) => (
              <button
                key={prompt.id}
                onClick={() => selectPrompt(prompt)}
                className="recent-chip"
                style={{
                  padding: "8px 14px",
                  borderRadius: "var(--radius-pill)",
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all 180ms ease",
                }}
              >
                {prompt.title}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Hot Right Now / Search Results */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
            {activeTag ? `#${activeTag} (${filteredPrompts.length})` : search ? `Search Results (${filteredPrompts.length})` : "🔥 Hot Right Now"}
          </h2>
          {!search && !activeTag && (
            <button
              onClick={() => setSearch(" ")}
              style={{
                fontSize: 14,
                color: "var(--primary)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Browse all {allPrompts.length} prompts →
            </button>
          )}
        </div>

        {/* Prompt Cards */}
        <div className="prompt-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {displayPrompts.length === 0 && (
            <div className="empty-state" style={{ padding: "60px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>
                {search || activeTag ? "No prompts found" : "No prompts available"}
              </h3>
              <p style={{ color: "var(--muted)", marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>
                {search 
                  ? `We couldn't find any prompts matching "${search}". Try a different search term.`
                  : activeTag
                  ? `No prompts tagged with #${activeTag}. Try a different tag.`
                  : "Start by searching for what you need."
                }
              </p>
              {(search || activeTag) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                  <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
                    Popular searches:
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                    {["listing", "leads", "social", "followup", "negotiation"].map(term => (
                      <button
                        key={term}
                        onClick={() => {
                          setSearch(term);
                          setActiveTag(null);
                        }}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "var(--radius-pill)",
                          background: "#f1f5f9",
                          border: "1px solid #e5e7eb",
                          color: "var(--text)",
                          fontSize: 13,
                          cursor: "pointer",
                          transition: "all 160ms ease",
                        }}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setSearch("");
                      setActiveTag(null);
                    }}
                    style={{
                      marginTop: 12,
                      padding: "8px 16px",
                      fontSize: 14,
                      color: "var(--primary)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    ← Clear and browse all
                  </button>
                </div>
              )}
            </div>
          )}
          
          {displayPrompts.map((prompt: any) => {
            const isFavorite = favorites.includes(prompt.id);
            const uses = copyCounts[prompt.id] || 0;
            const isHovered = hoveredCard === prompt.id;
            
            return (
              <div
                key={prompt.id}
                className="prompt-card-v2"
                style={{
                  background: "#fff",
                  border: `1px solid ${isHovered ? "var(--primary)" : "rgba(15,23,42,0.08)"}`,
                  borderRadius: "var(--radius-md)",
                  padding: 20,
                  cursor: "pointer",
                  transition: "all 180ms ease",
                  transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                  boxShadow: isHovered ? "var(--shadow-md)" : "none",
                }}
                onClick={() => selectPrompt(prompt)}
                onMouseEnter={() => setHoveredCard(prompt.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                    {prompt.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(prompt.id);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: 20,
                      cursor: "pointer",
                      padding: 4,
                      transition: "transform 160ms ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    {isFavorite ? "⭐" : "☆"}
                  </button>
                </div>

                <p style={{ 
                  fontSize: 14, 
                  color: "var(--muted)", 
                  lineHeight: 1.5, 
                  marginBottom: 12,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: isHovered ? 3 : 2,
                  WebkitBoxOrient: "vertical",
                  transition: "all 180ms ease",
                }}>
                  {prompt.quick}
                </p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {prompt.tags?.map((tag: string) => (
                      <button
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTag(tag);
                          setSearch("");
                          trackEvent("tag_clicked", { tag });
                        }}
                        className="badge tag-badge"
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: "var(--radius-pill)",
                          background: activeTag === tag ? "var(--primary)" : "#f1f5f9",
                          color: activeTag === tag ? "#fff" : "#475569",
                          border: "none",
                          cursor: "pointer",
                          transition: "all 160ms ease",
                        }}
                        onMouseEnter={(e) => {
                          if (activeTag !== tag) {
                            e.currentTarget.style.background = "#e2e8f0";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeTag !== tag) {
                            e.currentTarget.style.background = "#f1f5f9";
                          }
                        }}
                        title={`Filter by #${tag}`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {uses > 0 && (
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>
                        👥 {uses}
                      </span>
                    )}
                    {isHovered && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const shareUrl = `${window.location.origin}${window.location.pathname}?prompt=${encodeURIComponent(prompt.title)}`;
                            navigator.clipboard.writeText(shareUrl);
                            // Could show a mini-toast here
                          }}
                          style={{
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--text)",
                            background: "#f1f5f9",
                            border: "1px solid #e5e7eb",
                            borderRadius: "var(--radius-pill)",
                            cursor: "pointer",
                            animation: "slideIn 200ms ease-out",
                            transition: "all 160ms ease",
                          }}
                          title="Copy link to this prompt"
                        >
                          🔗 Share
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(prompt);
                          }}
                          className="quick-copy-btn"
                          style={{
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#fff",
                            background: "var(--primary)",
                            border: "none",
                            borderRadius: "var(--radius-pill)",
                            cursor: "pointer",
                            animation: "slideIn 200ms ease-out",
                            transition: "all 160ms ease",
                          }}
                          title="Quick copy (without opening details)"
                        >
                          📋 Quick Copy
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Detail Modal */}
      {selectedPrompt && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setSelectedPrompt(null)}
        >
          <div
            className="modal-content"
            style={{
              background: "#fff",
              borderRadius: "var(--radius-md)",
              maxWidth: 680,
              width: "100%",
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              padding: 32, 
              overflowY: "auto",
              flex: 1,
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>
                {selectedPrompt.title}
              </h2>
              <button
                onClick={() => setSelectedPrompt(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "var(--muted)",
                }}
              >
                ×
              </button>
            </div>
            
            {/* What You'll Get */}
            {selectedPrompt.deliverable && (
              <div style={{ 
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: "var(--radius-sm)",
                padding: "12px 16px",
                marginBottom: 20,
              }}>
                <p style={{ 
                  fontSize: 13, 
                  fontWeight: 600,
                  color: "#0369a1", 
                  marginBottom: 4,
                }}>
                  📦 What you'll get:
                </p>
                <p style={{ 
                  fontSize: 14, 
                  color: "#075985", 
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  {simplifyJargon(selectedPrompt.deliverable)}
                </p>
              </div>
            )}

            {/* Editable Fields - DocuSign Style Progressive Flow */}
            {(() => {
              const placeholders = extractPlaceholders(selectedPrompt);
              if (placeholders.length > 0) {
                const currentField = placeholders[currentFieldIndex];
                const isLastField = currentFieldIndex === placeholders.length - 1;
                const helpInfo = getPlaceholderHelp(currentField);

                return (
                  <div style={{ marginBottom: 20 }}>
                    {/* Progress Header */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
                          Quick Setup
                        </h3>
                        <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>
                          Step {currentFieldIndex + 1} of {placeholders.length}
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div style={{ 
                        height: 4, 
                        background: "#e5e7eb", 
                        borderRadius: 999,
                        overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${((currentFieldIndex + 1) / placeholders.length) * 100}%`,
                          background: "var(--primary)",
                          transition: "width 300ms ease",
                        }} />
                      </div>
                    </div>

                    {/* Current Field - Large & Focused */}
                    <div 
                      style={{
                        background: "#f8fafc",
                        border: "2px solid var(--primary)",
                        borderRadius: "var(--radius-md)",
                        padding: 24,
                        marginBottom: 16,
                        animation: "slideIn 220ms ease-out",
                      }}
                    >
                      <label
                        style={{
                          display: "block",
                          fontSize: 15,
                          fontWeight: 600,
                          marginBottom: 8,
                          color: "var(--text)",
                          lineHeight: 1.4,
                        }}
                      >
                        {helpInfo.description}
                      </label>
                      
                      {savedFieldValues[currentField] && (
                        <p style={{
                          fontSize: 11,
                          color: "#10b981",
                          marginBottom: 8,
                          fontWeight: 500,
                        }}>
                          ✓ Pre-filled from last time
                        </p>
                      )}
                      
                      <input
                        ref={fieldInputRef}
                        type="text"
                        value={fieldValues[currentField] || ""}
                        onChange={(e) => updateFieldValue(currentField, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isLastField) {
                            e.preventDefault();
                            setCurrentFieldIndex(currentFieldIndex + 1);
                          } else if (e.key === "Enter" && isLastField && fieldValues[currentField]?.trim()) {
                            handleCopy(selectedPrompt);
                          }
                        }}
                        placeholder={helpInfo.example}
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          borderRadius: "var(--radius-sm)",
                          border: "2px solid #e5e7eb",
                          fontSize: 15,
                          fontFamily: "var(--font-stack)",
                          transition: "all 160ms ease",
                        }}
                        autoFocus
                      />
                    </div>

                    {/* Navigation Buttons */}
                    <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                      <button
                        onClick={() => setCurrentFieldIndex(Math.max(0, currentFieldIndex - 1))}
                        disabled={currentFieldIndex === 0}
                        style={{
                          padding: "10px 20px",
                          fontSize: 14,
                          fontWeight: 600,
                          color: currentFieldIndex === 0 ? "var(--muted)" : "var(--text)",
                          background: currentFieldIndex === 0 ? "#f1f5f9" : "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "var(--radius-sm)",
                          cursor: currentFieldIndex === 0 ? "not-allowed" : "pointer",
                          opacity: currentFieldIndex === 0 ? 0.5 : 1,
                        }}
                      >
                        ← Back
                      </button>

                      <div style={{ display: "flex", gap: 8 }}>
                        {!isLastField ? (
                          <button
                            onClick={() => setCurrentFieldIndex(currentFieldIndex + 1)}
                            style={{
                              padding: "10px 24px",
                              fontSize: 14,
                              fontWeight: 600,
                              color: "#fff",
                              background: "var(--primary)",
                              border: "none",
                              borderRadius: "var(--radius-sm)",
                              cursor: "pointer",
                            }}
                          >
                            Next →
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCopy(selectedPrompt)}
                            style={{
                              padding: "12px 28px",
                              fontSize: 15,
                              fontWeight: 700,
                              color: "#fff",
                              background: "var(--primary)",
                              border: "none",
                              borderRadius: "var(--radius-sm)",
                              cursor: "pointer",
                            }}
                          >
                            📋 Copy Prompt
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              }
              
              // No fields - show prompt preview
              return (
                <div
                  style={{
                    background: "#f8fafc",
                    padding: 16,
                    borderRadius: "var(--radius-sm)",
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "#334155",
                    marginBottom: 20,
                    fontFamily: "ui-monospace, monospace",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {buildFullPrompt(selectedPrompt)}
                </div>
              );
            })()}

            {/* Action Buttons - Only show if no fields OR all fields viewed */}
            {(() => {
              const placeholders = extractPlaceholders(selectedPrompt);
              const hasFields = placeholders.length > 0;
              
              // Only show action buttons if no fields, or if we're on the last field
              if (!hasFields) {
                return (
                  <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <button
                      onClick={() => handleCopy(selectedPrompt)}
                      className="btn-primary"
                      style={{
                        flex: 1,
                        padding: "12px 24px",
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#fff",
                        background: "var(--primary)",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        transition: "all 160ms ease",
                      }}
                    >
                      {copied ? "✓ Copied!" : "📋 Copy Prompt"}
                    </button>
                    
                    <button
                      onClick={() => toggleFavorite((selectedPrompt as any).id)}
                      style={{
                        padding: "12px 20px",
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--text)",
                        background: "#f1f5f9",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        transition: "all 160ms ease",
                      }}
                    >
                      {favorites.includes((selectedPrompt as any).id) ? "⭐ Saved" : "☆ Save"}
                    </button>
                  </div>
                );
              }
              return null;
            })()}

            {/* Keyboard shortcuts hint */}
            <div style={{ 
              fontSize: 11, 
              color: "var(--muted)", 
              textAlign: "center",
              padding: "8px 0"
            }}>
              <kbd style={{ padding: "2px 6px", background: "#f1f5f9", borderRadius: 4, fontWeight: 600 }}>⌘</kbd> + <kbd style={{ padding: "2px 6px", background: "#f1f5f9", borderRadius: 4, fontWeight: 600 }}>Enter</kbd> to copy · <kbd style={{ padding: "2px 6px", background: "#f1f5f9", borderRadius: 4, fontWeight: 600 }}>ESC</kbd> to close
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Favorites Quick Access (Bottom Right FAB) */}
      {favorites.length > 0 && !showFavoritesView && (
        <button
          onClick={() => {
            setShowFavoritesView(true);
            setSearch("");
            setActiveTag(null);
            trackEvent("favorites_opened");
          }}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(37,99,235,0.3)",
            transition: "all 180ms ease",
          }}
          title={`View ${favorites.length} saved prompts`}
        >
          ⭐
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#ef4444",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: "50%",
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {favorites.length}
          </span>
        </button>
      )}

      {/* Favorites Panel */}
      {showFavoritesView && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setShowFavoritesView(false)}
        >
          <div
            className="modal-content"
            style={{
              background: "#fff",
              borderRadius: "var(--radius-md)",
              maxWidth: 720,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              padding: 32,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
                  ⭐ Saved Prompts
                </h2>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>
                  {favoritePrompts.length} prompt{favoritePrompts.length !== 1 ? "s" : ""} saved for quick access
                </p>
              </div>
              <button
                onClick={() => setShowFavoritesView(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "var(--muted)",
                }}
              >
                ×
              </button>
            </div>

            {favoritePrompts.length === 0 ? (
              <div className="empty-state" style={{ padding: "40px 20px" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>
                  No saved prompts yet
                </h3>
                <p style={{ color: "var(--muted)", marginBottom: 20 }}>
                  Click the star on any prompt to save it here for quick access.
                </p>
                <button
                  onClick={() => setShowFavoritesView(false)}
                  style={{
                    padding: "10px 20px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    background: "var(--primary)",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                  }}
                >
                  Browse Prompts
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {favoritePrompts.map((prompt: any) => {
                  const uses = copyCounts[prompt.id] || 0;
                  return (
                    <div
                      key={prompt.id}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e5e7eb",
                        borderRadius: "var(--radius-sm)",
                        padding: 16,
                        cursor: "pointer",
                        transition: "all 180ms ease",
                      }}
                      onClick={() => {
                        selectPrompt(prompt);
                        setShowFavoritesView(false);
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
                          {prompt.title}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(prompt.id);
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            fontSize: 18,
                            cursor: "pointer",
                            padding: 4,
                          }}
                          title="Remove from favorites"
                        >
                          ⭐
                        </button>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, marginBottom: 8 }}>
                        {prompt.quick?.slice(0, 120)}...
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--muted)" }}>
                        <span>{prompt.tags?.map((t: string) => `#${t}`).join(" ")}</span>
                        {uses > 0 && <span>· Copied {uses}×</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Copy Success Toast */}
      {copied && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#10b981",
            color: "#fff",
            padding: "16px 24px",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            zIndex: 10000,
            animation: "slideUp 300ms ease-out",
            maxWidth: "90vw",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
            ✓ Copied!
          </div>
          <div style={{ fontSize: 13, marginBottom: 12, opacity: 0.9 }}>
            Now paste into ChatGPT or Claude
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <a
              href="https://chatgpt.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "8px 16px",
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "var(--radius-sm)",
                color: "#fff",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
                transition: "all 160ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              }}
            >
              Open ChatGPT →
            </a>
            <a
              href="https://claude.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "8px 16px",
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "var(--radius-sm)",
                color: "#fff",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
                transition: "all 160ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              }}
            >
              Open Claude →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
