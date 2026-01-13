# Zbiór Kolekcji

Aplikacja do tworzenia, zarządzania i udostępniania kolekcji przedmiotów.

## Wymagania

- Node.js >= 18.x
- MongoDB >= 6.x
- npm >= 9.x

## Instalacja

```bash
# Klonowanie repozytorium
git clone https://github.com/your-repo/zbiorkolekcji.git
cd zbiorkolekcji

# Instalacja zależności
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## Konfiguracja

Utwórz pliki `.env` w katalogu `backend/`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/zbiorkolekcji
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email (production)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
EMAIL_FROM=noreply@example.com

# Development: użyj MailDev (localhost:1025)
NODE_ENV=development
```

## Uruchomienie

```bash
# Development (frontend + backend)
npm start

# Pierwsze uruchomienie z tworzeniem admina
npm run setup
```

## Tworzenie konta admina

Przy pierwszym uruchomieniu użyj skryptu setup:

```bash
npm run setup
```

## Struktura projektu

```
zbiorkolekcji/
├── backend/          # Express.js API
│   ├── models/       # Mongoose schemas
│   ├── routes/       # API endpoints
│   ├── middleware/   # Auth, validation
│   └── server.js     # Entry point
├── frontend/         # Vue.js 3 SPA
│   ├── src/
│   │   ├── views/    # Page components
│   │   ├── services/ # API clients
│   │   └── store/    # Vuex state
└── scripts/          # Setup scripts
```

## API Endpoints

| Endpoint | Opis |
|----------|------|
| `POST /api/v1/auth/login` | Logowanie |
| `POST /api/v1/auth/register` | Rejestracja |
| `GET /api/v1/collections` | Lista kolekcji |
| `GET /api/v1/categories` | Lista kategorii |
| `GET /api/v1/admin/*` | Endpointy admina |
