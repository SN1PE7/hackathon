import { useState, useEffect } from 'react';

interface User {
  name: string;
  email: string;
  img: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for user data first (set by redirect page)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }

    // Otherwise, check if token exists and fetch profile
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Listen for storage changes (for other tabs/windows)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
            setLoading(false);
          } catch (error) {
            console.error('Error parsing user from storage:', error);
          }
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchUserProfile = async (token: string) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Store user data for future sessions
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.error('Failed to fetch profile:', response.status);
        localStorage.removeItem('authToken');
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return { user, loading, logout };
}
