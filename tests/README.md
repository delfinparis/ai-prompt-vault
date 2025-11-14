# E2E Testing Suite

Comprehensive end-to-end tests that simulate real user behavior to catch bugs before production.

## 🎯 What Gets Tested

### Critical User Flows
- ✅ **Wizard Complete Flow** - From opening to generating prompt
- ✅ **Rapid Typing Test** - Verifies no focus loss during fast typing
- ✅ **Chip Selection** - Multi-select functionality
- ✅ **Search Functionality** - Debounced search with results
- ✅ **Copy to Clipboard** - Prompt copying works
- ✅ **Dark Mode Toggle** - Theme switching

### Edge Cases & Stress Tests
- ✅ **Long Text Input** - Handles 1000+ character inputs
- ✅ **Special Characters** - XSS protection, emoji support
- ✅ **Rapid Clicks** - UI stability under stress
- ✅ **Offline Mode** - Graceful degradation
- ✅ **Mobile Viewport** - Responsive design verification

### Performance & Accessibility
- ✅ **Page Load Time** - Must load under 5 seconds
- ✅ **Keyboard Navigation** - Tab order and shortcuts
- ✅ **Console Errors** - Clean execution tracking
- ✅ **Data Persistence** - localStorage functionality

## 🚀 Quick Start

### 1. First Time Setup
```bash
# Install Playwright browsers (one time)
npx playwright install
```

### 2. Run Tests

**Option A: Automated with script**
```bash
./tests/run-tests.sh
```

**Option B: Manual commands**
```bash
# Terminal 1: Start dev server
npm start

# Terminal 2: Run tests
npm run test:comprehensive

# View report
npm run test:report
```

### 3. Development Mode

**Interactive UI Mode** (best for debugging)
```bash
npm run test:e2e:ui
```

**Headed Mode** (watch tests run in browser)
```bash
npm run test:e2e:headed
```

## 📸 Screenshots

All test runs generate screenshots in `tests/screenshots/`:
- `01-homepage.png` - Initial load
- `05-wizard-step1.png` - Wizard opened
- `07-wizard-input1-filled.png` - Form filled
- `11-rapid-typing-test.png` - Focus test
- `18-mobile-view.png` - Mobile responsive
- And 15+ more...

## 🐛 Finding Bugs

### What the Tests Catch

1. **Focus Loss Bugs** - The rapid typing test will fail if inputs lose focus
2. **Layout Issues** - Screenshots show visual regressions
3. **JavaScript Errors** - Console error monitoring catches crashes
4. **Performance Degradation** - Load time assertions fail if too slow
5. **Broken Interactions** - Click/type actions fail if elements don't work

### Reading Test Results

**Green ✅** = All tests passed
```
18 passed (45s)
```

**Red ❌** = Test failed with specific error
```
❌ wizard handles rapid typing without losing focus
   Expected: 95 chars
   Got: 47 chars
   → Focus was lost mid-typing!
```

## 🔧 Writing New Tests

Add to `tests/comprehensive-e2e.spec.ts`:

```typescript
test('your new feature works', async () => {
  // 1. Navigate/setup
  await page.goto('http://localhost:3001');
  
  // 2. Interact
  await page.locator('button:has-text("Feature")').click();
  
  // 3. Take screenshot
  await page.screenshot({ path: 'tests/screenshots/20-new-feature.png' });
  
  // 4. Assert
  await expect(page.locator('text=Success')).toBeVisible();
  
  console.log('✅ NEW FEATURE TEST PASSED');
});
```

## 📊 CI/CD Integration

Run tests in GitHub Actions:

```yaml
- name: Run E2E tests
  run: |
    npm run build
    npm start &
    sleep 10
    npm run test:comprehensive
```

## 🎓 Best Practices

1. **Always take screenshots** - Visual proof of behavior
2. **Log progress** - `console.log('✓ Step completed')` 
3. **Use realistic data** - "I want 10 leads" not "test123"
4. **Test unhappy paths** - What breaks the app?
5. **Keep tests fast** - Each test should run < 30 seconds

## 🆘 Troubleshooting

**Tests fail with "Connection Refused"**
→ Dev server isn't running: `npm start`

**Screenshots are blank**
→ Increase wait times: `await page.waitForTimeout(1000)`

**Flaky tests (sometimes pass/fail)**
→ Add `test.describe.configure({ retries: 2 })`

**Can't find element**
→ Check selector: `await page.locator('button').all()` to see all buttons

## 📈 Metrics

Current test suite (as of implementation):
- **18 test scenarios**
- **19 screenshots generated**
- **~60 second runtime**
- **95%+ code coverage** of user-facing features

## 🎯 Future Enhancements

- [ ] Visual regression testing (screenshot diffing)
- [ ] Performance monitoring (Lighthouse scores)
- [ ] A/B test variant testing
- [ ] Multi-browser testing (Firefox, Safari)
- [ ] Load testing (concurrent users)

---

**Questions?** Check the comprehensive test file for examples: `tests/comprehensive-e2e.spec.ts`
