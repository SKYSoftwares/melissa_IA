import crypto from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

type MediaPayload = {
    session: string;
    messageId: string;
    // campos que vêm do seu webhook:
    mimetype: string; // ex: "image/jpeg"
    mediaKey: string; // Base64
    downloadUrl?: string; // URL pública (mmg.whatsapp.net ... .enc)
    directPath?: string; // Path relativo do WA
    localDownloadUrl?: string; // URL do seu WPPConnect (se disponível)
};

const WPP_BASE_URL = process.env.BACKEND_WPP_CONNECT;
const WPP_SECRET = process.env.BACKEND_WPP_CONNECT;

// ---- Utils -------------------------------------------------------------

function getMediaInfoString(mimetype: string): string {
    // Define a “info string” para HKDF conforme o tipo de mídia
    // (padrões do WhatsApp)
    if (mimetype.startsWith('image/')) return 'WhatsApp Image Keys';
    if (mimetype.startsWith('video/')) return 'WhatsApp Video Keys';
    if (mimetype.startsWith('audio/')) return 'WhatsApp Audio Keys';
    // document, application/pdf, etc.
    return 'WhatsApp Document Keys';
}

function hkdf(
    mediaKey: Buffer,
    info: string
): { iv: Buffer; cipherKey: Buffer; macKey: Buffer } {
    const salt = Buffer.alloc(32, 0);

    const okmArrayBuffer = crypto.hkdfSync(
        'sha256',
        mediaKey,
        salt,
        Buffer.from(info, 'utf8'),
        112
    );

    const okm = Buffer.from(okmArrayBuffer);

    const iv = okm.subarray(0, 16);
    const cipherKey = okm.subarray(16, 48);
    const macKey = okm.subarray(48, 80);

    return { iv, cipherKey, macKey };
}

function verifyAndStripMac(
    encFile: Buffer,
    iv: Buffer,
    macKey: Buffer
): Buffer {
    // O arquivo .enc = ciphertext || mac(10 bytes)
    if (encFile.length < 10)
        throw new Error('Arquivo .enc inválido (muito pequeno).');
    const macTag = encFile.subarray(encFile.length - 10);
    const ciphertext = encFile.subarray(0, encFile.length - 10);

    // HMAC-SHA256( macKey, iv || ciphertext ) e compara primeiros 10 bytes
    const h = crypto.createHmac('sha256', macKey);
    h.update(Buffer.concat([iv, ciphertext]));
    const fullMac = h.digest();
    const expectedTag = fullMac.subarray(0, 10);

    if (!crypto.timingSafeEqual(macTag, expectedTag)) {
        throw new Error('MAC inválido ao validar mídia do WhatsApp.');
    }
    return ciphertext;
}

function aesCbcDecrypt(ciphertext: Buffer, iv: Buffer, key: Buffer): Buffer {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);
    // Remover padding PKCS#7
    const pad = decrypted[decrypted.length - 1];
    if (pad <= 0 || pad > 16) return decrypted;
    return decrypted.subarray(0, decrypted.length - pad);
}

function extFromMime(mimetype: string): string {
    const map: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'video/mp4': 'mp4',
        'audio/ogg': 'ogg',
        'audio/mpeg': 'mp3',
        'application/pdf': 'pdf',
    };
    return map[mimetype] || 'bin';
}

async function fetchBuffer(
    url: string,
    headers?: Record<string, string>
): Promise<Buffer> {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Falha ao baixar mídia (${res.status})`);
    const arr = new Uint8Array(await res.arrayBuffer());
    return Buffer.from(arr);
}

async function tryLocalDownload(localUrl: string): Promise<Buffer | null> {
    // Alguns servidores WPPConnect expõem endpoint que já devolve base64.
    // Tentamos entender ambos os formatos:
    const res = await fetch(localUrl, {
        headers: WPP_SECRET
            ? { Authorization: `Bearer ${WPP_SECRET}` }
            : undefined,
    });

    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const j = await res.json().catch(() => null);
        // padrões comuns: { data: "base64..." } ou { result: "base64..." }
        const b64 = j?.data || j?.result || null;
        if (typeof b64 === 'string') return Buffer.from(b64, 'base64');
        return null;
    }

    // Se vier binário direto:
    const arr = new Uint8Array(await res.arrayBuffer());
    return Buffer.from(arr);
}

// ---- Route handler -----------------------------------------------------

export async function POST(req: NextRequest) {
    try {
        console.log('Recebendo requisição de download');

        const body = (await req.json()) as MediaPayload;
        const {
            session,
            messageId,
            mimetype,
            mediaKey,
            downloadUrl,
            localDownloadUrl,
            directPath,
        } = body;

        if (!session || !messageId || !mimetype || !mediaKey) {
            return NextResponse.json(
                { error: 'Parâmetros obrigatórios ausentes.' },
                { status: 400 }
            );
        }

        // 1) Baixar o arquivo .enc
        let encBuf: Buffer | null = null;

        // 1.a) Tenta via localDownloadUrl do WPPConnect (se já entrega base64/enc)
        if (localDownloadUrl) {
            encBuf = await tryLocalDownload(localDownloadUrl);
        }

        // 1.b) Se não veio, tenta URL pública assinada do WA (downloadUrl)
        if (!encBuf && downloadUrl) {
            encBuf = await fetchBuffer(downloadUrl);
        }

        // 1.c) Como fallback, se tiver directPath e seu servidor WPP expõe proxy:
        // muitos setups têm algo como: `${WPP_BASE_URL}/${session}/download-media` via POST { directPath }
        if (!encBuf && directPath) {
            const res = await fetch(
                `${WPP_BASE_URL}/${encodeURIComponent(session)}/download-media`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(WPP_SECRET
                            ? { Authorization: `Bearer ${WPP_SECRET}` }
                            : {}),
                    },
                    body: JSON.stringify({ directPath }),
                }
            );
            if (res.ok) {
                const ct = res.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    const j: any = await res.json().catch(() => null);
                    const b64 = j?.data || j?.result || null;
                    if (typeof b64 === 'string')
                        encBuf = Buffer.from(b64, 'base64');
                } else {
                    encBuf = Buffer.from(
                        new Uint8Array(await res.arrayBuffer())
                    );
                }
            }
        }

        if (!encBuf) {
            return NextResponse.json(
                { error: 'Não foi possível baixar a mídia (.enc).' },
                { status: 502 }
            );
        }

        // 2) Derivar chaves com HKDF
        const info = getMediaInfoString(mimetype);
        const { iv, cipherKey, macKey } = hkdf(
            Buffer.from(mediaKey, 'base64'),
            info
        );

        // 3) Validar MAC e separar ciphertext
        const ciphertext = verifyAndStripMac(encBuf, iv, macKey);

        // 4) Descriptografar AES-256-CBC
        const plain = aesCbcDecrypt(ciphertext, iv, cipherKey);

        // 5) Salvar arquivo descriptografado
        const outDir = join(process.cwd(), 'public', 'whatsapp-media');
        mkdirSync(outDir, { recursive: true });
        const ext = extFromMime(mimetype);
        const fileName = `${messageId}.${ext}`;
        const outPath = join(outDir, fileName);

        // grava o arquivo descriptografado
        writeFileSync(outPath, plain);

        // monte a url pública (Next serve tudo que está em /public)
        const publicUrl = `/whatsapp-media/${fileName}`;

        return NextResponse.json({
            ok: true,
            path: outPath,
            publicUrl,
            bytes: plain.length,
            mimetype,
            messageId,
        });
    } catch (err: any) {
        console.error('Erro ao baixar/decifrar mídia:', err);
        return NextResponse.json(
            { error: err?.message || 'Erro desconhecido' },
            { status: 500 }
        );
    }
}
