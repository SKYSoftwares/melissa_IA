import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, start, end, attendees, userEmail } = body;

    console.log('=== DEBUG CREATE EVENT ===');
    console.log('userEmail recebido:', userEmail);
    console.log('Dados do evento:', { title, description, start, end, attendees });
    
    // Debug das datas
    console.log('=== DEBUG DATAS ===');
    console.log('start original:', start);
    console.log('end original:', end);
    
    // Converter para fuso horário local (Brasil)
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    console.log('startDate:', startDate);
    console.log('endDate:', endDate);
    console.log('startDate.toISOString():', startDate.toISOString());
    console.log('endDate.toISOString():', endDate.toISOString());
    
    // Ajustar para fuso horário local (Brasil - UTC-3)
    const startLocal = new Date(startDate.getTime() - (3 * 60 * 60 * 1000));
    const endLocal = new Date(endDate.getTime() - (3 * 60 * 60 * 1000));
    
    console.log('startLocal:', startLocal);
    console.log('endLocal:', endLocal);
    console.log('startLocal.toISOString():', startLocal.toISOString());
    console.log('endLocal.toISOString():', endLocal.toISOString());

    if (!userEmail) {
      console.log('Erro: userEmail não fornecido');
      return NextResponse.json({ error: 'Email do usuário não fornecido' }, { status: 400 });
    }

    // Primeiro, buscar na tabela User
    let user = await prisma.user.findUnique({ 
      where: { email: userEmail },
      select: {
        id: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleEmail: true
      }
    });

    // Se não encontrar na tabela User, buscar na tabela Team
    if (!user) {
      const teamMember = await prisma.team.findUnique({
        where: { email: userEmail },
        select: {
          id: true,
          googleAccessToken: true,
          googleRefreshToken: true,
          googleEmail: true
        }
      });
      
      if (teamMember) {
        user = {
          id: teamMember.id,
          googleAccessToken: teamMember.googleAccessToken,
          googleRefreshToken: teamMember.googleRefreshToken,
          googleEmail: teamMember.googleEmail
        };
      }
    }

    console.log('Usuário encontrado:', user ? 'Sim' : 'Não');
    if (user) {
      console.log('Google tokens:', {
        hasAccessToken: !!user.googleAccessToken,
        hasRefreshToken: !!user.googleRefreshToken,
        googleEmail: user.googleEmail
      });
    }

    if (!user || !user.googleAccessToken || !user.googleRefreshToken) {
      console.log('Erro: Usuário não conectado ao Google');
      return NextResponse.json({ error: 'Usuário não conectado ao Google' }, { status: 401 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: title,
      description: description,
      start: { dateTime: start, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: end, timeZone: 'America/Sao_Paulo' },
      attendees: attendees?.map((email: string) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: new Date().toISOString(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });

    // Salvar no banco de dados local Meeting
    await prisma.meeting.create({
      data: {
        title,
        description,
        startDateTime: new Date(start),
        endDateTime: new Date(end),
        duration: Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000),
        type: 'meet',
        status: 'confirmed',
        meetLink: response.data.hangoutLink || '',
        attendees: attendees ? attendees.join(',') : '',
        organizerEmail: userEmail,
        googleEventId: response.data.id,
      }
    });

    return NextResponse.json({
      success: true,
      meetLink: response.data.hangoutLink,
      eventId: response.data.id,
      eventUrl: response.data.htmlLink
    });

  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return NextResponse.json({ 
      error: 'Erro ao criar evento no Google Calendar',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 