#!/bin/bash

# AI Prompt Vault - Automated Testing Script
# Runs comprehensive E2E tests and generates report

echo "🚀 Starting AI Prompt Vault Test Suite..."
echo ""

# Check if dev server is running
if ! curl -s http://localhost:3001 > /dev/null; then
    echo "⚠️  Dev server not running on localhost:3001"
    echo "Starting dev server..."
    npm start &
    SERVER_PID=$!
    sleep 10
    echo "✓ Dev server started (PID: $SERVER_PID)"
else
    echo "✓ Dev server already running"
    SERVER_PID=""
fi

echo ""
echo "🧪 Running comprehensive E2E tests..."
echo ""

# Run tests with retries for flaky tests
npx playwright test tests/comprehensive-e2e.spec.ts --reporter=html --retries=1

TEST_EXIT_CODE=$?

echo ""
echo "📸 Generating visual report..."

# Open test report
npx playwright show-report &

echo ""
echo "Screenshots saved to: tests/screenshots/"
echo "HTML report opened in browser"
echo ""

# Cleanup
if [ ! -z "$SERVER_PID" ]; then
    echo "Stopping dev server..."
    kill $SERVER_PID 2>/dev/null
fi

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ ALL TESTS PASSED"
else
    echo "❌ SOME TESTS FAILED - Check report for details"
fi

exit $TEST_EXIT_CODE
