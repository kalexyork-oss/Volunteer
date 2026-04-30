# Volunteer — Local On-Demand Service Marketplace

A full React web app for connecting customers with local service providers. Providers post what they help with (anything), customers search and book.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm start

# 3. Open http://localhost:3000
```

## Build for Production

```bash
npm run build
```

Then deploy the `/build` folder to any static host (Netlify, Vercel, GitHub Pages, etc).

---

## Project Structure

```
src/
├── App.jsx                   # Root — state management + routing
├── index.js                  # Entry point
├── index.css                 # All global styles
├── data.js                   # Seed data + constants (TAGS, providers, bookings)
│
├── components/
│   ├── UI.jsx                # Shared: Avatar, Stars, StatusBadge, Toast, LogoIcon
│   ├── Navbar.jsx            # Top navigation bar
│   ├── BookingModal.jsx      # 3-step booking flow (uses Claude API for tips)
│   └── PostServiceModal.jsx  # Provider profile creation form
│
└── pages/
    ├── LandingPage.jsx       # Hero, search, provider cards, trust section
    ├── CustomerPage.jsx      # Customer's booking history
    ├── ProviderPage.jsx      # Provider dashboard: jobs, profile
    └── AdminPage.jsx         # Admin: metrics, bookings table, provider list
```

---

## Features

### Customer Flow
- Search for **any** service by typing free text
- Browse providers by skill tags (30+ categories)
- 3-step booking modal: describe task → pick date/time → choose provider or post open
- Claude AI gives a relevant tip during booking
- Track all bookings with live status

### Provider Flow
- Post a profile with any skills (multi-select from 30 tags or type custom)
- Browse open job requests in the area
- Accept jobs with one click
- View accepted jobs and completed history

### Admin Panel
- Revenue, active bookings, provider count, completed jobs
- Status breakdown progress bars
- Full bookings table with Mark Done / Cancel actions
- Provider roster with ratings

---

## Database Schema (for when you add a backend)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('customer', 'provider', 'admin')),
  zip TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Providers
CREATE TABLE providers (
  id UUID PRIMARY KEY REFERENCES users(id),
  bio TEXT,
  skills TEXT[],          -- array of skill strings
  rating DECIMAL(3,2),
  review_count INT DEFAULT 0,
  job_count INT DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  available BOOLEAN DEFAULT TRUE
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id),
  provider_id UUID REFERENCES providers(id),
  service TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  zip TEXT NOT NULL,
  notes TEXT,
  status TEXT CHECK (status IN ('Pending','Accepted','Completed','Cancelled')) DEFAULT 'Pending',
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  reviewer_id UUID REFERENCES users(id),
  provider_id UUID REFERENCES providers(id),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Next Steps (when ready)

| Feature | Suggested Tool |
|---|---|
| Auth (login/signup) | Supabase Auth or Firebase |
| Real database | Supabase (Postgres) or PlanetScale |
| Payments | Stripe Connect |
| Notifications | Twilio (SMS) or Resend (email) |
| Hosting | Vercel (free) |
| Maps/location | Google Maps API |
