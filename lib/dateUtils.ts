export interface BusinessCycle {
  startDate: Date;
  endDate: Date;
  label: string;
}

export function getBusinessCycle(date = new Date()): { startDate: Date; endDate: Date } {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  
  // If before 5th, cycle is previous month 5th to current month 4th
  if (day < 5) {
    const startDate = new Date(year, month - 1, 5, 0, 0, 0);
    const endDate = new Date(year, month, 4, 23, 59, 59);
    return { startDate, endDate };
  }
  
  // If 5th or after, cycle is current month 5th to next month 4th
  const startDate = new Date(year, month, 5, 0, 0, 0);
  const endDate = new Date(year, month + 1, 4, 23, 59, 59);
  return { startDate, endDate };
}

export function getBusinessCycleLabel(startDate: Date): string {
  const month = startDate.toLocaleString('en-US', { month: 'short' });
  const year = startDate.getFullYear();
  return `${month} ${year}`;
}

export function getAllBusinessCycles(fromDate = new Date(2024, 0, 1)): { label: string; startDate: string; endDate: string }[] {
  const cycles = [];
  const now = new Date();
  let current = new Date(fromDate.getFullYear(), fromDate.getMonth(), 5);
  
  while (current <= now) {
    const start = new Date(current);
    const end = new Date(current.getFullYear(), current.getMonth() + 1, 4, 23, 59, 59);
    cycles.push({
      label: getBusinessCycleLabel(start),
      startDate: start.toISOString(),
      endDate: end.toISOString()
    });
    current.setMonth(current.getMonth() + 1);
  }
  
  return cycles.reverse();
}