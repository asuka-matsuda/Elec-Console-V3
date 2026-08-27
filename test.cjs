const formatDateTimeLocal = (dateStr, isAllDay) => {
  if (!dateStr) return '';
  if (isAllDay) {
    return dateStr.split('T')[0];
  }
  if (dateStr.includes('T')) {
    return dateStr.substring(0, 16);
  }
  return dateStr + 'T09:00';
};
console.log("allDay:", formatDateTimeLocal("2026-08-27", true));
console.log("time:", formatDateTimeLocal("2026-08-27T10:30:00+09:00", false));
console.log("allDay string but not allDay:", formatDateTimeLocal("2026-08-27", false));