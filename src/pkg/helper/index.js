/**
 * Format number into Indonesian Rupiah currency
 * @param {number} amount - Number to format
 * @param {boolean} isPrivacy - Whether privacy masking is active
 * @param {boolean} withSign - Whether to prefix with + for positive numbers
 * @returns {string} Formatted string
 */
export function formatRupiah(amount, isPrivacy = false, withSign = false) {
    if (amount === undefined || amount === null || amount === "" || isNaN(Number(amount))) {
        return isPrivacy ? "Rp ••••••" : "Rp 0";
    }

    if (isPrivacy) {
        return "Rp ••••••";
    }

    const num = typeof amount === "number" ? amount : parseFloat(amount) || 0;
    const isNegative = num < 0;
    const absVal = Math.abs(num);
    const formatted = new Intl.NumberFormat("id-ID").format(absVal);

    if (withSign && num > 0) {
        return `+Rp ${formatted}`;
    }
    if (isNegative) {
        return `-Rp ${formatted}`;
    }
    return `Rp ${formatted}`;
}