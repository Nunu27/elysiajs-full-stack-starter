import type { Role } from '@backend/db/schema';
import {
  LayoutDashboardIcon,
  UsersIcon
} from 'lucide-react';
import type { ElementType } from 'react';

type Menu = {
  title: string;
  url: string;
  icon: ElementType;
};

type MenuWithSub = {
  title: string;
  icon: ElementType;
  items: {
    title: string;
    url: string;
  }[];
};

export type MenuItem = Menu | MenuWithSub;

export const menuByRole: Record<Role, MenuItem[]> = {
  student: [
    {
      title: 'Dashboard',
      url: '/',
      icon: LayoutDashboardIcon,
    },
  ],
  lecturer: [
    {
      title: 'Dashboard',
      url: '/',
      icon: LayoutDashboardIcon,
    },
  ],
  admin: [
    {
      title: 'Dashboard',
      url: '/',
      icon: LayoutDashboardIcon,
    },
    {
      title: 'Management',
      icon: UsersIcon,
      items: [
        {
          title: 'Users',
          url: '/management/user',
        },
      ],
    },
  ],
};
