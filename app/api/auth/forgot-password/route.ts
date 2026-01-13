import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o email existe no banco
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    const teamMember = await prisma.team.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user && !teamMember) {
      // Por segurança, retornamos sucesso mesmo se o email não existir
      return NextResponse.json({
        success: true,
        message:
          "Se o email existir em nosso sistema, você receberá um link para redefinir sua senha.",
      });
    }

    // Gerar token de redefinição
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // Salvar token no banco (atualizar o usuário existente)
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpiry: resetTokenExpiry,
        },
      });
    } else if (teamMember) {
      await prisma.team.update({
        where: { id: teamMember.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpiry: resetTokenExpiry,
        },
      });
    }

    // Enviar email
    const emailResult = await sendPasswordResetEmail(email, resetToken);

    if (!emailResult.success) {
      console.error("Failed to send email:", emailResult.error);
      return NextResponse.json(
        { error: "Erro ao enviar email. Tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Se o email existir em nosso sistema, você receberá um link para redefinir sua senha.",
    });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
