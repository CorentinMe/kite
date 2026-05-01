import { IconCheck, IconChevronDown, IconServer } from '@tabler/icons-react'
import { useSearchParams } from 'react-router-dom'

import { useEnvironmentTypes } from '@/lib/api'
import { cn, getEnvDotColor } from '@/lib/utils'
import { useCluster } from '@/hooks/use-cluster'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ClusterSelector() {
  const {
    clusters,
    currentCluster,
    setCurrentCluster,
    isSwitching,
    isLoading,
  } = useCluster()
  const [searchParams] = useSearchParams()
  const activeEnvironment = searchParams.get('environment')
  const { data: envTypes = [] } = useEnvironmentTypes()
  const displayClusters = activeEnvironment
    ? clusters.filter((c) => c.environment === activeEnvironment)
    : clusters

  if (isLoading || isSwitching) {
    return (
      <div className="flex items-center justify-center">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        {isSwitching && (
          <span className="ml-2 text-sm text-muted-foreground">
            Switching cluster...
          </span>
        )}
      </div>
    )
  }

  const currentClusterData = clusters.find((c) => c.name === currentCluster)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 h-8 px-3 max-w-full focus-visible:ring-0 focus-visible:border-transparent"
          disabled={isSwitching}
        >
          <IconServer className="h-4 w-4" />
          <span className="text-sm font-medium truncate">
            {isSwitching
              ? 'Switching...'
              : currentClusterData?.name || 'Select Cluster'}
          </span>
          <IconChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {displayClusters.map((cluster) => (
          <DropdownMenuItem
            key={cluster.name}
            onClick={() => setCurrentCluster(cluster.name)}
            disabled={!!cluster.error}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-2">
                {cluster.environment && (
                  <span
                    className={cn(
                      'inline-block h-2 w-2 shrink-0 rounded-full',
                      getEnvDotColor(cluster.environment, envTypes)
                    )}
                  />
                )}
                <span className="font-medium">{cluster.name}</span>
                {cluster.isDefault && (
                  <Badge className="text-xs">Default</Badge>
                )}
                {cluster.error && (
                  <Badge variant="destructive" className="text-xs">
                    Sync Error
                  </Badge>
                )}
              </div>
              <span
                className={cn(
                  'text-xs truncate',
                  cluster.error
                    ? 'text-red-500'
                    : 'text-muted-foreground font-mono'
                )}
                title={cluster.error}
              >
                {cluster.error || cluster.version}
              </span>
            </div>
            {currentCluster === cluster.name && (
              <IconCheck className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
