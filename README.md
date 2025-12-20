# Room Expense Tracker

A full-stack web application to track shared expenses among room members. Built with React, Node.js, Express, PostgreSQL, and Prisma.

## Features

- **Dashboard Overview** - View total expenses, monthly spending, number of roommates, and average cost per person
- **Expense Management** - Add, view, edit, and delete expenses with detailed categorization
- **Expense Splitting** - Automatically calculate how much each person owes when splitting bills
- **Analytics & Charts** - Visual breakdown of spending by category, monthly trends, and roommate contributions
- **Roommate Management** - Add/remove roommates who can participate in expense splitting

## Tech Stack

- **Frontend**: React.js with Vite, Tailwind CSS, React Router, Recharts
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL 16
- **ORM**: Prisma.js
- **Containerization**: Docker Compose

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm or yarn

## Setup Instructions

### 1. Start the Database

First, start the PostgreSQL database using Docker Compose:

```bash
docker compose up -d postgres
```

This will:
- Start PostgreSQL 16 in a Docker container
- Create the database schema automatically
- Set up a default room for testing

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Create a `.env` file in the backend directory (or copy from `.env.example`):

```env
DATABASE_URL="postgresql://room_user:room_password@localhost:5432/room_expense_db?schema=public"
PORT=5000
NODE_ENV=development
```

Start the backend server:

```bash
npm run dev
```

The backend API will be running on `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal, navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be running on `http://localhost:3000`

## API Endpoints

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms` - Create a new room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

### Members
- `GET /api/members/room/:roomId` - Get all members for a room
- `GET /api/members/:id` - Get member by ID
- `POST /api/members` - Create a new member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member (soft delete by default)

### Expenses
- `GET /api/expenses/room/:roomId` - Get all expenses for a room
- `GET /api/expenses/:id` - Get expense by ID
- `POST /api/expenses` - Create a new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/room/:roomId/balances` - Get member balances

### Analytics
- `GET /api/analytics/room/:roomId/dashboard` - Get dashboard overview
- `GET /api/analytics/room/:roomId/monthly` - Get monthly summary
- `GET /api/analytics/room/:roomId/categories` - Get category-wise summary
- `GET /api/analytics/room/:roomId/trends` - Get monthly trends

## Database Schema

The database includes the following tables:

- **rooms** - Room information
- **members** - Room member details
- **expenses** - Expense records
- **expense_payments** - Who paid what for each expense
- **expense_shares** - How much each member owes for each expense

See `db/init.sql` for the complete schema definition.

## Development

### Backend Development

- Run `npm run dev` for development with auto-reload (nodemon)
- Run `npm run prisma:studio` to open Prisma Studio for database management
- Run `npm run prisma:migrate` to create new migrations

### Frontend Development

- Run `npm run dev` for development server with hot reload
- Run `npm run build` to build for production
- Run `npm run preview` to preview production build

## Project Structure

```
Room-Expense-Tracker-Cursor/
├── backend/
│   ├── routes/          # API route handlers
│   ├── prisma/          # Prisma schema
│   ├── server.js        # Express server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service functions
│   │   ├── context/     # React context providers
│   │   └── App.jsx      # Main app component
│   └── package.json
├── db/
│   └── init.sql         # Database initialization script
├── docker-compose.yml   # Docker Compose configuration
└── README.md
```

## License

ISC

