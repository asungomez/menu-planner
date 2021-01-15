exports.handler = (event, context, callback) => {
  if (event.triggerSource === 'CustomMessage_SignUp' || event.triggerSource === 'CustomMessage_ResendCode') {
    const { codeParameter } = event.request;
    const email = event.request.userAttributes.email;
    const { clientId } = event.callerContext;
    const link = `apifalsa.com/users/_validate_signup?code=${codeParameter}&email=${email}&id=${clientId}`;
    event.response.emailSubject = 'Please verify your email address';
    event.response.emailMessage = `<a href="${link}">Verify</a>`
  }
};