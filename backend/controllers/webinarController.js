import { google } from 'googleapis';
import Settings from '../models/Settings.js';
import { sendWebinarConfirmationEmail } from '../services/emailService.js';

// Helper to clean Settings values (handles the [object Object] issue from Sheets)
const getSettingValue = (setting) => {
  if (!setting) return null;
  if (typeof setting === 'object') return setting.value;
  return setting;
};

const webinarController = {
  
  // 1. REGISTER USER & SEND EMAIL
  register: async (req, res) => {
    try {
      // --- A. Validate Input ---
      const { name, email, phone, webinarDate } = req.body;
      if (!name || !email || !phone) {
        return res.status(400).json({ success: false, message: 'Name, Email, and Phone are required' });
      }

      // --- B. Save to Google Sheet ---
      const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      // We save the "webinarDate" string the user saw on the screen (e.g. "Sunday... @ 2pm")
      const values = [[ name, email, phone, webinarDate || 'Upcoming', timestamp ]];

      // Auth for Sheets
      const credentials = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
      };

      const auth = new google.auth.GoogleAuth({
        credentials, 
        scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/calendar.readonly']
      });

      const sheets = google.sheets({ version: 'v4', auth });

      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.WEBINAR_REGISTRATION_SHEET_ID,
        range: 'Sheet1!A:E', 
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values }
      });

      // --- C. Fetch Event Details for Email (Link lookup) ---
      // We re-fetch the link to ensure it's 100% accurate at the moment of signup
      let meetLink = null;
      let emailWebinarDate = webinarDate || 'Upcoming';

      try {
        const settingsDoc = await Settings.getOrCreate();
        const calendarId = getSettingValue(settingsDoc.settings['Webinar Calendar ID']);
        const bufferVal = getSettingValue(settingsDoc.settings['Webinar Buffer Hours']);
        const BUFFER_HOURS = parseFloat(bufferVal) || 0;
        
        // Only fetch if we have a valid Calendar ID
        if (calendarId) {
          const calendar = google.calendar({ version: 'v3', auth });
          
          const response = await calendar.events.list({
            calendarId: calendarId.trim(),
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
          });

          const events = response.data.items || [];
          
          // Calculate Buffer Cutoff (Now + Buffer Hours)
          const cutoffTime = new Date(Date.now() + BUFFER_HOURS * 60 * 60 * 1000);

          // Find the correct upcoming event
          const selectedEvent = events.find(event => {
            const start = new Date(event.start.dateTime || event.start.date);
            return start > cutoffTime;
          });

          if (selectedEvent) {
             // Extract Link
             meetLink = selectedEvent.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri 
                        || selectedEvent.htmlLink;
             
             // Extract clean date for email (overwriting the client-side string if needed)
             const startDateTime = new Date(selectedEvent.start.dateTime || selectedEvent.start.date);
             emailWebinarDate = startDateTime.toLocaleDateString('en-IN', { 
               weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
               hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
             });
          }
        }
        
        const webinarTitle = getSettingValue(settingsDoc.settings['Webinar Title']) || 'Upcoming Webinar';

        // --- D. Send Email ---
        // We use .catch() so email errors don't crash the http response
        sendWebinarConfirmationEmail(
          email, 
          name, 
          webinarTitle, 
          emailWebinarDate, 
          meetLink
        ).catch(err => console.error("Background email failed:", err.message));

      } catch (emailLogicError) {
        console.error("Error preparing email data:", emailLogicError.message);
        // We proceed to respond "Success" because the registration (Step B) saved okay.
      }

      res.status(200).json({ success: true, message: 'Registration successful! Check your email.' });

    } catch (error) {
      console.error('Webinar Registration Error:', error);
      res.status(500).json({ success: false, message: 'Registration failed.' });
    }
  },

  // 2. GET UPCOMING WEBINAR (For Frontend Display)
  getUpcoming: async (req, res) => {
    try {
      const settingsDoc = await Settings.getOrCreate();
      
      const calendarId = getSettingValue(settingsDoc.settings['Webinar Calendar ID']);
      const bufferVal = getSettingValue(settingsDoc.settings['Webinar Buffer Hours']);
      const BUFFER_HOURS = parseFloat(bufferVal) || 0;

      if (!calendarId) {
        return res.status(404).json({ success: false, message: 'Calendar ID not configured' });
      }

      // Auth
      const credentials = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
      };

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/calendar.readonly']
      });

      const calendar = google.calendar({ version: 'v3', auth });

      // Fetch batch of events
      const response = await calendar.events.list({
        calendarId: calendarId.trim(),
        timeMin: new Date().toISOString(),
        maxResults: 10, 
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];

      // Filter by Buffer Logic
      const cutoffTime = new Date(Date.now() + BUFFER_HOURS * 60 * 60 * 1000);
      
      const selectedEvent = events.find(event => {
        const start = new Date(event.start.dateTime || event.start.date);
        return start > cutoffTime;
      });

      if (selectedEvent) {
        const startDateTime = new Date(selectedEvent.start.dateTime || selectedEvent.start.date);
        
        return res.status(200).json({
          success: true,
          data: {
            title: selectedEvent.summary,
            date: startDateTime.toLocaleDateString('en-IN', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata'
            }),
            time: startDateTime.toLocaleTimeString('en-IN', { 
                hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
            }),
            fullDate: selectedEvent.start.dateTime,
            meetLink: selectedEvent.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri 
                      || selectedEvent.htmlLink,
            description: selectedEvent.description
          }
        });
      }

      return res.status(200).json({ success: true, data: null, message: 'No upcoming events found' });

    } catch (error) {
      console.error('Fetch Calendar Error:', error.message);
      res.status(500).json({ success: false, message: 'Failed to fetch webinar' });
    }
  }
};

export default webinarController;