# Instagram Dashboard

A full-stack application for tracking and analyzing Instagram profile metrics over time.

## Overview

Instagram Dashboard is a web application that periodically scrapes data from Instagram profiles, stores it in a PostgreSQL database, and displays interactive charts and analytics. It features both automatic daily scraping and manual scraping triggered by authenticated users.

## Features

- **Automated Data Collection**: Scheduled daily scraping of Instagram profiles at midnight
- **Manual Data Collection**: Authenticated users can trigger immediate scraping
- **Interactive Charts**: Visualize follower counts, engagement rates, and other metrics
- **User Authentication**: Secure login system for accessing protected features
- **PostgreSQL Database**: Efficient storage and retrieval of historical profile data
- **Responsive UI**: Clean dashboard interface built with Bootstrap 5

## Project Structure

```
ig-dashboard/
├── public/               # Static frontend files
│   ├── css/              # Stylesheets
│   ├── js/               # Frontend JavaScript
│   │   └── app.js        # Main frontend logic
│   ├── index.html        # Main dashboard page
│   ├── login.html        # User login page
│   └── register.html     # User registration page
├── python-scraper/       # Python Instagram scraper
│   ├── db_handler.py     # Database interaction 
│   ├── scraper.py        # Instagram profile scraper
│   └── requirements.txt  # Python dependencies
└── src/                  # Backend Node.js code
    ├── config/           # Configuration files
    ├── controllers/      # Route controllers
    ├── middleware/       # Express middleware
    ├── models/           # Database models
    ├── routes/           # API routes
    ├── services/         # Business logic services
    │   └── schedulerService.js  # Handles scheduled scraping
    └── index.js          # Main application entry point
```

## Technologies Used

- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5, Chart.js
- **Authentication**: JWT, bcrypt
- **Scraper**: Python, Instaloader
- **Scheduling**: node-schedule

## Setup and Installation

### Prerequisites

- Node.js (v14+ recommended)
- Python 3.8+ with pip
- PostgreSQL database

### Backend Setup

1. Clone the repository
2. Install Node.js dependencies:
   ```
   cd ig-dashboard
   npm install
   ```
3. Configure the Node.js backend `.env` file in the root directory:
   ```
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=ig_leaderBoard
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret
   ```

### Python Scraper Setup

1. Install Python dependencies:
   ```
   cd python-scraper
   pip install -r requirements.txt
   ```

2. Configure the Python scraper's `.env` file in the python-scraper directory:
   ```
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=ig_leaderBoard
   ```

### Environment Configuration

The project uses two separate `.env` files:

1. **Root `.env` file** (in the ig-dashboard directory)
   - Used by the Node.js backend
   - Contains configuration for Express server, database connection, and JWT authentication
   - Loaded by the backend when the server starts

2. **Python scraper `.env` file** (in the python-scraper directory)
   - Used by the Python scraper scripts
   - Contains only database connection information
   - Loaded when the Python scraper runs

Both files should have the same database connection details to ensure both parts of the application can access the database.

### Database Setup

1. Create a PostgreSQL database
2. Run the database initialization scripts (if available in src/config)

## Running the Application

### Development Mode

```
npm run dev
```

### Production Mode

```
npm start
```

## Scheduler

The application uses node-schedule to run the Instagram scraper automatically:

- Default schedule: Daily at midnight (00:00)
- Configuration: Modify the cron expression in `src/services/schedulerService.js` to change the schedule

## Manual Scraping

Authenticated users can trigger manual scraping by clicking the "Scrape Instagram" button in the dashboard.

## API Endpoints

- `GET /api/profiles` - Get all tracked profiles
- `GET /api/profiles/:username` - Get specific profile data
- `GET /api/profiles/:username/history` - Get historical data for a profile
- `POST /api/run-scraper` - Manually trigger the scraper (authenticated users only)

## License

MIT