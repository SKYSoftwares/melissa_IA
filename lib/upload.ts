import { v4 as uuidv4 } from 'uuid';
import { bucket } from './firebaseAdmin';

/** Remove prefixo data URL se vier no formato "data:...;base64,XXXX" */
function stripDataUrl(b64: string): string {
    return b64.startsWith('data:') ? b64.split(',')[1] : b64;
}

/** Normaliza MIME removendo parâmetros (ex.: "; codecs=opus") e mapeia audio/opus -> audio/ogg */
function normalizeMime(m?: string): string {
    const clean = (m || '').split(';')[0].trim().toLowerCase();
    if (!clean) return 'application/octet-stream';
    if (clean === 'audio/opus') return 'audio/ogg';
    return clean;
}

/** Garante um caminho/arquivo seguro */
function safeObjectPath(p: string): string {
    return p.replace(/[^a-z0-9/_\-.]/gi, '_');
}

/**
 * Sobe um base64 pro Firebase Storage e retorna uma URL pública (com token).
 * @param base64     Conteúdo base64 (aceita com ou sem prefixo data:)
 * @param objectPath Caminho/arquivo no bucket (ex.: "whatsapp/<sessao>/<arquivo>.ogg")
 * @param contentType MIME type (ex.: "audio/ogg", "image/jpeg")
 */
export async function uploadBase64ToFirebase(
    base64: string,
    objectPath: string,
    contentType: string
): Promise<string> {
    // 1) Limpa base64 e transforma em Buffer binário
    const cleanB64 = stripDataUrl(base64);
    const buffer = Buffer.from(cleanB64, 'base64');

    // 2) Sanity check — evita salvar arquivo vazio/corrompido
    if (buffer.byteLength < 1024) {
        throw new Error(
            `Conteúdo muito pequeno (${buffer.byteLength} bytes). Base64 inválido ou corrompido.`
        );
    }

    // 3) Normaliza MIME e caminho
    const mime = normalizeMime(contentType);
    const path = safeObjectPath(objectPath);

    // 4) Gera token para URL pública
    const token = uuidv4();

    // 5) Salva no Storage — **sem gzip** para mídia binária!
    const file = bucket.file(path);
    await file.save(buffer, {
        resumable: false,
        validation: 'md5',
        // NÃO usar gzip para áudio/vídeo/imagem
        // gzip: false, // (omitido = false)
        metadata: {
            contentType: mime,
            cacheControl: 'public, max-age=31536000, immutable',
            // Campo necessário para URLs com token do Firebase Storage
            metadata: { firebaseStorageDownloadTokens: token },
        },
    });

    // 6) Retorna URL pública (com token)
    return `https://firebasestorage.googleapis.com/v0/b/${
        bucket.name
    }/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}
