import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthenticationContext } from '../../contexts/AuthenticationContext';
import AuthenticationService from '../../services/AuthenticationService';

const NavBar = () => {
  const { isAuthenticated, userHasAuthenticated } = useAuthenticationContext();
  const logout = () => {
    AuthenticationService.logOut()
      .then(() => {
        userHasAuthenticated(false);
      })
      .catch(() => { });
  };
  return (
    <nav className="navbar fixed-top navbar-light bg-light">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand">Menu planner</Link>
        {isAuthenticated && (
          <button
            className="btn btn-outline-primary"
            onClick={e => {
              e.preventDefault();
              logout();
            }}
          >
            Log out
          </button>
        )}
      </div>
    </nav>
  );
};

export default NavBar;