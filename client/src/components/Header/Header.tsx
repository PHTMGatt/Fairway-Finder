// client/src/components/Header/'Header.tsx'
import { Link } from 'react-router-dom';
import { MouseEvent, CSSProperties } from 'react';
import Auth from '../../utils/auth';
import texture from '../../assets/images/pool-table.png';
import golfGif from '../../assets/images/golf2.gif';
import './Header.css';

//Note; remastered Header with preserved structure and inline background style
const Header: React.FC = () => {
  const logout = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    Auth.logout();
  };

  //Note; header background style using pool-table + striped gradient
  const headerStyle: CSSProperties = {
    position: 'relative',
    height: '120px',
    padding: '0 2rem',
    backgroundImage: `
      url(${texture}),
      repeating-linear-gradient(
        45deg,
        #2e5633,
        #2e5633 40px,
        #3b6e40 40px,
        #3b6e40 80px
      )
    `,
    backgroundRepeat: 'repeat',
    backgroundSize: 'auto, auto',
    borderBottom: '3px solid #1f3b24',
    boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
    fontFamily: `'Helvetica Neue', Helvetica, Arial, sans-serif`,
    display: 'flex',
    alignItems: 'center',
    zIndex: 1,
  };

  return (
    <header className="header" style={headerStyle}>
      {/*Note; animated icon links to home */}
      <Link to="/" className="header__icon-link">
        <img src={golfGif} alt="Home" className="header__gif-icon" />
      </Link>

      {/*Note; center title link */}
      <Link to="/" className="header__logo">
        FAIRWAY FINDER
      </Link>

      {/*Note; spacer pushes buttons right */}
      <div className="header__spacer" />

      {/*Note; auth buttons */}
      <div className="header__actions">
        {Auth.loggedIn() ? (
          <>
            <Link to="/dashboard" className="header__btn">My Trips</Link>
            <button onClick={logout} className="header__btn">Log Out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="header__btn">Log In</Link>
            <Link to="/signup" className="header__btn">Sign Up</Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
