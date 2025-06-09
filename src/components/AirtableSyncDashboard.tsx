import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  Database, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  AlertCircle,
  Calendar,
  BarChart3
} from 'lucide-react'
import { airtableSyncService, type SyncLog } from '@/lib/airtable-sync'

export function AirtableSyncDashboard() {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [stats, setStats] = useState({
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    totalRecordsSynced: 0,
    lastSyncAt: undefined as string | undefined
  })

  const loadSyncLogs = async () => {
    setIsLoading(true)
    try {
      const logs = await airtableSyncService.getSyncLogs(20)
      setSyncLogs(logs)
      
      const syncStats = await airtableSyncService.getSyncStats()
      setStats(syncStats)
    } catch (error) {
      console.error('Failed to load sync logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const triggerManualSync = async () => {
    setIsSyncing(true)
    try {
      const result = await airtableSyncService.triggerManualSync()
      
      if (result.success) {
        // Refresh logs after successful sync
        setTimeout(() => {
          loadSyncLogs()
        }, 2000)
      } else {
        console.error('Sync failed:', result.error)
      }
    } catch (error) {
      console.error('Failed to trigger sync:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    loadSyncLogs()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSyncLogs, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      running: 'secondary'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const duration = Math.round((end.getTime() - start.getTime()) / 1000)
    
    if (duration < 60) {
      return `${duration}s`
    } else if (duration < 3600) {
      return `${Math.round(duration / 60)}m`
    } else {
      return `${Math.round(duration / 3600)}h`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Airtable Sync Dashboard</h2>
          <p className="text-gray-400">Monitor and manage data synchronization with Airtable</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={loadSyncLogs}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="border-gray-600 text-black hover:bg-gray-800 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={triggerManualSync}
            disabled={isSyncing}
            className="bg-white text-black hover:bg-gray-100"
          >
            <Database className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-pulse' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Manual Sync'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#2a2a2a] border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Total Syncs</p>
                <p className="text-2xl font-bold text-white">{stats.totalSyncs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2a2a2a] border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Successful</p>
                <p className="text-2xl font-bold text-white">{stats.successfulSyncs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2a2a2a] border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Records Synced</p>
                <p className="text-2xl font-bold text-white">{stats.totalRecordsSynced}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2a2a2a] border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Last Sync</p>
                <p className="text-sm font-medium text-white">
                  {stats.lastSyncAt ? formatDate(stats.lastSyncAt) : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Logs */}
      <Card className="bg-[#2a2a2a] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Sync Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Loading sync logs...</span>
            </div>
          ) : syncLogs.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No sync activity yet</p>
              <p className="text-sm text-gray-500">Trigger a manual sync to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {syncLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-gray-600"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(log.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white capitalize">
                          {log.sync_type} Sync
                        </span>
                        {getStatusBadge(log.status)}
                      </div>
                      <p className="text-sm text-gray-400">
                        Started: {formatDate(log.started_at)}
                        {log.completed_at && (
                          <span className="ml-2">
                            • Duration: {formatDuration(log.started_at, log.completed_at)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="text-gray-300">
                        <span className="text-green-400">{log.records_synced}</span> synced
                      </div>
                      {log.records_failed > 0 && (
                        <div className="text-gray-300">
                          <span className="text-red-400">{log.records_failed}</span> failed
                        </div>
                      )}
                      <div className="text-gray-400">
                        {log.records_processed} total
                      </div>
                    </div>
                    
                    {log.errors && log.errors.length > 0 && (
                      <div className="mt-2">
                        <details className="text-xs">
                          <summary className="text-red-400 cursor-pointer">
                            View Errors ({log.errors.length})
                          </summary>
                          <div className="mt-2 p-2 bg-red-900/20 rounded border border-red-500/30">
                            {log.errors.map((error, index) => (
                              <div key={index} className="text-red-300">
                                {error}
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Info */}
      <Card className="bg-[#2a2a2a] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Sync Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-white mb-2">Source</h4>
              <p className="text-sm text-gray-400">Supabase contact_submissions table</p>
              <p className="text-xs text-gray-500">Real-time sync enabled via database triggers</p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Destination</h4>
              <p className="text-sm text-gray-400">Airtable Base: appOjOMHTayU1oZLJ</p>
              <p className="text-xs text-gray-500">Table: tblhpwqJMeAIETi1v</p>
            </div>
          </div>
          
          <div className="border-t border-gray-600 pt-4">
            <h4 className="font-medium text-white mb-2">Sync Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Real-time sync on new submissions</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Duplicate detection and prevention</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Error handling and logging</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Batch processing for efficiency</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}