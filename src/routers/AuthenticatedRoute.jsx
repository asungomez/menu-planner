import React from 'react';
import { Redirect, Route } from 'react-router-dom';

import { useAuthenticationContext } from '../contexts/AuthenticationContext';

const AuthenticatedRoute = ({ children, ...routeProps }) => {
  const { isAuthenticated } = useAuthenticationContext();
  return (
    <Route {...routeProps}>
      {isAuthenticated ? (
        children
      ) : (
        <Redirect to={`/login`} />
      )}
    </Route>
  );
};

export default AuthenticatedRoute;
