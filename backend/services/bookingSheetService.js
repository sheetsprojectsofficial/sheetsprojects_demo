import { google } from 'googleapis';

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
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ],
  });

  return google.sheets({ version: 'v4', auth });
};

/**
 * Add a booking to Google Sheets
 */
export const addBookingToSheet = async (bookingData) => {
  try {
    console.log(`Adding booking ${bookingData._id} to Google Sheets...`);
    const sheets = authenticateGoogleSheets();
    const spreadsheetId = process.env.BOOKINGS_SHEET_ID;

    console.log(`Using bookings spreadsheet ID: ${spreadsheetId}`);

    if (!spreadsheetId) {
      throw new Error('BOOKINGS_SHEET_ID is not set in environment variables');
    }

    // Format the booking data as a row
    // Format adults details as "Name (Gender, Age)" separated by semicolons
    const adultsDetails = bookingData.adults.map(adult =>
      `${adult.name} (${adult.gender}, Age: ${adult.age})`
    ).join('; ');

    const row = [
      bookingData._id.toString(),
      bookingData.name,
      bookingData.phone,
      bookingData.email,
      bookingData.address,
      bookingData.aadharNumber,
      bookingData.numberOfAdults.toString(),
      adultsDetails,
      bookingData.roomNumber,
      new Date(bookingData.checkInDateTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      new Date(bookingData.checkOutDateTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      bookingData.status,
      bookingData.googleCalendarEventId || '',
      new Date(bookingData.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    ];

    // Check if sheet has headers, if not create them
    console.log('Ensuring sheet has proper headers...');
    await ensureSheetHeaders(sheets, spreadsheetId);

    // Append the row
    console.log('Appending booking row to sheet...');
    console.log('Row data:', row);
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Bookings!A:N',
      valueInputOption: 'RAW',
      resource: {
        values: [row]
      }
    });

    console.log(`✓ Booking successfully added to sheet at ${response.data.updates.updatedRange}`);

    return {
      success: true,
      updatedRange: response.data.updates.updatedRange
    };
  } catch (error) {
    console.error('✗ Error adding booking to Google Sheets:', error.message);
    console.error('Full error:', error);
    throw new Error(`Failed to add booking to sheet: ${error.message}`);
  }
};

/**
 * Ensure the Bookings sheet has proper headers
 */
const ensureSheetHeaders = async (sheets, spreadsheetId) => {
  try {
    console.log('Checking if Bookings sheet has headers...');
    // Try to get the first row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Bookings!A1:N1'
    });

    const firstRow = response.data.values?.[0];
    console.log('First row:', firstRow);

    // If first row is empty or doesn't have all headers, set them
    if (!firstRow || firstRow.length < 14) {
      console.log('Headers missing or incomplete, creating headers...');
      const headers = [
        'Booking ID',
        'Name',
        'Phone',
        'Email',
        'Address',
        'Aadhar Number',
        'Number of Adults',
        'Adults Details',
        'Room Number',
        'Check-In Date Time',
        'Check-Out Date Time',
        'Status',
        'Calendar Event ID',
        'Created At'
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Bookings!A1:N1',
        valueInputOption: 'RAW',
        resource: {
          values: [headers]
        }
      });

      // Format header row (make it bold)
      console.log('Formatting header row...');
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 14
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.2,
                      green: 0.2,
                      blue: 0.8
                    },
                    textFormat: {
                      foregroundColor: {
                        red: 1.0,
                        green: 1.0,
                        blue: 1.0
                      },
                      fontSize: 11,
                      bold: true
                    }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            }
          ]
        }
      });
      console.log('✓ Headers created and formatted successfully');
    } else {
      console.log('✓ Headers already exist');
    }
  } catch (error) {
    console.error('✗ Error ensuring sheet headers:', error.message);
    console.error('Full error:', error);
    // Don't throw - this is not critical
  }
};

/**
 * Update booking status in Google Sheets
 */
export const updateBookingInSheet = async (bookingId, status) => {
  try {
    const sheets = authenticateGoogleSheets();
    const spreadsheetId = process.env.BOOKINGS_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('BOOKINGS_SHEET_ID is not set in environment variables');
    }

    // Get all bookings to find the row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Bookings!A:N'
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('No bookings found in sheet');
    }

    // Find the booking row
    const rowIndex = rows.findIndex(row => row[0] === bookingId);

    if (rowIndex === -1) {
      throw new Error('Booking not found in sheet');
    }

    // Update the status (column L, index 11)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Bookings!L${rowIndex + 1}`,
      valueInputOption: 'RAW',
      resource: {
        values: [[status]]
      }
    });

    return {
      success: true,
      message: 'Booking status updated in sheet'
    };
  } catch (error) {
    console.error('Error updating booking in Google Sheets:', error);
    throw new Error(`Failed to update booking in sheet: ${error.message}`);
  }
};

/**
 * Fetch all bookings from Google Sheets
 */
export const fetchBookingsFromSheet = async () => {
  try {
    const sheets = authenticateGoogleSheets();
    const spreadsheetId = process.env.BOOKINGS_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('BOOKINGS_SHEET_ID is not set in environment variables');
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Bookings!A:N'
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return [];
    }

    // Skip header row and map data
    const bookings = rows.slice(1).map((row) => ({
      bookingId: row[0] || '',
      name: row[1] || '',
      phone: row[2] || '',
      email: row[3] || '',
      address: row[4] || '',
      aadharNumber: row[5] || '',
      numberOfAdults: row[6] || '',
      adultsDetails: row[7] || '',
      roomNumber: row[8] || '',
      checkInDateTime: row[9] || '',
      checkOutDateTime: row[10] || '',
      status: row[11] || '',
      calendarEventId: row[12] || '',
      createdAt: row[13] || ''
    }));

    return bookings;
  } catch (error) {
    console.error('Error fetching bookings from Google Sheets:', error);
    throw new Error(`Failed to fetch bookings from sheet: ${error.message}`);
  }
};

export default {
  addBookingToSheet,
  updateBookingInSheet,
  fetchBookingsFromSheet
};
