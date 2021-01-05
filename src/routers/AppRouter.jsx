import { Switch } from 'react-router-dom';
import UnauthenticatedRoute from './UnauthenticatedRoute';
import AuthenticatedRoute from './AuthenticatedRoute';
import LogIn from '../components/LogIn/LogIn';
import SignUp from '../components/SignUp/SignUp';
import MenuTable from '../components/MenuTable/MenuTable';

const AppRouter = () => (
  <Switch>
    <UnauthenticatedRoute
      path={['/login', '/']}
      exact
    >
      <LogIn />
    </UnauthenticatedRoute>
    <UnauthenticatedRoute
      path={'/signup'}
      exact
    >
      <SignUp />
    </UnauthenticatedRoute>
    <AuthenticatedRoute path={'/menu'}>
      <MenuTable />
    </AuthenticatedRoute>
  </Switch>
);

export default AppRouter;