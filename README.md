# TF Reception App

Web application for registering gym members for events and gatherings.

## 🌐 Live Site

[https://tfreceptionapp.web.app](https://tfreceptionapp.web.app)

## 📁 Project Structure

```
tfReceptionApp/
├── frontend_tf/    # React frontend (Vite + TypeScript + Tailwind CSS)
└── backend/        # Node.js API (coming soon)
```

## ✅ Features

- Event registration form (name, surname, email)
- Event details display (date, time, location with Google Maps link)
- Duplicate registration prevention (email used as unique document ID)
- Live signed-up count displayed to visitors
- Registration deadline reminder message (configurable)
- Croatian language UI
- Responsive design with blurred background photo
- Animated logo with click-to-spin interaction
- Loading state while fetching event config (prevents false "no active events" flash)
- Graceful "no active events" state when no event is configured

### Admin Panel (`/admin`)
- Password protected with `sessionStorage` persistence (survives page refresh, clears on tab close)
- Configurable event settings: date picker, time picker, location, Google Maps URL, helper message
- Live preview of what visitors will see, updates as you type
- Reset event to "no active events" with a single button
- Lists all registered members with registration timestamp
- Delete individual registrations
- Delete all registrations (requires checkbox confirmation)
- Export all registrations to CSV

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Database**: Firebase Firestore
- **Deployment**: Firebase Hosting
- **CI/CD**: GitHub Actions (auto-deploy on push to `main`)

## 🗄️ Firestore Structure

```
/registrations/{email}     # Registration documents (email as document ID)
  - name
  - surname
  - email
  - registeredAt

/config/event              # Event configuration document
  - date        (ISO format: YYYY-MM-DD)
  - time        (HH:MM)
  - location
  - mapsUrl
  - helperMessage
```

### Required Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /registrations/{doc} {
      allow read, write: if true;
    }
    match /config/{doc} {
      allow read, write: if true;
    }
  }
}
```

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ and npm

### Install & Run

```bash
cd frontend_tf
npm install
npm run dev
```

App runs on `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## 🔧 Environment Variables

Copy `frontend_tf/.env.example` to `frontend_tf/.env` and fill in the values:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ADMIN_PASSWORD=
```

## 🚀 Deployment

Deployment is automated via **GitHub Actions** and **Firebase Hosting**:

- Push to `main` branch → triggers build and deploy automatically
- All `VITE_*` environment variables must be set as GitHub Actions secrets
