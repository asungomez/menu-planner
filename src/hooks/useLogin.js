import { useHistory } from 'react-router';

import { useAuthenticationContext } from '../contexts/AuthenticationContext';
import AuthenticationService from '../services/AuthenticationService';

const useLogin = () => {
  const { userHasAuthenticated, setUser } = useAuthenticationContext();
  const history = useHistory();
  const execute = () => {
    AuthenticationService.getUserAttributes()
      .then((attributes) => {
        setUser(attributes);
        userHasAuthenticated(true);
        history.push('/menu');
      })
      .catch(() => {
        userHasAuthenticated(false);
        history.push('/login');
      });
  };
  return execute;
};

export default useLogin;