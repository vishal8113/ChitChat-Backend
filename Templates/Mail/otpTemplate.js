module.exports = (email, otp) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 10px;
        box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
      }
      h2 {
        text-align: center;
        color: #333333;
      }
      p {
        color: #666666;
      }
      .otp {
        text-align: center;
        font-size: 24px;
        margin-top: 20px;
        margin-bottom: 30px;
        padding: 10px 0;
        background-color: #f0f0f0;
        border-radius: 5px;
      }
      .footer {
        text-align: center;
        margin-top: 30px;
        color: #999999;
      }
    </style>
  </head>
  <body>
  
    <div class="container">
      <h2>OTP Verification</h2>
  
      <p>Dear ${email},</p>
  
      <p>You are receiving this email to verify your identity for Chit Chat. Please use the following One-Time Password (OTP) to complete the verification process:</p>
  
      <div class="otp">${otp}</div>
  
      <p>This OTP is valid for only 10 Minutes due to security reasons. If you did not request this OTP or believe you received this email in error, please ignore it.</p>
  
      <p class="footer">Thank you for using ChitChat.</p>
    </div>
  
  </body>
  </html>
  
      `;
};
