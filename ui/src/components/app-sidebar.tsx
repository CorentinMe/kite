import * as React from 'react'
import { useEffect, useMemo } from 'react'
import Icon from '@/assets/icon.svg'
import { useSidebarConfig } from '@/contexts/sidebar-config-context'
import { CollapsibleContent } from '@radix-ui/react-collapsible'
import { IconLayoutDashboard } from '@tabler/icons-react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useSearchParams } from 'react-router-dom'

import { useEnvironmentTypes, useVersionInfo } from '@/lib/api'
import { useCluster } from '@/hooks/use-cluster'
import { cn, getEnvBgColor, getEnvDotColor, getEnvTextColor } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'

import { ClusterSelector } from './cluster-selector'
import { Collapsible, CollapsibleTrigger } from './ui/collapsible'
import { VersionInfo } from './version-info'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { isMobile, setOpenMobile } = useSidebar()

  const { config, isLoading, getIconComponent } = useSidebarConfig()
  const { clusters, currentCluster, setCurrentCluster } = useCluster()
  const { data: envTypes = [] } = useEnvironmentTypes()
  const activeEnv = searchParams.get('environment')

  useEffect(() => {
    if (!activeEnv || clusters.length === 0) return
    const envClusters = clusters.filter(
      (c) => (c.environment || 'default') === activeEnv
    )
    if (envClusters.length === 0) return
    const target = envClusters.find((c) => c.isDefault) ?? envClusters[0]
    if (target.name !== currentCluster) {
      setCurrentCluster(target.name)
    }
  }, [activeEnv, clusters])

  const environments = useMemo(() => {
    const seen = new Set<string>()
    return clusters
      .map((c) => c.environment || 'default')
      .filter((env) => {
        if (seen.has(env)) return false
        seen.add(env)
        return true
      })
      .map((env) => ({
        value: env,
        label: env.charAt(0).toUpperCase() + env.slice(1),
      }))
  }, [clusters])
  const { data: versionInfo } = useVersionInfo()

  const pinnedItems = useMemo(() => {
    if (!config) return []
    return config.groups
      .flatMap((group) => group.items)
      .filter((item) => config.pinnedItems.includes(item.id))
      .filter((item) => !config.hiddenItems.includes(item.id))
  }, [config])

  const visibleGroups = useMemo(() => {
    if (!config) return []
    return config.groups
      .filter((group) => group.visible)
      .sort((a, b) => a.order - b.order)
      .map((group) => ({
        ...group,
        items: group.items
          .filter((item) => !config.hiddenItems.includes(item.id))
          .filter((item) => !config.pinnedItems.includes(item.id))
          .sort((a, b) => a.order - b.order),
      }))
      .filter((group) => group.items.length > 0)
  }, [config])

  const isActive = (url: string) => {
    if (url === '/') {
      return location.pathname === '/'
    }
    if (url === '/crds') {
      return location.pathname == '/crds'
    }
    return location.pathname.startsWith(url)
  }

  // Handle menu item click on mobile - close sidebar
  const handleMenuItemClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  if (isLoading || !config) {
    return (
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/" onClick={handleMenuItemClick}>
                  <img src={Icon} alt="Kite Logo" className="ml-1 h-8 w-8" />
                  <span className="text-base font-semibold">Kite</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <div className="p-4 text-center text-muted-foreground">
            {t('common.messages.loading', 'Loading...')}
          </div>
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 hover:bg-accent/50 transition-colors"
            >
              <Link to="/" onClick={handleMenuItemClick}>
                <div className="relative flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <img src={Icon} alt="Kite Logo" className="h-8 w-8" />
                    <div className="flex flex-col">
                      <span className="text-base font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        Kite
                      </span>
                      <VersionInfo />
                    </div>
                  </div>
                  {versionInfo?.hasNewVersion ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (versionInfo?.releaseUrl) {
                          window.open(versionInfo.releaseUrl, '_blank')
                        }
                      }}
                      className="absolute right-0 top-0 mr-1 mt-1 rounded-sm bg-red-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-red-500 hover:bg-red-500/20"
                      title={t('sidebar.updateAvailable')}
                    >
                      New
                    </button>
                  ) : null}
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={t('nav.overview')}
                className="cursor-default transition-all duration-200 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm"
              >
                <IconLayoutDashboard className="text-sidebar-primary" />
                <span className="font-medium">{t('nav.overview')}</span>
              </SidebarMenuButton>
              {environments.length > 0 && (
                <SidebarMenuSub>
                  {environments.map((env) => {
                    const isEnvActive = searchParams.get('environment') === env.value
                    return (
                      <SidebarMenuSubItem key={env.value}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isEnvActive}
                          className={cn(
                            isEnvActive && getEnvBgColor(env.value, envTypes),
                            isEnvActive && getEnvTextColor(env.value, envTypes)
                          )}
                        >
                          <Link
                            to={`/?environment=${env.value}`}
                            onClick={handleMenuItemClick}
                          >
                            <span
                              className={cn(
                                'mr-1.5 inline-block h-2 w-2 shrink-0 rounded-full',
                                getEnvDotColor(env.value, envTypes)
                              )}
                            />
                            {env.label}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  })}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {pinnedItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {t('sidebar.pinned', 'Pinned')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {pinnedItems.map((item) => {
                  const IconComponent = getIconComponent(item.icon)
                  const title = item.titleKey
                    ? t(item.titleKey, { defaultValue: item.titleKey })
                    : ''
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        tooltip={title}
                        asChild
                        isActive={isActive(item.url)}
                      >
                        <Link to={item.url} onClick={handleMenuItemClick}>
                          <IconComponent className="text-sidebar-primary" />
                          <span>{title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleGroups.map((group) => (
          <Collapsible
            key={group.id}
            defaultOpen={!group.collapsed}
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group-data-[state=open]:text-foreground">
                  <span className="uppercase tracking-wide text-xs font-bold">
                    {group.nameKey
                      ? t(group.nameKey, { defaultValue: group.nameKey })
                      : ''}
                  </span>
                  <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent className="flex flex-col gap-2">
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const IconComponent = getIconComponent(item.icon)
                      const title = item.titleKey
                        ? t(item.titleKey, { defaultValue: item.titleKey })
                        : ''
                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            tooltip={title}
                            asChild
                            isActive={isActive(item.url)}
                          >
                            <Link to={item.url} onClick={handleMenuItemClick}>
                              <IconComponent className="text-sidebar-primary" />
                              <span>{title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5 bg-gradient-to-r from-muted/40 to-muted/20 border border-border/60 backdrop-blur-sm">
          <ClusterSelector />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
