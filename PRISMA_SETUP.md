# Prisma MongoDB Setup

This project is configured with Prisma for MongoDB. Here's how to set it up:

## Database Schema

The schema includes the following models:

1. **User** - Users with email addresses
2. **Plan** - Plans created by users with titles
3. **PlanOption** - Options for each plan
4. **Vote** - User votes on plan options (one vote per user per option)
5. **Comment** - User comments on plans

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with your MongoDB connection string:

```env
DATABASE_URL="your_mongodb_connection_string_here"
```

Replace `your_mongodb_connection_string_here` with your actual MongoDB connection string.

### 2. Generate Prisma Client

Run the following command to generate the Prisma client:

```bash
npx prisma generate
```

### 3. Push Schema to Database

If you want to push the schema to your MongoDB database:

```bash
npx prisma db push
```

### 4. View Database (Optional)

To view your database with Prisma Studio:

```bash
npx prisma studio
```

## API Routes

The following API routes are available:

- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/plans` - Get all plans
- `POST /api/plans` - Create a new plan

## Example Usage

### Creating a User

```javascript
const response = await fetch("/api/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "user@example.com",
  }),
});
```

### Creating a Plan

```javascript
const response = await fetch("/api/plans", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "What should we do tonight?",
    createdById: "user_id_here",
    options: ["Go to movies", "Stay home", "Go to restaurant"],
  }),
});
```

## Database Relationships

- Users can create multiple plans
- Each plan has multiple options
- Users can vote on options (one vote per user per option)
- Users can comment on plans
- All relationships are properly configured with cascade deletes

## Notes

- The schema uses MongoDB ObjectId for all ID fields
- Unique constraints are enforced at the database level
- Timestamps are automatically managed
- All relationships include proper foreign key constraints
