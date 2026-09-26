# Local development

Use Node.js 24 or newer. Keep backend credentials (database, JWT, and OAuth
secrets) in `backend/.env`.

Start the API with `cd backend` then `npm run dev`. In a second terminal,
run `cd frontend` then `npm run dev` and open http://localhost:5173.

The development environment files point the frontend at http://localhost:3000
and configure the backend for local HTTP cookies and redirects. The backend
development command loads these settings before reading credentials from `.env`.
Use `localhost` consistently instead of mixing it with `127.0.0.1`.
Restart both servers after changing environment files.

Production builds and `npm start` continue to use the production environment.
