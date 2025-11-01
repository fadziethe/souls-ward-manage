import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Users, Calendar, FileText, UserCog } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Patient Records",
      description: "Comprehensive patient information management",
    },
    {
      icon: Calendar,
      title: "Appointments",
      description: "Efficient scheduling system",
    },
    {
      icon: FileText,
      title: "Medical Records",
      description: "Secure medical history tracking",
    },
    {
      icon: UserCog,
      title: "Staff Management",
      description: "Complete staff directory",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Activity className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            All Souls Mission Hospital
          </h1>
          <p className="text-2xl text-muted-foreground mb-8">Record Management System</p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            A comprehensive healthcare management solution designed to streamline patient care, 
            appointments, and medical records for efficient hospital operations.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 py-6">
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border"
            >
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-card p-8 rounded-lg shadow-lg border max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-6">
              Join All Souls Mission Hospital's modern healthcare management system today.
            </p>
            <Button size="lg" onClick={() => navigate("/auth")} variant="default">
              Access System
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-20 py-8 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 All Souls Mission Hospital. All rights reserved.</p>
          <p className="mt-2">Secure Healthcare Management System</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
