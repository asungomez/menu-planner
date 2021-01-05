import { createContext, useContext } from 'react';

export const AuthenticationContext = createContext(
  null
);

export function useAuthenticationContext() {
  return useContext(AuthenticationContext);
}
