// client/src/context/AuthContext.tsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import Auth from '../../utils/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  refresh: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  refresh: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(Auth.loggedIn());

  const refresh = () => setIsLoggedIn(Auth.loggedIn());
  const logout = () => {
    Auth.logout();
    setIsLoggedIn(false);
  };

  useEffect(refresh, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
