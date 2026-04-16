# Inventory Management System (IMS)

## Description

The Inventory Management System (IMS) is a web-based application designed to manage inventory items and manifests. It provides a user-friendly interface for logging in, searching for items, and managing inventory data. The system consists of a client-side web application and a server-side API built with Node.js and Express, backed by a MySQL database.

## Features

- User authentication and login
- Search and view inventory items
- Search and view manifests
- Secure API endpoints with JWT authentication
- Responsive web interface

## Prerequisites

Before setting up the application, ensure you have the following installed:

- Node.js (version 14 or higher)
- MySQL Server
- npm (comes with Node.js)

## Setup Instructions

### 1. Clone or Download the Repository

Ensure you have the project files in your local directory.

### 2. Database Setup

1. Install and start MySQL Server on your machine.
2. Create a new database for the IMS application.
3. Run the SQL scripts to set up the database schema and initial data:
   - Open MySQL command line or a MySQL client (e.g., MySQL Workbench).
   - Execute the contents of `server/assets/CreateIMS.sql` to create the database tables.
   - Execute the contents of `server/assets/InitialData.sql` to populate the database with initial data.

### 3. Environment Configuration

1. Navigate to the `server` directory.
2. Create a `.env` file in the `server` directory with the following variables (replace with your actual MySQL credentials):

   ```
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=your_database_name
   ```

### 4. Install Dependencies

1. Open a terminal and navigate to the `server` directory.
2. Run the following command to install the required Node.js packages:

   ```
   npm install
   ```

### 5. Start the Server

1. From the `server` directory, run:

   ```
   npm run start:server
   ```

   This will start the server using nodemon, which will automatically restart on file changes.

2. The server will run on `http://localhost:3000`.

### 6. Access the Application

Open a web browser and navigate to `http://localhost:3000`. You should see the login page. Use the credentials from the initial data to log in and explore the application.

## Project Structure

- `client/`: Contains the frontend HTML, CSS, and JavaScript files.
- `server/`: Contains the backend Node.js application.
  - `index.js`: Main server file.
  - `db.js`: Database connection configuration.
  - `middleware/`: Authentication middleware.
  - `routes/api/`: API route handlers.
  - `assets/`: SQL scripts for database setup.

## API Endpoints

- `POST /api/account/login`: User login
- `GET /api/queries/items`: Search items
- `GET /api/queries/manifests`: Search manifests
- Other endpoints as defined in the route files.

## Development

For development, you can use nodemon to automatically restart the server on changes. The client files are served statically from the `client` directory.

## Troubleshooting

- Ensure MySQL is running and the database is properly configured.
- Check the console for any error messages when starting the server.
- Verify that the `.env` file has the correct database credentials.
