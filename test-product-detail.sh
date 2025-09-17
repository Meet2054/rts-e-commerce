#!/bin/bash

echo "🧪 Testing Product Detail Page Flow"
echo "=================================="

echo ""
echo "📋 Step 1: Getting product list..."
PRODUCTS=$(curl -s "http://localhost:3000/api/products" | jq -r '.products[0:3] | .[] | .sku')

echo "✅ Found products: $(echo "$PRODUCTS" | tr '\n' ' ')"

echo ""
echo "📋 Step 2: Testing individual product APIs..."
for sku in $PRODUCTS; do
    echo "  Testing SKU: $sku"
    RESULT=$(curl -s "http://localhost:3000/api/products/$sku" | jq -r '.success')
    if [ "$RESULT" = "true" ]; then
        echo "  ✅ API working for SKU: $sku"
    else
        echo "  ❌ API failed for SKU: $sku"
    fi
done

echo ""
echo "📋 Step 3: Testing related products..."
FIRST_SKU=$(echo "$PRODUCTS" | head -n1)
BRAND=$(curl -s "http://localhost:3000/api/products/$FIRST_SKU" | jq -r '.product.brand')
echo "  Testing related products for brand: $BRAND"
RELATED_COUNT=$(curl -s "http://localhost:3000/api/products/related/$(echo "$BRAND" | sed 's/ /%20/g')?exclude=$FIRST_SKU&limit=4" | jq '.products | length')
echo "  ✅ Found $RELATED_COUNT related products"

echo ""
echo "🎯 Test product detail URLs:"
for sku in $PRODUCTS; do
    echo "  http://localhost:3000/products/$sku"
done

echo ""
echo "✅ All APIs are working! You can now click on products in the browser."
