import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Session duration: 1 hour in ms
  const SESSION_DURATION = 60 * 60 * 1000;

  // Helper: Check if session is expired
  const isSessionExpired = () => {
    const sessionStart = localStorage.getItem('user_session_start');
    if (!sessionStart) return true;
    const now = Date.now();
    return now - Number(sessionStart) > SESSION_DURATION;
  };

  // Helper to get sanitized API base URL
  const getApiUrl = () => {
    let url = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
    // Remove trailing slash if present
    if (url.endsWith('/')) url = url.slice(0, -1);
    return url;
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      
      if (firebaseUser) {
        const sessionStart = localStorage.getItem('user_session_start');
        // Only check expiry if sessionStart exists (i.e., not first login)
        if (sessionStart && isSessionExpired()) {
          await signOut(auth);
          setUser(null);
          localStorage.removeItem('user_session_start');
          setLoading(false);
          return;
        }
        // Get Firebase ID token
        try {
          const token = await firebaseUser.getIdToken();
          
          // Verify with backend
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/auth/verify`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser({
              ...userData,
              token: token,
              firebaseUser: firebaseUser
            });
          } else {
            console.error('Backend verification failed:', response.status);
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              token: token,
              firebaseUser: firebaseUser
            });
          }
        } catch (error) {
          console.error('Token or backend verification failed:', error);
          // Fallback to local user data
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            token: null,
            firebaseUser: firebaseUser
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Set session start time
      localStorage.setItem('user_session_start', Date.now().toString());
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Email login error:', error);
      return { success: false, message: error.message };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      
      // Professional Google Sign-in configuration
      provider.addScope('email');
      provider.addScope('profile');
      
      // Force account selection for better UX
      provider.setCustomParameters({
        'prompt': 'select_account',
        'hd': ''  // Allow any domain, not restricted to specific organization
      });
      
      const result = await signInWithPopup(auth, provider);
      
      // Set session start time
      localStorage.setItem('user_session_start', Date.now().toString());
      
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Google login error:', error);
      let message = 'Google sign-in failed. Please try again.';
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Pop-up was blocked. Please allow pop-ups for this site.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        message = 'Another sign-in attempt is in progress.';
      }
      
      return { success: false, message };
    }
  };

  const register = async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Update display name if provided
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }
      // Set session start time
      localStorage.setItem('user_session_start', Date.now().toString());
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('user_session_start');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const value = {
    user,
    loading,
    loginWithEmail,
    loginWithGoogle,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 