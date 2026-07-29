import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../api/auth';

export const AuthContext = createContext({
  user: null,
  setUser: () => {},
  loading: true,
  logout: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const setAuthenticatedUser = (nextUser) => {
    setUser((prevUser) => {
      if (!nextUser) {
        return null;
      }

      const sanitizedUser = Object.fromEntries(
        Object.entries(nextUser).filter(([, value]) => value !== undefined)
      );

      return {
        ...(prevUser || {}),
        ...sanitizedUser,
        role: sanitizedUser.role ?? prevUser?.role,
        passwordChanged: sanitizedUser.passwordChanged ?? prevUser?.passwordChanged ?? false,
      };
    });
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const response = await getCurrentUser();
        if (response?.user) {
          setAuthenticatedUser(response.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const logout = async () => {
    setLoading(true);

    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout failed:', error.message || error);
    } finally {
      setUser(null);
      setLoading(false);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser: setAuthenticatedUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
