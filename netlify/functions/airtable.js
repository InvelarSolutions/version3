// Netlify Function for Airtable integration
const fetch = require('node-fetch');

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
  // Get Airtable API key from environment variable
  const airtableApiKey = process.env.AIRTABLE_API_KEY;
  const baseId = 'appOjOMHTayU1oZLJ';
  const tableId = 'tblhpwqJMeAIETi1v';
  
  if (!airtableApiKey) {
    throw new Error('Airtable API key not configured. Please set AIRTABLE_API_KEY environment variable.');
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

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({})
    };
  }

  try {
    if (event.httpMethod === 'POST') {
      // Contact form submission
      const data = JSON.parse(event.body);

      // Validate required fields
      if (!data.firstName || !data.lastName || !data.email || !data.phone) {
        return {
          statusCode: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }

      const airtableResult = await submitToAirtable(data);
      console.log('✅ Submitted to Airtable:', airtableResult.id);
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: true, 
          recordId: airtableResult.id 
        })
      };
    }

    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('❌ Function error:', error);
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: error.message || 'Internal server error' 
      })
    };
  }
};