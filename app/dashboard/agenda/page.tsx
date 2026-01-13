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
        d.setDate(currentDate.getDate() + (dir === 'next' ? 7 : -7));
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
                        <div className="flex items-center gap-2 bg-sky-50 px-3 py-2 rounded-lg border border-sky-200">
                            <Link className="h-4 w-4 text-sky-600" />
                            <span className="text-sm text-sky-800">
                                {googleStatus.googleEmail}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                            >
                                <Link2Off className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-sky-200 text-sky-700"
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
                            {currentDate.toLocaleDateString('pt-BR', {
                                month: 'long',
                                year: 'numeric',
                            })}
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
                                    className={`p-4 text-center border-r ${
                                        isToday(day) ? 'bg-sky-100' : ''
                                    }`}
                                >
                                    <div className="text-sm text-sky-700">
                                        {weekDays[index]}
                                    </div>
                                    <div
                                        className={`text-lg font-semibold ${
                                            isToday(day)
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
        </div>
    );
}
