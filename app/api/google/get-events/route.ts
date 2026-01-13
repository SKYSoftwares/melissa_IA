import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('email');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('=== DEBUG GET EVENTS ===');
    console.log('userEmail:', userEmail);
    console.log('startDate:', startDate);
    console.log('endDate:', endDate);

    if (!userEmail) {
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

    if (!user || !user.googleAccessToken || !user.googleRefreshToken) {
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

    // Definir período de busca (padrão: 7 dias)
    const timeMin = startDate ? new Date(startDate) : new Date();
    const timeMax = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    console.log('Buscando eventos de:', timeMin.toISOString(), 'até:', timeMax.toISOString());

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    console.log(`Encontrados ${events.length} eventos`);

    // Converter eventos do Google para formato da aplicação
    const formattedEvents = events.map((event, index) => {
      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;
      
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      return {
        id: event.id || `event-${index}`,
        title: event.summary || 'Evento sem título',
        client: event.attendees?.[0]?.displayName || event.organizer?.displayName || 'Cliente',
        type: event.conferenceData ? 'meet' : 'call',
        date: startDate.toISOString().split('T')[0],
        time: startDate.toTimeString().split(' ')[0].substring(0, 5),
        duration: Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)),
        status: 'confirmed',
        description: event.description || '',
        meetLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || '',
        attendees: event.attendees?.map(a => a.email) || [],
        priority: 'medium',
        googleEventId: event.id,
        htmlLink: event.htmlLink,
        source: 'google' // Identificar que veio do Google
      };
    });

    // Buscar eventos complementares no banco local
    const localEvents = await prisma.meeting.findMany({
      where: {
        organizerEmail: userEmail,
        startDateTime: {
          gte: timeMin,
          lte: timeMax
        }
      },
      orderBy: {
        startDateTime: 'asc'
      }
    });

    // Converter eventos locais para o mesmo formato
    const formattedLocalEvents = localEvents.map(event => ({
      id: event.id,
      title: event.title,
      client: 'Cliente', // Pode ser melhorado depois
      type: event.type,
      date: event.startDateTime.toISOString().split('T')[0],
      time: event.startDateTime.toTimeString().split(' ')[0].substring(0, 5),
      duration: event.duration,
      status: event.status,
      description: event.description || '',
      meetLink: event.meetLink || '',
      attendees: event.attendees ? event.attendees.split(',').map(email => email.trim()) : [],
      priority: 'medium',
      googleEventId: event.googleEventId,
      source: 'local' // Identificar que veio do banco local
    }));

    // Combinar eventos do Google com eventos locais
    // Priorizar eventos do Google (mais atualizados)
    const allEvents = [...formattedEvents, ...formattedLocalEvents];
    
    // Remover duplicatas baseado no googleEventId
    const uniqueEvents = allEvents.filter((event, index, self) => {
      if (!event.googleEventId) return true; // Manter eventos locais sem googleEventId
      return index === self.findIndex(e => e.googleEventId === event.googleEventId);
    });

    console.log(`Eventos do Google: ${formattedEvents.length}`);
    console.log(`Eventos locais: ${formattedLocalEvents.length}`);
    console.log(`Total único: ${uniqueEvents.length}`);

    return NextResponse.json({
      success: true,
      events: uniqueEvents
    });

  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar eventos do Google Calendar',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 