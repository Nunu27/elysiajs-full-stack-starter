import type api from '@frontend/lib/api';
import type { ExtractPaginationData } from '@frontend/lib/api-types';
import { formatTimeAgo } from '@frontend/lib/utils';
import { type ColumnDef } from '@tanstack/react-table';
import { UserActionsCell } from './components/user-actions-cell';

type Item = ExtractPaginationData<typeof api.user.pagination>;

export const userColumns: ColumnDef<Item>[] = [
  {
    accessorKey: 'index',
    enableSorting: false,
    enableHiding: false,
    size: 60,
    meta: {
      label: '#',
      center: true,
    },
    cell: ({ row }) => (
      <div className="text-center font-medium">{row.original.index}</div>
    ),
  },
  {
    accessorKey: 'email',
    size: 250,
    meta: {
      label: 'Email',
    },
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate">{row.original.email}</div>
    ),
  },
  {
    accessorKey: 'name',
    enableHiding: false,
    meta: {
      label: 'Name',
      isGrow: true,
    },
  },
  {
    accessorKey: 'role',
    size: 100,
    meta: {
      label: 'Role',
    },
  },
  {
    accessorKey: 'createdAt',
    size: 130,
    meta: {
      label: 'Created At',
    },
    cell: ({ row }) => {
      return formatTimeAgo(row.original.createdAt);
    },
  },
  {
    id: 'actions',
    size: 60,
    enableSorting: false,
    enableHiding: false,
    meta: {
      center: true,
    },
    cell: ({ row }) => <UserActionsCell user={row.original} />,
  },
];
