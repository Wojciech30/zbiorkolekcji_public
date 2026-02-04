# Zbiór Kolekcji

Aplikacja do tworzenia, zarządzania i udostępniania kolekcji przedmiotów.

## Wymagania

- Node.js >= 18.x
- MongoDB >= 6.x
- npm >= 9.x

## Instalacja

```bash
# Klonowanie repozytorium
git clone https://github.com/Wojciech30/zbiorkoleckcji_public.git
cd zbiorkolekcji

# Instalacja zależności
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## Konfiguracja

Utwórz pliki `.env` w katalogu projektu:

```env
MONGODB_URI=mongodb://localhost:27017/zbiorkolekcji
JWT_SECRET=*losowy ciąg znaków*
SALT_ROUNDS=*losowa liczba*
PORT=3000
NODE_ENV=development
VUE_APP_BASE_URL=http://localhost:3000
MAILDEV_HOST=localhost
MAILDEV_PORT=1025
ADMIN_EMAIL=*dowolny adres email*
FRONTEND_BASE_URL=http://localhost:8080

```

## Uruchomienie

```bash
# Development (frontend + backend)
npm run start:dev

# Pierwsze uruchomienie z tworzeniem admina
npm run setup
```

## Struktura projektu

```
zbiorkolekcji/
├── backend
│   ├── config
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── uploads
│   ├── utils
│   └── server.js
├── frontend
│   ├── public
│   └── src
│       ├── assets
│       ├── components
│       ├── router
│       ├── services
│       ├── store
│       ├── utils
│       ├── views
│       ├── App.vue
│       └── main.js
├── scripts
├── .env
└── README.md
```
