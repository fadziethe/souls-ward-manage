import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, FileText, Search, Printer, Pencil, Trash2 } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { dbOperations, generateId, getCurrentTimestamp } from "@/lib/db";

const medicalRecordSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  visit_date: z.string().min(1, "Visit date is required"),
  diagnosis: z.string().min(5, "Diagnosis must be at least 5 characters"),
  treatment: z.string().optional(),
  prescription: z.string().optional(),
});

interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  visit_date: string;
  diagnosis: string;
  treatment: string | null;
  prescription: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  patient_full_name?: string;
  patient_number?: string;
}

interface Patient {
  id: string;
  patient_number: string;
  full_name: string;
}

const MedicalRecords = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [formData, setFormData] = useState({
    patient_id: "",
    visit_date: "",
    diagnosis: "",
    treatment: "",
    prescription: "",
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
    fetchRecords();
    fetchPatients();
  };

  const fetchRecords = async () => {
    try {
      const data = await dbOperations.getAll("medical_records");
      const patients = await dbOperations.getAll("patients");
      
      // Join patient data
      const enriched = data.map(record => {
        const patient = patients.find(p => p.id === record.patient_id);
        return {
          ...record,
          patient_full_name: patient?.full_name || "Unknown",
          patient_number: patient?.patient_number || "N/A",
        };
      });
      
      // Sort by visit date descending
      enriched.sort((a, b) => 
        new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
      );
      
      setRecords(enriched);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch medical records",
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
      medicalRecordSchema.parse(formData);
      
      const { user } = await getCurrentUser();
      
      await dbOperations.add("medical_records", {
        id: generateId(),
        patient_id: formData.patient_id,
        doctor_id: user?.id || "",
        visit_date: formData.visit_date,
        diagnosis: formData.diagnosis,
        treatment: formData.treatment || null,
        prescription: formData.prescription || null,
        notes: formData.notes || null,
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp(),
      });

      toast({
        title: "Success",
        description: "Medical record added successfully",
      });
      setIsDialogOpen(false);
      setFormData({
        patient_id: "",
        visit_date: "",
        diagnosis: "",
        treatment: "",
        prescription: "",
        notes: "",
      });
      fetchRecords();
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
          description: "Failed to add medical record",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setFormData({
      patient_id: record.patient_id,
      visit_date: record.visit_date,
      diagnosis: record.diagnosis,
      treatment: record.treatment || "",
      prescription: record.prescription || "",
      notes: record.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setIsLoading(true);

    try {
      medicalRecordSchema.parse(formData);

      const { user } = await getCurrentUser();

      await dbOperations.update("medical_records", {
        ...selectedRecord,
        patient_id: formData.patient_id,
        visit_date: formData.visit_date,
        diagnosis: formData.diagnosis,
        treatment: formData.treatment || null,
        prescription: formData.prescription || null,
        notes: formData.notes || null,
        doctor_id: selectedRecord.doctor_id,
        created_at: selectedRecord.created_at,
        updated_at: getCurrentTimestamp(),
      });

      toast({
        title: "Success",
        description: "Medical record updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedRecord(null);
      fetchRecords();
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
          description: "Failed to update medical record",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRecord) return;

    try {
      await dbOperations.delete("medical_records", selectedRecord.id);
      toast({
        title: "Success",
        description: "Medical record deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete medical record",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredRecords = records.filter(
    (record) =>
      record.patient_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.patient_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 no-print">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  Medical Records
                </CardTitle>
                <CardDescription>Patient medical history and diagnoses</CardDescription>
              </div>
              <div className="flex gap-2 no-print">
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" /> Print Report
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Record
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Medical Record</DialogTitle>
                    <DialogDescription>Enter patient medical information</DialogDescription>
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
                    <div className="space-y-2">
                      <Label htmlFor="visit_date">Visit Date *</Label>
                      <Input
                        id="visit_date"
                        type="date"
                        value={formData.visit_date}
                        onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diagnosis">Diagnosis *</Label>
                      <Textarea
                        id="diagnosis"
                        value={formData.diagnosis}
                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                        placeholder="Enter diagnosis details..."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="treatment">Treatment Plan</Label>
                      <Textarea
                        id="treatment"
                        value={formData.treatment}
                        onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                        placeholder="Recommended treatment..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prescription">Prescription</Label>
                      <Textarea
                        id="prescription"
                        value={formData.prescription}
                        onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
                        placeholder="Medications and dosage..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any additional observations..."
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Adding..." : "Add Record"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 no-print">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name, number, or diagnosis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Treatment</TableHead>
                    <TableHead>Prescription</TableHead>
                    <TableHead className="no-print">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No medical records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {new Date(record.visit_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.patient_full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {record.patient_number}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{record.diagnosis}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {record.treatment || "-"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {record.prescription || "-"}
                        </TableCell>
                        <TableCell className="no-print">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(record)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedRecord(record);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Medical Record</DialogTitle>
              <DialogDescription>Update patient medical information</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_patient_id">Patient *</Label>
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
              <div className="space-y-2">
                <Label htmlFor="edit_visit_date">Visit Date *</Label>
                <Input
                  id="edit_visit_date"
                  type="date"
                  value={formData.visit_date}
                  onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_diagnosis">Diagnosis *</Label>
                <Textarea
                  id="edit_diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_treatment">Treatment Plan</Label>
                <Textarea
                  id="edit_treatment"
                  value={formData.treatment}
                  onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_prescription">Prescription</Label>
                <Textarea
                  id="edit_prescription"
                  value={formData.prescription}
                  onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_notes">Additional Notes</Label>
                <Textarea
                  id="edit_notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Record"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the medical record for{" "}
                <strong>{selectedRecord?.patient_full_name}</strong> dated{" "}
                {selectedRecord?.visit_date}. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .container {
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MedicalRecords;
