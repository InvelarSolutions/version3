import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { airtableService } from '@/lib/airtable';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'test' | 'settings'>('test');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const result = await airtableService.testConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const config = airtableService.getConfig();

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Glass Morphism Header Background */}
      <div className="header-background"></div>

      {/* Fixed Logo */}
      <div className="logo">
        <Link to="/" className="flex items-center">
          <img
            src="/Invelar Logo.png"
            alt="Invelar Logo"
            className="h-16 w-auto"
          />
        </Link>
      </div>

      {/* Fixed Navigation Button */}
      <div className="nav-buttons">
        <Link to="/">
          <Button 
            variant="outline" 
            className="border-gray-600 text-black hover:bg-gray-800 hover:text-white transition-all duration-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <main className="py-20 px-4 pt-32">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Admin Dashboard</h1>
            <p className="text-xl text-gray-300">
              Monitor Airtable integration and manage system settings
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-8 bg-[#2a2a2a] rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab('test')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                activeTab === 'test'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <TestTube className="h-4 w-4 mr-2 inline" />
              Connection Test
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                activeTab === 'settings'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Settings className="h-4 w-4 mr-2 inline" />
              Settings
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'test' && (
              <div>
                <Card className="bg-[#2a2a2a] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Airtable Connection Test</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Configuration Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-[#1a1a1a] rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">API Key</span>
                          <span className={`text-sm ${config.hasApiKey ? 'text-green-400' : 'text-red-400'}`}>
                            {config.hasApiKey ? '✓ Configured' : '✗ Missing'}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 bg-[#1a1a1a] rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Base ID</span>
                          <span className="text-sm text-green-400">✓ {config.baseId}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-[#1a1a1a] rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Table ID</span>
                          <span className="text-sm text-green-400">✓ {config.tableId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Test Button */}
                    <div className="text-center">
                      <Button
                        onClick={handleTestConnection}
                        disabled={isTestingConnection || !config.hasApiKey}
                        className="bg-white text-black hover:bg-gray-100 disabled:opacity-50"
                      >
                        {isTestingConnection ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                            Testing Connection...
                          </>
                        ) : (
                          'Test Airtable Connection'
                        )}
                      </Button>
                    </div>

                    {/* Test Results */}
                    {testResult && (
                      <div className={`p-4 rounded-lg border ${
                        testResult.success 
                          ? 'bg-green-900/20 border-green-500' 
                          : 'bg-red-900/20 border-red-500'
                      }`}>
                        <div className="flex items-center">
                          {testResult.success ? (
                            <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-400 mr-3" />
                          )}
                          <div>
                            <p className={`font-medium ${
                              testResult.success ? 'text-green-300' : 'text-red-300'
                            }`}>
                              {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                            </p>
                            <p className={`text-sm ${
                              testResult.success ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {testResult.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Configuration Warning */}
                    {!config.hasApiKey && (
                      <div className="p-4 bg-yellow-900/20 border border-yellow-500 rounded-lg">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
                          <div>
                            <p className="text-yellow-300 font-medium">API Key Required</p>
                            <p className="text-yellow-400 text-sm">
                              Please set VITE_AIRTABLE_API_KEY in your environment variables to test the connection.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <Card className="bg-[#2a2a2a] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">System Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Environment Variables Check */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Environment Variables</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-[#1a1a1a] rounded-lg">
                            <span className="text-gray-300">VITE_AIRTABLE_API_KEY</span>
                            <span className={`text-sm ${config.hasApiKey ? 'text-green-400' : 'text-red-400'}`}>
                              {config.hasApiKey ? '✓ Configured' : '✗ Missing'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-[#1a1a1a] rounded-lg">
                            <span className="text-gray-300">VITE_AIRTABLE_BASE_ID</span>
                            <span className="text-sm text-green-400">✓ {config.baseId}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-[#1a1a1a] rounded-lg">
                            <span className="text-gray-300">VITE_AIRTABLE_TABLE_ID</span>
                            <span className="text-sm text-green-400">✓ {config.tableId}</span>
                          </div>
                        </div>
                      </div>

                      {/* Airtable Configuration */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Airtable Configuration</h3>
                        <div className="space-y-3">
                          <div className="p-3 bg-[#1a1a1a] rounded-lg">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Base ID:</span>
                                <p className="text-white font-mono">{config.baseId}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Table ID:</span>
                                <p className="text-white font-mono">{config.tableId}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Integration Type:</span>
                                <p className="text-white">Direct API Connection</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Form Submission:</span>
                                <p className="text-white">Real-time to Airtable</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Setup Instructions */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Setup Instructions</h3>
                        <div className="p-4 bg-[#1a1a1a] rounded-lg">
                          <ol className="list-decimal list-inside space-y-2 text-gray-300">
                            <li>Create a personal access token in your Airtable account</li>
                            <li>Grant the token access to the base: {config.baseId}</li>
                            <li>Set the VITE_AIRTABLE_API_KEY environment variable</li>
                            <li>Restart the development server</li>
                            <li>Test the connection using the Connection Test tab</li>
                          </ol>
                        </div>
                      </div>

                      {/* System Status */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-[#1a1a1a] rounded-lg">
                            <h4 className="font-medium text-white mb-2">Form Integration</h4>
                            <p className="text-sm text-gray-400">
                              Direct submission to Airtable via REST API with real-time validation
                            </p>
                          </div>
                          <div className="p-4 bg-[#1a1a1a] rounded-lg">
                            <h4 className="font-medium text-white mb-2">Data Processing</h4>
                            <p className="text-sm text-gray-400">
                              Client-side form validation and server-side data formatting
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}