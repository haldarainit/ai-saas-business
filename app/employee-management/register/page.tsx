"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import {
  Camera,
  Upload,
  UserPlus,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [submissionStatus, setSubmissionStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: "user",
        },
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
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context || video.readyState < 2) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.8);
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

    if (!file.type.startsWith("image/")) {
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
    setSubmissionStatus(null);

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
      const response = await fetch("/api/employee/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          profileImage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success!",
          description: `Employee ${formData.name} registered successfully. Login credentials have been sent to ${formData.email}.`,
        });
        setSubmissionStatus({
          type: "success",
          message: `Employee ${formData.name} registered successfully. Login credentials have been sent to ${formData.email}.`,
        });

        // Show temporary password in development mode
        if (process.env.NODE_ENV === "development" && data.tempPassword) {
          toast({
            title: "Development Mode - Credentials",
            description: `Temp Password: ${data.tempPassword}`,
            duration: 10000,
          });
        }

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
        setSubmissionStatus({
          type: "error",
          message: data.error || "Failed to register employee.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register employee. Please try again.",
        variant: "destructive",
      });
      setSubmissionStatus({
        type: "error",
        message: "Failed to register employee. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-6 sm:py-8 md:py-12">
        <div className="container px-4 sm:px-6 md:px-6 max-w-4xl mx-auto">
          <Link
            href="/employee-management"
            className="text-sm text-muted-foreground hover:text-primary mb-4 sm:mb-6 inline-block"
          >
            ← Back to Employee Management
          </Link>

          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              Register New Employee
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Add employee details and capture their profile photo for face
              verification.
            </p>
          </div>

          {submissionStatus && (
            <Alert
              variant={
                submissionStatus.type === "error" ? "destructive" : "default"
              }
              className="mb-6 sm:mb-8"
            >
              {submissionStatus.type === "error" ?
                <AlertCircle className="text-destructive" />
              : <CheckCircle className="text-green-600" />}
              <AlertTitle>
                {submissionStatus.type === "error" ?
                  "Registration failed"
                : "Registration successful"}
              </AlertTitle>
              <AlertDescription>{submissionStatus.message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {/* Employee Details */}
              <Card className="p-4 sm:p-5 md:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">
                  Employee Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="employeeId">Employee ID *</Label>
                    <Input
                      id="employeeId"
                      placeholder="EMP001"
                      value={formData.employeeId}
                      onChange={(e) =>
                        setFormData({ ...formData, employeeId: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
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
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+1234567890"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) =>
                        setFormData({ ...formData, department: value })
                      }
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
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                    />
                  </div>
                </div>
              </Card>

              {/* Profile Photo */}
              <Card className="p-4 sm:p-5 md:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">
                  Profile Photo *
                </h2>

                {!imagePreview ?
                  <div className="space-y-3 sm:space-y-4">
                    {/* Camera Capture */}
                    {useCamera ?
                      <div className="space-y-3 sm:space-y-4">
                        <div
                          className="relative bg-black rounded-lg overflow-hidden"
                          style={{ aspectRatio: "4/3", minHeight: "200px" }}
                        >
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
                          />
                          {!cameraActive && (
                            <div className="absolute inset-0 flex items-center justify-center text-white">
                              <Camera className="w-12 h-12 sm:w-16 sm:h-16 opacity-50 animate-pulse" />
                            </div>
                          )}
                          <canvas ref={canvasRef} className="hidden" />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            type="button"
                            onClick={capturePhoto}
                            disabled={!cameraActive}
                            className="flex-1 w-full sm:w-auto"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            <span className="text-sm sm:text-base">
                              Capture Photo
                            </span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={stopCamera}
                            className="w-full sm:w-auto"
                          >
                            <X className="w-4 h-4 mr-2" />
                            <span className="text-sm sm:text-base">Cancel</span>
                          </Button>
                        </div>
                      </div>
                    : <div className="space-y-3 sm:space-y-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-24 sm:h-28 md:h-32"
                          onClick={() => {
                            setUseCamera(true);
                            setTimeout(startCamera, 100);
                          }}
                        >
                          <div className="flex flex-col items-center">
                            <Camera className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                            <span className="text-sm sm:text-base">
                              Use Camera
                            </span>
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
                          className="w-full h-24 sm:h-28 md:h-32"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="flex flex-col items-center">
                            <Upload className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                            <span className="text-sm sm:text-base">
                              Upload Photo
                            </span>
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
                    }

                    <div className="bg-muted p-3 rounded-lg text-xs sm:text-sm">
                      <p className="font-semibold mb-1">Photo Guidelines:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Clear, front-facing photo</li>
                        <li>Good lighting</li>
                        <li>No accessories covering face</li>
                        <li>Neutral expression</li>
                      </ul>
                    </div>
                  </div>
                : <div className="space-y-3 sm:space-y-4">
                    <div className="relative rounded-lg overflow-hidden border">
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="w-full h-auto"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm font-medium">
                        Photo captured successfully
                      </span>
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
                      <span className="text-sm sm:text-base">Retake Photo</span>
                    </Button>
                  </div>
                }
              </Card>
            </div>

            {/* Submit Button */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                <span className="text-sm sm:text-base">Cancel</span>
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                <span className="text-sm sm:text-base">
                  {loading ? "Registering..." : "Register Employee"}
                </span>
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
