#!/bin/bash
set -e

BASE_URL="http://localhost:5000"
echo "=== 🚀 START ADMIN & COOK VERIFICATION ==="

# 1. Register & Login Admin
echo "[1] Register Admin..."
ADMIN_USER="verify_admin_$(date +%s)"
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$ADMIN_USER\", \"password\": \"123\", \"role\": \"admin\"}" > /dev/null

ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$ADMIN_USER\", \"password\": \"123\"}" | jq -r '.token')
echo "Admin Token: ${ADMIN_TOKEN:0:10}..."

# 2. Register & Login Cook
echo "[2] Register Cook..."
COOK_USER="verify_cook_$(date +%s)"
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$COOK_USER\", \"password\": \"123\", \"role\": \"cook\"}" > /dev/null

COOK_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$COOK_USER\", \"password\": \"123\"}" | jq -r '.token')
echo "Cook Token: ${COOK_TOKEN:0:10}..."

# 3. Cook creates Procurement Request
echo "[3] Cook creates request for 'Potatoes'..."
curl -s -X POST "$BASE_URL/cook/request" \
  -H "Authorization: Bearer $COOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"item_name": "Potatoes", "quantity": 50}' | jq
echo ""

# 4. Admin views Requests (Pending)
echo "[4] Admin views pending requests..."
REQUESTS=$(curl -s "$BASE_URL/admin/requests" -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$REQUESTS" | jq

# Extract ID of the last request
REQ_ID=$(echo "$REQUESTS" | jq '.[-1].id')
echo "Target Request ID: $REQ_ID"

# 5. Admin Approves Request with Cost
echo "[5] Admin approves request #$REQ_ID with Cost 30..."
curl -s -X PUT "$BASE_URL/admin/requests/$REQ_ID/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"total_cost": 30}' | jq
echo ""

# 6. Admin Stats (General)
echo "[6] Admin views General Stats (Revenue - Expenses)..."
STATS=$(curl -s "$BASE_URL/admin/stats" -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$STATS" | jq

EXPENSES=$(echo "$STATS" | jq '.total_expenses')
if [ "$EXPENSES" -gt 0 ]; then
  echo "✅ SUCCESS: Expenses updated (Current: $EXPENSES)."
else
  echo "❌ FAILURE: Expenses not updated. Got $EXPENSES"
fi

# 7. Admin Dishes Report
echo "[7] Admin views Dishes Report..."
curl -s "$BASE_URL/admin/dishes-report" -H "Authorization: Bearer $ADMIN_TOKEN" | jq
echo ""

echo "=== ✅ ADMIN VERIFICATION COMPLETE ==="
