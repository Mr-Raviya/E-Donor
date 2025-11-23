import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';

/**
 * Custom hook to get real-time unread notification count
 * @returns unreadCount - Number of unread notifications
 */
export function useUnreadNotifications(): number {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }

    // Set up real-time listener for unread notifications
    const q = query(
      collection(db, 'userNotifications'),
      where('userId', '==', currentUser.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUnreadCount(snapshot.size);
      },
      (error) => {
        console.error('Error listening to unread notifications:', error);
        setUnreadCount(0);
      }
    );

    return () => unsubscribe();
  }, []);

  return unreadCount;
}
