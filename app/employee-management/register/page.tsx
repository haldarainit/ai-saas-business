"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Camera, Upload, UserPlus, X, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RegisterEmployee() {
  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
  });
  const [profileImage, setProfileImage] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [useCamera, setUseCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setCameraActive(true);
          });
        };
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState < 2) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setProfileImage(imageData);
    setImagePreview(imageData);
    stopCamera();

    toast({
      title: "Photo Captured",
      description: "Profile photo captured successfully.",
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setProfileImage(imageData);
      setImagePreview(imageData);
      toast({
        title: "Image Uploaded",
        description: "Profile photo uploaded successfully.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.employeeId || !formData.name || !formData.email) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!profileImage) {
      toast({
        title: "Profile Photo Required",
        description: "Please capture or upload a profile photo.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          profileImage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success!",
          description: `Employee ${formData.name} registered successfully.`,
        });

        // Reset form
        setFormData({
          employeeId: "",
          name: "",
          email: "",
          phone: "",
          department: "",
          position: "",
        });
        setProfileImage("");
        setImagePreview("");
      } else {
        toast({
          title: "Registration Failed",
          description: data.error || "Failed to register employee.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register employee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <Link href="/employee-management" className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block">
            ← Back to Employee Management
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Register New Employee</h1>
            <p className="text-muted-foreground">
              Add employee details and capture their profile photo for face verification.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Employee Details */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Employee Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="employeeId">Employee ID *</Label>
                    <Input
                      id="employeeId"
                      placeholder="EMP001"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+1234567890"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData({...formData, department: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      placeholder="Software Engineer"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                    />
                  </div>
                </div>
              </Card>

              {/* Profile Photo */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Profile Photo *</h2>
                
                {!imagePreview ? (
                  <div className="space-y-4">
                    {/* Camera Capture */}
                    {useCamera ? (
                      <div className="space-y-4">
                        <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', minHeight: '300px' }}>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                          />
                          {!cameraActive && (
                            <div className="absolute inset-0 flex items-center justify-center text-white">
                              <Camera className="w-16 h-16 opacity-50 animate-pulse" />
                            </div>
                          )}
                          <canvas ref={canvasRef} className="hidden" />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={capturePhoto}
                            disabled={!cameraActive}
                            className="flex-1"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Capture Photo
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={stopCamera}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-32"
                          onClick={() => {
                            setUseCamera(true);
                            setTimeout(startCamera, 100);
                          }}
                        >
                          <div className="flex flex-col items-center">
                            <Camera className="w-8 h-8 mb-2" />
                            <span>Use Camera</span>
                          </div>
                        </Button>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                              Or
                            </span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-32"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="flex flex-col items-center">
                            <Upload className="w-8 h-8 mb-2" />
                            <span>Upload Photo</span>
                          </div>
                        </Button>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </div>
                    )}

                    <div className="bg-muted p-3 rounded-lg text-sm">
                      <p className="font-semibold mb-1">Photo Guidelines:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Clear, front-facing photo</li>
                        <li>Good lighting</li>
                        <li>No accessories covering face</li>
                        <li>Neutral expression</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden border">
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="w-full h-auto"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Photo captured successfully</span>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setProfileImage("");
                        setImagePreview("");
                      }}
                      className="w-full"
                    >
                      Retake Photo
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <UserPlus className="w-4 h-4 mr-2" />
                {loading ? "Registering..." : "Register Employee"}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
