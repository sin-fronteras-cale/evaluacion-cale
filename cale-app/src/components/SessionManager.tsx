'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes of inactivity
const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute
const STORAGE_KEY_LAST_ACTIVE = 'cale_last_active';

export default function SessionManager() {
  const router = useRouter();

  useEffect(() => {
    // Function to update last active timestamp
    const updateActivity = () => {
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, Date.now().toString());
    };

    const checkInactivity = async () => {
      const lastActiveStr = localStorage.getItem(STORAGE_KEY_LAST_ACTIVE);
      
      if (lastActiveStr) {
        const lastActive = parseInt(lastActiveStr, 10);
        const now = Date.now();
        
        if (now - lastActive > INACTIVITY_LIMIT_MS) {
          console.log('Session expired due to inactivity');
          localStorage.removeItem(STORAGE_KEY_LAST_ACTIVE);
          
          // Call logout endpoint to clear cookie
          try {
            await fetch('/api/auth/logout', {
              method: 'POST',
              credentials: 'include'
            });
          } catch (e) {
            console.error('Logout error:', e);
          }
          
          router.push('/');
          router.refresh();
        }
      } else {
        updateActivity();
      }
    };

    // Initial check
    checkInactivity();

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove', 'click'];
    
    let throttleTimer: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (throttleTimer) return;
      
      throttleTimer = setTimeout(() => {
        updateActivity();
        throttleTimer = null;
      }, 5000);
    };

    events.forEach(event => window.addEventListener(event, handleActivity));
    
    const intervalId = setInterval(checkInactivity, CHECK_INTERVAL_MS);

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (throttleTimer) clearTimeout(throttleTimer);
      clearInterval(intervalId);
    };
  }, [router]);

  return null;
}
