import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  requiresAuth: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(true);

  useEffect(() => {
    // Check if running on localhost
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    setRequiresAuth(!isLocalhost);

    // If localhost, auto-authenticate
    if (isLocalhost) {
      setIsAuthenticated(true);
    } else {
      // Check if already authenticated in this session
      const authFlag = sessionStorage.getItem('dewc_authenticated');
      if (authFlag === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    if (username === 'dewc' && password === 'indopac') {
      setIsAuthenticated(true);
      sessionStorage.setItem('dewc_authenticated', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('dewc_authenticated');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, requiresAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
