"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ManualLocationUpdate() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees?status=active');
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const sendLocation = async () => {
    if (!selectedEmployee) {
      toast({
        title: "Select Employee",
        description: "Please select an employee first",
        variant: "destructive",
      });
      return;
    }

    if (!navigator.geolocation) {
      toast({
        title: "GPS Not Supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch('/api/tracking/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: selectedEmployee,
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              },
              status: 'active',
              activity: 'working',
              speed: position.coords.speed ? (position.coords.speed * 3.6) : 0,
              heading: position.coords.heading || 0,
              deviceInfo: navigator.userAgent,
            }),
          });

          const result = await response.json();

          if (result.success) {
            toast({
              title: "✅ Location Sent!",
              description: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
            });
            setDialogOpen(false);
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to send location",
              variant: "destructive",
            });
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        toast({
          title: "Location Error",
          description: error.message,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const openDialog = () => {
    loadEmployees();
    setDialogOpen(true);
  };

  return (
    <>
      <Button onClick={openDialog} variant="outline" size="sm">
        <MapPin className="w-4 h-4 mr-2" />
        Send My Location
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Your Location</DialogTitle>
            <DialogDescription>
              Manually update your current GPS location for tracking
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Your Employee Profile
              </label>
              {employees.length === 0 ? (
                <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                  Loading employees...
                </div>
              ) : (
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your profile..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp: any) => (
                      <SelectItem key={emp.employeeId} value={emp.employeeId}>
                        {emp.name} ({emp.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-400">
                💡 Your current GPS location will be sent to the tracking system. Make sure to allow location access when prompted.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={sendLocation}
                disabled={!selectedEmployee || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 mr-2" />
                    Send Location Now
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
