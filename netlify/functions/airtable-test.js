// Netlify Function for testing Airtable connection
const fetch = require('node-fetch');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

async function testAirtableConnection() {
  const airtableApiKey = process.env.AIRTABLE_API_KEY;
  const baseId = 'appOjOMHTayU1oZLJ';
  const tableId = 'tblhpwqJMeAIETi1v';
  
  if (!airtableApiKey) {
    throw new Error('Airtable API key not configured. Please set AIRTABLE_API_KEY environment variable.');
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
    if (event.httpMethod === 'GET') {
      const result = await testAirtableConnection();
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      };
    }

    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('❌ Test function error:', error);
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: error.message || 'Connection test failed' 
      })
    };
  }
};