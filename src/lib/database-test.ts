// Enhanced database connection test utility
import { supabase, contactService } from './supabase';

export const testDatabaseConnection = async () => {
  console.log('🔍 Starting comprehensive database connection test...');
  
  // Check if client exists
  if (!supabase) {
    console.error('❌ Supabase client is not initialized');
    console.error('This usually means:');
    console.error('1. Environment variables are missing or incorrect');
    console.error('2. .env file is not properly configured');
    console.error('3. Environment variables have placeholder values');
    return false;
  }

  try {
    // Test 1: Use the contact service test method
    console.log('📡 Testing connection via contact service...');
    await contactService.testConnection();

    // Test 2: Test insert permissions with a real test
    console.log('📝 Testing insert permissions...');
    const testSubmission = {
      first_name: 'Test',
      last_name: 'Connection',
      email: `test-connection-${Date.now()}@example.com`,
      phone: '+1 555-0123',
      company_name: 'Test Company',
      industry: 'technology',
      additional_notes: 'This is a connection test submission',
      newsletter_subscription: false
    };

    const insertResult = await contactService.createContactSubmission(testSubmission);
    
    if (insertResult?.id) {
      console.log('✅ Insert test successful - record created:', insertResult.id);
      
      // Test 3: Try to clean up the test record (this might fail for anonymous users, which is expected)
      try {
        const { error: deleteError } = await supabase
          .from('contact_submissions')
          .delete()
          .eq('id', insertResult.id);

        if (deleteError) {
          console.log('⚠️ Could not delete test record (this is normal for anonymous users):', deleteError.message);
        } else {
          console.log('✅ Test data cleaned up successfully');
        }
      } catch (cleanupError) {
        console.log('⚠️ Cleanup failed (this is normal for anonymous users):', cleanupError);
      }
    }

    console.log('🎉 All database connection tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    
    // Provide specific error guidance
    if (error instanceof Error) {
      if (error.message.includes('JWT')) {
        console.error('🔑 This appears to be an authentication/API key issue');
        console.error('Please check that your VITE_SUPABASE_ANON_KEY is correct');
      } else if (error.message.includes('fetch')) {
        console.error('🌐 This appears to be a network/URL issue');
        console.error('Please check that your VITE_SUPABASE_URL is correct and accessible');
      } else if (error.message.includes('permission')) {
        console.error('🔒 This appears to be a permissions issue');
        console.error('Please check your RLS policies in Supabase');
      }
    }
    
    return false;
  }
};

export const getDatabaseStats = async () => {
  if (!supabase) {
    console.error('❌ Cannot get stats - Supabase client not initialized');
    return null;
  }

  try {
    console.log('📊 Fetching database statistics...');
    const stats = await contactService.getContactSubmissionStats();
    console.log('✅ Stats retrieved:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error getting database stats:', error);
    return {
      total: 0,
      recent: 0,
      newsletter: 0
    };
  }
};

// Additional diagnostic function
export const diagnoseDatabaseIssues = async () => {
  console.log('🔧 Running database diagnostics...');
  
  const diagnostics = {
    clientInitialized: !!supabase,
    environmentVariables: {
      url: !!import.meta.env.VITE_SUPABASE_URL,
      key: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      urlValue: import.meta.env.VITE_SUPABASE_URL || 'NOT SET',
      keyPreview: import.meta.env.VITE_SUPABASE_ANON_KEY ? 
        `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'NOT SET'
    },
    connectionTest: false,
    errorDetails: null as any
  };

  if (supabase) {
    try {
      await testDatabaseConnection();
      diagnostics.connectionTest = true;
    } catch (error) {
      diagnostics.errorDetails = error;
    }
  }

  console.log('📋 Diagnostics Results:', diagnostics);
  return diagnostics;
};