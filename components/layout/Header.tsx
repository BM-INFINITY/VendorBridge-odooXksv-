"use client";

import { logoutUser } from "@/lib/actions/auth.actions";
import { getInitials } from "@/lib/utils";
import type { SessionUser } from "@/types";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  user: SessionUser;
}

// Top header bar with user profile dropdown.
export function Header({ user }: HeaderProps) {
  const initials = getInitials(`${user.firstName} ${user.lastName}`);

  return (
    <header className="flex items-center justify-between border-b bg-card px-6 h-16">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Welcome back,{" "}
          <span className="font-medium text-foreground">{user.firstName}</span>
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground h-9 w-9 items-center justify-center font-medium text-sm hover:opacity-90 transition-opacity">
            {initials}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="font-medium">{`${user.firstName} ${user.lastName}`}</p>
            <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
            <p className="text-xs text-muted-foreground font-normal capitalize">
              {user.role.replace(/_/g, " ").toLowerCase()}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive cursor-pointer"
            onClick={() => logoutUser()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
