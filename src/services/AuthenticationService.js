import { Auth } from 'aws-amplify';

class AuthenticationService {
  static async checkAuthentication() {
    try {
      const response = await Auth.currentSession();
      return Promise.resolve(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async getUserAttributes() {
    try {
      const info = await Auth.currentUserInfo();
      if (info) {
        return Promise.resolve(info.attributes);
      } else {
        return Promise.reject('User info not available');
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  static async signUp(email, password) {
    try {
      const response = await Auth.signUp({
        username: email,
        password: password,
      });
      return Promise.resolve(response);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  static async logIn(email, password) {
    try {
      const user = await Auth.signIn(email, password);
      return Promise.resolve(user);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async logOut(){
    try {
      const response = await Auth.signOut();
      return Promise.resolve(response);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  static async confirm(email, code) {
    try {
      const response = await Auth.confirmSignUp(email, code);
      return Promise.resolve(response);
    }
    catch(e) {
      return Promise.reject(e);
    }
  }
};

export default AuthenticationService;