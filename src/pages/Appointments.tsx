import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Calendar } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { dbOperations, generateId, getCurrentTimestamp } from "@/lib/db";

const appointmentSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  appointment_date: z.string().min(1, "Date is required"),
  appointment_time: z.string().min(1, "Time is required"),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
});

interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: string;
  notes: string | null;
  patient_full_name?: string;
  patient_number?: string;
}

interface Patient {
  id: string;
  patient_number: string;
  full_name: string;
}

const Appointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: "",
    appointment_date: "",
    appointment_time: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { user } = await getCurrentUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchAppointments();
    fetchPatients();
  };

  const fetchAppointments = async () => {
    try {
      const data = await dbOperations.getAll("appointments");
      const patients = await dbOperations.getAll("patients");
      
      // Join patient data
      const enriched = data.map(apt => {
        const patient = patients.find(p => p.id === apt.patient_id);
        return {
          ...apt,
          patient_full_name: patient?.full_name || "Unknown",
          patient_number: patient?.patient_number || "N/A",
        };
      });
      
      // Sort by date and time
      enriched.sort((a, b) => {
        const dateCompare = a.appointment_date.localeCompare(b.appointment_date);
        if (dateCompare !== 0) return dateCompare;
        return a.appointment_time.localeCompare(b.appointment_time);
      });
      
      setAppointments(enriched);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch appointments",
      });
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await dbOperations.getAll("patients");
      const active = data
        .filter(p => p.status === "active")
        .sort((a, b) => a.full_name.localeCompare(b.full_name));
      setPatients(active.map(p => ({
        id: p.id,
        patient_number: p.patient_number,
        full_name: p.full_name,
      })));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch patients",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      appointmentSchema.parse(formData);
      
      const { user } = await getCurrentUser();
      
      await dbOperations.add("appointments", {
        id: generateId(),
        patient_id: formData.patient_id,
        doctor_id: user?.id || "",
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        reason: formData.reason,
        status: "scheduled",
        notes: formData.notes || null,
        created_by: user?.id || "",
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp(),
      });

      toast({
        title: "Success",
        description: "Appointment scheduled successfully",
      });
      setIsDialogOpen(false);
      setFormData({
        patient_id: "",
        appointment_date: "",
        appointment_time: "",
        reason: "",
        notes: "",
      });
      fetchAppointments();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to schedule appointment",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: "bg-info/20 text-info",
      completed: "bg-success/20 text-success",
      cancelled: "bg-destructive/20 text-destructive",
      "no-show": "bg-warning/20 text-warning",
    };
    return colors[status as keyof typeof colors] || "bg-muted";
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
                  <Calendar className="h-6 w-6" />
                  Appointments
                </CardTitle>
                <CardDescription>Schedule and manage patient appointments</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Schedule Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Schedule New Appointment</DialogTitle>
                    <DialogDescription>Enter appointment details</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="patient_id">Patient *</Label>
                      <Select
                        value={formData.patient_id}
                        onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.patient_number} - {patient.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="appointment_date">Date *</Label>
                        <Input
                          id="appointment_date"
                          type="date"
                          value={formData.appointment_date}
                          onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="appointment_time">Time *</Label>
                        <Input
                          id="appointment_time"
                          type="time"
                          value={formData.appointment_time}
                          onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason for Visit *</Label>
                      <Textarea
                        id="reason"
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        placeholder="E.g., Regular checkup, Follow-up, Emergency..."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any special instructions or notes..."
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Scheduling..." : "Schedule Appointment"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No appointments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          {new Date(appointment.appointment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{appointment.appointment_time}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{appointment.patient_full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.patient_number}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{appointment.reason}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {appointment.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Appointments;
