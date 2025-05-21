import { type JwtPayload, jwtDecode } from 'jwt-decode';

interface ExtendedJwt extends JwtPayload {
  data:{
    username:string,
    email:string,
    _id:string
  }
};

class AuthService {
  getProfile(): ExtendedJwt | null {
    const token = this.getToken();
    try {
      return jwtDecode<ExtendedJwt>(token);
    } catch {
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
      return false;
    }
  }

  getToken(): string {
    return localStorage.getItem('id_token') || '';
  }

  login(idToken: string): void {
    localStorage.setItem('id_token', idToken);
    window.location.assign('/');
  }

  logout(): void {
    localStorage.removeItem('id_token');
    window.location.assign('/');
  }
}

export default new AuthService();
