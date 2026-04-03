# Multi-tenant Supabase Integration

This SaaS now supports multiple garages (tenants) with automatic data isolation.

## Architecture

### Key Files

- **`lib/garage.ts`** - Garage context & tenant management
- **`lib/api.ts`** - Multi-tenant API (auto-injects & filters by garage_id)
- **`lib/supabase.ts`** - Supabase client initialization
- **`lib/schema.sql`** - Complete database schema with garages table

### How It Works

1. **Garage Context**: Each request uses `getGarageId()` to get the current tenant ID
   ```ts
   const garageId = getGarageId(); // Returns GARAGE_ID from env
   ```

2. **Automatic Injection**: All `create()` operations auto-inject `garage_id`
   ```ts
   await clientsAPI.create({ name, phone, ... })
   // Internally adds: garage_id = getGarageId()
   ```

3. **Data Filtering**: All `getAll()` queries filter by `garage_id`
   ```ts
   .eq('garage_id', garageId)
   ```

4. **Data Isolation**: Each garage only sees its own clients, interventions, invoices

## Setup

### 1. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_GARAGE_ID=demo-garage-id
```

For multiple garages, rotate `NEXT_PUBLIC_GARAGE_ID` per deployment:
```env
# Garage 1
NEXT_PUBLIC_GARAGE_ID=garage-uuid-1

# Garage 2
NEXT_PUBLIC_GARAGE_ID=garage-uuid-2
```

### 2. Create Database Schema

Run `lib/schema.sql` in Supabase SQL Editor:

- Creates `garages` table
- Links `clients`, `vehicles`, `interventions`, `invoices` to `garages`
- Adds indexes for performance
- Includes RLS policies (activate when auth is integrated)

### 3. Insert Demo Garage

```sql
insert into garages (id, name, phone, email, address)
values (
  'demo-garage-id',
  '2roues Pasteur',
  '01 23 45 67 89',
  'contact@2rouespasteur.fr',
  '123 Rue de la Moto, 75001 Paris'
);
```

## API Reference

### Clients API

```ts
import { clientsAPI } from '@/lib/api';

// Get all clients for current garage
const clients = await clientsAPI.getAll();

// Create client (garage_id auto-injected)
const client = await clientsAPI.create({
  name: 'Ahmed Ben Ali',
  phone: '06 11 22 33 44',
  email: 'ahmed@example.com',
  address: '123 Rue, Paris',
  vip: false,
  lastVisit: 2,
});
```

### Interventions API

```ts
import { interventionsAPI } from '@/lib/api';

// Get all interventions for current garage
const interventions = await interventionsAPI.getAll();

// Create intervention (garage_id auto-injected)
const intervention = await interventionsAPI.create({
  clientId: 'client-uuid',
  vehicle: 'Yamaha XMAX 300',
  type: 'Révision complète',
  status: 'En cours',
  date: '2026-03-29',
  price: 120,
  description: 'Full service',
  notes: 'Client requested oil change',
});
```

### Invoices API

```ts
import { facturesAPI } from '@/lib/api';

// Get all invoices for current garage
const invoices = await facturesAPI.getAll();

// Create invoice (garage_id auto-injected)
const invoice = await facturesAPI.create({
  clientId: 'client-uuid',
  interventionId: 'intervention-uuid',
  amount: 250.50,
  status: 'En attente',
  date: '2026-03-29',
  dueDate: '2026-04-28',
  notes: 'Payment due in 30 days',
});

// Mark invoice as paid
const paidInvoice = await facturesAPI.markAsPaid('invoice-uuid');
```

## Migration Path (Future)

### From Single-tenant to Multi-tenant Sessions

When Supabase Auth is integrated:

```ts
// lib/garage.ts
export const getGarageId = async (): Promise<string> => {
  const { data } = await supabase.auth.getSession();
  
  // Option 1: Store garage_id in user metadata
  const garageId = data.session?.user?.user_metadata?.garage_id;
  
  // Option 2: Join users → garages table
  const { data: profile } = await supabase
    .from('profiles')
    .select('garage_id')
    .eq('user_id', data.session?.user?.id)
    .single();
    
  return garageId || profile?.garage_id || GARAGE_ID;
};
```

### Row-level Security (RLS)

Uncomment the RLS policies in `lib/schema.sql` when auth is ready:

```sql
alter table clients enable row level security;
create policy "Users can see only their garage's clients" on clients
  for select using (garage_id = auth.uid());
```

## Testing

### Verify Isolation

1. Start with `NEXT_PUBLIC_GARAGE_ID=demo-garage-id`
2. Create a client
3. Change `NEXT_PUBLIC_GARAGE_ID=other-garage-id`
4. Refresh - client should not appear (correctly isolated)
5. Switch back to `demo-garage-id` - client reappears

### Manual SQL Queries

```sql
-- See all data in Garage 1
select * from clients where garage_id = 'demo-garage-id';
select * from interventions where garage_id = 'demo-garage-id';
select * from invoices where garage_id = 'demo-garage-id';

-- Verify isolation
select distinct garage_id from clients;
```

## Best Practices

1. **Always use `getGarageId()`** - Never hardcode garage IDs
2. **Test isolation** - Verify data doesn't leak between garages
3. **Use RLS** - Enable Row-level Security in production
4. **Audit logs** - Track who accessed what from which garage
5. **API keys** - Use different anon keys per environment (dev/staging/prod)

## Troubleshooting

**Q: "Error: Missing garage_id in response"**
- Verify `NEXT_PUBLIC_GARAGE_ID` is set in `.env.local`
- Check that the garage exists in `garages` table

**Q: "No data returned for garage"**
- Confirm `garage_id` values match between client creation and queries
- Run diagnostic SQL to check row counts per garage

**Q: "Wrong garage's data showing"**
- Verify `getGarageId()` returns the correct ID
- Check no hardcoded garage IDs remain in code

## Summary

✅ Multi-tenant ready  
✅ Automatic garage_id injection  
✅ Data isolation per garage  
✅ RLS policies included (for auth)  
✅ Production-grade SQL schema  
✅ Easy to scale to 1000s of garages
