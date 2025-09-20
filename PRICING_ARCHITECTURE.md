# Custom Pricing Architecture - Subcollection Approach

## Overview
We've restructured the custom pricing system to use Firestore subcollections instead of a separate `clientPriceOverrides` collection. This provides better data organization, improved performance, and cleaner architecture.

## New Structure

### Firestore Collection Structure
```
users/{userId}/customPricing/{productId}
```

**Old Structure (Deprecated):**
```
clientPriceOverrides/{clientEmail_productId}
```

**New Structure:**
```
users/
  └── {userId}/
      ├── (user document data)
      └── customPricing/  (subcollection)
          └── {productId}/
              ├── productId: string
              ├── sku: string
              ├── customPrice: number  (in cents/paise)
              ├── currency: string
              ├── source: string
              ├── createdAt: timestamp
              └── updatedAt: timestamp
```

## Benefits

### 1. **Better Data Organization**
- Custom prices are logically grouped under each user
- No need for composite IDs
- Cleaner data structure

### 2. **Improved Performance**
- Direct subcollection queries are faster than filtered queries
- Better indexing capabilities
- Reduced data transfer

### 3. **Scalability**
- Each user's custom pricing is isolated
- No cross-user data pollution
- Easier to manage large datasets

### 4. **Security**
- Better security rules (user can only access their own pricing)
- Cleaner access patterns
- Reduced permission complexity

## Implementation Changes

### 1. Pricing Upload API (`/api/admin/pricing/upload`)
- **Before:** Created documents in `clientPriceOverrides` with composite IDs
- **After:** Creates documents in `users/{userId}/customPricing/{productId}`
- **Process:**
  1. Find user by email to get userId
  2. Store custom price in user's subcollection
  3. Use productId as document ID (natural key)

### 2. Products API (`/api/products`)
- **Before:** Queried `clientPriceOverrides` with `where('clientId', '==', userId)`
- **After:** Queries `users/{userId}/customPricing` subcollection directly
- **Benefits:** Faster queries, no filtering needed

### 3. PricingService (Client-side)
- **Before:** `getClientPrice()`, `setClientPrice()` with composite IDs
- **After:** `getCustomPrice()`, `setCustomPrice()` with subcollections
- **Simplified:** Cleaner API, no composite ID management

## Data Flow

### Product Listing with Custom Pricing
1. **User Authentication:** Get userId from Firebase Auth token
2. **Fetch Products:** Get all products from `products` collection
3. **Fetch Custom Pricing:** Get user's custom prices from `users/{userId}/customPricing`
4. **Merge Data:** Apply custom prices where available, fall back to base prices
5. **Return Response:** Products with effective prices (custom or base)

### Pricing Upload Process
1. **File Upload:** Admin uploads Excel with "katun pn" and price columns
2. **User Resolution:** Find user by email to get userId
3. **Product Matching:** Match SKUs to products in database
4. **Price Storage:** Store custom prices in `users/{userId}/customPricing/{productId}`
5. **Response:** Success/failure report with detailed logs

## Supported Excel Formats

### Column Names (Case Insensitive)
**SKU Columns:**
- `katun pn`, `katun_pn`, `katunpn`
- `sku`, `SKU`
- `product id`, `Product_ID`, `productid`

**Price Columns:**
- `price`, `Price`
- `amount`, `Amount`
- `cost`, `Cost`

## API Changes Summary

### Updated Endpoints
1. **`POST /api/admin/pricing/upload`**
   - Now stores in user subcollections
   - Supports "katun pn" column recognition
   - Enhanced error handling and reporting

2. **`GET /api/products`**
   - Fetches custom pricing from user subcollections
   - Returns merged pricing data
   - Includes `hasCustomPrice` flag

### New Services
1. **`PricingService.getCustomPrice(userId, productId)`**
2. **`PricingService.setCustomPrice(userId, productId, price)`**
3. **`PricingService.getEffectivePrice(userId, productId)`**

## Migration Notes

### Data Migration (if needed)
If you have existing data in `clientPriceOverrides`, you would need to:
1. Query existing price overrides
2. Map `clientId` (email) to `userId`
3. Create new documents in user subcollections
4. Verify data integrity
5. Clean up old collection

### Backwards Compatibility
- Old `ClientPriceOverride` interface is still available but deprecated
- New `CustomPricing` interface should be used for new development
- Frontend components automatically work with new structure

## Security Rules (Recommended)

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own custom pricing
    match /users/{userId}/customPricing/{productId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admins can manage all custom pricing
    match /users/{userId}/customPricing/{productId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Testing

### Test Cases
1. **Upload pricing with "katun pn" column**
2. **Verify custom prices appear in product listings**
3. **Test fallback to base prices when no custom price exists**
4. **Verify user isolation (users only see their own prices)**
5. **Test admin access to all pricing data**

This architecture provides a much cleaner, more scalable, and maintainable approach to custom pricing management.