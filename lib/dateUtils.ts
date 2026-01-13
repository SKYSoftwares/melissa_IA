import { DateTime } from "luxon";

/**
 * Utilitários para manipulação de datas usando Luxon
 */

/**
 * Converte uma string de data para DateTime do Luxon
 * @param dateString - String de data em formato ISO ou outro formato válido
 * @returns DateTime do Luxon ou null se inválido
 */
export function parseDate(dateString: string): DateTime | null {
  try {
    const date = DateTime.fromISO(dateString);
    return date.isValid ? date : null;
  } catch {
    return null;
  }
}

/**
 * Converte uma DateTime do Luxon para Date nativo do JavaScript
 * @param luxonDate - DateTime do Luxon
 * @returns Date nativo ou null se inválido
 */
export function luxonToJSDate(luxonDate: DateTime): Date | null {
  try {
    return luxonDate.isValid ? luxonDate.toJSDate() : null;
  } catch {
    return null;
  }
}

/**
 * Formata uma data para exibição em português brasileiro
 * @param date - Date nativo ou DateTime do Luxon
 * @param format - Formato desejado (opcional)
 * @returns String formatada
 */
export function formatDateForDisplay(
  date: Date | DateTime,
  format?: string
): string {
  try {
    const luxonDate =
      date instanceof DateTime ? date : DateTime.fromJSDate(date);
    if (!luxonDate.isValid) return "Data inválida";

    return format
      ? luxonDate.toFormat(format)
      : luxonDate.toLocaleString(DateTime.DATETIME_MED);
  } catch {
    return "Data inválida";
  }
}

/**
 * Cria uma DateTime para agendamento preservando o horário local do usuário
 * @param dateString - String de data/hora do input do usuário
 * @returns DateTime do Luxon ou null se inválido
 */
export function createLocalScheduleDateTime(
  dateString: string
): DateTime | null {
  try {
    // Primeiro tenta parsear como ISO sem especificar fuso horário
    let date = DateTime.fromISO(dateString);

    // Se não funcionar, tenta parsear como formato local
    if (!date.isValid) {
      date = DateTime.fromFormat(dateString, "yyyy-MM-dd'T'HH:mm");
    }

    // Se ainda não funcionar, tenta parsear como Date nativo e converter
    if (!date.isValid) {
      const jsDate = new Date(dateString);
      if (!isNaN(jsDate.getTime())) {
        date = DateTime.fromJSDate(jsDate);
      }
    }

    return date.isValid ? date : null;
  } catch {
    return null;
  }
}

/**
 * Cria uma DateTime para agendamento com validação de fuso horário
 * @param dateString - String de data/hora
 * @param timezone - Fuso horário (padrão: 'America/Sao_Paulo')
 * @returns DateTime do Luxon ou null se inválido
 */
export function createScheduleDateTime(
  dateString: string,
  timezone: string = "America/Sao_Paulo"
): DateTime | null {
  try {
    // Primeiro tenta parsear como ISO com fuso horário específico
    let date = DateTime.fromISO(dateString, { zone: timezone });

    // Se não funcionar, tenta parsear como local e depois converter para o fuso desejado
    if (!date.isValid) {
      date = DateTime.fromISO(dateString).setZone(timezone);
    }

    // Se ainda não funcionar, tenta parsear como string simples e assumir fuso local
    if (!date.isValid) {
      date = DateTime.fromFormat(dateString, "yyyy-MM-dd'T'HH:mm", {
        zone: timezone,
      });
    }

    return date.isValid ? date : null;
  } catch {
    return null;
  }
}

/**
 * Valida se uma data de agendamento é válida (não pode ser no passado)
 * @param dateString - String de data/hora
 * @returns true se válida, false caso contrário
 */
export function isValidScheduleDate(dateString: string): boolean {
  try {
    const scheduleDate = DateTime.fromISO(dateString);
    const now = DateTime.now();

    return scheduleDate.isValid && scheduleDate > now;
  } catch {
    return false;
  }
}

/**
 * Converte uma DateTime para string ISO para envio à API
 * @param luxonDate - DateTime do Luxon
 * @returns String ISO ou null se inválido
 */
export function toISOString(luxonDate: DateTime): string | null {
  try {
    return luxonDate.isValid ? luxonDate.toISO() : null;
  } catch {
    return null;
  }
}

/**
 * Converte uma data UTC do banco para exibição no fuso horário local
 * @param utcDateString - String de data UTC do banco
 * @returns String formatada para exibição
 */
export function formatUTCToLocal(utcDateString: string): string {
  try {
    const utcDate = DateTime.fromISO(utcDateString, { zone: "utc" });
    if (!utcDate.isValid) return "Data inválida";

    // Converte para o fuso horário local
    const localDate = utcDate.toLocal();
    return localDate.toLocaleString(DateTime.DATETIME_MED);
  } catch {
    return "Data inválida";
  }
}

/**
 * Converte uma data UTC do banco para exibição com formato específico
 * @param utcDateString - String de data UTC do banco
 * @param format - Formato desejado
 * @returns String formatada para exibição
 */
export function formatUTCToLocalWithFormat(
  utcDateString: string,
  format: string
): string {
  try {
    const utcDate = DateTime.fromISO(utcDateString, { zone: "utc" });
    if (!utcDate.isValid) return "Data inválida";

    // Converte para o fuso horário local
    const localDate = utcDate.toLocal();
    return localDate.toFormat(format);
  } catch {
    return "Data inválida";
  }
}
