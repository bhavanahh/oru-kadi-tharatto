
'use client';

import { useRef, useState, useEffect, useTransition } from 'react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, FileUp, Copy } from 'lucide-react';
import { getDimensionsFromImage } from '@/app/actions';
import { Card, CardContent } from './ui/card';

interface CameraUploadProps {
    onDimensionsCalculated: (dimensions: { snackType: 'parippuvada' | 'vazhaikkapam' | 'unknown', diameter?: number | null; length?: number | null; width?: number | null }) => void;
}

export default function CameraUpload({ onDimensionsCalculated }: CameraUploadProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, startProcessing] = useTransition();
  const [analysisError, setAnalysisError] = useState<string | null>(null);
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
        setAnalysisError(null);
      }
    }
  };

  const handleAnalyze = () => {
    if (!capturedImage) return;

    startProcessing(async () => {
      setAnalysisError(null);
      const result = await getDimensionsFromImage({ imageData: capturedImage });
      
      if (result.error || result.snackType === 'unknown') {
        const errorMessage = result.error || "Ee snack manassilayilla. Vere onnu tharumo?";
        setAnalysisError(errorMessage);
      } else {
        onDimensionsCalculated({
            snackType: result.snackType,
            diameter: result.diameter,
            length: result.length,
            width: result.width,
        });
        toast({
          title: `Ithu ${result.snackType} aanu!`,
          description: "Alavukal update cheythittundu.",
        });
        setCapturedImage(null);
      }
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
        setAnalysisError(null);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const copyToClipboard = () => {
    if (analysisError) {
        navigator.clipboard.writeText(analysisError).then(() => {
            toast({
                title: "Copied!",
                description: "Error message copied to clipboard.",
            });
        });
    }
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-4">
            <div className="space-y-4">
            <div className="relative w-full overflow-hidden rounded-lg border bg-muted flex justify-center items-center">
                {capturedImage ? (
                <img src={capturedImage} alt="Captured snack" className="w-auto h-auto max-h-[400px] max-w-full rounded-lg object-contain" />
                ) : (
                <video ref={videoRef} className="w-full h-full object-cover rounded-lg" autoPlay muted playsInline />
                )}
                <canvas ref={canvasRef} className="hidden" />
                 {hasCameraPermission === null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
            </div>

            {hasCameraPermission === false && !capturedImage && (
                <Alert variant="destructive">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        Please allow camera access to use this feature or upload a file.
                    </AlertDescription>
                </Alert>
            )}

            {analysisError && (
                 <Alert variant="destructive">
                    <div className="flex justify-between items-start">
                        <div>
                            <AlertTitle>Analysis Failed</AlertTitle>
                            <AlertDescription>
                                {analysisError}
                            </AlertDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </Alert>
            )}

            {capturedImage ? (
                <div className="flex gap-2">
                    <Button onClick={handleAnalyze} disabled={isProcessing} className="w-full bg-accent hover:bg-accent/90">
                    {isProcessing ? <Loader2 className="animate-spin" /> : 'Analyze Snack'}
                    </Button>
                    <Button onClick={() => setCapturedImage(null)} variant="outline">
                    Retake
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    <Button onClick={captureImage} className="w-full" disabled={hasCameraPermission !== true}>
                        <Camera className="mr-2" /> Capture
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                        <FileUp className="mr-2" /> Upload File
                    </Button>
                    <input type="file" ref={fileInputRef} id="file-upload" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </div>
            )}
            </div>
        </CardContent>
    </Card>
  );
}
