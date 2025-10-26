import { google } from 'googleapis';

// Authenticate with Google Sheets
const authenticateGoogleSheets = () => {
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
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/spreadsheets'
    ],
  });

  return google.sheets({ version: 'v4', auth });
};

// Fetch room data from Google Sheets
export const fetchRoomDataFromSheet = async () => {
  try {
    console.log('Fetching room data from Google Sheets...');
    const sheets = authenticateGoogleSheets();
    const spreadsheetId = process.env.SETTINGS_SHEET_ID;
    const sheetName = process.env.SETTINGS_SHEET_NAME || 'Settings';

    console.log(`Using spreadsheet ID: ${spreadsheetId}`);
    console.log(`Using sheet name: ${sheetName}`);

    if (!spreadsheetId) {
      throw new Error('SETTINGS_SHEET_ID is not set in environment variables');
    }

    // Fetch rooms data - columns A (field name), B (capacity), C (image url), D (prices), E (calendar ID)
    const range = `${sheetName}!A:E`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log('No data found in settings sheet');
      return [];
    }

    console.log(`Found ${rows.length} rows in settings sheet`);

    const rooms = [];
    let isRoomSection = false;

    for (let i = 0; i < rows.length; i++) {
      const field = rows[i][0];
      const capacity = rows[i][1];
      const imageUrl = rows[i][2];
      const price = rows[i][3];
      const calendarId = rows[i][4];

      // Check if we're in the Rooms section
      if (field === 'Rooms') {
        console.log('Found Rooms section at row', i + 1);
        isRoomSection = true;
        continue;
      }

      // If we're in the room section and the field starts with "Room"
      if (isRoomSection && field && field.toString().toLowerCase().startsWith('room')) {
        const roomNumber = field.match(/\d+/)?.[0]; // Extract room number

        if (roomNumber) {
          const room = {
            id: roomNumber,
            name: field.trim(),
            capacity: parseInt(capacity) || 2,
            imageUrl: imageUrl || '',
            price: parseInt(price) || 0,
            calendarId: calendarId || '',
            displayName: `${field.trim()} (${capacity} Guests)` // For dropdown display
          };
          rooms.push(room);
          console.log(`Added room: ${field.trim()} - Capacity: ${capacity}, Image URL: ${imageUrl ? imageUrl.substring(0, 30) + '...' : 'None'}, Price: ${price}, Calendar ID: ${calendarId ? calendarId.substring(0, 20) + '...' : 'None'}`);
        }
      }

      // Stop if we reach another section
      if (isRoomSection && field && field.toString().match(/^[A-Z]/)) {
        const nextSection = field.toString().trim();
        // Check if this is a new section (not a room)
        if (!nextSection.toLowerCase().startsWith('room')) {
          console.log(`Reached end of Rooms section at row ${i + 1}`);
          break;
        }
      }
    }

    console.log(`✓ Successfully fetched ${rooms.length} rooms from Google Sheets`);
    return rooms;

  } catch (error) {
    console.error('✗ Error fetching room data from Google Sheets:', error.message);
    console.error('Full error:', error);
    throw new Error(`Failed to fetch room data: ${error.message}`);
  }
};

// Get room calendar IDs mapped by room number
export const getRoomCalendarIds = async () => {
  try {
    console.log('Fetching room calendar IDs...');
    const rooms = await fetchRoomDataFromSheet();
    const calendarIds = {};

    rooms.forEach(room => {
      if (room.calendarId) {
        calendarIds[room.id] = room.calendarId;
        console.log(`Room ${room.id} calendar ID: ${room.calendarId.substring(0, 20)}...`);
      } else {
        console.warn(`⚠ Room ${room.id} has no calendar ID`);
      }
    });

    if (Object.keys(calendarIds).length === 0) {
      console.warn('⚠ No calendar IDs found in Google Sheets, falling back to env variables');
      const fallback = {
        '1': process.env.ROOM_1_CALENDAR_ID,
        '2': process.env.ROOM_2_CALENDAR_ID,
        '3': process.env.ROOM_3_CALENDAR_ID
      };
      console.log('Using fallback calendar IDs from env');
      return fallback;
    }

    console.log(`✓ Successfully fetched ${Object.keys(calendarIds).length} calendar IDs`);
    return calendarIds;

  } catch (error) {
    console.error('✗ Error fetching room calendar IDs:', error.message);
    console.log('Falling back to environment variables for calendar IDs');
    // Fallback to environment variables if sheet fetch fails
    return {
      '1': process.env.ROOM_1_CALENDAR_ID,
      '2': process.env.ROOM_2_CALENDAR_ID,
      '3': process.env.ROOM_3_CALENDAR_ID
    };
  }
};

export default {
  fetchRoomDataFromSheet,
  getRoomCalendarIds
};