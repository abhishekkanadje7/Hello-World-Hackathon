import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  loginUser, 
  registerCustomer, 
  getMe, 
  getToken, 
  setToken, 
  setOnSessionExpired 
} from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('triagex_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(null);

  useEffect(() => {
    setOnSessionExpired((msg) => {
      setTokenState(null);
      setUser(null);
      setSessionExpiredMsg(msg);
    });

    // Check token validity on mount
    const verifyUser = async () => {
      const currentToken = getToken();
      if (currentToken) {
        try {
          const profile = await getMe();
          setUser(profile);
          localStorage.setItem('triagex_user', JSON.stringify(profile));
        } catch (e) {
          setToken(null);
          localStorage.removeItem('triagex_user');
          setUser(null);
          setTokenState(null);
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    const res = await loginUser(email, password);
    setToken(res.access_token);
    setTokenState(res.access_token);
    setUser(res.user);
    localStorage.setItem('triagex_user', JSON.stringify(res.user));
    setSessionExpiredMsg(null);
    return res.user;
  };

  const register = async (name, email, password) => {
    const res = await registerCustomer(name, email, password);
    setToken(res.access_token);
    setTokenState(res.access_token);
    setUser(res.user);
    localStorage.setItem('triagex_user', JSON.stringify(res.user));
    setSessionExpiredMsg(null);
    return res.user;
  };

  const logout = () => {
    setToken(null);
    setTokenState(null);
    setUser(null);
    localStorage.removeItem('triagex_user');
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('triagex_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      loading,
      login,
      register,
      logout,
      updateUser,
      sessionExpiredMsg,
      setSessionExpiredMsg
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
