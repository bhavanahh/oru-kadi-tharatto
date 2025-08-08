
'use client';

import { useRef, useState, useEffect, useTransition } from 'react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Upload } from 'lucide-react';
import { getDimensionsFromImage } from '@/app/actions';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

interface CameraUploadProps {
    onDimensionsCalculated: (dimensions: { diameter?: number | null; length?: number | null; width?: number | null }) => void;
}

export default function CameraUpload({ onDimensionsCalculated }: CameraUploadProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, startProcessing] = useTransition();
  const [snackType, setSnackType] = useState<'parippuvada' | 'vazhaikkapam'>('parippuvada');
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();
    
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast]);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleAnalyze = () => {
    if (!capturedImage) return;

    startProcessing(async () => {
      const result = await getDimensionsFromImage({ imageData: capturedImage, snackType });
      
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: result.error,
        });
      } else {
        onDimensionsCalculated({
            diameter: result.diameter,
            length: result.length,
            width: result.width,
        });
        toast({
          title: 'Analysis Complete!',
          description: "We've updated the measurements for your snack.",
        });
      }
      setCapturedImage(null); // Return to camera view after analysis
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  if (hasCameraPermission === null) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }
  
  if (hasCameraPermission === false) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Camera Access Required</AlertTitle>
        <AlertDescription>
          Please allow camera access in your browser to use this feature. You can still upload a file.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
             <Button onClick={() => document.getElementById('file-upload')?.click()}>
                <Upload className="mr-2" /> Upload File
            </Button>
            <input type="file" id="file-upload" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </div>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            {capturedImage ? (
            <img src={capturedImage} alt="Captured snack" className="h-full w-full object-cover" />
            ) : (
            <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>

        {hasCameraPermission === false && !capturedImage && (
            <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                    Please allow camera access to use this feature or upload a file.
                </AlertDescription>
            </Alert>
        )}

        {capturedImage ? (
            <div className="space-y-4">
            <Tabs value={snackType} onValueChange={(value) => setSnackType(value as 'parippuvada' | 'vazhaikkapam')}>
                <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="parippuvada">Parippuvada</TabsTrigger>
                <TabsTrigger value="vazhaikkapam">Vazhaikkapam</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="flex gap-2">
                <Button onClick={handleAnalyze} disabled={isProcessing} className="w-full">
                {isProcessing ? <Loader2 className="animate-spin" /> : 'Analyze Snack'}
                </Button>
                <Button onClick={() => setCapturedImage(null)} variant="outline">
                Retake
                </Button>
            </div>
            </div>
        ) : (
            <Button onClick={captureImage} className="w-full" disabled={hasCameraPermission === false}>
                <Camera className="mr-2" /> Capture
            </Button>
        )}
    </div>
  );
}
