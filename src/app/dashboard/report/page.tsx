
// "use client";

// import { useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Button } from '@/components/ui/button';
// import { Camera, MapPin, Upload } from 'lucide-react';
// import { toast } from '@/hooks/use-toast';
// import { submitReport } from '@/app/actions/report';

// export default function ReportPage() {
//   const [building, setBuilding] = useState<string>("");
//   const [level, setLevel] = useState<string>("");
//   const [side, setSide] = useState<string>("");

//   const getLevelOptions = () => {
//     return ["Basement", "1", "2", "3", "4", "5", "6"];
//   };

//   const getSideOptions = (bldg: string, lvl: string) => {
//     if (!bldg) return [];

//     // Basement Logic: Shared area
//     if (lvl === "Basement") return ["Canteen Bins", "Car Parking Bins"];

//     // Level 1 (Ground) Landmarks
//     if (lvl === "1") {
//       if (bldg === "2") return ["Student Affairs", "Accounting Department"];
//       if (bldg === "3") return ["Library", "Meeting Room"];
//       return ["Ground Floor Lobby"]; // B1 & B4
//     }

//     // X-Notation Logic: X is building number
//     // Standard Floors (Levels 2-6): Middle Room Rule (X22 and X25)
//     const standardRooms = [
//       `Room ${bldg}${lvl}2 (Front Side)`, 
//       `Room ${bldg}${lvl}5 (Behind Side)`
//     ];

//     // Level 2 Theatre Rules: B1 and B2
//     if (lvl === "2" && (bldg === "1" || bldg === "2")) {
//       return ["Theatres (Front Side Entry Only)", ...standardRooms];
//     }

//     return standardRooms;
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     toast({
//       title: "Report Submitted",
//       description: `Reported bin at Building ${building}, Floor ${level}, Location: ${side}.`,
//     });
//     setSide("");
//   };

//   return (
//     <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-8 animate-in fade-in duration-500">
//       <div className="text-center md:text-left mb-8">
//         <h2 className="text-3xl font-headline font-bold">Report a Bin</h2>
//         <p className="text-muted-foreground">Follow UIT Yangon campus logic to pinpoint disposal issues.</p>
//       </div>

//       <Card className="bg-card/50 backdrop-blur-md border-primary/20 shadow-xl overflow-hidden">
//         <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />
//         <CardHeader>
//           <CardTitle className="font-headline">Bin Location Details</CardTitle>
//           <CardDescription>Hierarchical selection based on UIT campus structure.</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div className="space-y-2">
//               <Label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Select Building</Label>
//               <Select value={building} onValueChange={(val) => { setBuilding(val); setLevel(""); setSide(""); }}>
//                 <SelectTrigger className="bg-background/50 h-12">
//                   <SelectValue placeholder="Which Building?" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="1">Building 1 (Admin & Theatre)</SelectItem>
//                   <SelectItem value="2">Building 2 (Student Center & Theatre)</SelectItem>
//                   <SelectItem value="3">Building 3 (Resource Center & Library)</SelectItem>
//                   <SelectItem value="4">Building 4 (Academic Building)</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             {building && (
//               <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
//                 <Label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Floor Level</Label>
//                 <Select value={level} onValueChange={(val) => { setLevel(val); setSide(""); }}>
//                   <SelectTrigger className="bg-background/50 h-12">
//                     <SelectValue placeholder="Select Floor" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {getLevelOptions().map((l) => (
//                       <SelectItem key={l} value={l}>{l === "Basement" ? "Shared Basement" : `Level ${l}`}</SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             )}

//             {level && (
//               <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
//                 <Label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Area / Side</Label>
//                 <Select value={side} onValueChange={setSide}>
//                   <SelectTrigger className="bg-background/50 h-12">
//                     <SelectValue placeholder="Select Specific Spot" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {getSideOptions(building, level).map((s) => (
//                       <SelectItem key={s} value={s}>{s}</SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             )}

//             <div className="space-y-4 pt-4">
//               <Label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Upload Proof</Label>
//               <div className="grid grid-cols-2 gap-4">
//                 <Button type="button" variant="outline" className="h-28 border-dashed flex flex-col gap-2 group hover:border-primary transition-colors">
//                   <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20">
//                     <Camera className="w-5 h-5 text-primary" />
//                   </div>
//                   <span className="text-[10px] font-bold tracking-widest uppercase text-foreground">Live Photo</span>
//                 </Button>
//                 <Button type="button" variant="outline" className="h-28 border-dashed flex flex-col gap-2 group hover:border-accent transition-colors">
//                   <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20">
//                     <Upload className="w-5 h-5 text-accent" />
//                   </div>
//                   <span className="text-[10px] font-bold tracking-widest uppercase text-foreground">Gallery</span>
//                 </Button>
//               </div>
//             </div>

//             <Button type="submit" className="w-full font-headline bg-primary py-7 text-lg shadow-xl shadow-primary/20" disabled={!side}>
//               Submit Bin Report
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }










// "use client";

// import { useState, useRef } from 'react';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Button } from '@/components/ui/button';
// import { Camera, MapPin, Upload, Loader2, CheckCircle2, X } from 'lucide-react'; 
// import { toast } from '@/hooks/use-toast';
// import { submitReport } from '@/app/actions/report';

// export default function ReportPage() {
//   const [building, setBuilding] = useState<string>("");
//   const [level, setLevel] = useState<string>("");
//   const [side, setSide] = useState<string>("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // NEW: State for the image file
//   const [file, setFile] = useState<File | null>(null);
//   // NEW: Reference to click the hidden input
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const getLevelOptions = () => ["Basement", "1", "2", "3", "4", "5", "6"];

//   const getSideOptions = (bldg: string, lvl: string) => {
//     if (!bldg) return [];
//     if (lvl === "Basement") return ["Canteen Bins", "Car Parking Bins"];
//     if (lvl === "1") {
//       if (bldg === "2") return ["Student Affairs", "Accounting Department"];
//       if (bldg === "3") return ["Library", "Meeting Room"];
//       return ["Ground Floor Lobby"];
//     }
//     const standardRooms = [`Room ${bldg}${lvl}2 (Front Side)`, `Room ${bldg}${lvl}5 (Behind Side)`];
//     if (lvl === "2" && (bldg === "1" || bldg === "2")) {
//       return ["Theatres (Front Side Entry Only)", ...standardRooms];
//     }
//     return standardRooms;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);

//     // Using FormData to send file + text to Server Action
//     const formData = new FormData();
//     formData.append("building", building);
//     formData.append("level", level);
//     formData.append("side", side);
//     if (file) formData.append("image", file);

//     try {
//       const response = await submitReport(formData);

//       if (response.success) {
//         toast({
//           title: "Report Submitted Successfully",
//           description: `Bin at Bldg ${building}, Lvl ${level} (${side}) has been recorded.`,
//         });
//         setBuilding("");
//         setLevel("");
//         setSide("");
//         setFile(null);
//       } else {
//         toast({
//           title: "Submission Failed",
//           description: response.error || "Could not connect to the database.",
//           variant: "destructive",
//         });
//       }
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "An unexpected error occurred.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-8 animate-in fade-in duration-500">
//       <div className="text-center md:text-left mb-8">
//         <h2 className="text-3xl font-headline font-bold">Report a Bin</h2>
//         <p className="text-muted-foreground">Follow UIT Yangon campus logic to pinpoint disposal issues.</p>
//       </div>

//       <Card className="bg-card/50 backdrop-blur-md border-primary/20 shadow-xl overflow-hidden">
//         <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />
//         <CardHeader>
//           <CardTitle className="font-headline">Bin Location Details</CardTitle>
//           <CardDescription>Hierarchical selection based on UIT campus structure.</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-6">

//             {/* Building Selection */}
//             <div className="space-y-2">
//               <Label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Select Building</Label>
//               <Select value={building} onValueChange={(val) => { setBuilding(val); setLevel(""); setSide(""); }} disabled={isSubmitting}>
//                 <SelectTrigger className="bg-background/50 h-12">
//                   <SelectValue placeholder="Which Building?" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="1">Building 1 (Admin & Theatre)</SelectItem>
//                   <SelectItem value="2">Building 2 (Student Center & Theatre)</SelectItem>
//                   <SelectItem value="3">Building 3 (Resource Center & Library)</SelectItem>
//                   <SelectItem value="4">Building 4 (Academic Building)</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             {/* Floor Selection */}
//             {building && (
//               <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
//                 <Label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Floor Level</Label>
//                 <Select value={level} onValueChange={(val) => { setLevel(val); setSide(""); }} disabled={isSubmitting}>
//                   <SelectTrigger className="bg-background/50 h-12">
//                     <SelectValue placeholder="Select Floor" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {getLevelOptions().map((l) => (
//                       <SelectItem key={l} value={l}>{l === "Basement" ? "Shared Basement" : `Level ${l}`}</SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             )}

//             {/* Area Selection */}
//             {level && (
//               <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
//                 <Label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Area / Side</Label>
//                 <Select value={side} onValueChange={setSide} disabled={isSubmitting}>
//                   <SelectTrigger className="bg-background/50 h-12">
//                     <SelectValue placeholder="Select Specific Spot" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {getSideOptions(building, level).map((s) => (
//                       <SelectItem key={s} value={s}>{s}</SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             )}

//             {/* Photo Upload - BOTH buttons now work! */}
//             <div className="space-y-4 pt-4">
//               <Label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
//                 Upload Proof {file && <span className="text-primary ml-2 text-[10px]">✔ {file.name.substring(0, 15)}...</span>}
//               </Label>

//               {/* HIDDEN FILE INPUT */}
//               <input 
//                 type="file" 
//                 ref={fileInputRef} 
//                 className="hidden" 
//                 accept="image/*" 
//                 onChange={(e) => setFile(e.target.files?.[0] || null)}
//               />

//               <div className="grid grid-cols-2 gap-4">
//                 <Button 
//                   type="button" 
//                   variant="outline" 
//                   onClick={() => fileInputRef.current?.click()}
//                   className={`h-28 border-dashed flex flex-col gap-2 group transition-colors ${file ? 'border-primary' : 'hover:border-primary'}`}
//                 >
//                   <div className={`p-2 rounded-lg ${file ? 'bg-primary/20' : 'bg-primary/10 group-hover:bg-primary/20'}`}>
//                     <Camera className="w-5 h-5 text-primary" />
//                   </div>
//                   <span className="text-[10px] font-bold tracking-widest uppercase text-foreground">
//                     {file ? "Change Photo" : "Live Photo"}
//                   </span>
//                 </Button>

//                 <Button 
//                   type="button" 
//                   variant="outline" 
//                   onClick={() => fileInputRef.current?.click()}
//                   className={`h-28 border-dashed flex flex-col gap-2 group transition-colors ${file ? 'border-accent' : 'hover:border-accent'}`}
//                 >
//                   <div className={`p-2 rounded-lg ${file ? 'bg-accent/20' : 'bg-accent/10 group-hover:bg-accent/20'}`}>
//                     <Upload className="w-5 h-5 text-accent" />
//                   </div>
//                   <span className="text-[10px] font-bold tracking-widest uppercase text-foreground">
//                     {file ? "Change Photo" : "Gallery"}
//                   </span>
//                 </Button>
//               </div>

//               {/* Remove file button if one is selected */}
//               {file && (
//                 <button type="button" onClick={() => setFile(null)} className="text-[10px] text-red-500 flex items-center gap-1">
//                   <X className="w-3 h-3" /> Remove selected photo
//                 </button>
//               )}
//             </div>

//             <Button 
//               type="submit" 
//               className="w-full font-headline bg-primary py-7 text-lg shadow-xl shadow-primary/20" 
//               disabled={!side || isSubmitting}
//             >
//               {isSubmitting ? (
//                 <>
//                   <Loader2 className="mr-2 h-5 w-5 animate-spin" />
//                   Recording Report...
//                 </>
//               ) : (
//                 "Submit Bin Report"
//               )}
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }






"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Camera, MapPin, Upload, Loader2, CheckCircle2, X, Circle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { submitReport } from '@/app/actions/report';

export default function ReportPage() {
  const [building, setBuilding] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [side, setSide] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NEW: State for camera and photo
  const [file, setFile] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getLevelOptions = () => ["Basement", "1", "2", "3", "4", "5", "6"];

  const getSideOptions = (bldg: string, lvl: string) => {
    if (!bldg) return [];
    if (lvl === "Basement") return ["Canteen Bins", "Car Parking Bins"];
    if (lvl === "1") {
      if (bldg === "2") return ["Student Affairs", "Accounting Department"];
      if (bldg === "3") return ["Library", "Meeting Room"];
      return ["Ground Floor Lobby"];
    }
    const standardRooms = [`Room ${bldg}${lvl}2 (Front Side)`, `Room ${bldg}${lvl}5 (Behind Side)`];
    if (lvl === "2" && (bldg === "1" || bldg === "2")) {
      return ["Theatres (Front Side Entry Only)"];
    }
    return standardRooms;
  };

  // --- NEW: CAMERA FUNCTIONS ---
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      toast({ title: "Error", description: "Camera access denied.", variant: "destructive" });
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);

      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], `live-photo-${Date.now()}.jpg`, { type: "image/jpeg" });
          setFile(capturedFile);
          stopCamera();
        }
      }, "image/jpeg");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("building", building);
    formData.append("level", level);
    formData.append("side", side);

    // NEW: Add email so it shows in history
    const email = localStorage.getItem("user_email");
    if (email) formData.append("email", email);

    if (file) formData.append("image", file);

    try {
      const response = await submitReport(formData);

      if (response.success) {
        toast({
          title: "Report Submitted Successfully",
          description: `Bin at Bldg ${building}, Lvl ${level} (${side}) has been recorded. Redirecting...`,
        });
        setBuilding("");
        setLevel("");
        setSide("");
        setFile(null);

        // Redirect to dashboard to show history
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        toast({
          title: "Submission Failed",
          description: response.error || "Could not connect to the database.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-8 animate-in fade-in duration-500">
      <div className="text-center md:text-left mb-8">
        <h2 className="text-3xl font-headline font-bold">Report a Bin</h2>
        <p className="text-muted-foreground">Follow UIT Yangon campus logic to pinpoint disposal issues.</p>
      </div>

      <Card className="bg-card/50 backdrop-blur-md border-primary/20 shadow-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />
        <CardHeader>
          <CardTitle className="font-headline">Bin Location Details</CardTitle>
          <CardDescription>Hierarchical selection based on UIT campus structure.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Select Building</Label>
              <Select value={building} onValueChange={(val) => { setBuilding(val); setLevel(""); setSide(""); }} disabled={isSubmitting}>
                <SelectTrigger className="bg-background/50 h-12">
                  <SelectValue placeholder="Which Building?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Building 1</SelectItem>
                  <SelectItem value="2">Building 2</SelectItem>
                  <SelectItem value="3">Building 3</SelectItem>
                  <SelectItem value="4">Building 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {building && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Floor Level</Label>
                <Select value={level} onValueChange={(val) => { setLevel(val); setSide(""); }} disabled={isSubmitting}>
                  <SelectTrigger className="bg-background/50 h-12">
                    <SelectValue placeholder="Select Floor" />
                  </SelectTrigger>
                  <SelectContent>
                    {getLevelOptions().map((l) => (
                      <SelectItem key={l} value={l}>{l === "Basement" ? "Shared Basement" : `Level ${l}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {level && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Area / Side</Label>
                <Select value={side} onValueChange={setSide} disabled={isSubmitting}>
                  <SelectTrigger className="bg-background/50 h-12">
                    <SelectValue placeholder="Select Specific Spot" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSideOptions(building, level).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-4 pt-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Upload Proof {file && <span className="text-primary ml-2 text-[10px]">✔ {file.name.substring(0, 15)}...</span>}
              </Label>

              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />

              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={startCamera}
                  className={`h-28 border-dashed flex flex-col gap-2 group transition-colors ${file ? 'border-primary' : 'hover:border-primary'}`}
                >
                  <div className={`p-2 rounded-lg ${file ? 'bg-primary/20' : 'bg-primary/10 group-hover:bg-primary/20'}`}>
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-foreground">
                    {file ? "Change Photo" : "Live Photo"}
                  </span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className={`h-28 border-dashed flex flex-col gap-2 group transition-colors ${file ? 'border-accent' : 'hover:border-accent'}`}
                >
                  <div className={`p-2 rounded-lg ${file ? 'bg-accent/20' : 'bg-accent/10 group-hover:bg-accent/20'}`}>
                    <Upload className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-foreground">
                    {file ? "Change Photo" : "Gallery"}
                  </span>
                </Button>
              </div>

              {file && (
                <button type="button" onClick={() => setFile(null)} className="text-[10px] text-red-500 flex items-center gap-1">
                  <X className="w-3 h-3" /> Remove selected photo
                </button>
              )}
            </div>

            <Button
              type="submit"
              className="w-full font-headline bg-primary py-7 text-lg shadow-xl shadow-primary/20"
              disabled={!side || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Recording Report...
                </>
              ) : (
                "Submit Bin Report"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* CAMERA OVERLAY */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover md:max-w-md md:h-[80%] md:rounded-2xl" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-10 flex items-center justify-around w-full max-w-md px-10">
            <Button variant="ghost" className="text-white" onClick={stopCamera}>Cancel</Button>
            <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-gray-400 active:scale-95 transition-transform flex items-center justify-center">
              <Circle className="w-12 h-12 text-gray-200 fill-current" />
            </button>
            <div className="w-12" />
          </div>
        </div>
      )}
    </div>
  );
}