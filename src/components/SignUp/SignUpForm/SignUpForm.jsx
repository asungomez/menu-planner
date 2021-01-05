import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthenticationService from '../../../services/AuthenticationService';

const SignUpForm = ({onSuccess}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signUp = () => {
    setLoading(true);
    AuthenticationService.signUp(email, password)
      .then(() => {
        setLoading(false);
        onSuccess(email);
      })
      .catch(e => {
        setLoading(false);
        console.log(e);
      });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h1>Sign up</h1>
      </div>
      <div className="card-body">
        <form
          onSubmit={e => {
            e.preventDefault();
            signUp();
          }}
        >
          <div className="mb-3 form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              name="email"
              aria-describedby="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-3 form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              name="password"
              aria-describedby="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
        </form>
      </div>
      <div className="card-footer">
        <div className="d-flex flex-row justify-content-between align-items-center">
          <Link className="link-primary" to="/login">Log in</Link>
          <button
            className="btn btn-primary"
            onClick={e => {
              e.preventDefault();
              signUp();
            }}
          >
            {
              loading && (
                <div className="spinner-border spinner-border-sm text-light mr-4" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              )
            }
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;