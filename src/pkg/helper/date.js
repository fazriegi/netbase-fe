import dayjs from "dayjs";

/**
 * Format date range label with year-boundary awareness
 * e.g.:
 * - Same year: "27 Mei – 26 Jun 2026"
 * - Different year: "25 Des 2025 – 24 Jan 2026"
 * 
 * @param {string|dayjs.Dayjs} startDate
 * @param {string|dayjs.Dayjs} endDate
 * @returns {string}
 */
export function formatCycleRangeLabel(startDate, endDate) {
  if (!startDate || !endDate) return "";

  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (!start.isValid() || !end.isValid()) return "";

  if (start.year() === end.year()) {
    return `${start.format("D MMM")} – ${end.format("D MMM YYYY")}`;
  }

  return `${start.format("D MMM YYYY")} – ${end.format("D MMM YYYY")}`;
}

/**
 * Get English ordinal suffix for a day number (e.g. 1st, 2nd, 3rd, 4th, 21st, 22nd, 31st)
 * @param {number|string} day
 * @returns {string} e.g. "1st", "2nd", "25th"
 */
export function getOrdinalSuffix(day) {
  const d = Number(day);
  if (isNaN(d)) return `${day}`;

  const remainder100 = d % 100;
  if (remainder100 >= 11 && remainder100 <= 13) {
    return `${d}th`;
  }

  switch (d % 10) {
    case 1:
      return `${d}st`;
    case 2:
      return `${d}nd`;
    case 3:
      return `${d}rd`;
    default:
      return `${d}th`;
  }
}


/**
 * Calculate financial month date range based on cycleStartDay (1-31) and referenceDate.
 * If referenceDate is a month (or day), it returns the cycle corresponding to that month.
 * 
 * @param {number} cycleStartDay - 1 to 31 (default: 1)
 * @param {string|dayjs.Dayjs} referenceDate - Target date/month (default: today)
 * @returns {{ startDate: string, endDate: string, label: string }}
 */
export function getFinancialMonthRange(cycleStartDay = 1, referenceDate = dayjs()) {
  const ref = dayjs(referenceDate).isValid() ? dayjs(referenceDate) : dayjs();
  const day = Number(cycleStartDay) || 1;

  // Case 1: Standard calendar month (cycleStartDay == 1)
  if (day <= 1) {
    const start = ref.startOf("month");
    const end = ref.endOf("month");
    return {
      startDate: start.format("YYYY-MM-DD"),
      endDate: end.format("YYYY-MM-DD"),
      label: formatCycleRangeLabel(start, end),
    };
  }

  // Case 2: Custom cycle (day > 1)
  // For target month (ref), Start Month is previous month, End Month is target month
  // E.g., for June 2026 with cycleStartDay=27:
  // Start: 27 May 2026
  // End: 26 June 2026
  const targetYear = ref.year();
  const targetMonth = ref.month(); // 0-indexed in dayjs

  const prevMonthDate = dayjs(new Date(targetYear, targetMonth - 1, 1));
  const currMonthDate = dayjs(new Date(targetYear, targetMonth, 1));

  // Clamping start day with number of days in previous month
  const daysInPrev = prevMonthDate.daysInMonth();
  const actualStartDay = Math.min(day, daysInPrev);
  const startDate = prevMonthDate.date(actualStartDay);

  // Clamping end day (day - 1) with number of days in current month
  const daysInCurr = currMonthDate.daysInMonth();
  const actualEndDay = Math.min(day - 1, daysInCurr);
  const endDate = currMonthDate.date(actualEndDay);

  return {
    startDate: startDate.format("YYYY-MM-DD"),
    endDate: endDate.format("YYYY-MM-DD"),
    label: formatCycleRangeLabel(startDate, endDate),
  };
}
