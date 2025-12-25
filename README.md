##### A full-stack web application to track shared expenses among room members. Built with React, Node.js, Express, PostgreSQL, and Prisma.

### Features
- **Dashboard Overview** - View total expenses, monthly spending, number of roommates, and average cost per person
- **Expense Management** - Add, view, edit, and delete expenses with detailed categorization
- **Expense Splitting** - Automatically calculate how much each person owes when splitting bills
- **Analytics & Charts** - Visual breakdown of spending by category, monthly trends, and roommate contributions
- **Roommate Management** - Add/remove roommates who can participate in expense splitting

### Tech Stack
### Frontend
- **React 18** - UI library
- **React Router v6** - Client-side routing
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Tailwind CSS** - Utility-first CSS framework
- **date-fns** - Date manipulation
- **xlsx** - Excel export functionality

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **express-validator** - Input validation

### Setup Instructions

```
git clone <repo>
cd <repo>
create .env with values:

# Database Configuration
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DB=room_expense_db

# Backend Configuration
ADMIN_USERNAME=create_username
ADMIN_PASSWORD=create_password
JWT_SECRET=your_jwt

# Frontend Configuration
VITE_API_URL=http://yourdomain/api

## For production
/frotend/.env.production
VITE_API_URL=https://yourdomain/api


docker compose up -d
```



