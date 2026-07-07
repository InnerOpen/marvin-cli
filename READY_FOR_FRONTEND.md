# ✅ SDK Ready for Frontend Integration

## Summary

The Marvin SDK is now **production-ready** and can be installed in the frontend to replace all direct API calls.

## What's Changed

### SDK v1.3.0 (Published)

✅ **OpenAPI Type Integration**
- All Platform API types now generated from backend OpenAPI spec
- Run `npm run generate:types` to sync types with backend
- 8,996 lines of auto-generated TypeScript definitions

✅ **New Features**
- Workspace Members module (5 methods)
- API Client preview endpoint
- 100% Platform API coverage (18/18 endpoints)
- 100% Publishing API coverage (11/11 endpoints)

✅ **Type Safety**
- Generated types ensure SDK matches backend exactly
- No more type drift
- Compile-time validation

### CLI v1.1.0 (Published)

✅ **New Commands**
- API clients management (7 commands)
- Workspace members management (5 commands)
- Total: 47 commands

✅ **Architecture**
- Zero direct HTTP calls
- All API interactions via SDK
- Proper credential management

## Installation

```bash
cd path/to/marvin-frontend
npm install @inneropen/marvin-sdk@^1.3.0
```

## Usage in Frontend

### Before (Direct API Calls)
```typescript
// OLD: Direct fetch calls scattered throughout frontend
const response = await fetch(`${apiUrl}/api/platform/entries`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const entries = await response.json();
```

### After (SDK)
```typescript
import { PlatformClient } from '@inneropen/marvin-sdk/platform';

// Initialize once (e.g., in a context provider)
const client = new PlatformClient({
  apiUrl: process.env.MARVIN_API_URL,
  userToken: session.accessToken
});

// Use throughout app
const entries = await client.entries.list();
const entry = await client.entries.get(id);
await client.entries.update(id, { title: 'Updated' });
```

### Type Safety
```typescript
import type {
  PlatformEntry,
  PlatformEntryCreate,
  PlatformEntryUpdate
} from '@inneropen/marvin-sdk/platform';

// All types are auto-generated from backend OpenAPI spec
const createEntry = async (data: PlatformEntryCreate): Promise<PlatformEntry> => {
  return client.entries.create(data);
};
```

## Available Modules

### Platform API (User Token - CRUD Operations)

```typescript
import { PlatformClient } from '@inneropen/marvin-sdk/platform';

const client = new PlatformClient({
  apiUrl: 'http://localhost:8080',
  userToken: 'your-user-token'
});

// Entries
await client.entries.list();
await client.entries.get(id);
await client.entries.create(data);
await client.entries.update(id, data);
await client.entries.delete(id);
await client.entries.listCollections(entryId);
await client.entries.addToCollection(entryId, collectionId);
await client.entries.removeFromCollection(entryId, collectionId);

// Collections
await client.collections.list();
await client.collections.get(id);
await client.collections.create(data);
await client.collections.update(id, data);
await client.collections.delete(id);

// Resources
await client.resources.list();
await client.resources.get(id);
await client.resources.create(data);
await client.resources.update(id, data);
await client.resources.delete(id);

// Assets
await client.assets.list();
await client.assets.get(id);
await client.assets.create(data);
await client.assets.update(id, data);
await client.assets.delete(id);

// Entry Types (read-only)
await client.entryTypes.list();
await client.entryTypes.get(id);

// API Clients (publishing token management)
await client.apiClients.list();
await client.apiClients.get(id);
await client.apiClients.create(data);
await client.apiClients.update(id, data);
await client.apiClients.delete(id);
await client.apiClients.rotateToken(id);
await client.apiClients.preview(id); // NEW

// Workspace Members (NEW)
await client.workspaceMembers.list(workspaceId);
await client.workspaceMembers.get(workspaceId, userId);
await client.workspaceMembers.add(workspaceId, data);
await client.workspaceMembers.updateRole(workspaceId, userId, data);
await client.workspaceMembers.remove(workspaceId, userId);
```

### Publishing API (Site Token - Read-Only)

```typescript
import { MarvinClient } from '@inneropen/marvin-sdk';

const client = new MarvinClient({
  apiUrl: 'http://localhost:8080',
  siteClientToken: 'your-site-token',
  workspaceSlug: 'my-workspace'
});

// Site
await client.initialize(); // Loads site config
const site = client.site; // Access cached site data

// Entries
await client.entries.list();
await client.entries.get(slug);
await client.pages(); // Convenience method
await client.posts(); // Convenience method

// Collections
await client.collections.list();
await client.collections.get(slug);
await client.collections.entries(slug);

// Resources
await client.resources.list();
await client.resources.get(slug);
await client.resources.entries(slug);

// Assets
await client.assets.list();
```

## Migration Strategy for Frontend

### Phase 1: Install SDK
```bash
npm install @inneropen/marvin-sdk@^1.3.0
```

### Phase 2: Create SDK Client Provider (React Example)

```typescript
// contexts/MarvinContext.tsx
import { createContext, useContext, useMemo } from 'react';
import { PlatformClient } from '@inneropen/marvin-sdk/platform';
import { useSession } from './AuthContext';

const MarvinContext = createContext<PlatformClient | null>(null);

export function MarvinProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  
  const client = useMemo(() => {
    if (!session?.accessToken) return null;
    
    return new PlatformClient({
      apiUrl: process.env.NEXT_PUBLIC_MARVIN_API_URL!,
      userToken: session.accessToken
    });
  }, [session?.accessToken]);

  return (
    <MarvinContext.Provider value={client}>
      {children}
    </MarvinContext.Provider>
  );
}

export function useMarvin() {
  const client = useContext(MarvinContext);
  if (!client) throw new Error('useMarvin must be used within MarvinProvider');
  return client;
}
```

### Phase 3: Replace API Calls Page by Page

**Example: Entries List Page**

```typescript
// BEFORE
function EntriesPage() {
  const [entries, setEntries] = useState([]);
  
  useEffect(() => {
    fetch(`${apiUrl}/api/platform/entries`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setEntries);
  }, []);
  
  return <EntriesList entries={entries} />;
}

// AFTER
import { useMarvin } from '@/contexts/MarvinContext';
import type { PlatformEntry } from '@inneropen/marvin-sdk/platform';

function EntriesPage() {
  const marvin = useMarvin();
  const [entries, setEntries] = useState<PlatformEntry[]>([]);
  
  useEffect(() => {
    marvin.entries.list().then(setEntries);
  }, [marvin]);
  
  return <EntriesList entries={entries} />;
}
```

### Phase 4: Verify & Test
- All API calls go through SDK
- Type checking catches errors
- No more manual type definitions

## Benefits for Frontend

✅ **Type Safety**
- Auto-generated types from backend
- Catch API changes at compile-time
- IntelliSense / autocomplete everywhere

✅ **Maintainability**
- Single source of truth (SDK)
- No duplicate HTTP logic
- Easy to update when API changes

✅ **Developer Experience**
- Clean, consistent API
- Error handling built-in
- Async/await throughout

✅ **Future-Proof**
- Types regenerate from OpenAPI spec
- SDK auto-syncs with backend
- New endpoints = just update SDK

## Next Steps

1. ✅ SDK published to npm (v1.3.0)
2. ✅ CLI published to npm (v1.1.0)
3. ⏭️ Install SDK in frontend
4. ⏭️ Create SDK provider/context
5. ⏭️ Migrate pages to use SDK
6. ⏭️ Remove direct fetch calls
7. ⏭️ Enjoy type safety! 🎉

---

**Ready to integrate!** The SDK is production-ready and waiting for you in the frontend. 🚀
