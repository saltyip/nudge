export async function parseTime(timeStr) {
  const chrono = await import('chrono-node');
  const parsedDate = chrono.parseDate(timeStr);
  return parsedDate;
}
