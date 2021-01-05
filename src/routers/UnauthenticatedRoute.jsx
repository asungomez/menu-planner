import React from 'react';
import { Redirect, Route } from 'react-router-dom';

import { useAuthenticationContext } from '../contexts/AuthenticationContext';

const UnauthenticatedRoute = ({ children, ...routeProps }) => {
  const { isAuthenticated } = useAuthenticationContext();
  return (
    <Route {...routeProps}>
      {!isAuthenticated ? children : <Redirect to="/menu" />}
    </Route>
  );
};

export default UnauthenticatedRoute;
