# 🔑 Set Up OpenAI API Key - 5 Minute Guide

## Step 1: Get Your OpenAI API Key

1. Go to: **https://platform.openai.com/api-keys**
2. Click **"Create new secret key"**
3. Name it: `AI Prompt Vault - Production`
4. Click **"Create secret key"**
5. **COPY THE KEY** (starts with `sk-proj-...`)
   - ⚠️ You can only see it once!

## Step 2: Add to Vercel

1. Go to: **https://vercel.com/dashboard**
2. Click your **`ai-prompt-vault`** project
3. Click **"Settings"** (top nav)
4. Click **"Environment Variables"** (left sidebar)
5. Click **"Add New"** button

### Fill in the form:

```
Key (Name):        OPENAI_API_KEY
Value:             sk-proj-xxxxxxxxxxxxxxxxxxxxx (paste your key)

Environment:       ✓ Production
                   ✓ Preview
                   ✓ Development
```

6. Click **"Save"**

## Step 3: Redeploy

**Option A - Automatic (wait 2 min):**
- Push any commit to trigger new build
- The new build will have the API key

**Option B - Manual (instant):**
1. Go to **"Deployments"** tab
2. Find the latest deployment
3. Click the **"..."** menu
4. Click **"Redeploy"**
5. Wait ~90 seconds

## Step 4: Test It! 🧪

1. Visit your site: **https://ai-prompt-vault-9vbxeb46n-delfinparis-projects.vercel.app**
2. Click any prompt card
3. Fill in placeholder values
4. Click **"✨ Generate with AI"**
5. Wait 3-5 seconds
6. **You should see:**
   - AI-generated content appears
   - Purple bordered output panel
   - "Copy Output" button
   - Confetti on first use! 🎉
   - Usage counter: "1 / 3 free generations used"

## Troubleshooting

### "API key not configured" error:
- ✅ Check Vercel env vars: Settings → Environment Variables
- ✅ Make sure variable name is exactly: `OPENAI_API_KEY`
- ✅ Check all three environments are selected
- ✅ Redeploy after adding

### "Insufficient credits" error:
- Your OpenAI account needs credits
- Add payment method: https://platform.openai.com/account/billing
- Minimum: $5 (lasts ~100 generations)

### Nothing happens when clicking "Generate":
- Open browser DevTools → Console
- Look for error messages
- Check Network tab for failed `/api/generate` request

### Still not working?
- Check Vercel deployment logs: Dashboard → Deployments → [Latest] → Function Logs
- Look for errors in the `generate` function

---

## 🎉 Success Checklist

- [ ] OpenAI API key created
- [ ] API key added to Vercel (all 3 environments)
- [ ] Redeployed to production
- [ ] Tested generation - output appears
- [ ] Copy button works
- [ ] Usage counter increments
- [ ] Upgrade modal appears after 3 uses

---

**Next:** Share with beta testers and get feedback! 🚀

Your production URL:
https://ai-prompt-vault-9vbxeb46n-delfinparis-projects.vercel.app
