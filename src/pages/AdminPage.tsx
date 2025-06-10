import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings, TestTube, CheckCircle, XCircle, AlertCircle, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { contactService } from '@/lib/supabase-contact';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'test' | 'settings'>('test');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; recordCount?: number } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const result = await contactService.testConnection();
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

  const config = contactService.getConfig();

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
              Monitor Supabase integration and manage system settings
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
                    <CardTitle className="text-white flex items-center">
                      <Database className="h-5 w-5 mr-2" />
                      Supabase Connection Test
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Configuration Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-[#1a1a1a] rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Supabase URL</span>
                          <span className={`text-sm ${config.isConfigured ? 'text-green-400' : 'text-red-400'}`}>
                            {config.isConfigured ? '✓ Configured' : '✗ Not Configured'}
                          </span>
                        </div>
                        {config.isConfigured && (
                          <p className="text-xs text-gray-500 mt-1 font-mono truncate">
                            {config.supabaseUrl}
                          </p>
                        )}
                      </div>
                      <div className="p-4 bg-[#1a1a1a] rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Anonymous Key</span>
                          <span className={`text-sm ${config.hasAnonKey ? 'text-green-400' : 'text-red-400'}`}>
                            {config.hasAnonKey ? '✓ Configured' : '✗ Missing'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Test Button */}
                    <div className="text-center">
                      <Button
                        onClick={handleTestConnection}
                        disabled={isTestingConnection || !config.isConfigured}
                        className="bg-white text-black hover:bg-gray-100 disabled:opacity-50"
                      >
                        {isTestingConnection ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                            Testing Connection...
                          </>
                        ) : (
                          'Test Supabase Connection'
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
                            {testResult.success && testResult.recordCount !== undefined && (
                              <p className="text-sm text-green-400 mt-1">
                                Found {testResult.recordCount} contact submissions in database
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Configuration Warning */}
                    {!config.isConfigured && (
                      <div className="p-4 bg-yellow-900/20 border border-yellow-500 rounded-lg">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
                          <div>
                            <p className="text-yellow-300 font-medium">Supabase Configuration Required</p>
                            <p className="text-yellow-400 text-sm">
                              Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.
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
                            <span className="text-gray-300">VITE_SUPABASE_URL</span>
                            <span className={`text-sm ${config.isConfigured ? 'text-green-400' : 'text-red-400'}`}>
                              {config.isConfigured ? '✓ Configured' : '✗ Missing'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-[#1a1a1a] rounded-lg">
                            <span className="text-gray-300">VITE_SUPABASE_ANON_KEY</span>
                            <span className={`text-sm ${config.hasAnonKey ? 'text-green-400' : 'text-red-400'}`}>
                              {config.hasAnonKey ? '✓ Configured' : '✗ Missing'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Supabase Configuration */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Supabase Configuration</h3>
                        <div className="space-y-3">
                          <div className="p-3 bg-[#1a1a1a] rounded-lg">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Database URL:</span>
                                <p className="text-white font-mono text-xs truncate">
                                  {config.isConfigured ? config.supabaseUrl : 'Not configured'}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-400">Table:</span>
                                <p className="text-white">contact_submissions</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Integration Type:</span>
                                <p className="text-white">Direct Database Connection</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Form Submission:</span>
                                <p className="text-white">Real-time to Supabase</p>
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
                            <li>Create a Supabase project at <a href="https://supabase.com" className="text-blue-400 hover:underline">supabase.com</a></li>
                            <li>Get your project URL and anon key from the API settings</li>
                            <li>Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables</li>
                            <li>Ensure the contact_submissions table exists with proper RLS policies</li>
                            <li>Test the connection using the Connection Test tab</li>
                          </ol>
                        </div>
                      </div>

                      {/* System Status */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-[#1a1a1a] rounded-lg">
                            <h4 className="font-medium text-white mb-2">Database Integration</h4>
                            <p className="text-sm text-gray-400">
                              Direct submission to Supabase contact_submissions table with real-time validation
                            </p>
                          </div>
                          <div className="p-4 bg-[#1a1a1a] rounded-lg">
                            <h4 className="font-medium text-white mb-2">Data Processing</h4>
                            <p className="text-sm text-gray-400">
                              Client-side form validation and direct database insertion with RLS security
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