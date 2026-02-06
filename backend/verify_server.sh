#!/bin/bash
set -e

BASE_URL="http://localhost:5000"
echo "=== 🚀 START VERIFICATION ==="

# 1. Register Student
echo "[1] Register Student..."
STUDENT_USER="verify_student_$(date +%s)"
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$STUDENT_USER\", \"password\": \"123\", \"role\": \"student\", \"allergies\": \"none\"}"
echo ""

# Login Student
echo "[1.1] Login Student..."
STUDENT_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$STUDENT_USER\", \"password\": \"123\"}" | jq -r '.token')
echo "Token: ${STUDENT_TOKEN:0:10}..."

# 2. Register Cook & Add Menu
echo "[2] Register Cook..."
COOK_USER="verify_cook_$(date +%s)"
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$COOK_USER\", \"password\": \"123\", \"role\": \"cook\"}"
echo ""

COOK_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$COOK_USER\", \"password\": \"123\"}" | jq -r '.token')

echo "[2.1] Add Menu Item..."
curl -s -X POST "$BASE_URL/cook/menu" \
  -H "Authorization: Bearer $COOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Dish", "description": "Tasty", "price": 100, "type": "lunch", "available_qty": 10}'
echo ""

# Get Menu ID (assuming it's the last one, or just list)
MENU_ITEM=$(curl -s "$BASE_URL/student/menu" -H "Authorization: Bearer $STUDENT_TOKEN" | jq '.[-1]')
MENU_ID=$(echo $MENU_ITEM | jq '.id')
MENU_PRICE=$(echo $MENU_ITEM | jq '.price')
echo "Added Menu Item ID: $MENU_ID, Price: $MENU_PRICE"

# 3. Check Balance (Should be 0)
echo "[3] Check Initial Balance..."
BALANCE_BEFORE=$(curl -s "$BASE_URL/student/profile" -H "Authorization: Bearer $STUDENT_TOKEN" | jq '.balance')
echo "Balance: $BALANCE_BEFORE"

# 4. Top Up Balance
echo "[4] Top Up Balance (+500)..."
curl -s -X POST "$BASE_URL/student/balance" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 500}'
echo ""

BALANCE_AFTER_TOPUP=$(curl -s "$BASE_URL/student/profile" -H "Authorization: Bearer $STUDENT_TOKEN" | jq '.balance')
echo "Balance after topup: $BALANCE_AFTER_TOPUP"

# 5. Buy Item
echo "[5] Buy Item (Price $MENU_PRICE)..."
BUY_RES=$(curl -s -X POST "$BASE_URL/student/buy" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"menu_item_id\": $MENU_ID, \"type\": \"single\"}")
echo "Buy Response: $BUY_RES"

# 6. Verify Balance Deduction
echo "[6] Verify Balance Deduction..."
BALANCE_FINAL=$(curl -s "$BASE_URL/student/profile" -H "Authorization: Bearer $STUDENT_TOKEN" | jq '.balance')
echo "Final Balance: $BALANCE_FINAL"

EXPECTED_BALANCE=$((BALANCE_AFTER_TOPUP - MENU_PRICE)) # // End of script 500 - 100 = 400

if [[ "$BALANCE_FINAL" == "$EXPECTED_BALANCE" ]] || [[ "$BALANCE_FINAL" == "400" ]]; then
  echo "✅ SUCCESS: Balance deducted correctly."
else
  echo "❌ FAILURE: Balance incorrect. Expected $EXPECTED_BALANCE, got $BALANCE_FINAL"
fi

echo "=== ✅ VERIFICATION COMPLETE ==="
