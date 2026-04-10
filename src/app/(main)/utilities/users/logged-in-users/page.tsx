"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { userService } from "@/services/user-service";

export default function LoggedInUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["logged-in-sessions"],
    queryFn: () => userService.listSessions(),
  });

  const logoffMutation = useMutation({
    mutationFn: (sessionId: number) => userService.forceLogoff(sessionId),
    onSuccess: () => {
      toast.success("Session logged off");
      queryClient.invalidateQueries({ queryKey: ["logged-in-sessions"] });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to log off"),
  });

  const rows = (data?.data ?? []).filter((row: any) => {
    const s = search.toLowerCase();
    return (
      String(row.userName || "").toLowerCase().includes(s) ||
      String(row.userType || "").toLowerCase().includes(s) ||
      String(row.ipAddress || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <div className="mb-3 flex items-center justify-between">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8"
          onClick={() => queryClient.refetchQueries({ queryKey: ["logged-in-sessions"], type: "active" })}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Input className="h-8 w-48" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="text-primary-foreground">User Name</TableHead>
              <TableHead className="text-primary-foreground">Login Date</TableHead>
              <TableHead className="text-primary-foreground">Login Time</TableHead>
              <TableHead className="text-primary-foreground">User Type</TableHead>
              <TableHead className="text-primary-foreground">IP Address</TableHead>
              <TableHead className="text-primary-foreground text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center">Loading sessions...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No logged-in users.</TableCell></TableRow>
            ) : rows.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell>{row.userName}</TableCell>
                <TableCell>{row.loginDate}</TableCell>
                <TableCell>{row.loginTime}</TableCell>
                <TableCell>{row.userType}</TableCell>
                <TableCell>{row.ipAddress}</TableCell>
                <TableCell className="text-center">
                  <Button type="button" size="sm" variant="outline" onClick={() => logoffMutation.mutate(row.id)}>
                    <LogOut className="mr-1 h-3.5 w-3.5" />
                    Log Off
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
