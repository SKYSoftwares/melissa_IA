import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audioUrl = formData.get('audioUrl');

        if (!audioUrl || typeof audioUrl !== 'string') {
            return NextResponse.json(
                { ok: false, error: 'audioUrl não informado.' },
                { status: 400 }
            );
        }

        // 1) Baixa o arquivo do Firebase
        const fileResp = await fetch(audioUrl);
        if (!fileResp.ok) {
            return NextResponse.json(
                { ok: false, error: 'Falha ao baixar o áudio.' },
                { status: 400 }
            );
        }

        const arrayBuffer = await fileResp.arrayBuffer();

        // 2) Cria um File a partir do buffer
        const file = new File([arrayBuffer], 'audio.ogg', {
            type: 'audio/ogg',
        });

        // 3) Manda pra OpenAI transcrever
        const transcription = await openai.audio.transcriptions.create({
            file,
            model: 'whisper-1',
            language: 'pt',
        });

        return NextResponse.json({
            ok: true,
            text: transcription.text,
        });
    } catch (err) {
        console.error('Erro ao transcrever áudio:', err);
        return NextResponse.json(
            { ok: false, error: 'Erro ao transcrever áudio.' },
            { status: 500 }
        );
    }
}
