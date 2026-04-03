# 📋 RLS Deployment Checklist

Use this checklist to deploy RLS to production.

---

## ✅ Pre-Deployment (Do First)

- [ ] Read [RLS_QUICK_START.md](RLS_QUICK_START.md) (10 min)
- [ ] Review [RLS_VISUAL_ARCHITECTURE.md](RLS_VISUAL_ARCHITECTURE.md) if you want diagrams (15 min)
- [ ] Ensure you have Supabase project access
- [ ] Backup existing database (if applicable)

---

## ✅ Deployment (5 Minutes)

### Step 1: Prepare SQL
- [ ] Open [lib/schema.sql](lib/schema.sql) in VS Code
- [ ] Select All content (Ctrl+A)
- [ ] Copy to clipboard (Ctrl+C)

### Step 2: Deploy to Supabase
- [ ] Go to [https://app.supabase.com](https://app.supabase.com)
- [ ] Click your project
- [ ] Go to SQL Editor (left sidebar)
- [ ] Click "New Query"
- [ ] Paste the SQL (Ctrl+V)
- [ ] Click "Run" button (blue, top-right)
- [ ] Wait for completion
- [ ] ✅ Should see success message (no errors)

### Step 3: Quick Verify
- [ ] No error messages appear
- [ ] Message shows "X queries completed"

---

## ✅ Post-Deployment Verification

### Run These SQL Queries

#### Query 1: Check All Tables Exist
```sql
select tablename 
from pg_tables 
where schemaname = 'public' 
order by tablename;
```
**Expected**: 6 tables
- [ ] garages
- [ ] users
- [ ] clients
- [ ] vehicles
- [ ] interventions
- [ ] invoices

#### Query 2: Check RLS Enabled
```sql
select tablename, rowsecurity 
from pg_tables 
where schemaname = 'public' 
order by tablename;
```
**Expected**: All 6 tables show `rowsecurity = t` (true)
- [ ] garages: t
- [ ] users: t
- [ ] clients: t
- [ ] vehicles: t
- [ ] interventions: t
- [ ] invoices: t

#### Query 3: Count Policies
```sql
select count(*) as policy_count
from pg_policies
where schemaname = 'public';
```
**Expected**: >= 24 policies
- [ ] Result shows at least 24

#### Query 4: List All Policies
```sql
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```
**Expected**: Policies grouped by table (shows all 24)
- [ ] Garages: 2 policies
- [ ] Users: 2 policies
- [ ] Clients: 4 policies
- [ ] Vehicles: 4 policies
- [ ] Interventions: 4 policies
- [ ] Invoices: 4 policies

---

## ✅ Test Data Setup (Optional)

### Create Demo Garage
```sql
insert into garages (id, name, phone, email, address, siret)
values (
  'demo-garage-id',
  '2roues Pasteur',
  '01 23 45 67 89',
  'contact@2rouespasteur.fr',
  '123 Rue de la Moto, 75001 Paris',
  '12345678901234'
)
on conflict (id) do nothing;
```
- [ ] Run this query
- [ ] Verify garage created (select * from garages)

### Create Test User
```sql
insert into users (id, garage_id, role)
values (
  'test-user-123',  -- Replace with real Supabase auth ID later
  'demo-garage-id',
  'owner'
)
on conflict (id) do nothing;
```
- [ ] Run this query
- [ ] Verify user created (select * from users)

---

## ✅ Test Multi-Tenant Isolation

### Test 1: User Can See Own Garage
```sql
-- Simulating user 'test-user-123' querying their clients
select * from clients 
where garage_id = 'demo-garage-id';
```
**Expected**: Empty initially (no clients yet), but RLS allows query
- [ ] Query completes without error
- [ ] This means RLS permits the query

### Test 2: User Cannot See Other Garage (Theoretical)
```javascript
// This would be blocked by RLS in real app:
const { data } = await supabase
  .from('clients')
  .select()
  .eq('garage_id', 'other-garage-id');

// Result: data = [] (RLS filters even if garage exists)
```
- [ ] Understand how RLS blocks access
- [ ] Even if garage_id is different, RLS returns empty

---

## ✅ Production Readiness

### Database
- [ ] All 6 tables created
- [ ] RLS enabled on all tables
- [ ] 24+ policies active
- [ ] Foreign keys enforced
- [ ] Indexes created

### Application
- [ ] Build still passes (run `npm run build`)
- [ ] No TypeScript errors
- [ ] All pages prerendered
- [ ] Development server works (`npm run dev`)

### Security
- [ ] RLS policies reviewed
- [ ] Team approval obtained
- [ ] Security audit completed
- [ ] Backup created

### Documentation
- [ ] Team trained on RLS concepts
- [ ] Documentation accessible to team
- [ ] Deployment procedure documented
- [ ] Escalation path documented

---

## ✅ Next Steps

### Week 1: Current (RLS Deployment)
- [ ] Deploy RLS schema
- [ ] Verify all checks above
- [ ] Get team sign-off
- [ ] Monitor for issues

### Week 2: Supabase Auth (Future)
- [ ] Plan auth implementation
- [ ] Design user signup flow
- [ ] Create auth pages
- [ ] Test auth integration

### Week 3: Production Deployment
- [ ] Final testing on staging
- [ ] Deploy to production
- [ ] Monitor audit logs
- [ ] User onboarding begins

---

## 📞 Troubleshooting

### Error During SQL Deployment

**Error**: "relation X does not exist"
- **Cause**: Dependency issue
- **Solution**: Check that previous tables were created, run query again

**Error**: "policy X already exists"
- **Cause**: Policies already deployed
- **Solution**: That's fine, they're already active

**Error**: "Permission denied"
- **Cause**: User doesn't have permission
- **Solution**: Use Supabase service role, not anon key

### Verification Query Fails

**No rows returned from table query**
- **Cause**: Table doesn't exist
- **Solution**: Recheck SQL deployment, look for error messages

**RLS shows 'f' (false)**
- **Cause**: RLS not enabled
- **Solution**: Rerun `alter table X enable row level security`

**Policy count < 24**
- **Cause**: Not all policies created
- **Solution**: Recheck SQL deployment for errors

---

## ✅ Confirmation

When all checks above are complete:

- [ ] RLS deployed to Supabase
- [ ] All 6 tables exist
- [ ] All 6 tables have RLS enabled (rowsecurity = t)
- [ ] 24+ policies created
- [ ] Verification queries all pass
- [ ] Test data created (optional)
- [ ] Isolation concept understood
- [ ] Team approved
- [ ] Build still passing
- [ ] Ready for next phase

---

## 🎉 You're Done!

**RLS is now live.** Your database is protected with enterprise-grade multi-tenant security.

**What happens next?**
1. Monitor the system
2. Plan Supabase Auth integration (Week 2)
3. Deploy to production (Week 3)

**Questions?**
- RLS details → [RLS_SECURITY_GUIDE.md](RLS_SECURITY_GUIDE.md)
- Visual explanation → [RLS_VISUAL_ARCHITECTURE.md](RLS_VISUAL_ARCHITECTURE.md)
- Navigation → [RLS_INDEX.md](RLS_INDEX.md)

---

**Deployment Date**: ___________  
**Deployed By**: ___________  
**Verified By**: ___________  
**Sign-Off**: ___________  

---

*Checklist Template - Print and use for deployment day*
