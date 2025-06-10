import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

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

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  industry?: string;
  additionalNotes?: string;
  newsletterSubscription: boolean;
}

async function submitToAirtable(data: ContactFormData) {
  const airtableApiKey = Deno.env.get('AIRTABLE_API_KEY') || 'pathdCnsO2NWzZNnO.b282f93d07ef47a2cb0186d26ffd8ddbc780729e9397553cfd73624b32a5ade0';
  const baseId = 'appOjOMHTayU1oZLJ';
  const tableId = 'tblhpwqJMeAIETi1v';
  
  if (!airtableApiKey) {
    throw new Error('Airtable API key not configured');
  }

  const currentTimestamp = new Date().toISOString();
  
  const record = {
    fields: {
      [FIELD_IDS.firstName]: data.firstName.trim(),
      [FIELD_IDS.lastName]: data.lastName.trim(),
      [FIELD_IDS.email]: data.email.trim().toLowerCase(),
      [FIELD_IDS.phone]: data.phone.trim(),
      [FIELD_IDS.currentStatus]: 'New Submission',
      [FIELD_IDS.companyName]: data.companyName?.trim() || '',
      [FIELD_IDS.industry]: data.industry || '',
      [FIELD_IDS.additionalNotes]: data.additionalNotes?.trim() || '',
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
  const airtableApiKey = Deno.env.get('AIRTABLE_API_KEY') || 'pathdCnsO2NWzZNnO.b282f93d07ef47a2cb0186d26ffd8ddbc780729e9397553cfd73624b32a5ade0';
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

async function saveToSupabase(data: ContactFormData) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: result, error } = await supabase
    .from('contact_submissions')
    .insert([
      {
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        company_name: data.companyName?.trim() || null,
        industry: data.industry || null,
        additional_notes: data.additionalNotes?.trim() || null,
        newsletter_subscription: data.newsletterSubscription || false,
        status: 'new'
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
    throw new Error('Failed to save to database');
  }

  return result;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();

    if (type === 'test_connection') {
      const result = await testAirtableConnection();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'contact_submission') {
      // Validate required fields
      if (!data.firstName || !data.lastName || !data.email || !data.phone) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { 
            status: 422, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Save to Supabase first
      const supabaseResult = await saveToSupabase(data);
      console.log('✅ Saved to Supabase:', supabaseResult.id);

      // Then sync to Airtable
      try {
        const airtableResult = await submitToAirtable(data);
        console.log('✅ Synced to Airtable:', airtableResult.id);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            recordId: airtableResult.id,
            supabaseId: supabaseResult.id 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (airtableError) {
        console.error('❌ Airtable sync failed:', airtableError);
        
        // Still return success since we saved to Supabase
        // The sync can be retried later
        return new Response(
          JSON.stringify({ 
            success: true, 
            recordId: supabaseResult.id,
            supabaseId: supabaseResult.id,
            warning: 'Saved to database but Airtable sync failed'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request type' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});