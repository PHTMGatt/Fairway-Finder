// client/src/utils/auth.ts
import { JwtPayload, jwtDecode } from 'jwt-decode';

interface ExtendedJwt extends JwtPayload {
  data: {
    username: string;
    email: string;
    _id: string;
  };
}

class AuthService {
  getProfile(): ExtendedJwt | null {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      this.logout();
      return null;
    }
    try {
      return jwtDecode<ExtendedJwt>(token);
    } catch {
      this.logout();
      return null;
    }
  }

  loggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return !!decoded.exp && decoded.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }

  getToken(): string {
    return localStorage.getItem('id_token') || '';
  }

  login(idToken: string): void {
    localStorage.setItem('id_token', idToken);
  }

  logout(): void {
    localStorage.removeItem('id_token');
  }
}

export default new AuthService();
