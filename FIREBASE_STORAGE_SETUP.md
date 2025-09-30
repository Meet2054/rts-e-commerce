# Firebase Storage Rules Deployment

## Issue Resolution
You're getting "storage/unauthorized" because Firebase Storage rules aren't configured to allow uploads.

## Steps to Fix:

### 1. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Deploy Storage Rules
```bash
firebase deploy --only storage
```

### 4. Alternative: Manual Rule Setup
If you prefer to set rules manually via Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `rts-imaging-e-commerce`
3. Navigate to "Storage" → "Rules"
4. Replace the existing rules with the content from `storage.rules`
5. Click "Publish"

## Testing Upload
After deploying rules, test the upload functionality:

1. Login as admin user
2. Go to Admin Panel → Add Product
3. Fill in product details with SKU (e.g., "12345")
4. Upload an image
5. Submit the form

## Troubleshooting

### If still getting unauthorized error:
1. Check if user is properly authenticated
2. Verify the user has a valid Firebase token
3. Check browser console for detailed error messages
4. Ensure the storage bucket name matches in environment variables

### Environment Variables Check:
Make sure your `.env.local` has:
```
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=rts-imaging-e-commerce.appspot.com
```

### Debug Commands:
```bash
# Check current project
firebase projects:list

# Test rules deployment
firebase deploy --only storage --debug
```