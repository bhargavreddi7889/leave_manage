# Setup Guide - Leave Management System

## Quick Start

Follow these steps to get the Leave Management System up and running:

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up PostgreSQL Database

Make sure you have PostgreSQL installed and running, or use a cloud service like Supabase.

**For Local PostgreSQL:**
```sql
CREATE DATABASE leave_management;
```

**For Supabase:**
- Create a new project
- Get the connection string from Settings > Database
- Use the connection pooler URL (port 6543) for better performance

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require&pgbouncer=true"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-key-here"
```

**Important Security Notes:**
- Replace `username`, `password`, `host`, `port`, and `database` with your actual database credentials
- Generate a secure random string for `NEXTAUTH_SECRET` (you can use: `openssl rand -base64 32`)
- For Supabase, use the connection pooler URL with `pgbouncer=true`
- For local PostgreSQL, remove `sslmode=require&pgbouncer=true`
- **Never commit the `.env` file to version control**

### 4. Set Up Database Schema

```bash
npm run db:setup
```

This script will:
- Create all necessary database tables
- Create required enums (UserRole, LeaveStatus, LeaveCategory)
- Set up foreign key relationships

### 5. Seed the Database

This will create initial data including:
- Leave types (Sick Leave, Annual Leave, Personal Leave)
- Admin user
- Manager user
- Employee users
- Leave balances

```bash
npm run db:seed
```

⚠️ **SECURITY WARNING**: The seed script creates users with default passwords. **Change all passwords immediately after first login, especially in production environments!**

### 6. Start Development Server

```bash
npm run dev
```

### 7. Access the Application

Open your browser and navigate to: [http://localhost:3000](http://localhost:3000)

## Default Login Credentials

After seeding, you can login with the default credentials. **These are for development only - change them immediately in production!**

The seed script will output the default credentials in the console. These credentials are:
- Admin account
- Manager account  
- Employee accounts

**⚠️ IMPORTANT**: Never use default credentials in production. Change all passwords immediately after first login.

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `pg_isready` (local) or check cloud service status
- Check your DATABASE_URL format
- Ensure the database exists
- For Supabase, verify you're using the connection pooler URL
- Check SSL requirements (Supabase requires SSL)

### Environment Variables Not Loading

- Ensure `.env` file is in the root directory
- Check for typos in variable names
- Restart the development server after changing `.env`

### Database Schema Issues

- Run `npm run db:setup` to recreate the schema
- Check for existing tables that might conflict
- Verify database permissions

### TypeScript Errors

- Run `npm run build` to check for type errors
- Ensure all dependencies are installed: `npm install`
- Clear `.next` folder and rebuild if needed

## Production Deployment

Before deploying to production:

1. **Change all default passwords** - Critical security step!
2. **Use strong NEXTAUTH_SECRET** - Generate a secure random string
3. **Use HTTPS** - Configure SSL/TLS certificates
4. **Secure database** - Use strong passwords and SSL connections
5. **Review environment variables** - Ensure all are set correctly
6. **Test role-based access** - Verify permissions work correctly
7. **Backup database** - Set up regular backups

## Additional Notes

- The system uses direct PostgreSQL connections (no ORM)
- All database queries use parameterized statements for security
- Password hashing uses bcryptjs with 12 rounds
- Session management uses JWT tokens via NextAuth.js
