#!/bin/bash

BASE_URL="http://localhost:5000"
# Register Cook
curl -s -X POST $BASE_URL/auth/register -H "Content-Type: application/json" -d '{"username":"cook1", "password":"password", "role":"cook"}' > /dev/null

# Register Admin
curl -s -X POST $BASE_URL/auth/register -H "Content-Type: application/json" -d '{"username":"admin1", "password":"password", "role":"admin"}' > /dev/null

COOK_TOKEN=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"username":"cook1", "password":"password"}' | jq -r '.token')
ADMIN_TOKEN=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"username":"admin1", "password":"password"}' | jq -r '.token')

echo "---------------------------------------------------"
echo "VERIFYING INVENTORY UPSERT (Adding existing item)"
echo "---------------------------------------------------"

# 1. Get current quantity of 'Test Ingredient'
# First add it to ensure it exists
curl -s -X POST $BASE_URL/cook/inventory -H "Authorization: Bearer $COOK_TOKEN" -H "Content-Type: application/json" -d '{
  "product_name": "Test Ingredient",
  "quantity": 10,
  "unit": "kg"
}' > /dev/null

# Get stats
INITIAL_QTY=$(curl -s -X GET $BASE_URL/cook/inventory -H "Authorization: Bearer $COOK_TOKEN" | jq '.[] | select(.product_name=="Test Ingredient") | .quantity')
echo "Initial Quantity: $INITIAL_QTY"

# 2. Add same item again (should add, not error)
echo "Adding 5 more..."
RESPONSE=$(curl -s -X POST $BASE_URL/cook/inventory -H "Authorization: Bearer $COOK_TOKEN" -H "Content-Type: application/json" -d '{
  "product_name": "Test Ingredient",
  "quantity": 5,
  "unit": "kg"
}')
echo "Response: $RESPONSE"

# 3. Verify new quantity
NEW_QTY=$(curl -s -X GET $BASE_URL/cook/inventory -H "Authorization: Bearer $COOK_TOKEN" | jq '.[] | select(.product_name=="Test Ingredient") | .quantity')
echo "New Quantity: $NEW_QTY"

if [ "$NEW_QTY" -eq "$((INITIAL_QTY + 5))" ]; then
  echo "✅ INVENTORY UPSERT PASSED"
else
  echo "❌ INVENTORY UPSERT FAILED"
fi

echo "---------------------------------------------------"
echo "VERIFYING MENU UPSERT (Adding existing dish)"
echo "---------------------------------------------------"

# 1. Add Dish
curl -s -X POST $BASE_URL/cook/menu -H "Authorization: Bearer $COOK_TOKEN" -H "Content-Type: application/json" -d '{
  "name": "Upsert Dish",
  "description": "Tasty",
  "price": 100,
  "type": "main",
  "available_qty": 10
}' > /dev/null

INITIAL_MENU_QTY=$(curl -s -X GET $BASE_URL/student/menu -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.[] | select(.name=="Upsert Dish") | .available_qty')
echo "Initial Menu Qty: $INITIAL_MENU_QTY"

# 2. Add same dish again
echo "Adding 5 more portions..."
curl -s -X POST $BASE_URL/cook/menu -H "Authorization: Bearer $COOK_TOKEN" -H "Content-Type: application/json" -d '{
  "name": "Upsert Dish",
  "description": "Tasty Updated",
  "price": 120,
  "type": "main",
  "available_qty": 5
}' > /dev/null

# 3. Verify
NEW_MENU_QTY=$(curl -s -X GET $BASE_URL/student/menu -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.[] | select(.name=="Upsert Dish") | .available_qty')
echo "New Menu Qty: $NEW_MENU_QTY"

if [ "$NEW_MENU_QTY" -eq "$((INITIAL_MENU_QTY + 5))" ]; then
  echo "✅ MENU UPSERT PASSED"
else
  echo "❌ MENU UPSERT FAILED"
fi
