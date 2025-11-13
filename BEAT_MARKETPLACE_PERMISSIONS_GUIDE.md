# Beat Marketplace Role-Based Permissions Implementation Guide

## Overview

This guide shows you how to implement role-based permissions in the Beat Marketplace, similar to how the Producer Hub works. The permissions system controls what actions users can perform based on their role (Producer, Artist, Lyricist, etc.).

## ✅ Completed Setup

All the infrastructure is now in place:

1. ✅ **permissions.ts** - Extended with beat marketplace permissions
2. ✅ **api-middleware.ts** - Updated to handle all permissions
3. ✅ **types.ts** - Complete permission interface
4. ✅ **authProvider.client.ts** - Fetches permissions from `/api/auth/me`
5. ✅ **usePermissions hook** - Returns complete permissions
6. ✅ `/api/auth/me` endpoint - Returns user with all permissions

## Permission Matrix for Beat Marketplace

| Permission                  | Producer | Artist | Lyricist | Studio Owner | Gear Sales | Other |
|-----------------------------|----------|--------|----------|--------------|------------|-------|
| canUploadBeats              | ✅       | ❌     | ❌       | ❌           | ❌         | ❌    |
| canPurchaseBeats            | ✅       | ✅     | ✅       | ✅           | ✅         | ✅    |
| canReviewBeats              | ✅       | ✅     | ✅       | ✅           | ✅         | ❌    |
| canCommentOnBeats           | ✅       | ✅     | ✅       | ❌           | ❌         | ❌    |
| canSendLicensingOffers      | ✅       | ✅     | ✅       | ❌           | ❌         | ❌    |
| canViewBeatAnalytics        | ✅       | ❌     | ❌       | ❌           | ❌         | ❌    |
| canSetAdvancedPricing       | ✅       | ❌     | ❌       | ❌           | ❌         | ❌    |
| canCollaborateOnBeats       | ✅       | ✅     | ✅       | ❌           | ❌         | ❌    |
| canCreateBeatCollections    | ✅       | ✅     | ✅       | ✅           | ✅         | ✅    |
| canRequestRemixRights       | ✅       | ✅     | ✅       | ❌           | ❌         | ❌    |
| canSplitRoyalties           | ✅       | ✅     | ✅       | ❌           | ❌         | ❌    |
| canListEquipment            | ❌       | ❌     | ❌       | ✅           | ✅         | ❌    |

## Implementation in BeatMarketplace Component

### Step 1: Import the usePermissions Hook

```typescript
import { usePermissions } from "@/hooks/usePermissions";
```

### Step 2: Get Permissions in Your Component

```typescript
export default function BeatMarketplace() {
  const { permissions, isProducer, isArtist, canAccess } = usePermissions();

  // ... rest of your component
}
```

### Step 3: Conditionally Render UI Based on Permissions

Here's how to implement role-based UI for different scenarios:

#### A) Upload Beat Button (Producers Only)

```typescript
{permissions.canUploadBeats && (
  <button
    className={/* your styles */}
    onClick={() => router.push('/beats/upload')}
  >
    <Plus className="w-4 h-4" strokeWidth={2} />
    Upload Beat
  </button>
)}
```

#### B) Beat Card Actions (Different for Each Role)

```typescript
const BeatCardActions = ({ beat }: { beat: Beat }) => {
  const { permissions, isProducer } = usePermissions();

  // Producer viewing their own beat
  const isOwnBeat = false; // Replace with: currentUserId === beat.producerId

  if (isOwnBeat && permissions.canUploadBeats) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => router.push(`/beats/${beat.id}/edit`)}
          className={/* your styles */}
        >
          <Edit3 className="w-4 h-4" />
          Edit Beat
        </button>

        {permissions.canViewBeatAnalytics && (
          <button
            onClick={() => router.push(`/beats/${beat.id}/analytics`)}
            className={/* your styles */}
          >
            <TrendingUp className="w-4 h-4" />
            Analytics
          </button>
        )}
      </div>
    );
  }

  // Other users (Artists, Lyricists, etc.) viewing beats
  return (
    <div className="flex gap-2">
      {permissions.canPurchaseBeats && (
        <button
          onClick={() => addToCart(beat.id)}
          className={/* your styles */}
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
      )}

      {permissions.canSendLicensingOffers && (
        <button
          onClick={() => sendOffer(beat.id)}
          className={/* your styles */}
        >
          <DollarSign className="w-4 h-4" />
          Make Offer
        </button>
      )}
    </div>
  );
};
```

#### C) Permission Info Banner

```typescript
{isProducer && (
  <div className={`mb-6 p-4 rounded-lg border ${
    theme === "dark"
      ? "bg-blue-950/20 border-blue-900/30"
      : "bg-blue-50 border-blue-200/50"
  }`}>
    <div className="flex items-start gap-3">
      <Music2 className={`w-5 h-5 ${
        theme === "dark" ? "text-blue-400" : "text-blue-600"
      }`} />
      <div>
        <p className={`text-sm font-medium ${
          theme === "dark" ? "text-blue-300" : "text-blue-900"
        }`}>
          Producer Dashboard
        </p>
        <p className={`text-xs mt-1 ${
          theme === "dark" ? "text-blue-400/70" : "text-blue-700/70"
        }`}>
          You can upload beats, view analytics, and manage pricing.
        </p>
      </div>
    </div>
  </div>
)}
```

#### D) Comments Section (Role-Based Access)

```typescript
{permissions.canCommentOnBeats && (
  <div className="mt-6">
    <h3 className="text-lg font-light mb-4">Comments</h3>
    <textarea
      placeholder="Share your thoughts on this beat..."
      className={/* your styles */}
    />
    <button className={/* your styles */}>
      Post Comment
    </button>
  </div>
)}

{!permissions.canCommentOnBeats && (
  <div className="mt-6 p-4 rounded-lg border">
    <p className="text-sm text-gray-600">
      Only Artists, Lyricists, and Producers can comment on beats.
    </p>
  </div>
)}
```

#### E) Review/Rating System

```typescript
{permissions.canReviewBeats && (
  <div className="flex items-center gap-2">
    <Star className="w-4 h-4" />
    <span>Rate this beat</span>
  </div>
)}
```

#### F) Advanced Pricing Controls (Producers Only)

```typescript
{permissions.canSetAdvancedPricing && (
  <div className="space-y-4">
    <h3>Pricing Options</h3>

    <div>
      <label>Time-based Discount</label>
      <input type="number" placeholder="10% off until..." />
    </div>

    <div>
      <label>Bulk Licensing</label>
      <input type="number" placeholder="Buy 3 get 20% off" />
    </div>

    <div>
      <label>Subscriber-Only Deal</label>
      <input type="checkbox" />
    </div>
  </div>
)}
```

#### G) Beat Collections (All Users)

```typescript
{permissions.canCreateBeatCollections && (
  <button
    onClick={() => addToCollection(beat.id)}
    className={/* your styles */}
  >
    <Plus className="w-4 h-4" />
    Add to Collection
  </button>
)}
```

#### H) Royalty Splits (Artists, Lyricists, Producers)

```typescript
{permissions.canSplitRoyalties && (
  <div className="mt-4">
    <h4>Split Royalties</h4>
    <input type="text" placeholder="Add collaborator..." />
    <input type="number" placeholder="Percentage..." />
  </div>
)}
```

## Complete BeatMarketplace Example

Here's how your updated component structure should look:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
import { usePermissions } from "@/hooks/usePermissions";
import { /* your icons */ } from "lucide-react";

export default function BeatMarketplace() {
  const router = useRouter();
  const { theme } = useTheme();
  const { permissions, isProducer, isArtist, canAccess } = usePermissions();

  // ... your state variables

  return (
    <div className={/* your container styles */}>
      {/* Header with conditional upload button */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1>Beat Marketplace</h1>
          <p>Discover and license premium beats from top producers</p>
        </div>

        {permissions.canUploadBeats && (
          <button onClick={() => router.push('/beats/upload')}>
            <Plus className="w-4 h-4" />
            Upload Beat
          </button>
        )}
      </div>

      {/* Permission Info Banner */}
      {isProducer && (
        <div className="mb-6 p-4 rounded-lg border">
          <p>Producer Dashboard - Upload beats and view analytics</p>
        </div>
      )}

      {/* Beats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {beats.map((beat) => (
          <BeatCard key={beat.id} beat={beat} />
        ))}
      </div>
    </div>
  );
}
```

## Using Permissions in API Routes

When creating API endpoints for beat operations:

```typescript
// /api/beats/upload/route.ts
import { withAuth, withPermission } from '@/lib/api-middleware';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    return withPermission('uploadBeats', async (req) => {
      // Only users with uploadBeats permission can access
      const user = req.user!;

      // Upload beat logic
      return NextResponse.json({ success: true });
    })(req);
  });
}
```

## Testing Different Roles

1. **As Producer**: Can upload beats, view analytics, set pricing
2. **As Artist**: Can purchase beats, comment, send offers, request remix rights
3. **As Lyricist**: Can purchase beats, comment, collaborate
4. **As Studio Owner**: Can only purchase beats and create collections
5. **As Other**: Can only create collections (limited access)

## Key Benefits

1. ✅ **Centralized Permissions**: All permissions defined in one place (`permissions.ts`)
2. ✅ **Type-Safe**: Full TypeScript support for all permissions
3. ✅ **Consistent**: Same permission logic on client and server
4. ✅ **Flexible**: Easy to add new permissions or roles
5. ✅ **Secure**: Server-side validation via middleware
6. ✅ **Performance**: Permissions cached in auth identity

## Next Steps

1. Replace the mock `isOwnBeat` checks with real user ID comparison
2. Connect permission checks to actual API endpoints
3. Add permission-based routing (redirect if no access)
4. Implement role-specific dashboards
5. Add analytics tracking for permission usage

## Troubleshooting

**Permissions not showing?**
- Check if user is logged in: `useGetIdentity()`
- Verify `/api/auth/me` endpoint is working
- Check browser console for errors

**Wrong permissions displayed?**
- Clear cookies and re-login
- Check database for correct role assignment
- Verify `getUserPermissions()` logic in `permissions.ts`

**TypeScript errors?**
- Ensure all files import `UserPermissions` from same location
- Run `npm run build` to check for type errors
