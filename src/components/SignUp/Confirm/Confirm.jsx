import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import AuthenticationService from '../../../services/AuthenticationService';

const Confirm = ({ email, onCancel }) => {

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const confirm = () => {
    setLoading(true);
    AuthenticationService.confirm(email, code)
      .then(() => {
        setLoading(false);
        history.push('/login');
      })
      .catch(e => {
        setLoading(false);
        console.log(e);
      });
  };

  return (
    <div className="card">
      <form
        onSubmit={e => {
          e.preventDefault();
          confirm();
        }}
      >
        <div className="card-header">
          <h1>Confirm your account</h1>
        </div>
        <div className="card-body">
          <div className="mb-3 form-group">
            <label htmlFor="code" className="form-label">Confirmation code</label>
            <input
              type="string"
              className="form-control"
              name="code"
              aria-describedby="code"
              value={code}
              onChange={e => setCode(e.target.value)}
            />
          </div>
        </div>
        <div className="card-footer">
          <div className="d-flex flex-row justify-content-between align-items-center">
            <button className="link-primary" onClick={e => {
              e.preventDefault();
              onCancel();
            }}>Cancel</button>
            <button
              className="btn btn-primary"
            >
              {
                loading && (
                  <div className="spinner-border spinner-border-sm text-light mr-4" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                )
              }
            Confirm
          </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Confirm;