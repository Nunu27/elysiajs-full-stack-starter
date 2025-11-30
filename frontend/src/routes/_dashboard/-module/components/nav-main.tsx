'use client';

import { ChevronRight } from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@frontend/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@frontend/components/ui/sidebar';
import type { MenuItem } from '@frontend/constants/menu';
import { Link, useRouterState } from '@tanstack/react-router';

export function NavMain({ items }: { items: MenuItem[] }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          let isChildActive = false;
          const haveSubMenu = 'items' in item;
          const subMenu = (haveSubMenu ? item.items : [])?.map((subItem) => {
            const isActive = subItem.url === pathname;
            if (!isChildActive && isActive) isChildActive = true;

            return (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton asChild>
                  <Link
                    to={subItem.url}
                    activeProps={{
                      className:
                        'bg-sidebar-accent text-sidebar-accent-foreground font-semibold',
                    }}
                  >
                    {subItem.title}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          });

          return haveSubMenu ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isChildActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className="cursor-pointer"
                    tooltip={item.title}
                  >
                    {item.icon && <item.icon />}
                    {item.title}
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>{subMenu}</SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild>
                <Link
                  to={item.url}
                  activeProps={{
                    className:
                      'bg-sidebar-accent text-sidebar-accent-foreground font-semibold',
                  }}
                >
                  {item.icon && <item.icon />}
                  {item.title}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
