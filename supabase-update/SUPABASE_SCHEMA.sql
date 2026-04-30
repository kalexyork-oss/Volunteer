-- ============================================
--  Volunteer Marketplace — Supabase SQL Setup
--  Paste this entire file into:
--  Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================

-- PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('customer', 'provider')) DEFAULT 'customer',
  zip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PROVIDERS (extra info for provider accounts)
CREATE TABLE providers (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  headline TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10,2),
  rating DECIMAL(3,2) DEFAULT 5.0,
  review_count INT DEFAULT 0,
  job_count INT DEFAULT 0,
  available BOOLEAN DEFAULT TRUE,
  zip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BOOKINGS
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  service TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  zip TEXT NOT NULL,
  notes TEXT,
  status TEXT CHECK (status IN ('Pending','Accepted','Completed','Cancelled')) DEFAULT 'Pending',
  price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REVIEWS
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
--  ROW LEVEL SECURITY (RLS) — keeps data safe
-- ============================================

ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews   ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only you can edit yours
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile"  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Providers: anyone can read, only the provider can edit
CREATE POLICY "Providers are viewable by everyone"  ON providers FOR SELECT USING (true);
CREATE POLICY "Providers can insert their own row"  ON providers FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Providers can update their own row"  ON providers FOR UPDATE USING (auth.uid() = id);

-- Bookings: customers see their own, providers see ones assigned to them
CREATE POLICY "Customers see their bookings"  ON bookings FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Providers see their bookings"  ON bookings FOR SELECT USING (auth.uid() = provider_id);
CREATE POLICY "Anyone can see pending bookings" ON bookings FOR SELECT USING (status = 'Pending');
CREATE POLICY "Customers can create bookings"  ON bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Providers can update bookings"  ON bookings FOR UPDATE USING (auth.uid() = provider_id OR auth.uid() = customer_id);

-- Reviews: anyone can read
CREATE POLICY "Reviews are public"            ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can review" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- ============================================
--  AUTO-CREATE PROFILE ON SIGNUP
--  This trigger runs whenever someone signs up
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
