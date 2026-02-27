window.APP_CONFIG = {
  // Cloudflare Worker URL (or any serverless proxy URL) that serves POST /api/character
  apiUrl: "https://REPLACE_WITH_YOUR_WORKER_URL/api/character",

  // Google Form URL (viewform link)
  rsvpFormUrl: "https://docs.google.com/forms/d/e/REPLACE_FORM_ID/viewform",

  // Google Form entry IDs from prefilled link
  rsvpFields: {
    name: "entry.111111111",
    role: "entry.222222222",
    alias: "entry.333333333",
    attendance: "entry.444444444"
  },

  attendanceYesValue: "Yes"
};
