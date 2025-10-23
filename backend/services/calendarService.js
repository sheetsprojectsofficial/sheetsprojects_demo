import { google } from 'googleapis';
import { getRoomCalendarIds } from './roomService.js';

// Cache for room calendar IDs
let ROOM_CALENDAR_IDS = null;

const authenticateGoogleCalendar = () => {
  const credentials = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ],
  });

  return google.calendar({ version: 'v3', auth });
};

/**
 * Get or fetch room calendar IDs
 */
const getRoomCalendarId = async (roomNumber) => {
  console.log(`Getting calendar ID for room ${roomNumber}...`);

  // Fetch calendar IDs from Google Sheets if not cached
  if (!ROOM_CALENDAR_IDS) {
    console.log('Calendar IDs not cached, fetching from Google Sheets...');
    ROOM_CALENDAR_IDS = await getRoomCalendarIds();
  }

  const calendarId = ROOM_CALENDAR_IDS[roomNumber];

  if (!calendarId) {
    console.log(`Calendar ID not found in cache for room ${roomNumber}, refreshing...`);
    // Try to refresh from Google Sheets
    ROOM_CALENDAR_IDS = await getRoomCalendarIds();
    const refreshedId = ROOM_CALENDAR_IDS[roomNumber];
    if (refreshedId) {
      console.log(`✓ Found calendar ID for room ${roomNumber} after refresh`);
    } else {
      console.error(`✗ No calendar ID found for room ${roomNumber} even after refresh`);
    }
    return refreshedId;
  }

  console.log(`✓ Using cached calendar ID for room ${roomNumber}`);
  return calendarId;
};

/**
 * Check if a room is available for the given time slot
 */
export const checkRoomAvailability = async (roomNumber, checkInDateTime, checkOutDateTime) => {
  try {
    const calendarId = await getRoomCalendarId(roomNumber);

    if (!calendarId) {
      throw new Error(`Calendar ID not configured for Room ${roomNumber}`);
    }

    const calendar = authenticateGoogleCalendar();

    // Get events in the time range
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: new Date(checkInDateTime).toISOString(),
      timeMax: new Date(checkOutDateTime).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    // Check for any overlapping events
    const hasConflict = events.some(event => {
      const eventStart = new Date(event.start.dateTime || event.start.date);
      const eventEnd = new Date(event.end.dateTime || event.end.date);
      const requestedStart = new Date(checkInDateTime);
      const requestedEnd = new Date(checkOutDateTime);

      // Check if there's any overlap
      return (requestedStart < eventEnd && requestedEnd > eventStart);
    });

    return {
      available: !hasConflict,
      conflictingEvents: hasConflict ? events : []
    };
  } catch (error) {
    console.error('Error checking room availability:', error);
    throw new Error(`Calendar availability check failed: ${error.message}`);
  }
};

/**
 * Create a booking event in Google Calendar
 */
export const createCalendarEvent = async (bookingData) => {
  try {
    const { roomNumber, name, phone, email, checkInDateTime, checkOutDateTime, aadharNumber, numberOfAdults, adults } = bookingData;
    const calendarId = await getRoomCalendarId(roomNumber);

    if (!calendarId) {
      throw new Error(`Calendar ID not configured for Room ${roomNumber}`);
    }

    const calendar = authenticateGoogleCalendar();

    // Format adults details
    const adultsDetails = adults.map((adult, index) =>
      `  Adult ${index + 1}: ${adult.name} (${adult.gender}, Age: ${adult.age})`
    ).join('\n');

    const event = {
      summary: `Room ${roomNumber} - ${name} (${numberOfAdults} ${numberOfAdults === 1 ? 'Adult' : 'Adults'})`,
      description: `
Booking Details:
- Guest Name: ${name}
- Email: ${email}
- Phone: ${phone}
- Aadhar Number: ${aadharNumber}
- Room Number: ${roomNumber}
- Number of Adults: ${numberOfAdults}

Adults Details:
${adultsDetails}
      `.trim(),
      start: {
        dateTime: new Date(checkInDateTime).toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: new Date(checkOutDateTime).toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      colorId: roomNumber, // Different color for each room
    };

    const response = await calendar.events.insert({
      calendarId: calendarId,
      resource: event,
    });

    return {
      success: true,
      eventId: response.data.id,
      eventLink: response.data.htmlLink
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
};

/**
 * Delete a booking event from Google Calendar
 */
export const deleteCalendarEvent = async (roomNumber, eventId) => {
  try {
    const calendarId = await getRoomCalendarId(roomNumber);

    if (!calendarId) {
      throw new Error(`Calendar ID not configured for Room ${roomNumber}`);
    }

    if (!eventId) {
      console.warn('No event ID provided for deletion');
      return { success: true, message: 'No event to delete' };
    }

    const calendar = authenticateGoogleCalendar();

    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId,
    });

    return {
      success: true,
      message: 'Calendar event deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    // Don't throw error if event doesn't exist
    if (error.code === 404) {
      return { success: true, message: 'Event not found (may have been already deleted)' };
    }
    throw new Error(`Failed to delete calendar event: ${error.message}`);
  }
};

/**
 * Update a booking event in Google Calendar
 */
export const updateCalendarEvent = async (roomNumber, eventId, bookingData) => {
  try {
    // Delete old event and create new one (simpler than updating)
    await deleteCalendarEvent(roomNumber, eventId);
    return await createCalendarEvent(bookingData);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw new Error(`Failed to update calendar event: ${error.message}`);
  }
};

export default {
  checkRoomAvailability,
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent
};
