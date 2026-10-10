export function formatKanbanDate(timestamp: number | string | null | undefined): string | number {
  if (!timestamp) return 0;
  
  try {
    let ts = typeof timestamp === 'number' ? timestamp : parseInt(timestamp as string, 10);
    // If it's a seconds timestamp (e.g. 1789830692), convert to ms
    if (ts > 0 && ts < 10000000000) {
      ts = ts * 1000;
    }
    const d = new Date(ts);
    if (isNaN(d.getTime())) return 0;
    return d.getTime();
  } catch (e) {
    return 0;
  }
}
