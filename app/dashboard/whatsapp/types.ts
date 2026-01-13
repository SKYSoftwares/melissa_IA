export interface Contact {
    id: string;
    name?: string;
    phone?: string;
    avatarUrl?: string;
}

export interface Tag {
    id: string;
    name: string;
    color: string;
    _count?: {
        contacts: number;
    };
}

export interface LastMessage {
    id: string;
    text?: string;
    timestamp: string;
    direction: 'inbound' | 'outbound';
}

export interface Chat {
    id: string;
    contact?: Contact;
    sessionName: string;
    sessionId: string;
    tags?: Tag[];
    lastMessage?: LastMessage;
    chatId: string;
    archived?: boolean;
}

export interface Message {
    id: string;
    text?: string;
    caption?: string;
    timestamp: string;
    direction: 'inbound' | 'outbound';
    fromType: string;
    channel: string;
    type?: string;
    mediaUrl?: string;
    fileName?: string;
    mediaType?: string;
    body?: string;
    mimetype?: string;
}
