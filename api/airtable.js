// Backend API endpoint for Airtable integration
// This file should be deployed to a backend service like Vercel, Netlify Functions, or similar

// Airtable field mapping using actual field IDs
const FIELD_IDS = {
  firstName: 'fld2yAX1BepyzcYxb',           // First Name
  lastName: 'fldnLyFGgejjoSTTd',            // Last Name
  email: 'fldqtGtICn9VQSmyT',               // Email Address
  phone: 'fldJkeLbcy9NtcBCY',               // Phone Number
  currentStatus: 'fldFRzOgZvS5kNfex',       // Current Status
  companyName: 'fldmdPJ6b8w9B45NF',         // Company Name
  industry: 'fld6IS6IersuxaV1B',            // Industry Type
  additionalNotes: 'fldWeqmLYt3MX1Wn5',     // Additional Notes
  newsletterSubscription: 'fldbAeIOCdQQm7JzG', // Newsletter Subscription Status
  creationTimestamp: 'fldtmLnCmbGEG8g5P',   // Creation Timestamp
  syncTimestamp: 'fldQZqbSsfJkfUfiw',       // Sync Timestamp
  lastUpdateTimestamp: 'fldlwObGh6kc1peJ4'  // Last Update Timestamp
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

async function submitToAirtable(data) {
  // Set your Airtable API key here or use environment variable
  const airtableApiKey = process.env.AIRTABLE_API_KEY || 'pathdCnsO2NWzZNnO.b282f93d07ef47a2cb0186d26ffd8ddbc780729e9397553cfd73624b32a5ade0';
  const baseId = 'appOjOMHTayU1oZLJ';
  const tableId = 'tblhpwqJMeAIETi1v';
  
  if (!airtableApiKey) {
    throw new Error('Airtable API key not configured');
  }

  const currentTimestamp = new Date().toISOString();
  
  const record = {
    fields: {
      [FIELD_IDS.firstName]: data.firstName,
      [FIELD_IDS.lastName]: data.lastName,
      [FIELD_IDS.email]: data.email,
      [FIELD_IDS.phone]: data.phone,
      [FIELD_IDS.currentStatus]: 'New Submission',
      [FIELD_IDS.companyName]: data.companyName || '',
      [FIELD_IDS.industry]: data.industry || '',
      [FIELD_IDS.additionalNotes]: data.additionalNotes || '',
      [FIELD_IDS.newsletterSubscription]: data.newsletterSubscription || false,
      [FIELD_IDS.creationTimestamp]: currentTimestamp,
      [FIELD_IDS.syncTimestamp]: currentTimestamp,
      [FIELD_IDS.lastUpdateTimestamp]: currentTimestamp
    }
  };

  const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${airtableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      records: [record]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Airtable API Error:', response.status, errorText);
    throw new Error(`Airtable API error: ${response.status}`);
  }

  const result = await response.json();
  return result.records[0];
}

async function testAirtableConnection() {
  const airtableApiKey = process.env.AIRTABLE_API_KEY || 'pathdCnsO2NWzZNnO.b282f93d07ef47a2cb0186d26ffd8ddbc780729e9397553cfd73624b32a5ade0';
  const baseId = 'appOjOMHTayU1oZLJ';
  const tableId = 'tblhpwqJMeAIETi1v';
  
  if (!airtableApiKey) {
    throw new Error('Airtable API key not configured');
  }

  const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}?maxRecords=1`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${airtableApiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Airtable connection test failed: ${response.status}`);
  }

  const data = await response.json();
  const availableFields = data.records?.[0] ? Object.keys(data.records[0].fields) : [];

  return {
    success: true,
    message: 'Airtable connection successful',
    availableFields
  };
}

// Main handler function
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).json({});
    return;
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
    if (req.method === 'GET' && req.url.endsWith('/test')) {
      // Test connection endpoint
      const result = await testAirtableConnection();
      res.status(200).json(result);
      return;
    }

    if (req.method === 'POST') {
      // Contact form submission
      const data = req.body;

      // Validate required fields
      if (!data.firstName || !data.lastName || !data.email || !data.phone) {
        res.status(422).json({ error: 'Missing required fields' });
        return;
      }

      const airtableResult = await submitToAirtable(data);
      console.log('✅ Submitted to Airtable:', airtableResult.id);
      
      res.status(200).json({ 
        success: true, 
        recordId: airtableResult.id 
      });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ API error:', error);
    
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}