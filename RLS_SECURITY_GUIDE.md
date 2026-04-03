# Supabase Row Level Security (RLS) Implementation Guide

## Overview

Row Level Security (RLS) provides database-level protection against cross-tenant data access. Even if your API layer is compromised, RLS policies ensure users can only access data belonging to their garage.

**Status**: Ready to deploy to Supabase production

---

## 1. Architecture

### User-Garage Relationship

```
Authentication (Supabase Auth)
         ↓
    auth.uid() ←→ users.id
         ↓
    users.garage_id
         ↓
All data filtered by garage_id
```

### Flow

1. User logs in with Supabase Auth
2. A `users` table record links their auth.uid() to their garage_id
3. All RLS policies check: "Is this row's garage_id the user's garage_id?"
4. Unauthorized rows are automatically hidden (SELECT) or blocked (INSERT/UPDATE/DELETE)

---

## 2. Tables Protected

All tables have RLS enabled and policies for SELECT, INSERT, UPDATE, DELETE:

| Table | Purpose | Protected By |
|-------|---------|--------------|
| `garages` | Root tenant record | User's garage_id |
| `users` | User-to-garage mapping | User's garage_id |
| `clients` | Customer records | client.garage_id |
| `vehicles` | Vehicle inventory | vehicle.garage_id |
| `interventions` | Service records | intervention.garage_id |
| `invoices` | Billing records | invoice.garage_id |

---

## 3. Policy Breakdown

### GARAGES Table

**SELECT**: User can only see their own garage
```sql
create policy "Users can read their garage" on garages
  for select using (id = (select garage_id from users where id = auth.uid()));
```

**UPDATE**: User can only update their own garage
```sql
create policy "Users can update their garage" on garages
  for update using (id = (select garage_id from users where id = auth.uid()))
  with check (id = (select garage_id from users where id = auth.uid()));
```

---

### USERS Table

**SELECT**: User can see other users in their garage (not other garages)
```sql
create policy "Users can read users from their garage" on users
  for select using (garage_id = (select garage_id from users where id = auth.uid()));
```

**INSERT**: Only garage owners can add new users
```sql
create policy "Only garage owners can insert users" on users
  for insert with check (
    garage_id = (select garage_id from users where id = auth.uid())
    and exists(select 1 from users where id = auth.uid() and role = 'owner')
  );
```

---

### CLIENTS, VEHICLES, INTERVENTIONS, INVOICES Tables

All follow the same pattern (example: CLIENTS):

**SELECT**: User can only see records from their garage
```sql
create policy "Users can read clients from their garage" on clients
  for select using (garage_id = (select garage_id from users where id = auth.uid()));
```

**INSERT**: User can only create records in their garage
```sql
create policy "Users can create clients in their garage" on clients
  for insert with check (garage_id = (select garage_id from users where id = auth.uid()));
```

**UPDATE**: User can only update records in their garage
```sql
create policy "Users can update clients in their garage" on clients
  for update using (garage_id = (select garage_id from users where id = auth.uid()))
  with check (garage_id = (select garage_id from users where id = auth.uid()));
```

**DELETE**: User can only delete records from their garage
```sql
create policy "Users can delete clients from their garage" on clients
  for delete using (garage_id = (select garage_id from users where id = auth.uid()));
```

---

## 4. Deployment Steps

### Step 1: Run the Complete Schema

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Project → SQL Editor
3. Copy entire `lib/schema.sql` content
4. Paste into SQL editor
5. Click "Run" to execute

**Expected Result**: 
- ✅ 6 tables created (garages, users, clients, vehicles, interventions, invoices)
- ✅ Indexes created for performance
- ✅ RLS enabled on all 6 tables
- ✅ 20+ policies created

---

### Step 2: Create Initial Data

#### Create a Demo Garage

```sql
insert into garages (id, name, phone, email, address, siret)
values (
  'demo-garage-id',
  '2roues Pasteur',
  '01 23 45 67 89',
  'contact@2rouespasteur.fr',
  '123 Rue de la Moto, 75001 Paris',
  '12345678901234'
) on conflict (id) do nothing;
```

#### Create a Demo User (for local testing)

After creating Supabase Auth users, create their user record:

```sql
insert into users (id, garage_id, role)
values (
  '[REPLACE WITH SUPABASE AUTH USER ID]',
  'demo-garage-id',
  'owner'
) on conflict (id) do nothing;
```

---

## 5. Testing RLS

### Test 1: Multi-Tenant Isolation

```javascript
// User A (Garage 1) tries to read Garage 2 data
const { data, error } = await supabase
  .from('clients')
  .select()
  .eq('garage_id', 'other-garage-id');

// Result: data = [] (empty, even if records exist)
// RLS filters them out
```

### Test 2: INSERT Validation

```javascript
// User A tries to insert client into Garage 2
const { error } = await supabase
  .from('clients')
  .insert({
    garage_id: 'other-garage-id',  // Different from user's garage
    name: 'Hacker Client',
    phone: '555-0000'
  });

// Result: error "new row violates row level security policy"
```

### Test 3: UPDATE Validation

```javascript
// User A tries to update client from Garage 2
const { error } = await supabase
  .from('clients')
  .update({ name: 'Hacked Name' })
  .eq('id', 'client-from-garage-2');

// Result: error "new row violates row level security policy"
```

---

## 6. API Layer Integration

### Current Status (Before RLS Activation)

`lib/api.ts` currently:
- ✅ Injects garage_id in all INSERT operations
- ✅ Filters with `.eq('garage_id', garageId)` in all SELECT operations
- ⚠️ **Does NOT validate garage_id matches logged-in user**

### After RLS Activation

When you enable RLS and activate auth context in APIs:

```typescript
// Update lib/api.ts to use authenticated client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,  // Enable session
      autoRefreshToken: true,
    }
  }
);

// Now all queries run as authenticated user
// RLS policies automatically filter by auth.uid()
```

---

## 7. Security Guarantees

### What RLS Protects Against

✅ **API Bypass**: Even if frontend sends direct Supabase requests, RLS filters data  
✅ **SQL Injection**: Policies prevent injected SQL from accessing other garages  
✅ **Compromise of Secrets**: If API keys are exposed, RLS prevents cross-tenant access  
✅ **Malicious Queries**: Manually crafted requests are blocked by database policies  

### Example: Even with exposed API key

```javascript
// Hacker has your public API key
const hacker = createClient(PUBLIC_URL, PUBLIC_KEY);

// Try to read all clients
const { data } = await hacker
  .from('clients')
  .select();

// Result: Returns ONLY hacker's garage clients
// RLS enforces this at database level
```

---

## 8. Role-Based Access Control (RBAC)

The `users.role` field supports 3 tiers (extensible):

| Role | Permissions | Example |
|------|-------------|---------|
| `owner` | All operations + manage users | Owner can add/remove team members |
| `manager` | CRUD all data (clients, etc.) | Manager can handle bookings |
| `mechanic` | Create/read/update interventions | Mechanic logs work details |

### Example Policy with Role Check

```sql
-- Only managers and owners can delete invoices
create policy "Only managers can delete invoices" on invoices
  for delete using (
    garage_id = (select garage_id from users where id = auth.uid())
    and (select role from users where id = auth.uid()) in ('owner', 'manager')
  );
```

---

## 9. Monitoring & Audits

### View Active RLS Policies

```sql
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

### Check RLS Status

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

### Audit Logs (Future)

```sql
-- Create audit table
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text,
  action text,  -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
  user_id uuid references auth.users(id),
  garage_id uuid,
  old_data jsonb,
  new_data jsonb,
  timestamp timestamptz default now()
);
```

---

## 10. Troubleshooting

### Issue: "Unable to select rows: ERROR: new row violates row level security policy"

**Cause**: User doesn't have a record in `users` table or garage_id doesn't match

**Solution**:
```sql
-- Verify user exists
select * from users where id = 'user-auth-id';

-- If missing, insert:
insert into users (id, garage_id, role)
values ('user-auth-id', 'demo-garage-id', 'mechanic');
```

### Issue: "Remaining: 0" when querying (empty results)

**Cause**: RLS is filtering out rows - user's garage_id doesn't match

**Debug**:
```sql
-- Check user's garage_id
select garage_id from users where id = auth.uid();

-- Check if row's garage_id matches
select garage_id from clients;
```

### Issue: Policy Error "relation does not exist"

**Cause**: `users` table not created yet

**Solution**: Run the complete `lib/schema.sql` to create all tables

---

## 11. Migration Path (Current → Full Auth)

### Phase 1: Current (API-Layer Protection Only)
- ✅ `lib/api.ts` injects gauge_id manually
- ✅ `lib/garage.ts` provides GARAGE_ID constant
- ⚠️ No RLS enabled yet

### Phase 2: Deploy RLS (This Guide)
- 🔄 Enable RLS on all tables
- 🔄 Deploy users table
- 🔄 Create policies
- 🔄 No app code changes needed

### Phase 3: Authenticate Requests (Future)
- Integrate `@supabase/auth-helpers-nextjs`
- Get `session.user.id` from auth
- Insert into users table on signup
- API queries now run as authenticated user
- RLS automatically filters (no manual `.eq()` needed)

---

## 12. Complete Deployment Checklist

- [ ] Copy `lib/schema.sql` content
- [ ] Paste into Supabase SQL editor
- [ ] Execute (should complete without errors)
- [ ] Verify tables created: `information_schema.tables`
- [ ] Check RLS enabled: `select tablename, rowsecurity from pg_tables`
- [ ] Insert demo garage record
- [ ] Create test user and insert into users table
- [ ] Test queries via Supabase client
- [ ] Verify isolation (user A cannot see user B's garage data)
- [ ] Document users' garage_id in onboarding flow
- [ ] Plan Supabase Auth integration (Phase 3)

---

## 13. Key Security Principles

1. **Never Trust Client Input**: RLS validates at database level, not UI
2. **Defense in Depth**: API layer + RLS policies = maximum protection
3. **Least Privilege**: Each role has only necessary permissions
4. **Audit Everything**: Log who accessed what, when (with audit_logs table)
5. **Test Isolation**: Regularly verify users cannot see other garages

---

## 14. Reference Links

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Enable RLS in Supabase Dashboard](https://app.supabase.com/)

---

**Last Updated**: March 29, 2026  
**Status**: Ready for Supabase Production Deployment
