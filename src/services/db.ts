
import { Appointment, Barber } from '../types';

// Chaves para salvar no navegador
const BOOKINGS_KEY = 'mans_space_bookings';
const REVIEWS_KEY = 'mans_space_user_reviews';

export interface SavedAppointment {
  id: string;
  clientName: string;
  clientEmail: string;
  barberId: string;
  barberName: string;
  serviceNames: string[];
  productNames: string[];
  date: string; // DD/MM/YYYY
  time: string; // HH:MM
  totalPrice: number;
  createdAt: string;
  status: 'confirmed' | 'completed' | 'cancelled';
}

export interface UserReview {
  id: string;
  name: string;
  comment: string;
  stars: number;
  picture?: string;
  createdAt: string;
}

export const db = {
  // --- AGENDAMENTOS ---
  createAppointment: async (data: Omit<SavedAppointment, 'id' | 'createdAt' | 'status'>) => {
    const appointments = await db.getAppointments();
    
    const conflict = appointments.find(a => 
      a.barberId === data.barberId && 
      a.date === data.date && 
      a.time === data.time &&
      a.status !== 'cancelled'
    );

    if (conflict) {
      throw new Error(`O barbeiro ${data.barberName} já está ocupado em ${data.date} às ${data.time}.`);
    }

    const newAppointment: SavedAppointment = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: 'confirmed'
    };

    appointments.push(newAppointment);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(appointments));
    return newAppointment;
  },

  getAppointments: async (): Promise<SavedAppointment[]> => {
    const data = localStorage.getItem(BOOKINGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getBusyTimes: async (barberId: string, date: string): Promise<string[]> => {
    const appointments = await db.getAppointments();
    return appointments
      .filter(a => a.barberId === barberId && a.date === date && a.status !== 'cancelled')
      .map(a => a.time);
  },

  // --- AVALIAÇÕES ---
  createReview: async (review: Omit<UserReview, 'id' | 'createdAt'>) => {
    const reviews = await db.getReviews();
    const newReview: UserReview = {
      ...review,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    reviews.unshift(newReview); // Mais novos primeiro
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
    return newReview;
  },

  getReviews: async (): Promise<UserReview[]> => {
    const data = localStorage.getItem(REVIEWS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // --- ADMIN ---
  getMetrics: async () => {
    const appts = await db.getAppointments();
    const activeAppts = appts.filter(a => a.status !== 'cancelled');
    
    const totalRevenue = activeAppts.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const totalCuts = activeAppts.length;
    
    const barberCounts: Record<string, number> = {};
    activeAppts.forEach(a => {
      barberCounts[a.barberName] = (barberCounts[a.barberName] || 0) + 1;
    });
    
    const topBarber = Object.entries(barberCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      revenue: totalRevenue,
      count: totalCuts,
      topBarber: topBarber ? topBarber[0] : 'Nenhum'
    };
  },

  resetSystem: () => {
    localStorage.removeItem(BOOKINGS_KEY);
    localStorage.removeItem(REVIEWS_KEY);
    window.location.reload();
  }
};
