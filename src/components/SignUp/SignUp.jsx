import React, { useState } from 'react';
import Confirm from './Confirm/Confirm';
import SignUpForm from './SignUpForm/SignUpForm';

const SignUp = () => {
  const [email, setEmail] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const toConfirm = (email) => {
    setEmail(email);
    setConfirming(true);
  };

  const toSignUp = () => {
    setEmail(null);
    setConfirming(false);
  };

  if(confirming) {
    return <Confirm email={email} onCancel={toSignUp} />;
  }
  else {
    return <SignUpForm onSuccess={toConfirm} />;
  }
};

export default SignUp;