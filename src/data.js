// =====================
//  Volunteer — Seed Data
// =====================

export const TAGS = [
  'Home Repair','Cleaning','Moving Help','Tech Support','Pet Care',
  'Tutoring','Cooking','Photography','Design','Gardening',
  'Painting','Plumbing','Electrical','Carpentry','Car Repair',
  'Childcare','Elder Care','Event Setup','Music Lessons','Fitness Training',
  'Writing','Translation','Web Dev','Accounting','Legal Advice',
  'Dog Walking','Grocery Run','Furniture Assembly','Landscaping','Power Washing',
];

export const AVATAR_COLORS = ['#0f1e3d','#1a2f5a','#1e3a5f','#0a1628','#0f2744'];

export const initialProviders = [
  {
    id: 'p1',
    name: 'Marcus Rivera',
    skills: ['Lawn Care','Gardening','General Handyman'],
    bio: '5 years experience in residential lawn care and landscaping. Quick, reliable, and detail-oriented.',
    rating: 4.9, reviews: 47, zip: '29707', avatar: 0, jobs: 23,
    joined: '2023-01-15', available: true,
  },
  {
    id: 'p2',
    name: 'Aria Thompson',
    skills: ['Cleaning','Home Repair','Moving Help'],
    bio: 'Professional cleaner and handywoman. No job too big or too small!',
    rating: 4.8, reviews: 82, zip: '29707', avatar: 1, jobs: 54,
    joined: '2022-08-20', available: true,
  },
  {
    id: 'p3',
    name: 'James Kowalski',
    skills: ['Tech Support','Web Dev','Photography'],
    bio: 'IT professional offering tech help, website fixes, and event photography on weekends.',
    rating: 5.0, reviews: 31, zip: '29715', avatar: 2, jobs: 18,
    joined: '2023-06-01', available: false,
  },
  {
    id: 'p4',
    name: 'Sofia Nguyen',
    skills: ['Tutoring','Music Lessons','Cooking'],
    bio: 'Former teacher offering tutoring K-12 and adult cooking classes. Specializing in math and science.',
    rating: 4.7, reviews: 55, zip: '29708', avatar: 3, jobs: 41,
    joined: '2022-11-10', available: true,
  },
  {
    id: 'p5',
    name: 'Darnell Woods',
    skills: ['Car Repair','Electrical','Plumbing'],
    bio: 'Licensed electrician and experienced mechanic. Weekend availability. Honest pricing.',
    rating: 4.9, reviews: 68, zip: '29707', avatar: 4, jobs: 37,
    joined: '2023-03-22', available: true,
  },
];

export const initialBookings = [
  {
    id: 'b1', customerId: 'demo', providerName: 'Marcus Rivera', providerId: 'p1',
    service: 'Lawn Care', date: '2026-05-02', time: '09:00', zip: '29707',
    status: 'Accepted', created: Date.now() - 86400000 * 2, price: 75,
    notes: 'Front and backyard, about 1 acre',
  },
  {
    id: 'b2', customerId: 'demo', providerName: null, providerId: null,
    service: 'Tech Support', date: '2026-05-05', time: '14:00', zip: '29707',
    status: 'Pending', created: Date.now() - 86400000, price: 60,
    notes: 'Laptop running slow, possible virus',
  },
  {
    id: 'b3', customerId: 'c2', providerName: 'Aria Thompson', providerId: 'p2',
    service: 'Cleaning', date: '2026-04-30', time: '10:00', zip: '29708',
    status: 'Completed', created: Date.now() - 86400000 * 5, price: 90,
    notes: 'Deep clean 3 bed 2 bath',
  },
];
