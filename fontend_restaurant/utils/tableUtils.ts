/**
 * Format table code to friendly name (e.g. VIP-Q1-2-1 -> Bàn VIP 2-1 or VIP Table 2-1)
 */
export function formatTableCode(tableCode: string | undefined, language: string = 'vi', short: boolean = false): string {
  if (!tableCode) return '';
  const parts = tableCode.split('-');
  if (parts.length >= 4) {
    const isVip = parts[0].toUpperCase() === 'VIP';
    const capacity = parts[2];
    const index = parts[3];
    if (language === 'vi') {
      if (short) {
        return isVip ? `VIP ${capacity}-${index}` : `Thường ${capacity}-${index}`;
      }
      return isVip ? `Bàn VIP ${capacity}-${index}` : `Bàn Thường ${capacity}-${index}`;
    } else {
      if (short) {
        return isVip ? `VIP ${capacity}-${index}` : `Std ${capacity}-${index}`;
      }
      return isVip ? `VIP Table ${capacity}-${index}` : `Standard Table ${capacity}-${index}`;
    }
  }
  // If it doesn't match standard pattern, clean up any branch code
  if (tableCode.startsWith('VIP-')) {
    const suffix = tableCode.substring(4);
    if (short) return `VIP ${suffix}`;
    return language === 'vi' ? `Bàn VIP ${suffix}` : `VIP Table ${suffix}`;
  }
  if (tableCode.startsWith('STD-')) {
    const suffix = tableCode.substring(4);
    if (short) return language === 'vi' ? `Thường ${suffix}` : `Std ${suffix}`;
    return language === 'vi' ? `Bàn Thường ${suffix}` : `Standard Table ${suffix}`;
  }
  return tableCode;
}
