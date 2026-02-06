// lib/mailgun.ts
import Mailgun from "mailgun.js";
import formData from "form-data";

// Função para criar o cliente Mailgun
export function getMailgunClient() {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain) {
    throw new Error("MAILGUN_API_KEY ou MAILGUN_DOMAIN não configurados!");
  }

  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({
    username: "api",
    key: apiKey,
    url: "https://api.mailgun.net",
  });

  return { mg, domain };
}

// Enviar email de redefinição de senha
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
) => {
  const resetUrl = `${process.env.NEXTAUTH_URL}/redefinir-senha?token=${resetToken}`;

  const { mg, domain } = getMailgunClient();

  try {
    const data = await mg.messages.create(domain, {
      from: `Melissa IA <no-reply@melissaia.com.br>`,
      to: [email],
      subject: "🔐 Redefinição de Senha - Melissa IA CRM",

      text: `
Redefinição de Senha - Melissa IA

Clique no link abaixo:
${resetUrl}

Válido por 1 hora.
      `,

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
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Melissa IA</p>
          </div>
          
          <div class="content">
            <h2>Olá! 👋</h2>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Melissa IA</strong>.</p>
            
            <p>Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha:</p>
            
          <div style="text-align: center; margin: 30px 0;">
    <a href="${resetUrl}" 
       style="
         background-color: #7c3aed;
         color: white;
         padding: 14px 24px;
         text-decoration: none;
         border-radius: 8px;
         font-weight: bold;
         display: inline-block;
       ">
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
            
<p>Se o botão não funcionar, clique no link abaixo:</p>

<p style="word-break: break-all; text-align: center;">
  <a href="${resetUrl}" 
     target="_blank"
     style="
       color: #7c3aed;
       font-weight: bold;
       text-decoration: underline;
     ">
     ${resetUrl}
  </a>
</p>
            
            <p>Se você tiver dúvidas ou precisar de ajuda, entre em contato conosco.</p>
          </div>
          
          <div class="footer">
            <p><strong>Melissa IA</strong></p>
            <p>📧 contato@melissaia.com.br | 📱 (11) 93922-6976 </p>
            <p>Este é um email automático, não responda a esta mensagem.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    });

    console.log("✅ Password changed email sent:", data.id);
    return { success: true, messageId: data.id };

  } catch (error) {
    console.error("❌ Failed to send password changed email:", error);
    return { success: false, error };
  }
};
// Enviar email de confirmação de senha alterada
export const sendPasswordChangedEmail = async (email: string) => {
    const { mg, domain } = getMailgunClient();

  try {
    const data = await mg.messages.create(domain, {
      from: `Melissa IA <no-reply@melissaia.com.br>`,
      to: [email],
      subject: "✅ Senha Alterada com Sucesso - Melissa IA",

      text: `
Senha Alterada com Sucesso - Melissa IA

Sua senha foi alterada com sucesso em ${new Date().toLocaleString("pt-BR")}.

Se não foi você, entre em contato imediatamente.
      `,

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
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Melissa IA</p>
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
            
            <p>Para acessar sua conta, <a href="${process.env.NEXTAUTH_URL
        }/login" style="color: #667eea; text-decoration: none;">clique aqui</a>.</p>
          </div>
          
          <div class="footer">
            <p><strong>Melissa IA</strong></p>
            <p>📧 contato@melissaia.com.br | 📱 (11) 93922-6976</p>
            <p>Este é um email automático, não responda a esta mensagem.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    });

    console.log("✅ Password changed email sent:", data.id);
    return { success: true, messageId: data.id };

  } catch (error) {
    console.error("❌ Failed to send password changed email:", error);
    return { success: false, error };
  }
};