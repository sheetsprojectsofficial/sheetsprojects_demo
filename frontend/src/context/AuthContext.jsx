import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged,
  getIdToken
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // Get Firebase ID token
  const getToken = async () => {
    if (user) {
      try {
        return await getIdToken(user);
      } catch (error) {
        console.error('Error getting token:', error);
        return null;
      }
    }
    return null;
  };

  // Google login function
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0]
      }));

      // Get user role from backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0]
        }),
      });

      const data = await response.json();
      if (data.success) {
        setUserRole(data.user.role);
        localStorage.setItem('userRole', data.user.role);
      }

      return { success: true, user };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('blogUserId');
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return userRole === 'admin';
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Get stored user data
        const storedUser = localStorage.getItem('user');
        const storedRole = localStorage.getItem('userRole');
        
        if (storedUser && storedRole) {
          setUserRole(storedRole);
        } else {
          // Fetch user role from backend
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/user/${user.uid}`);
            const data = await response.json();
            if (data.success) {
              setUserRole(data.user.role);
              localStorage.setItem('userRole', data.user.role);
            }
          } catch (error) {
            console.error('Error fetching user role:', error);
          }
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userRole,
    loginWithGoogle,
    logout,
    isAdmin,
    isAuthenticated,
    getToken,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 