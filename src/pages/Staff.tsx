import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Staff {
  id: string;
  staff_number: string;
  full_name: string;
  role: string;
  department: string | null;
  specialization: string | null;
  phone: string;
  email: string;
  hire_date: string;
}

const Staff = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { user } = await getCurrentUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchStaff();
  };

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("full_name");

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch staff",
      });
    } else {
      setStaff(data || []);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: "bg-destructive/20 text-destructive",
      doctor: "bg-primary/20 text-primary",
      nurse: "bg-secondary/20 text-secondary",
      receptionist: "bg-accent/20 text-accent",
    };
    return badges[role as keyof typeof badges] || "bg-muted";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <UserCog className="h-6 w-6" />
                  Staff Management
                </CardTitle>
                <CardDescription>Hospital staff directory and information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {staff.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No staff members found</p>
                <p className="text-sm mt-2">Staff records will appear here once added</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Hire Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.staff_number}</TableCell>
                        <TableCell>{member.full_name}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getRoleBadge(
                              member.role
                            )}`}
                          >
                            {member.role}
                          </span>
                        </TableCell>
                        <TableCell>{member.department || "-"}</TableCell>
                        <TableCell>{member.specialization || "-"}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{member.phone}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(member.hire_date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Staff;
