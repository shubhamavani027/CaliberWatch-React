# CaliberWatch

CaliberWatch is a full-stack watch shopping experience built with React for the frontend and Node.js/Express for the backend.

## Project structure

- `frontend/` — React app built with Create React App
- `backend/` — Express API server with MongoDB support
- `.github/workflows/pages.yml` — GitHub Actions workflow for Pages deployment

## Tech stack

- Frontend: React, React Router, Bootstrap, Axios
- Backend: Node.js, Express, MongoDB, Mongoose, Passport
- Deployment: GitHub Pages for frontend

## Local setup

1. Install dependencies:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

2. Create a `.env` file inside `backend/` and configure required values.

3. Start both frontend and backend together:

```bash
npm run dev
```

This starts:
- Backend on `http://localhost:5000`
- Frontend on `http://localhost:3000`

## Backend scripts

- `npm run start:backend` — start backend server
- `npm --prefix backend run dev:watch` — run backend with nodemon
- `npm --prefix backend run seed` — seed the backend database
- `npm --prefix backend run create-admin` — create an admin user

## Frontend scripts

- `npm run start:frontend` — start frontend dev server
- `npm run build:frontend` — create production build

## Environment variables

Create `backend/.env` with at least:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Optional values for features:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
BACKEND_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
OPENAI_API_KEY=
OPENAI_CHAT_MODEL=gpt-4.1-mini
EMAIL_MODE=smtp
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SENDGRID_API_KEY=
SENDGRID_FROM=
OTP_SECRET=
ORDER_AUTO_PROGRESS=true
ORDER_AUTO_PROGRESS_SEND_EMAIL=true
ORDER_AUTO_PROGRESS_INTERVAL_MS=60000
```

## GitHub Pages

The frontend is configured to publish to GitHub Pages using the repository homepage:

https://dhruvil055.github.io/CaliberWatch--React/

## Notes

- The backend API is proxied from frontend dev mode to `http://localhost:5000`
- Make sure MongoDB is available before starting the backend
- Use `npm run build:frontend` to generate the production-ready `frontend/build` folder
