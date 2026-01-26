# Deployment Guide - Leave Management System

## Common Deployment Issues & Solutions

### Issue: Login Works But Can't Access Dashboards / Cookies Not Created

This is typically caused by NextAuth.js configuration issues in production.

#### Solution 1: Environment Variables

Ensure these environment variables are set correctly in your production environment:

```env
NEXTAUTH_URL="https://your-domain.com"  # Must match your production URL exactly
NEXTAUTH_SECRET="your-secure-secret-key"  # Must be set and consistent
DATABASE_URL="your-database-connection-string"
```

**Critical Notes:**
- `NEXTAUTH_URL` must be the **exact** production URL (including `https://`)
- `NEXTAUTH_SECRET` must be the same across all instances
- Never use `http://localhost:3000` in production

#### Solution 2: Cookie Configuration

The app is configured to use secure cookies in production automatically. Ensure:
- Your production site uses HTTPS (not HTTP)
- The domain in `NEXTAUTH_URL` matches your actual domain
- No CORS issues blocking cookies

#### Solution 3: Platform-Specific Configuration

**For Vercel:**
1. Go to Project Settings > Environment Variables
2. Add all required variables
3. Ensure `NEXTAUTH_URL` is set to your Vercel domain
4. Redeploy after adding variables

**For Other Platforms:**
- Ensure environment variables are set before building
- Some platforms require variables to be set in their dashboard
- Restart the application after setting variables

### Issue: Session Not Persisting

**Symptoms:**
- Can login but immediately logged out
- Session not available on page refresh
- Cookies not being set

**Solutions:**
1. Check browser console for cookie errors
2. Verify `NEXTAUTH_SECRET` is set and consistent
3. Check if cookies are being blocked by browser settings
4. Verify HTTPS is enabled (required for secure cookies)

### Issue: Redirect Loops

**Symptoms:**
- Infinite redirects between login and dashboard
- Middleware blocking access

**Solutions:**
1. Check middleware configuration
2. Verify session is being created correctly
3. Check browser console for errors
4. Clear browser cookies and try again

## Deployment Checklist

Before deploying, ensure:

- [ ] `NEXTAUTH_URL` is set to production URL (with https://)
- [ ] `NEXTAUTH_SECRET` is set and is a secure random string
- [ ] `DATABASE_URL` is set correctly
- [ ] Database is accessible from production environment
- [ ] HTTPS is enabled (required for secure cookies)
- [ ] All environment variables are set in production platform
- [ ] Application is rebuilt after setting environment variables

## Testing After Deployment

1. **Test Login:**
   - Login with valid credentials
   - Check browser DevTools > Application > Cookies
   - Verify `next-auth.session-token` cookie is created

2. **Test Session:**
   - After login, refresh the page
   - Verify you remain logged in
   - Check that dashboard loads correctly

3. **Test Role-Based Access:**
   - Login as different roles
   - Verify correct dashboard loads
   - Test protected routes

## Debugging Tips

### Check Environment Variables

Add temporary logging (remove after debugging):

```typescript
// In lib/auth-config.ts (temporary)
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET')
console.log('NODE_ENV:', process.env.NODE_ENV)
```

### Check Browser Console

Look for:
- Cookie-related errors
- CORS errors
- Network errors to `/api/auth/*` endpoints

### Check Server Logs

Look for:
- Database connection errors
- Authentication errors
- Environment variable warnings

## Common Platform Configurations

### Vercel

```env
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret
DATABASE_URL=your-database-url
```

### Netlify

```env
NEXTAUTH_URL=https://your-app.netlify.app
NEXTAUTH_SECRET=your-secret
DATABASE_URL=your-database-url
```

### Railway

```env
NEXTAUTH_URL=https://your-app.railway.app
NEXTAUTH_SECRET=your-secret
DATABASE_URL=your-database-url
```

### Custom Domain

```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret
DATABASE_URL=your-database-url
```

## Still Having Issues?

1. **Clear all cookies** for your domain
2. **Check browser console** for specific errors
3. **Verify environment variables** are actually set (not just in .env file)
4. **Check server logs** for authentication errors
5. **Test with different browser** to rule out browser-specific issues
6. **Verify database connection** is working in production

