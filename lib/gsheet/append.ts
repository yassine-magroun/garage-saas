import { google } from 'googleapis';

export async function appendToGSheet(
  sheetId: string,
  row: (string | number | null)[],
): Promise<string> {
  const credentialsJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!credentialsJson) throw new Error('GCP_SERVICE_ACCOUNT_JSON not set');

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(credentialsJson) as object,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Factures!A:G',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });

  return res.data.updates?.updatedRange ?? '';
}
