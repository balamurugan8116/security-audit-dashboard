# SecureAudit – Security Audit Log Management Dashboard

SecureAudit is a full-stack web application developed using the MERN stack. The project helps security engineers upload and investigate system audit logs efficiently.

The application supports bulk log uploads, server-side searching, filtering, sorting, and pagination to handle large datasets without affecting frontend performance.

## Tech Stack

### Frontend
- React.js
- Vite
- React Router
- Axios
- Tailwind CSS

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose

---

## Features

- Upload 10,000+ audit logs at once
- View all uploaded logs
- Search logs by actor, action, resource, or IP address
- Filter logs by severity, role, status, region, etc.
- Sort logs by different columns
- Server-side pagination
- Dashboard showing log statistics
- Responsive user interface

---

## Project Structure

```
SecureAudit
│
├── frontend
│   ├── src
│   ├── public
│   ├── package.json
│   └── vite.config.js
│
├── backend
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   └── server.js
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## Installation

### Clone the repository

```bash
git clone https://github.com/balamurugan8116/security-audit-dashboard
```

### Backend

```bash
cd backend
npm install
npm run dev
```

Runs on:
```
http://localhost:5000

```

---

### Frontend

```bash
cd frontend

npm install
npm run dev
```

Runs on:
```
http://localhost:5173
```
---

## Environment Variables

### Backend (.env)

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string //Add your DB connection

CLIENT_ORIGIN=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Sample Audit Log

```json
{
  "actor": "priya.nair@company.com",
  "role": "admin",
  "action": "DELETE_USER",
  "resource": "/api/users/334",
  "resourceType": "USER",
  "ipAddress": "192.168.1.45",
  "region": "ap-south-1",
  "severity": "HIGH",
  "status": "Unresolved",
  "timestamp": "2025-06-14T08:32:11Z"
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/logs/upload | Upload audit logs |
| GET | /api/logs | Get logs |
| GET | /api/logs/:id | Get single log |
| GET | /api/logs/stats | Dashboard statistics |
| GET | /api/logs/meta | Filter values |

---

## How It Works

1. Upload a JSON or CSV file containing audit logs.
2. The backend validates and stores the records in MongoDB.
3. The dashboard fetches data using REST APIs.
4. Searching, filtering, sorting, and pagination are handled on the server.
5. Dashboard statistics are generated using MongoDB aggregation.

---

## Why Server-side Processing?

The project requirement was to perform searching, filtering, sorting, and pagination on the server.

Instead of sending all records to the browser, only the required page of data is returned. This improves performance and makes the application scalable for large datasets.

---

## Future Improvements

- Add a secure login and registration system.
- Implement separate dashboards for **Admin**, **Security Engineer**, and **Viewer** users.
- Add JWT-based authentication and authorization.
- Restrict features based on user roles (Role-Based Access Control).
- Enable users to update their profiles and reset passwords.
- Add real-time notifications for critical security events.
- Support exporting audit logs to CSV and PDF.
- Improve search performance using Elasticsearch.

---

## Author

**Balamurugan R**

GitHub: https://github.com/balamurugan8116

LinkedIn: https://www.linkedin.com/in/bala-murugan8116/
