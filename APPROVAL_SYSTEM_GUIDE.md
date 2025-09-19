# User Approval System - Testing Guide

This system implements role-based access control with user approval workflow.

## System Overview

### User Roles & Access
- **Admin Users**: Automatic approval, access to admin panel, no need for approval
- **Regular Users**: Require admin approval, cannot access admin panel until approved
- **Unapproved Users**: Cannot login to the system

### Access Rules
1. **Admin users** (`role: 'admin'`):
   - Auto-approved upon registration
   - Can access `/admin/client` and other admin routes
   - Can approve/reject regular users
   - Bypass all approval checks

2. **Regular users** (`role: 'client'`):
   - Start with `status: 'requested'` and `approved: false`
   - Cannot login until approved by admin
   - Can access `/products`, `/cart` once approved
   - Cannot access admin panel

3. **Unapproved users**:
   - Blocked from login with appropriate error messages
   - Must wait for admin approval

## How to Test

### 1. Create an Admin User
To create an admin user, register with an email ending in `@admin.com` or modify the logic in `src/lib/firebase-auth.ts`:

```typescript
// Current logic - emails ending with @admin.com become admins
const isAdmin = email.endsWith('@admin.com') || email === 'admin@yourdomain.com';
```

**Example admin emails:**
- `admin@admin.com`
- `test@admin.com`
- `admin@yourdomain.com`

### 2. Create Regular Users
Register with any other email (e.g., `user@example.com`) - they will be created with `requested` status.

### 3. Test the Approval Workflow

#### As Admin:
1. Sign in with admin credentials
2. Navigate to `/admin/client` 
3. Click "View Requests" to see pending users
4. Use "Approve" or "Reject" buttons
5. Switch to "Active Clients" to see approved users

#### As Regular User:
1. Try to sign in with unapproved credentials → Should show "pending approval" message
2. After admin approval, sign in should work and redirect to `/products`
3. Try to access `/admin/client` → Should show "Access Denied" message

### 4. Verify Access Controls

#### Protected Routes:
- `/products` - Requires approval (regular users) or admin role
- `/cart` - Requires approval (regular users) or admin role  
- `/admin/client` - Requires admin role only

#### Public Routes:
- `/` - Homepage (public)
- `/sign-in` - Sign in page (public)
- `/sign-up` - Registration page (public)

## User Status Flow

```
Registration → requested → (admin approval) → active
                ↓
            (admin rejection) → inactive
```

### Status Meanings:
- `requested`: New user awaiting approval
- `active`: Approved user who can login
- `inactive`: Rejected user who cannot login

## Firebase Data Structure

```javascript
// User document in Firestore
{
  email: "user@example.com",
  displayName: "John Doe",
  role: "client", // or "admin"
  status: "requested", // "active", "inactive", "requested"
  approved: false, // true for approved users
  approvedAt: timestamp, // when approved
  approvedBy: "admin-uid", // who approved
  rejectedAt: timestamp, // when rejected (if applicable)
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Components Structure

### Authentication Components:
- `AuthProvider` - Manages auth state and role checking
- `ApprovalGuard` - Protects regular user routes (requires approval)
- `AdminGuard` - Protects admin-only routes

### Key Features:
- Automatic admin detection and approval
- Role-based navigation in header
- Contextual error messages for different rejection reasons
- Seamless approval workflow for admins

## Customization

### To Change Admin Detection Logic:
Edit `src/lib/firebase-auth.ts` in the `signUp` function:

```typescript
const isAdmin = email.endsWith('@yourdomain.com'); // Your custom logic
```

### To Add New Protected Routes:
Wrap pages with appropriate guards:

```tsx
// For admin-only pages
import { AdminGuard } from '@/components/auth/admin-guard';

export default function AdminPage() {
  return (
    <AdminGuard>
      {/* Your admin content */}
    </AdminGuard>
  );
}

// For approved-user pages
import { ApprovalGuard } from '@/components/auth/approval-guard';

export default function UserPage() {
  return (
    <ApprovalGuard>
      {/* Your user content */}
    </ApprovalGuard>
  );
}
```
