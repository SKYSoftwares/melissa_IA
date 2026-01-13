export function formatBRPhone(raw?: string | null): string {
    if (!raw) return '';
    const digits = String(raw).replace(/\D/g, '');

    let rest = digits;
    let prefix = '';
    if (digits.startsWith('55')) {
        prefix = '+55 ';
        rest = digits.slice(2);
    }

    if (rest.length === 11) {
        const ddd = rest.slice(0, 2);
        const num = rest.slice(2);
        return `${prefix}(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
    }
    if (rest.length === 10) {
        const ddd = rest.slice(0, 2);
        const num = rest.slice(2);
        return `${prefix}(${ddd}) ${num.slice(0, 4)}-${num.slice(4)}`;
    }
    if (rest.length === 9)
        return `${prefix}${rest.slice(0, 5)}-${rest.slice(5)}`;
    if (rest.length === 8)
        return `${prefix}${rest.slice(0, 4)}-${rest.slice(4)}`;

    if (digits.length >= 12 && digits.startsWith('55')) return `+${digits}`;
    return digits;
}
