module.exports = (email, resetLink) => {
  return `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
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
    .reset-link {
      text-align: center;
      margin-top: 20px;
    }
    .reset-link a {
      display: inline-block;
      padding: 10px 20px;
      background-color: #007bff;
      color: #ffffff;
      text-decoration: none;
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
    <h2>Password Reset</h2>

    <p>Dear ${email},</p>

    <p>You are receiving this email because a password reset request was made for your account on ChitChat. If you did not request this password reset, you can safely ignore this email.</p>

    <p>To reset your password, please click on the following link:</p>

    <div class="reset-link"><a href=${resetLink} target="_blank">Reset Password</a></div>

    <p>If the above link is not clickable, you can copy and paste the following URL into your web browser:</p>

    <p>${resetLink}</p>

    <p class="footer">Thank you for using ChitChat.</p>
  </div>

</body>
</html>

    `;
};
