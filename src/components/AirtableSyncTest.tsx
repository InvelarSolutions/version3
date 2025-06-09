import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database } from 'lucide-react';

export function AirtableSyncTest() {
  const [testResults, setTestResults] = useState<{
    environmentCheck: boolean | null;
    edgeFunctionCheck: boolean | null;
    airtableConnectionCheck: boolean | null;
    syncTest: boolean | null;
    errors: string[];
  }>({
    environmentCheck: null,
    edgeFunctionCheck: null,
    airtableConnectionCheck: null,
    syncTest: null,
    errors: []
  });
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    const errors: string[] = [];
    
    try {
      // Test 1: Environment Variables Check
      console.log('🔍 Testing environment variables...');
      const envCheck = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      if (!envCheck) {
        errors.push('Missing required environment variables (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY)');
      }

      setTestResults(prev => ({ ...prev, environmentCheck: envCheck, errors }));
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test 2: Edge Function Availability
      console.log('🔍 Testing edge function availability...');
      let edgeFunctionCheck = false;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/airtable-sync?type=manual`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        // Even if the function fails due to missing API key, a 500 response means the function exists
        edgeFunctionCheck = response.status !== 404;
        
        if (!edgeFunctionCheck) {
          errors.push('Airtable sync edge function not found - needs to be deployed');
        }
      } catch (error) {
        errors.push(`Edge function test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      setTestResults(prev => ({ ...prev, edgeFunctionCheck, errors: [...errors] }));
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test 3: Airtable Connection (via edge function)
      console.log('🔍 Testing Airtable connection...');
      let airtableConnectionCheck = false;
      
      if (edgeFunctionCheck) {
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/airtable-sync?type=manual`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          });

          const result = await response.json();
          
          // Check if the error is specifically about missing API key
          if (result.error && result.error.includes('AIRTABLE_API_KEY')) {
            errors.push('AIRTABLE_API_KEY environment variable not configured in Supabase');
          } else if (result.success || (result.error && !result.error.includes('AIRTABLE_API_KEY'))) {
            airtableConnectionCheck = true;
          }
        } catch (error) {
          errors.push(`Airtable connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setTestResults(prev => ({ ...prev, airtableConnectionCheck, errors: [...errors] }));
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test 4: Full Sync Test (only if previous tests pass)
      console.log('🔍 Testing full sync functionality...');
      let syncTest = false;
      
      if (envCheck && edgeFunctionCheck && airtableConnectionCheck) {
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/airtable-sync?type=manual`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          });

          const result = await response.json();
          syncTest = result.success === true;
          
          if (!syncTest && result.error) {
            errors.push(`Sync test failed: ${result.error}`);
          }
        } catch (error) {
          errors.push(`Sync test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        errors.push('Skipping sync test due to previous failures');
      }

      setTestResults(prev => ({ 
        ...prev, 
        syncTest, 
        errors: [...errors]
      }));

    } catch (error) {
      errors.push(`Test suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTestResults(prev => ({ ...prev, errors: [...errors] }));
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) {
      return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
    return status ? 
      <CheckCircle className="h-5 w-5 text-green-400" /> : 
      <XCircle className="h-5 w-5 text-red-400" />;
  };

  const getStatusText = (status: boolean | null) => {
    if (status === null) return 'Not tested';
    return status ? 'Passed' : 'Failed';
  };

  return (
    <Card className="bg-[#2a2a2a] border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Airtable Sync Configuration Test</CardTitle>
          <Button
            onClick={runTests}
            disabled={isRunning}
            className="bg-white text-black hover:bg-gray-100"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            {isRunning ? 'Testing...' : 'Run Tests'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Results */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(testResults.environmentCheck)}
              <span className="text-white">Environment Variables</span>
            </div>
            <span className={`text-sm ${
              testResults.environmentCheck === true ? 'text-green-400' : 
              testResults.environmentCheck === false ? 'text-red-400' : 'text-gray-400'
            }`}>
              {getStatusText(testResults.environmentCheck)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(testResults.edgeFunctionCheck)}
              <span className="text-white">Edge Function Deployment</span>
            </div>
            <span className={`text-sm ${
              testResults.edgeFunctionCheck === true ? 'text-green-400' : 
              testResults.edgeFunctionCheck === false ? 'text-red-400' : 'text-gray-400'
            }`}>
              {getStatusText(testResults.edgeFunctionCheck)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(testResults.airtableConnectionCheck)}
              <span className="text-white">Airtable API Connection</span>
            </div>
            <span className={`text-sm ${
              testResults.airtableConnectionCheck === true ? 'text-green-400' : 
              testResults.airtableConnectionCheck === false ? 'text-red-400' : 'text-gray-400'
            }`}>
              {getStatusText(testResults.airtableConnectionCheck)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(testResults.syncTest)}
              <span className="text-white">Full Sync Test</span>
            </div>
            <span className={`text-sm ${
              testResults.syncTest === true ? 'text-green-400' : 
              testResults.syncTest === false ? 'text-red-400' : 'text-gray-400'
            }`}>
              {getStatusText(testResults.syncTest)}
            </span>
          </div>
        </div>

        {/* Error Messages */}
        {testResults.errors.length > 0 && (
          <div className="mt-6">
            <h4 className="text-red-400 font-medium mb-3">Issues Found:</h4>
            <div className="space-y-2">
              {testResults.errors.map((error, index) => (
                <div key={index} className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        {!isRunning && testResults.environmentCheck !== null && (
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <h4 className="text-blue-400 font-medium mb-2">Next Steps:</h4>
            <div className="text-sm text-blue-300 space-y-1">
              {!testResults.environmentCheck && (
                <p>• Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file</p>
              )}
              {!testResults.edgeFunctionCheck && (
                <p>• Deploy the Airtable sync edge function: `supabase functions deploy airtable-sync`</p>
              )}
              {!testResults.airtableConnectionCheck && (
                <p>• Add AIRTABLE_API_KEY to your Supabase project environment variables</p>
              )}
              {testResults.environmentCheck && testResults.edgeFunctionCheck && testResults.airtableConnectionCheck && !testResults.syncTest && (
                <p>• Check Airtable base permissions and field mappings</p>
              )}
              {testResults.environmentCheck && testResults.edgeFunctionCheck && testResults.airtableConnectionCheck && testResults.syncTest && (
                <p>✅ All tests passed! Your Airtable sync is configured correctly.</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}