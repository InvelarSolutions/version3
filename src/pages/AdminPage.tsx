import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Database, Settings, Activity, TestTube, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DatabaseStatus } from '@/components/DatabaseStatus';
import { AirtableSyncDashboard } from '@/components/AirtableSyncDashboard';
import { AirtableSyncTest } from '@/components/AirtableSyncTest';
import { AirtableSyncTroubleshooter } from '@/components/AirtableSyncTroubleshooter';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'troubleshoot' | 'database' | 'sync' | 'test' | 'settings'>('troubleshoot');

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
              Monitor system status, manage data sync, and configure settings
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-8 bg-[#2a2a2a] rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab('troubleshoot')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                activeTab === 'troubleshoot'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Wrench className="h-4 w-4 mr-2 inline" />
              Troubleshoot
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                activeTab === 'test'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <TestTube className="h-4 w-4 mr-2 inline" />
              Sync Test
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                activeTab === 'database'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Database className="h-4 w-4 mr-2 inline" />
              Database
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                activeTab === 'sync'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Activity className="h-4 w-4 mr-2 inline" />
              Airtable Sync
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
            {activeTab === 'troubleshoot' && (
              <div>
                <AirtableSyncTroubleshooter />
              </div>
            )}

            {activeTab === 'test' && (
              <div>
                <AirtableSyncTest />
              </div>
            )}

            {activeTab === 'database' && (
              <div>
                <DatabaseStatus />
              </div>
            )}

            {activeTab === 'sync' && (
              <div>
                <AirtableSyncDashboard />
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
                            <span className={`text-sm ${import.meta.env.VITE_SUPABASE_URL ? 'text-green-400' : 'text-red-400'}`}>
                              {import.meta.env.VITE_SUPABASE_URL ? '✓ Configured' : '✗ Missing'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-[#1a1a1a] rounded-lg">
                            <span className="text-gray-300">VITE_SUPABASE_ANON_KEY</span>
                            <span className={`text-sm ${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'text-green-400' : 'text-red-400'}`}>
                              {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Configured' : '✗ Missing'}
                            </span>
                          </div>
                          <div className="p-3 bg-[#1a1a1a] rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-300">AIRTABLE_API_KEY</span>
                              <span className="text-sm text-yellow-400">Server-side only</span>
                            </div>
                            <p className="text-xs text-gray-500">
                              This environment variable is configured on the Supabase server and not visible in the client.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Sync Configuration */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Airtable Configuration</h3>
                        <div className="space-y-3">
                          <div className="p-3 bg-[#1a1a1a] rounded-lg">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Base ID:</span>
                                <p className="text-white font-mono">appOjOMHTayU1oZLJ</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Table ID:</span>
                                <p className="text-white font-mono">tblhpwqJMeAIETi1v</p>
                              </div>
                              <div>
                                <span className="text-gray-400">View ID:</span>
                                <p className="text-white font-mono">viwEO6AvLQ641myYg</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Sync Type:</span>
                                <p className="text-white">Real-time + Scheduled</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* System Status */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-[#1a1a1a] rounded-lg">
                            <h4 className="font-medium text-white mb-2">Database Connection</h4>
                            <p className="text-sm text-gray-400">
                              Real-time connection to Supabase database for contact submissions
                            </p>
                          </div>
                          <div className="p-4 bg-[#1a1a1a] rounded-lg">
                            <h4 className="font-medium text-white mb-2">Edge Functions</h4>
                            <p className="text-sm text-gray-400">
                              Serverless functions for Airtable sync and data processing
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