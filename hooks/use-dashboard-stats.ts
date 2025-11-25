import { collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';

interface DashboardStats {
  totalUsers: number;
  totalHospitals: number;
  totalInventory: number;
  totalRequests: number;
  totalNotifications: number;
  activeRequests: number;
}

/**
 * Custom hook to get real-time dashboard statistics
 * @returns Dashboard statistics that update automatically
 */
export function useDashboardStats(): DashboardStats {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalHospitals: 0,
    totalInventory: 0,
    totalRequests: 0,
    totalNotifications: 0,
    activeRequests: 0,
  });

  useEffect(() => {
    // Real-time listener for users count (profiles collection)
    const usersQuery = query(collection(db, 'profiles'));
    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        setStats((prev) => ({ ...prev, totalUsers: snapshot.size }));
      },
      (error) => {
        console.error('Error listening to users:', error);
      }
    );

    // Real-time listener for hospitals count (if you have this collection)
    const hospitalsQuery = query(collection(db, 'hospitals'));
    const unsubscribeHospitals = onSnapshot(
      hospitalsQuery,
      (snapshot) => {
        setStats((prev) => ({ ...prev, totalHospitals: snapshot.size }));
      },
      (error) => {
        console.error('Error listening to hospitals:', error);
      }
    );

    // Real-time listener for blood inventory
    const inventoryQuery = query(collection(db, 'bloodInventory'));
    const unsubscribeInventory = onSnapshot(
      inventoryQuery,
      (snapshot) => {
        setStats((prev) => ({ ...prev, totalInventory: snapshot.size }));
      },
      (error) => {
        console.error('Error listening to inventory:', error);
      }
    );

    // Real-time listener for blood requests
    const requestsQuery = query(collection(db, 'bloodRequests'));
    const unsubscribeRequests = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const total = snapshot.size;
        // Count active requests (you can customize this based on your status field)
        const active = snapshot.docs.filter(doc => {
          const status = doc.data().status;
          return status === 'pending' || status === 'active' || status === 'urgent';
        }).length;
        
        setStats((prev) => ({ 
          ...prev, 
          totalRequests: total,
          activeRequests: active 
        }));
      },
      (error) => {
        console.error('Error listening to requests:', error);
      }
    );

    // Real-time listener for notifications count
    const notificationsQuery = query(collection(db, 'notifications'));
    const unsubscribeNotifications = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        setStats((prev) => ({ ...prev, totalNotifications: snapshot.size }));
      },
      (error) => {
        console.error('Error listening to notifications:', error);
      }
    );

    // Cleanup all listeners
    return () => {
      unsubscribeUsers();
      unsubscribeHospitals();
      unsubscribeInventory();
      unsubscribeRequests();
      unsubscribeNotifications();
    };
  }, []);

  return stats;
}
