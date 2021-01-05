import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import useAsyncState from '../../hooks/useAsyncState';
import AuthenticationService from '../../services/AuthenticationService';
import AppRouter from '../../routers/AppRouter';
import { AuthenticationContext } from '../../contexts/AuthenticationContext';
import NavBar from '../NavBar/NavBar';

const App = () => {
  const [isAuthenticated, userHasAuthenticated] = useAsyncState(false);
  const [isAuthenticating, setIsAuthenticating] = useAsyncState(true);
  const [user, setUser] = useAsyncState(null);

  useEffect(() => {
    AuthenticationService.checkAuthentication()
      .then(() => {
        AuthenticationService.getUserAttributes()
          .then(authenticatedUser => {
            setUser(authenticatedUser);
            userHasAuthenticated(true);
            setIsAuthenticating(false);
          })
          .catch(() => {
            setIsAuthenticating(false);
          });
      })
      .catch(() => {
        setIsAuthenticating(false);
      });
  }, [isAuthenticated, setIsAuthenticating, setUser, userHasAuthenticated]);

  return (
    <div>
      {
        !isAuthenticating && (
          <BrowserRouter>
            <AuthenticationContext.Provider
              value={{ isAuthenticated, userHasAuthenticated, user, setUser }}
            >
              <NavBar />
              <div className="page-wrapper">
                <div className="container-md main-container">
                  <div className="d-flex flex-column justify-content-center align-items-center vertical-container">
                    <div className="row">
                      <div className="col-12">
                        <AppRouter />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AuthenticationContext.Provider>
          </BrowserRouter>
        )
      }
    </div>
  )
};

export default App;
