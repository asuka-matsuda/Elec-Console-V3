const fs = require("fs");
let c = fs.readFileSync("app/components/Portal/Calendar.client.vue", "utf8");
c = c.replace(
  /start: formatDateTimeLocal\(startStr, allDay\),/g,
  "start: formatDateTimeLocal(startStr, allDay) || '',"
);
c = c.replace(
  /end: formatDateTimeLocal\(endStr, allDay\),/g,
  "end: formatDateTimeLocal(endStr, allDay) || '',"
);
c = c.replace(
  /start: formatDateTimeLocal\(eventInfo\.startStr, eventInfo\.allDay\),/g,
  "start: formatDateTimeLocal(eventInfo.startStr, eventInfo.allDay) || '',"
);
c = c.replace(
  /end: formatDateTimeLocal\(eventInfo\.endStr, eventInfo\.allDay\),/g,
  "end: formatDateTimeLocal(eventInfo.endStr, eventInfo.allDay) || '',"
);
fs.writeFileSync("app/components/Portal/Calendar.client.vue", c);