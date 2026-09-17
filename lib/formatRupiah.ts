/**
 * Format angka ke mata uang Rupiah Indonesia.
 *
 * Contoh:
 *   formatRupiah(1500)        → "Rp1.500"
 *   formatRupiah(1500, true)  → "Rp1.500,00"
 *   formatRupiah(0)           → "Rp0"
 *   formatRupiah(-250000)     → "-Rp250.000"
 *   formatRupiah(1500000.5)  → "Rp1.500.000,5"
 */
export function formatRupiah(
  amount: number | string | null | undefined,
  decimals = false,
): string {
  if (amount === null || amount === undefined) {
    return "Rp0";
  }

  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    return "Rp0";
  }

  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  const [whole, fraction] = String(abs).split(".");
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  if (decimals) {
    const frac = fraction ?? "00";
    const paddedFraction = frac.length >= 2 ? frac.slice(0, 2) : frac.padEnd(2, "0");
    return `${sign}Rp${formattedWhole},${paddedFraction}`;
  }

  return `${sign}Rp${formattedWhole}`;
}
