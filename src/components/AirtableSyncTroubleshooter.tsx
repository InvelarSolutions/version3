import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  ExternalLink,
  Copy,
  Eye,
  Settings,
  Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  action?: string;
}

export function AirtableSyncTroubleshooter() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testSubmissionId, setTestSubmissionId] = useState<string | null>(null);

  const addDiagnostic = (result: DiagnosticResult) => {
    setDiagnostics(prev => [...prev, result]);
  };

  const runComprehensiveDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);
    setTestSubmissionId(null);

    try {
      // Step 1: Check Environment Variables
      addDiagnostic({
        step: "Environment Variables",
        status: "info",
        message: "Checking environment configuration..."
      });

      const hasSupabaseUrl = !!import.meta.env.VITE_SUPABASE_URL;
      const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!hasSupabaseUrl || !hasSupabaseKey) {
        addDiagnostic({
          step: "Environment Variables",
          status: "error",
          message: "Missing required Supabase environment variables",
          details: `VITE_SUPABASE_URL: ${hasSupabaseUrl ? '✓' : '✗'}, VITE_SUPABASE_ANON_KEY: ${hasSupabaseKey ? '✓' : '✗'}`,
          action: "Configure missing environment variables in your .env file"
        });
        return;
      }

      addDiagnostic({
        step: "Environment Variables",
        status: "success",
        message: "Supabase environment variables configured correctly"
      });

      // Step 2: Test Database Connection
      addDiagnostic({
        step: "Database Connection",
        status: "info",
        message: "Testing Supabase database connection..."
      });

      if (!supabase) {
        addDiagnostic({
          step: "Database Connection",
          status: "error",
          message: "Supabase client not initialized",
          action: "Check environment variables and restart the application"
        });
        return;
      }

      const { data: testData, error: dbError } = await supabase
        .from('contact_submissions')
        .select('count')
        .limit(1);

      if (dbError) {
        addDiagnostic({
          step: "Database Connection",
          status: "error",
          message: "Database connection failed",
          details: dbError.message,
          action: "Check Supabase project status and credentials"
        });
        return;
      }

      addDiagnostic({
        step: "Database Connection",
        status: "success",
        message: "Database connection successful"
      });

      // Step 3: Check Sync Tables
      addDiagnostic({
        step: "Sync Infrastructure",
        status: "info",
        message: "Checking sync tables and triggers..."
      });

      const { data: syncLogs, error: syncError } = await supabase
        .from('sync_logs')
        .select('count')
        .limit(1);

      if (syncError) {
        addDiagnostic({
          step: "Sync Infrastructure",
          status: "error",
          message: "Sync logs table not found",
          details: syncError.message,
          action: "Run database migrations to create sync infrastructure"
        });
        return;
      }

      addDiagnostic({
        step: "Sync Infrastructure",
        status: "success",
        message: "Sync infrastructure tables exist"
      });

      // Step 4: Test Edge Function Availability
      addDiagnostic({
        step: "Edge Function",
        status: "info",
        message: "Testing Airtable sync edge function..."
      });

      try {
        const edgeResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/airtable-sync/test`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (edgeResponse.status === 404) {
          addDiagnostic({
            step: "Edge Function",
            status: "error",
            message: "Airtable sync edge function not deployed",
            action: "Deploy the edge function: supabase functions deploy airtable-sync"
          });
          return;
        }

        const edgeResult = await edgeResponse.json();
        
        if (edgeResult.success) {
          addDiagnostic({
            step: "Edge Function",
            status: "success",
            message: "Edge function deployed and Airtable connection successful"
          });
        } else {
          addDiagnostic({
            step: "Edge Function",
            status: "error",
            message: "Edge function deployed but Airtable connection failed",
            details: edgeResult.message,
            action: "Check AIRTABLE_API_KEY in Supabase environment variables"
          });
          return;
        }
      } catch (edgeError) {
        addDiagnostic({
          step: "Edge Function",
          status: "error",
          message: "Edge function test failed",
          details: edgeError instanceof Error ? edgeError.message : 'Unknown error',
          action: "Check edge function deployment and logs"
        });
        return;
      }

      // Step 5: Check Recent Sync Activity
      addDiagnostic({
        step: "Sync Activity",
        status: "info",
        message: "Checking recent sync activity..."
      });

      const { data: recentSyncs, error: syncActivityError } = await supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (syncActivityError) {
        addDiagnostic({
          step: "Sync Activity",
          status: "warning",
          message: "Could not fetch sync logs",
          details: syncActivityError.message
        });
      } else if (!recentSyncs || recentSyncs.length === 0) {
        addDiagnostic({
          step: "Sync Activity",
          status: "warning",
          message: "No sync activity found",
          details: "No sync operations have been recorded",
          action: "Try submitting a test form or trigger a manual sync"
        });
      } else {
        const lastSync = recentSyncs[0];
        const successfulSyncs = recentSyncs.filter(s => s.status === 'completed').length;
        
        addDiagnostic({
          step: "Sync Activity",
          status: successfulSyncs > 0 ? "success" : "warning",
          message: `Found ${recentSyncs.length} recent sync operations`,
          details: `Last sync: ${lastSync.status} at ${new Date(lastSync.created_at).toLocaleString()}, ${successfulSyncs}/${recentSyncs.length} successful`
        });
      }

      // Step 6: Create Test Submission
      addDiagnostic({
        step: "Test Submission",
        status: "info",
        message: "Creating test contact submission..."
      });

      const testSubmission = {
        first_name: 'Test',
        last_name: 'Sync',
        email: `test-sync-${Date.now()}@example.com`,
        phone: '+1 555-0123',
        company_name: 'Test Company',
        industry: 'technology',
        additional_notes: 'This is a test submission for sync troubleshooting',
        newsletter_subscription: false
      };

      const { data: newSubmission, error: submissionError } = await supabase
        .from('contact_submissions')
        .insert([testSubmission])
        .select()
        .single();

      if (submissionError) {
        addDiagnostic({
          step: "Test Submission",
          status: "error",
          message: "Failed to create test submission",
          details: submissionError.message,
          action: "Check database permissions and table structure"
        });
        return;
      }

      setTestSubmissionId(newSubmission.id);
      addDiagnostic({
        step: "Test Submission",
        status: "success",
        message: "Test submission created successfully",
        details: `Submission ID: ${newSubmission.id}`
      });

      // Step 7: Wait and Check for Sync
      addDiagnostic({
        step: "Sync Verification",
        status: "info",
        message: "Waiting for real-time sync to trigger..."
      });

      // Wait 10 seconds for sync to process
      await new Promise(resolve => setTimeout(resolve, 10000));

      const { data: syncCheck, error: syncCheckError } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('sync_type', 'realtime')
        .order('created_at', { ascending: false })
        .limit(3);

      if (syncCheckError) {
        addDiagnostic({
          step: "Sync Verification",
          status: "warning",
          message: "Could not verify sync operation",
          details: syncCheckError.message
        });
      } else {
        const recentRealTimeSync = syncCheck?.find(s => 
          new Date(s.created_at).getTime() > Date.now() - 30000 // Last 30 seconds
        );

        if (recentRealTimeSync) {
          addDiagnostic({
            step: "Sync Verification",
            status: recentRealTimeSync.status === 'completed' ? "success" : "warning",
            message: `Real-time sync ${recentRealTimeSync.status}`,
            details: `Records processed: ${recentRealTimeSync.records_processed}, synced: ${recentRealTimeSync.records_synced}, failed: ${recentRealTimeSync.records_failed}`
          });

          if (recentRealTimeSync.errors && recentRealTimeSync.errors.length > 0) {
            addDiagnostic({
              step: "Sync Errors",
              status: "error",
              message: "Sync completed with errors",
              details: recentRealTimeSync.errors.join('; '),
              action: "Check Airtable API key and base permissions"
            });
          }
        } else {
          addDiagnostic({
            step: "Sync Verification",
            status: "warning",
            message: "No recent real-time sync detected",
            details: "Real-time sync may not be triggering properly",
            action: "Check database triggers and edge function logs"
          });
        }
      }

      // Step 8: Manual Sync Test
      addDiagnostic({
        step: "Manual Sync Test",
        status: "info",
        message: "Testing manual sync..."
      });

      try {
        const manualSyncResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/airtable-sync?type=manual`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        const manualSyncResult = await manualSyncResponse.json();

        if (manualSyncResult.success) {
          addDiagnostic({
            step: "Manual Sync Test",
            status: "success",
            message: "Manual sync completed successfully",
            details: `Processed: ${manualSyncResult.records_processed}, Synced: ${manualSyncResult.records_synced}, Failed: ${manualSyncResult.records_failed}`
          });
        } else {
          addDiagnostic({
            step: "Manual Sync Test",
            status: "error",
            message: "Manual sync failed",
            details: manualSyncResult.error,
            action: "Check edge function logs and Airtable configuration"
          });
        }
      } catch (manualSyncError) {
        addDiagnostic({
          step: "Manual Sync Test",
          status: "error",
          message: "Manual sync test failed",
          details: manualSyncError instanceof Error ? manualSyncError.message : 'Unknown error'
        });
      }

      // Final Summary
      const errorCount = diagnostics.filter(d => d.status === 'error').length;
      const warningCount = diagnostics.filter(d => d.status === 'warning').length;

      if (errorCount === 0 && warningCount === 0) {
        addDiagnostic({
          step: "Summary",
          status: "success",
          message: "All diagnostics passed! Sync should be working correctly."
        });
      } else if (errorCount > 0) {
        addDiagnostic({
          step: "Summary",
          status: "error",
          message: `Found ${errorCount} critical issues that need to be resolved`,
          action: "Address the errors above to restore sync functionality"
        });
      } else {
        addDiagnostic({
          step: "Summary",
          status: "warning",
          message: `Found ${warningCount} warnings that may affect sync performance`,
          action: "Review warnings above for optimal sync performance"
        });
      }

    } catch (error) {
      addDiagnostic({
        step: "Diagnostic Error",
        status: "error",
        message: "Diagnostic process failed",
        details: error instanceof Error ? error.message : 'Unknown error',
        action: "Check console for detailed error information"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const cleanupTestSubmission = async () => {
    if (!testSubmissionId || !supabase) return;

    try {
      await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', testSubmissionId);
      
      setTestSubmissionId(null);
      addDiagnostic({
        step: "Cleanup",
        status: "success",
        message: "Test submission cleaned up"
      });
    } catch (error) {
      addDiagnostic({
        step: "Cleanup",
        status: "warning",
        message: "Could not clean up test submission",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'info':
        return <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />;
      default:
        return <RefreshCw className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      info: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#2a2a2a] border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Airtable Sync Troubleshooter</CardTitle>
              <p className="text-gray-400 mt-2">
                Comprehensive diagnostic tool to identify and resolve sync issues
              </p>
            </div>
            <div className="flex space-x-2">
              {testSubmissionId && (
                <Button
                  onClick={cleanupTestSubmission}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-black hover:bg-gray-800 hover:text-white"
                >
                  Clean Up Test
                </Button>
              )}
              <Button
                onClick={runComprehensiveDiagnostics}
                disabled={isRunning}
                className="bg-white text-black hover:bg-gray-100"
              >
                {isRunning ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {isRunning ? 'Running Diagnostics...' : 'Run Full Diagnostics'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {diagnostics.length === 0 && !isRunning && (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Click "Run Full Diagnostics" to start troubleshooting</p>
              <p className="text-sm text-gray-500 mt-2">
                This will test all aspects of your Airtable sync configuration
              </p>
            </div>
          )}

          {diagnostics.length > 0 && (
            <div className="space-y-4">
              {diagnostics.map((diagnostic, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 bg-[#1a1a1a] rounded-lg border border-gray-600"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(diagnostic.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-white">{diagnostic.step}</h4>
                      {getStatusBadge(diagnostic.status)}
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{diagnostic.message}</p>
                    
                    {diagnostic.details && (
                      <div className="mb-2">
                        <details className="text-xs">
                          <summary className="text-gray-400 cursor-pointer hover:text-gray-300">
                            View Details
                          </summary>
                          <div className="mt-2 p-2 bg-gray-800 rounded border border-gray-600">
                            <code className="text-gray-300 text-xs">{diagnostic.details}</code>
                          </div>
                        </details>
                      </div>
                    )}
                    
                    {diagnostic.action && (
                      <div className="p-2 bg-blue-900/20 border border-blue-500/30 rounded">
                        <p className="text-blue-300 text-xs">
                          <strong>Action Required:</strong> {diagnostic.action}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-[#2a2a2a] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="border-gray-600 text-black hover:bg-gray-800 hover:text-white h-auto p-4 flex flex-col items-start"
              onClick={() => window.open('https://airtable.com/appOjOMHTayU1oZLJ', '_blank')}
            >
              <ExternalLink className="h-5 w-5 mb-2" />
              <span className="font-medium">View Airtable Base</span>
              <span className="text-xs text-gray-500">Check if data is appearing</span>
            </Button>

            <Button
              variant="outline"
              className="border-gray-600 text-black hover:bg-gray-800 hover:text-white h-auto p-4 flex flex-col items-start"
              onClick={() => {
                navigator.clipboard.writeText('appOjOMHTayU1oZLJ');
              }}
            >
              <Copy className="h-5 w-5 mb-2" />
              <span className="font-medium">Copy Base ID</span>
              <span className="text-xs text-gray-500">appOjOMHTayU1oZLJ</span>
            </Button>

            <Button
              variant="outline"
              className="border-gray-600 text-black hover:bg-gray-800 hover:text-white h-auto p-4 flex flex-col items-start"
              onClick={() => {
                navigator.clipboard.writeText('tblhpwqJMeAIETi1v');
              }}
            >
              <Copy className="h-5 w-5 mb-2" />
              <span className="font-medium">Copy Table ID</span>
              <span className="text-xs text-gray-500">tblhpwqJMeAIETi1v</span>
            </Button>

            <Button
              variant="outline"
              className="border-gray-600 text-black hover:bg-gray-800 hover:text-white h-auto p-4 flex flex-col items-start"
              onClick={() => window.open('/contact', '_blank')}
            >
              <ExternalLink className="h-5 w-5 mb-2" />
              <span className="font-medium">Test Contact Form</span>
              <span className="text-xs text-gray-500">Submit a real test</span>
            </Button>

            <Button
              variant="outline"
              className="border-gray-600 text-black hover:bg-gray-800 hover:text-white h-auto p-4 flex flex-col items-start"
              onClick={() => {
                if (supabase) {
                  supabase.from('sync_logs').select('*').order('created_at', { ascending: false }).limit(10)
                    .then(({ data }) => console.log('Recent sync logs:', data));
                }
              }}
            >
              <Eye className="h-5 w-5 mb-2" />
              <span className="font-medium">View Sync Logs</span>
              <span className="text-xs text-gray-500">Check console output</span>
            </Button>

            <Button
              variant="outline"
              className="border-gray-600 text-black hover:bg-gray-800 hover:text-white h-auto p-4 flex flex-col items-start"
              onClick={() => window.open('https://supabase.com/dashboard/project', '_blank')}
            >
              <Database className="h-5 w-5 mb-2" />
              <span className="font-medium">Supabase Dashboard</span>
              <span className="text-xs text-gray-500">Check environment vars</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Common Issues */}
      <Card className="bg-[#2a2a2a] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Common Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-600">
              <h4 className="font-medium text-white mb-2">Data not appearing in Airtable</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Check if AIRTABLE_API_KEY is configured in Supabase environment variables</li>
                <li>• Verify API key has write permissions to the base</li>
                <li>• Ensure all required fields exist in Airtable table</li>
                <li>• Check sync logs for error messages</li>
              </ul>
            </div>

            <div className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-600">
              <h4 className="font-medium text-white mb-2">Real-time sync not triggering</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Verify database triggers are installed (run migrations)</li>
                <li>• Check if edge function is deployed</li>
                <li>• Ensure pg_net extension is enabled in Supabase</li>
                <li>• Test with manual sync first</li>
              </ul>
            </div>

            <div className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-600">
              <h4 className="font-medium text-white mb-2">Authentication errors</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Regenerate Airtable API key if expired</li>
                <li>• Check API key permissions include data.records:write</li>
                <li>• Verify base ID is correct: appOjOMHTayU1oZLJ</li>
                <li>• Ensure table ID is correct: tblhpwqJMeAIETi1v</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}