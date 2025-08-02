# Collaborative Calendar for Event Scheduling

## Project Overview

The **Event Management System** is a collaborative calendar platform designed to streamline group scheduling, event coordination, and participant interaction. It supports real-time updates, role-based access control, notification handling, and client-side caching to ensure high performance and consistency.

This project enables users to:
- Create and manage groups with distinct roles (Admin, Editor, Viewer)
- Schedule events collaboratively
- Handle invitations and notifications
- Optimize performance through local caching
- Prevent conflicts via version-controlled concurrency mechanisms

Creating Database:
python create_database.py

Starting Flask:
$env:FLASK_APP="server.app"
$env:FLASK_ENV="development"
flask run

Backend testing:
Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/auth/signup" `
-Method POST `
-Headers @{ "Content-Type" = "application/json" } `
-Body '{"name": "Test User", "email": "testuser@test.com", "password": "Test@1234"}'


