import heroImage from '../assets/events/1.jpeg';

const demoEvents = [
  {
    id: 900001,
    imageUrl: heroImage,
    title: 'Sydney Harbour Music Night',
    category: 'Music',
    date: '2026-06-14',
    location: 'Circular Quay, Sydney',
    description: 'A waterfront live music experience with food stalls, sunset views, and local artists.',
    ticketQuantity: 180,
    ticketPrice: 45,
    status: 'ACTIVE',
    approvalStatus: 'APPROVED',
  },
  {
    id: 900002,
    imageUrl: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80',
    title: 'Startup Growth Summit',
    category: 'Business',
    date: '2026-06-21',
    location: 'ICC Sydney',
    description: 'A business networking and growth event featuring founders, investors, and product leaders.',
    ticketQuantity: 120,
    ticketPrice: 79,
    status: 'ACTIVE',
    approvalStatus: 'APPROVED',
  },
  {
    id: 900003,
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    title: 'Creative Design Workshop',
    category: 'Educational',
    date: '2026-06-28',
    location: 'Newtown Creative Hub',
    description: 'A hands-on workshop for students and designers exploring UI, branding, and modern product thinking.',
    ticketQuantity: 60,
    ticketPrice: 25,
    status: 'ACTIVE',
    approvalStatus: 'APPROVED',
  },
];

export default demoEvents;
