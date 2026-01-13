import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      leadId,
      title,
      description,
      startDateTime,
      endDateTime,
      attendees = [],
      duration = 60,
    } = body;

    if (!leadId || !title || !startDateTime) {
      return NextResponse.json(
        {
          error: "Dados obrigatórios: leadId, title, startDateTime",
        },
        { status: 400 }
      );
    }

    // Verificar se o lead existe
    const lead = await prisma.lead.findFirst({
      where: { 
        id: leadId,
        deletedAt: null, // Não permitir agendar reunião para lead deletado
      },
      select: { id: true, name: true, email: true, phone: true },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado ou está na lixeira" },
        { status: 404 }
      );
    }

    // Buscar dados do usuário para autenticação Google
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleEmail: true,
      },
    });

    if (!user) {
      const teamMember = await prisma.team.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          googleAccessToken: true,
          googleRefreshToken: true,
          googleEmail: true,
        },
      });

      if (teamMember) {
        user = {
          id: teamMember.id,
          googleAccessToken: teamMember.googleAccessToken,
          googleRefreshToken: teamMember.googleRefreshToken,
          googleEmail: teamMember.googleEmail,
        };
      }
    }

    if (!user || !user.googleAccessToken || !user.googleRefreshToken) {
      return NextResponse.json(
        {
          error: "Usuário não conectado ao Google Calendar",
        },
        { status: 401 }
      );
    }

    // Configurar OAuth2
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    // Verificar se o token precisa ser renovado
    try {
      await oauth2Client.getAccessToken();
    } catch (error) {
      console.log("Token expirado, tentando renovar...");
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);

        // Atualizar tokens no banco de dados
        if (user.id) {
          await prisma.team.update({
            where: { id: user.id },
            data: {
              googleAccessToken: credentials.access_token,
              googleRefreshToken:
                credentials.refresh_token || user.googleRefreshToken,
            },
          });
        }
      } catch (refreshError) {
        console.error("Erro ao renovar token:", refreshError);
        return NextResponse.json(
          {
            error: "Sessão expirada. Reconecte sua conta Google.",
          },
          { status: 401 }
        );
      }
    }

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Preparar dados do evento
    const startDate = new Date(startDateTime);
    const endDate = new Date(
      endDateTime || new Date(startDate.getTime() + duration * 60000)
    );

    // Incluir email do lead se disponível
    const allAttendees = [...attendees];
    if (lead.email) {
      allAttendees.push(lead.email);
    }

    const event = {
      summary: title,
      description: description || `Reunião com ${lead.name}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      attendees: allAttendees.map((email) => ({
        email,
        responseStatus: "needsAction",
      })),
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 10 },
        ],
      },
    };

    // Criar evento no Google Calendar
    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
    });

    // Salvar no banco de dados local
    const meeting = await prisma.meeting.create({
      data: {
        title,
        description: description || `Reunião com ${lead.name}`,
        startDateTime: startDate,
        endDateTime: endDate,
        duration,
        type: "meet",
        status: "confirmed",
        meetLink: response.data.hangoutLink || "",
        attendees: allAttendees.join(","),
        organizerEmail: session.user.email,
        googleEventId: response.data.id,
        leadId: leadId,
      },
    });

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        meetLink: meeting.meetLink,
        googleEventId: meeting.googleEventId,
        eventUrl: response.data.htmlLink,
        startTime: meeting.startDateTime,
        endTime: meeting.endDateTime,
        attendees: meeting.attendees,
      },
      googleEvent: {
        id: response.data.id,
        htmlLink: response.data.htmlLink,
        hangoutLink: response.data.hangoutLink,
        conferenceData: response.data.conferenceData,
      },
    });
  } catch (error) {
    console.error("Erro ao agendar reunião:", error);
    return NextResponse.json(
      {
        error: "Erro ao agendar reunião",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
