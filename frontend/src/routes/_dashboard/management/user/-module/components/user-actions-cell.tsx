import { ChangePasswordModal } from '@frontend/components/modals/change-password-modal';
import { Button } from '@frontend/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@frontend/components/ui/dropdown-menu';
import type api from '@frontend/lib/api';
import type { ExtractPaginationData } from '@frontend/lib/api-types';
import { MoreVerticalIcon } from 'lucide-react';
import { useState } from 'react';
import { DeleteUserModal } from './modals/delete-user-modal';
import { EditUserModal } from './modals/edit-user-modal';

type Item = ExtractPaginationData<typeof api.user.pagination>;

export function UserActionsCell({ user }: { user: Item }) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] =
    useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <MoreVerticalIcon />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={() => setEditDialogOpen(true)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setChangePasswordDialogOpen(true)}
            >
              Change Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteDialogOpen(true)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <EditUserModal
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={user}
      />
      <ChangePasswordModal
        open={changePasswordDialogOpen}
        onOpenChange={setChangePasswordDialogOpen}
        userId={user.id}
        userName={user.name}
      />
      <DeleteUserModal
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userId={user.id}
        userName={user.name}
        userEmail={user.email}
      />
    </>
  );
}
