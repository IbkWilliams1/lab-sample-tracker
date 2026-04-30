# Lab Sample Tracker App

A practical laboratory sample management application designed to improve sample registration, traceability, storage visibility, and retrieval efficiency in petroleum laboratory operations.

This project was developed as part of my DevOps and software engineering learning journey, using a real-world laboratory workflow as the business case.

---

## Project Overview

In many laboratories, sample tracking is still handled manually using physical registers, handwritten labels, and informal storage knowledge. This creates operational risks such as:

- Slow sample retrieval
- Missing or incomplete sample records
- Poor visibility of sample location
- Difficulty tracing samples by vessel, client, cargo, port, or chemist
- Weak audit readiness
- Dependency on individual staff memory

The Lab Sample Tracker App is intended to digitize this workflow by providing a structured system for recording, organizing, searching, and tracking laboratory samples from receipt to storage.

---

## Business Problem

In petroleum laboratory operations, samples may come from vessels, clients, offshore locations, ports, or internal operations. Each sample must be properly identified, documented, stored, and retrieved when needed.

A manual system can work at small scale, but it becomes inefficient when sample volume increases or when new personnel need to locate samples quickly.

This application provides a foundation for improving:

- Sample traceability
- Chain-of-custody visibility
- Laboratory record integrity
- Operational efficiency
- Audit preparedness
- Digital transformation of laboratory workflows

---

## Key Features

### Current Features

- Sample registration form
- Capture of vessel/sample details
- Lab ID recording
- Client and cargo information
- Port/source information
- Sample volume entry
- Sampling method entry
- Chemist/surveyor details
- Sample description preview
- Tank-based sample entry structure
- Backend API support for sample data handling

### Planned Features

- Search samples by Lab ID, vessel, client, cargo, or date
- Auto-generated sequential Lab IDs
- Sample storage location tracking by shelf, row, and position
- Edit and update sample records
- Delete or archive old records
- Export sample register to Excel or PDF
- User login and role-based access
- Dashboard summary of received samples
- Monthly sample movement report
- Dockerized deployment
- CI/CD pipeline with GitHub Actions
- Database backup automation
- Cloud deployment

---

## Technology Stack

| Area | Technology |
|---|---|
| Runtime | Node.js |
| Backend Framework | Express.js |
| Frontend | HTML, CSS, JavaScript |
| Template Engine | EJS |
| Database | SQLite |
| Version Control | Git and GitHub |
| Future Deployment | Docker, Nginx, GitHub Actions, Cloud Hosting |

---

## Project Structure

```text
lab-sample-tracker/
│
├── app.js                  # Main Express application
├── package.json            # Project dependencies and scripts
├── package-lock.json       # Locked dependency versions
│
├── routes/
│   └── api.js              # API routes for sample handling
│
├── views/
│   └── batch-form.ejs      # Sample registration form
│
├── public/
│   ├── css/                # Stylesheets
│   └── js/
│       └── batch-form.js   # Frontend form logic
│
├── db/
│   └── database.sqlite     # SQLite database file
│
└── README.md
