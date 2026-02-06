import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.titan.email",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, // email COMPLETO
    pass: process.env.EMAIL_PASS, // senha do email
  },
  // tls: {
  //   rejectUnauthorized: false,
  // },
});

export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ SMTP HostGator conectado com sucesso");
    return true;
  } catch (error) {
    console.error("❌ Erro SMTP HostGator:", error);
    return false;
  }
};

// Enviar email de redefinição de senha
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
) => {
  const resetUrl = `${process.env.NEXTAUTH_URL}/redefinir-senha?token=${resetToken}`;

  const mailOptions = {
    from: `"Melissa IA" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔐 Redefinição de Senha - Melissa IA CRM",
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinição de Senha</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .content h2 {
            color: #2d3748;
            margin-top: 0;
            font-size: 20px;
          }
          .content p {
            color: #4a5568;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .warning {
            background: #fef5e7;
            border: 1px solid #f6ad55;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
          }
          .warning-icon {
            color: #d69e2e;
            font-weight: bold;
          }
          .footer {
            background: #f7fafc;
            padding: 20px 30px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #718096;
            font-size: 14px;
          }
          .token-info {
            background: #edf2f7;
            border-radius: 6px;
            padding: 12px;
            font-family: monospace;
            font-size: 12px;
            color: #4a5568;
            word-break: break-all;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Redefinição de Senha</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Melisa IA</p>
          </div>
          
          <div class="content">
            <h2>Olá! 👋</h2>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Melisa IA</strong>.</p>
            
            <p>Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">
                🔑 Redefinir Minha Senha
              </a>
            </div>
            
            <div class="warning">
              <p><span class="warning-icon">⚠️</span> <strong>Importante:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Este link é válido por <strong>1 hora</strong></li>
                <li>Use apenas uma vez</li>
                <li>Se você não solicitou esta redefinição, ignore este email</li>
              </ul>
            </div>
            
            <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
            <div class="token-info">${resetUrl}</div>
            
            <p>Se você tiver dúvidas ou precisar de ajuda, entre em contato conosco.</p>
          </div>
          
          <div class="footer">
            <p><strong>Melisa IA</strong></p>
            <p>📧 contato@melissaia.com.br | 📱 (11) 93922-6976/p>
            <p>Este é um email automático, não responda a esta mensagem.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Redefinição de Senha - Melisa IA
      
      Olá!
      
      Recebemos uma solicitação para redefinir a senha da sua conta.
      
      Clique no link abaixo para criar uma nova senha:
      ${resetUrl}
      
      Este link é válido por 1 hora e pode ser usado apenas uma vez.
      
      Se você não solicitou esta redefinição, ignore este email.
      
      --
      Melisa IA
      Email: contato@melissaia.com.br
      Telefone: (11) 93922-6976
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error);
    return { success: false, error: error };
  }
};

// Enviar email de confirmação de senha alterada
export const sendPasswordChangedEmail = async (email: string) => {
  const mailOptions = {
    from: `"Melisa IA" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "✅ Senha Alterada com Sucesso - Melisa IA",
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Senha Alterada</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .content h2 {
            color: #2d3748;
            margin-top: 0;
            font-size: 20px;
          }
          .content p {
            color: #4a5568;
            margin-bottom: 20px;
          }
          .success {
            background: #f0fff4;
            border: 1px solid #9ae6b4;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
          }
          .success-icon {
            color: #38a169;
            font-weight: bold;
          }
          .footer {
            background: #f7fafc;
            padding: 20px 30px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #718096;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Senha Alterada</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Melisa IA</p>
          </div>
          
          <div class="content">
            <h2>Sucesso! 🎉</h2>
            
            <p>Sua senha foi alterada com sucesso em <strong>${new Date().toLocaleString(
              "pt-BR"
            )}</strong>.</p>
            
            <div class="success">
              <p><span class="success-icon">✅</span> <strong>Confirmação:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Sua senha foi atualizada com segurança</li>
                <li>Você pode fazer login com a nova senha</li>
                <li>Se você não fez esta alteração, entre em contato conosco imediatamente</li>
              </ul>
            </div>
            
            <p>Para acessar sua conta, <a href="${
              process.env.NEXTAUTH_URL
            }/login" style="color: #667eea; text-decoration: none;">clique aqui</a>.</p>
          </div>
          
          <div class="footer">
            <p><strong>Melisa IA</strong></p>
            <p>📧 contato@melissaia.com.br | 📱 (11) 93922-6976</p>
            <p>Este é um email automático, não responda a esta mensagem.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Senha Alterada com Sucesso - Melisa IA
      
      Sucesso!
      
      Sua senha foi alterada com sucesso em ${new Date().toLocaleString(
        "pt-BR"
      )}.
      
      Confirmação:
      - Sua senha foi atualizada com segurança
      - Você pode fazer login com a nova senha
      - Se você não fez esta alteração, entre em contato conosco imediatamente
      
      Para acessar sua conta: ${process.env.NEXTAUTH_URL}/login
      
      --
      Melisa IA
      Email: contato@melissaia.com.br
      Telefone: (11) 93922-6976
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Password changed email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Failed to send password changed email:", error);
    return { success: false, error: error };
  }
};

export default transporter;
