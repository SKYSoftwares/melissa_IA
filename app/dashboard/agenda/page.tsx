'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Link,
    Link2Off,
    MapPin,
    Phone,
    Plus,
    Video,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useEffect } from 'react';

const timeSlots = [
    '06:00',
    '06:30',
    '07:00',
    '07:30',
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
    '20:00',
    '20:30',
    '21:00',
    '21:30',
    '22:00',
    '22:30',
    '23:00',
];

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function AgendaPage() {
    const { data: session } = useSession();
    const user = session?.user;

    const [appointments, setAppointments] = useState<any[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showNewMeeting, setShowNewMeeting] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'week' | 'day' | 'month'>('week');
    const [googleStatus, setGoogleStatus] = useState({
        isConnected: false,
        googleEmail: null as string | null,
    });
    const [isLoading, setIsLoading] = useState(false);

    const [meetingForm, setMeetingForm] = useState({
        title: '',
        date: '',
        time: '',
        duration: '60',
        type: 'meet',
        attendees: '',
        description: '',
        sendInvites: true,
        addToCalendar: true,
        reminder: true,
    });


    useEffect(() => {
        if (!user?.email) return;

        const checkGoogleStatus = async () => {
            try {
                const res = await fetch(`/api/google/status?email=${user.email}`);
                const data = await res.json();

                if (res.ok && data.isConnected) {
                    setGoogleStatus({
                        isConnected: true,
                        googleEmail: data.googleEmail,
                    });
                } else {
                    setGoogleStatus({
                        isConnected: false,
                        googleEmail: null,
                    });
                }
            } catch (error) {
                setGoogleStatus({
                    isConnected: false,
                    googleEmail: null,
                });
            }
        };

        checkGoogleStatus();
    }, [user]);


    const isToday = (date: Date) =>
        date.toDateString() === new Date().toDateString();

    const getWeekDays = (date: Date) => {
        const week = [];
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay());
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            week.push(d);
        }
        return week;
    };

    const weekDaysArray = getWeekDays(currentDate);

    const navigate = (dir: 'prev' | 'next') => {
        const d = new Date(currentDate);

        if (viewMode === 'week') {
            d.setDate(d.getDate() + (dir === 'next' ? 7 : -7));
        }

        if (viewMode === 'day') {
            d.setDate(d.getDate() + (dir === 'next' ? 1 : -1));
        }

        if (viewMode === 'month') {
            d.setMonth(d.getMonth() + (dir === 'next' ? 1 : -1));
        }

        setCurrentDate(d);
    };


    const getAppointmentsForTimeSlot = (date: Date, time: string) => {
        const dateStr = date.toISOString().split('T')[0];
        return appointments.filter(
            (a) => a.date === dateStr && a.time === time
        );
    };

    const createQuickMeeting = (date: Date, time: string) => {
        setSelectedDate(date);
        setSelectedTimeSlot(time);
        setMeetingForm({
            ...meetingForm,
            date: date.toISOString().split('T')[0],
            time,
        });
        setShowNewMeeting(true);
    };

    const getTypeIcon = (type: string) => {
        if (type === 'meet') return <Video className="h-4 w-4 text-sky-600" />;
        if (type === 'call')
            return <Phone className="h-4 w-4 text-emerald-600" />;
        if (type === 'presential')
            return <MapPin className="h-4 w-4 text-purple-600" />;
        return <CalendarIcon className="h-4 w-4 text-sky-600" />;
    };

    const getStatusBadge = (status: string) => {
        if (status === 'confirmed')
            return (
                <Badge className="bg-emerald-100 text-emerald-800">
                    Confirmado
                </Badge>
            );
        if (status === 'pending')
            return (
                <Badge className="bg-amber-100 text-amber-800">Pendente</Badge>
            );
        if (status === 'completed')
            return <Badge className="bg-sky-100 text-sky-800">Concluído</Badge>;
        return <Badge variant="secondary">{status}</Badge>;
    };

    const handleCreateMeeting = async () => {
        
  if (!meetingForm.date || !meetingForm.time || !meetingForm.title) return;

  const startDate = new Date(`${meetingForm.date}T${meetingForm.time}:00`);
const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1h

  if (meetingForm.addToCalendar && user?.email) {
    const res = await fetch('/api/google/create-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
  title: meetingForm.title,
  description: meetingForm.description,
  start: startDate.toISOString(),
  end: endDate.toISOString(),
  attendees: meetingForm.attendees
    ? meetingForm.attendees.split(',').map(e => e.trim())
    : [],
  userEmail: user.email,
}),

    });

    const data = await res.json();

    if (!res.ok) {
      console.error("ERRO REAL:", data);
      alert(data.details || data.error);
      return;
    }

    console.log("Evento criado:", data);
  }

  setShowNewMeeting(false);
};

    const loadEvents = async () => {
        if (!user?.email) return;

        setIsLoadingEvents(true);

        const res = await fetch(
            `/api/google/get-events?email=${user.email}&startDate=${currentDate.toISOString()}`
        );

        const data = await res.json();

        if (data.success) {
            setAppointments(data.events);
        }

        setIsLoadingEvents(false);
    };

    useEffect(() => {
        loadEvents();
    }, [currentDate, viewMode]);


    return (
        <div className="flex-1 space-y-6 p-8 pt-6 bg-gradient-to-br from-sky-50 via-white to-cyan-100 min-h-screen">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-sky-900">
                        Agenda Google Meet
                    </h2>
                    <p className="text-sky-700">
                        Gerencie reuniões com integração completa
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {googleStatus.isConnected ? (
                        <div className="flex items-center gap-2 bg-sky-50 px-3 py-2 rounded-lg border">
                            <Link className="h-4 w-4 text-sky-600" />
                            <span className="text-sm text-sky-800">
                                {googleStatus.googleEmail}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={async () => {
                                    await fetch('/api/google/disconnect', { method: 'POST' });
                                    setGoogleStatus({ isConnected: false, googleEmail: null });
                                }}
                            >
                                <Link2Off className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-sky-200 text-sky-700"
                            onClick={() => {
                                window.location.href = '/api/google/login';
                            }}
                        >
                            Conectar Google
                        </Button>
                    )}



                    <Button
                        className="bg-sky-600 hover:bg-sky-700 text-white"
                        onClick={() => setShowNewMeeting(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Reunião
                    </Button>
                </div>
            </div>

            {/* NAVEGAÇÃO */}
            <Card className="border-sky-200">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('prev')}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h3 className="font-semibold text-sky-900">


                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('next')}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        {isLoadingEvents && (
                            <div className="flex items-center gap-2 text-sm text-sky-700">
                                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-sky-600" />
                                Carregando...
                            </div>
                        )}
                    </div>

                    <div className="flex bg-white border rounded-lg">
                        {['month', 'week', 'day'].map((mode) => (
                            <Button
                                key={mode}
                                variant={
                                    viewMode === mode ? 'default' : 'ghost'
                                }
                                className={
                                    viewMode === mode
                                        ? 'bg-sky-600 text-white'
                                        : 'text-sky-700'
                                }
                                onClick={() => setViewMode(mode as any)}
                            >
                                {mode === 'month'
                                    ? 'Mês'
                                    : mode === 'week'
                                        ? 'Semana'
                                        : 'Dia'}
                            </Button>
                        ))}
                    </div>
                </CardHeader>
            </Card>

            {viewMode === 'month' &&
                currentDate.toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                })}

            {viewMode === 'week' &&
                `Semana de ${weekDaysArray[0].toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                })}`}

            {viewMode === 'day' &&
                currentDate.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                })}

            {viewMode === 'day' && (
                <Card className="border-sky-200">
                    <CardContent className="p-0">
                        {timeSlots.map((time) => {
                            const items = getAppointmentsForTimeSlot(currentDate, time);

                            return (
                                <div
                                    key={time}
                                    className="flex border-b hover:bg-sky-50"
                                    onClick={() => createQuickMeeting(currentDate, time)}
                                >
                                    <div className="w-24 p-3 bg-sky-50 text-sm text-sky-700">
                                        {time}
                                    </div>

                                    <div className="flex-1 p-2 min-h-[60px]">
                                        {items.map((appointment) => (
                                            <div
                                                key={appointment.id}
                                                className="bg-sky-600 text-white text-xs p-2 rounded mb-1"
                                            >
                                                {appointment.client}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}
            {viewMode === 'month' && (
                <Card className="border-sky-200">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-7 gap-2">
                            {weekDays.map((d) => (
                                <div
                                    key={d}
                                    className="text-center text-sm font-medium text-sky-700"
                                >
                                    {d}
                                </div>
                            ))}

                            {Array.from({ length: 42 }).map((_, i) => {
                                const firstDay = new Date(
                                    currentDate.getFullYear(),
                                    currentDate.getMonth(),
                                    1
                                );
                                const startDay = firstDay.getDay();
                                const day = i - startDay + 1;

                                const date = new Date(
                                    currentDate.getFullYear(),
                                    currentDate.getMonth(),
                                    day
                                );

                                if (day < 1 || day > new Date(
                                    currentDate.getFullYear(),
                                    currentDate.getMonth() + 1,
                                    0
                                ).getDate()) {
                                    return <div key={i} />;
                                }

                                return (
                                    <div
                                        key={i}
                                        className={`border rounded p-2 text-sm cursor-pointer ${isToday(date) ? 'bg-sky-100' : ''
                                            }`}
                                        onClick={() => {
                                            setCurrentDate(date);
                                            setViewMode('day');
                                        }}
                                    >
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
            {/* VISÃO SEMANAL */}
            {viewMode === 'week' && (
                <Card className="border-sky-200">
                    <CardContent className="p-0">
                        <div className="grid grid-cols-8 border-b">
                            <div className="p-4 border-r bg-sky-50 text-sm font-medium text-sky-700">
                                Horário
                            </div>
                            {weekDaysArray.map((day, index) => (
                                <div
                                    key={day.toISOString()}
                                    className={`p-4 text-center border-r ${isToday(day) ? 'bg-sky-100' : ''
                                        }`}
                                >
                                    <div className="text-sm text-sky-700">
                                        {weekDays[index]}
                                    </div>
                                    <div
                                        className={`text-lg font-semibold ${isToday(day)
                                            ? 'text-sky-700'
                                            : 'text-sky-900'
                                            }`}
                                    >
                                        {day.getDate()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="max-h-[600px] overflow-y-auto">
                            {timeSlots.map((time) => (
                                <div
                                    key={time}
                                    className="grid grid-cols-8 border-b hover:bg-sky-50"
                                >
                                    <div className="p-3 border-r bg-sky-50 text-sm text-sky-700 font-medium">
                                        {time}
                                    </div>

                                    {weekDaysArray.map((day) => {
                                        const items =
                                            getAppointmentsForTimeSlot(
                                                day,
                                                time
                                            );
                                        return (
                                            <div
                                                key={`${day.toISOString()}-${time}`}
                                                className="p-1 border-r min-h-[60px] cursor-pointer hover:bg-sky-100"
                                                onClick={() =>
                                                    createQuickMeeting(
                                                        day,
                                                        time
                                                    )
                                                }
                                            >
                                                {items.map((appointment) => (
                                                    <div
                                                        key={appointment.id}
                                                        className="bg-sky-600 text-white text-xs p-2 rounded mb-1 hover:bg-sky-700"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedAppointment(
                                                                appointment
                                                            );
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            {getTypeIcon(
                                                                appointment.type
                                                            )}
                                                            <span className="truncate">
                                                                {
                                                                    appointment.client
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {showNewMeeting && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Nova Reunião</h3>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <input
                                type="text"
                                placeholder="Título da reunião"
                                className="w-full border rounded px-3 py-2"
                                value={meetingForm.title}
                                onChange={(e) =>
                                    setMeetingForm({ ...meetingForm, title: e.target.value })
                                }
                            />

                            <input
                                type="date"
                                className="w-full border rounded px-3 py-2"
                                value={meetingForm.date}
                                onChange={(e) =>
                                    setMeetingForm({ ...meetingForm, date: e.target.value })
                                }
                            />

                            <select
                                className="w-full border rounded px-3 py-2"
                                value={meetingForm.time}
                                onChange={(e) =>
                                    setMeetingForm({ ...meetingForm, time: e.target.value })
                                }
                            >
                                <option value="">Horário</option>
                                {timeSlots.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowNewMeeting(false)}
                                >
                                    Cancelar
                                </Button>

                                <Button
                                    className="bg-sky-600 text-white"
                                    onClick={handleCreateMeeting}
                                >
                                    Salvar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

        </div>
    );
}
