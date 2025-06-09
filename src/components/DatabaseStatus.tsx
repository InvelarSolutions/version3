import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CheckCircle, AlertCircle, RefreshCw, Database, AlertTriangle, Info } from 'lucide-react';
import { testDatabaseConnection, getDatabaseStats, diagnoseDatabaseIssues } from '@/lib/database-test';

export function DatabaseStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const runConnectionTest = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Starting connection test from UI...');
      const result = await testDatabaseConnection();
      setIsConnected(result);
      
      if (result) {
        const dbStats = await getDatabaseStats();
        setStats(dbStats);
      }
      
      setLastChecked(new Date());
    } catch (error) {
      console.error('Connection test error:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const diagResults = await diagnoseDatabaseIssues();
      setDiagnostics(diagResults);
      setShowDiagnostics(true);
    } catch (error) {
      console.error('Diagnostics error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runConnectionTest();
  }, []);

  return (
    <div className="space-y-4">
      <Card className="bg-[#2a2a2a] border-gray-700">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-white" />
              <h3 className="text-lg font-semibold text-white">Database Status</h3>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={runDiagnostics}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="border-gray-600 text-black hover:bg-gray-800 hover:text-white"
              >
                <Info className="h-4 w-4 mr-1" />
                Diagnose
              </Button>
              <Button
                onClick={runConnectionTest}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="border-gray-600 text-black hover:bg-gray-800 hover:text-white"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Test
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-3">
            {isConnected === null ? (
              <div className="h-3 w-3 bg-gray-400 rounded-full animate-pulse" />
            ) : isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400" />
            )}
            <span className="text-white">
              {isConnected === null 
                ? 'Checking connection...' 
                : isConnected 
                  ? 'Database connected successfully' 
                  : 'Database connection failed'
              }
            </span>
          </div>

          {/* Database Statistics */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-600">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Submissions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.recentSubmissions}</div>
                <div className="text-sm text-gray-400">This Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.newsletterSubscribers}</div>
                <div className="text-sm text-gray-400">Newsletter Signups</div>
              </div>
            </div>
          )}

          {/* Environment Variables Check */}
          <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-gray-600">
            <div>Environment: {import.meta.env.MODE}</div>
            <div className="flex items-center space-x-2">
              <span>Supabase URL:</span>
              {import.meta.env.VITE_SUPABASE_URL ? (
                <span className="text-green-400">✓ Configured</span>
              ) : (
                <span className="text-red-400">✗ Missing</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span>Anon Key:</span>
              {import.meta.env.VITE_SUPABASE_ANON_KEY ? (
                <span className="text-green-400">✓ Configured</span>
              ) : (
                <span className="text-red-400">✗ Missing</span>
              )}
            </div>
          </div>

          {/* Last Checked */}
          {lastChecked && (
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-600">
              Last checked: {lastChecked.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diagnostics Panel */}
      {showDiagnostics && diagnostics && (
        <Card className="bg-[#2a2a2a] border-gray-700">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Diagnostics</h3>
              </div>
              <Button
                onClick={() => setShowDiagnostics(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Client Initialized:</span>
                <span className={diagnostics.clientInitialized ? 'text-green-400' : 'text-red-400'}>
                  {diagnostics.clientInitialized ? '✓' : '✗'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">URL Variable:</span>
                <span className={diagnostics.environmentVariables.url ? 'text-green-400' : 'text-red-400'}>
                  {diagnostics.environmentVariables.url ? '✓' : '✗'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Key Variable:</span>
                <span className={diagnostics.environmentVariables.key ? 'text-green-400' : 'text-red-400'}>
                  {diagnostics.environmentVariables.key ? '✓' : '✗'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Connection Test:</span>
                <span className={diagnostics.connectionTest ? 'text-green-400' : 'text-red-400'}>
                  {diagnostics.connectionTest ? '✓' : '✗'}
                </span>
              </div>
            </div>

            {/* Environment Values */}
            <div className="pt-4 border-t border-gray-600">
              <h4 className="text-white font-medium mb-2">Environment Values:</h4>
              <div className="space-y-1 text-xs">
                <div className="text-gray-400">
                  URL: {diagnostics.environmentVariables.urlValue}
                </div>
                <div className="text-gray-400">
                  Key: {diagnostics.environmentVariables.keyPreview}
                </div>
              </div>
            </div>

            {/* Error Details */}
            {diagnostics.errorDetails && (
              <div className="pt-4 border-t border-gray-600">
                <h4 className="text-red-400 font-medium mb-2">Error Details:</h4>
                <div className="text-xs text-gray-400 bg-[#1a1a1a] p-2 rounded">
                  {diagnostics.errorDetails.message || JSON.stringify(diagnostics.errorDetails)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}