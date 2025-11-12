# 🏡 Kale Realty - AI Prompt Vault Integration

## Full-Page Squarespace Embed (RECOMMENDED)

Perfect for: `/resources/ai-prompts` page on joinkale.com

### Copy-Paste Ready Code:

```html
<!-- Kale Branded AI Prompt Vault Embed -->
<style>
  /* Kale Brand Integration */
  .kale-prompt-vault-wrapper {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
    background: #F8F9FA;
  }
  
  .kale-vault-hero {
    background: linear-gradient(135deg, #0c2340 0%, #1a3356 100%);
    color: white;
    padding: 60px 24px;
    text-align: center;
    margin-bottom: 0;
  }
  
  .kale-vault-hero h1 {
    font-size: 42px;
    font-weight: 700;
    margin: 0 0 16px 0;
    color: white;
    line-height: 1.2;
  }
  
  .kale-vault-hero .subtitle {
    font-size: 20px;
    font-weight: 400;
    margin: 0 0 24px 0;
    color: rgba(255,255,255,0.9);
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .kale-vault-hero .badge {
    display: inline-block;
    background: #8BC53F;
    color: #0c2340;
    padding: 8px 20px;
    border-radius: 24px;
    font-weight: 700;
    font-size: 14px;
    margin-top: 8px;
  }
  
  .kale-prompt-vault-container {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    background: white;
    border-radius: 0;
    box-shadow: none;
    position: relative;
  }
  
  .kale-vault-iframe {
    width: 100%;
    height: 90vh;
    min-height: 800px;
    border: none;
    display: block;
  }
  
  .kale-vault-footer {
    background: #0c2340;
    color: white;
    text-align: center;
    padding: 32px 24px;
    font-size: 14px;
  }
  
  .kale-vault-footer a {
    color: #8BC53F;
    text-decoration: none;
    font-weight: 600;
  }
  
  .kale-vault-footer a:hover {
    text-decoration: underline;
  }
  
  /* Mobile optimization */
  @media (max-width: 768px) {
    .kale-vault-hero {
      padding: 40px 20px;
    }
    
    .kale-vault-hero h1 {
      font-size: 32px;
    }
    
    .kale-vault-hero .subtitle {
      font-size: 16px;
    }
    
    .kale-vault-iframe {
      height: 100vh;
      min-height: 100vh;
    }
  }
  
  /* Loading state */
  .kale-vault-loading {
    text-align: center;
    padding: 60px 20px;
    color: #6B7280;
  }
  
  .kale-vault-loading:after {
    content: "Loading AI Prompt Vault...";
    display: block;
    margin-top: 16px;
    font-size: 18px;
    font-weight: 600;
    color: #0c2340;
  }
</style>

<div class="kale-prompt-vault-wrapper">
  <!-- Hero Section -->
  <div class="kale-vault-hero">
    <h1>🤖 AI Prompt Vault for Kale Brokers</h1>
    <p class="subtitle">
      129+ ready-to-use AI prompts built specifically for real estate agents.<br>
      Save 10+ hours per week on writing listings, emails, and social content.
    </p>
    <span class="badge">✨ FREE FOR ALL KALE BROKERS</span>
  </div>
  
  <!-- App Container -->
  <div class="kale-prompt-vault-container">
    <div class="kale-vault-loading"></div>
    <iframe 
      src="https://your-app.vercel.app?kale=true"
      class="kale-vault-iframe"
      title="AI Prompt Vault - Free AI Prompts for Kale Realty Brokers"
      loading="lazy"
      allow="clipboard-write"
      onload="this.previousElementSibling.style.display='none'"
    ></iframe>
  </div>
  
  <!-- Footer CTA -->
  <div class="kale-vault-footer">
    <p>💡 <strong>Have a prompt idea?</strong> <a href="mailto:dj@kalerealty.com?subject=AI Prompt Suggestion">Send it to DJ</a> and we'll add it for everyone!</p>
  </div>
</div>

<script>
  // Add kale branding class to iframe when it loads
  window.addEventListener('message', function(e) {
    if (e.data === 'promptVaultLoaded') {
      console.log('AI Prompt Vault loaded successfully');
    }
  });
</script>
```

---

## Modal/Popup Version (Alternative)

Perfect for: Linked from training pages, resource sections

```html
<style>
  /* Kale-Branded Launch Button */
  .kale-launch-vault {
    display: inline-block;
    background: linear-gradient(135deg, #0c2340 0%, #1a3356 100%);
    color: white;
    padding: 18px 36px;
    border-radius: 8px;
    font-size: 18px;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 4px 12px rgba(12, 35, 64, 0.3);
    transition: all 0.2s ease;
    cursor: pointer;
    border: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  
  .kale-launch-vault:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(12, 35, 64, 0.4);
    background: linear-gradient(135deg, #081a2e 0%, #0c2340 100%);
  }
  
  .kale-launch-vault:before {
    content: "🤖 ";
    margin-right: 8px;
  }
  
  /* Modal Styles */
  .kale-vault-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(12, 35, 64, 0.95);
    z-index: 999999;
    padding: 20px;
    backdrop-filter: blur(4px);
  }
  
  .kale-vault-modal.active {
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .kale-vault-modal-content {
    width: 100%;
    max-width: 1600px;
    height: 95vh;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    position: relative;
    animation: slideUp 0.3s ease;
  }
  
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  .kale-vault-close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 48px;
    height: 48px;
    background: #0c2340;
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 28px;
    cursor: pointer;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 300;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  
  .kale-vault-close:hover {
    background: #8BC53F;
    color: #0c2340;
    transform: rotate(90deg);
  }
  
  @media (max-width: 768px) {
    .kale-vault-modal-content {
      height: 100vh;
      border-radius: 0;
    }
    
    .kale-vault-close {
      width: 40px;
      height: 40px;
      font-size: 24px;
    }
  }
</style>

<!-- Launch Button -->
<button class="kale-launch-vault" onclick="openKaleVault()">
  Launch AI Prompt Vault
</button>

<!-- Modal -->
<div class="kale-vault-modal" id="kaleVaultModal">
  <div class="kale-vault-modal-content">
    <button class="kale-vault-close" onclick="closeKaleVault()" aria-label="Close">×</button>
    <iframe 
      src="https://your-app.vercel.app?kale=true"
      style="width: 100%; height: 100%; border: none;"
      title="AI Prompt Vault"
      allow="clipboard-write"
      id="kaleVaultFrame"
    ></iframe>
  </div>
</div>

<script>
  function openKaleVault() {
    const modal = document.getElementById('kaleVaultModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Track usage (optional - add your analytics)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'ai_vault_opened', {
        'event_category': 'engagement',
        'event_label': 'AI Prompt Vault'
      });
    }
  }
  
  function closeKaleVault() {
    const modal = document.getElementById('kaleVaultModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeKaleVault();
  });
  
  // Click outside to close
  document.getElementById('kaleVaultModal').addEventListener('click', function(e) {
    if (e.target === this) closeKaleVault();
  });
</script>
```

---

## Squarespace Setup Instructions

### Step 1: Add New Page
1. Pages → + → Blank Page
2. Name it "AI Prompts" or "AI Tools"
3. URL: `/ai-prompts` or `/resources/ai-tools`

### Step 2: Add Code Block
1. Edit page → Add Section → Code Block
2. Paste either embed code above
3. Save

### Step 3: Add to Header (Optional - for site-wide access)
1. Settings → Advanced → Code Injection
2. Header: Add modal version
3. Now the button works on any page!

### Step 4: Link from Navigation
Add to main menu:
- **Label:** "AI Tools" or "Free AI Prompts"
- **Link:** `/ai-prompts`
- **Icon:** 🤖 (optional)

---

## Branding Enhancements Needed

To make the app match Kale perfectly, I need to:

### 1. Add Kale Theme Detection
Detect `?kale=true` URL parameter and apply Kale colors

### 2. Update App Colors
- Primary: Kale Navy (#0c2340)
- Accent: Kale Green (#8BC53F)
- Highlights: Kale Yellow (#F7B500)

### 3. Custom Header
Show "Kale Realty" branding when embedded

---

## Want me to implement these branding changes in the app?

I can:
1. Add URL parameter detection (`?kale=true`)
2. Apply Kale color scheme automatically
3. Add custom header with Kale logo
4. Match fonts and spacing exactly

**Ready to make it look native to joinkale.com?** 🎨
