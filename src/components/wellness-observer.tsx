
"use client";

import type React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { observeWellness, type ObserveWellnessInput, type ObserveWellnessOutput } from '@/ai/flows/observe-wellness';
import { Camera, Loader2, AlertTriangle, VideoOff, Eye, ShieldAlert } from 'lucide-react';

interface WellnessObserverProps {
  onObservationComplete: (result: ObserveWellnessOutput) => void;
  onObservationError: (message: string) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  observationResult: ObserveWellnessOutput | null;
  lastErrorMessage: string | null;
}

const WellnessObserver: React.FC<WellnessObserverProps> = ({
  onObservationComplete,
  onObservationError,
  isProcessing,
  setIsProcessing,
  observationResult,
  lastErrorMessage,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);

  const startWebcam = useCallback(async () => {
    try {
      setWebcamError(null);
      setShowPlaceholder(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setWebcamError("Could not access webcam. Please ensure permissions are granted and your camera is not in use by another app.");
      setShowPlaceholder(true);
      onObservationError("Webcam access denied or unavailable.");
    }
  }, [onObservationError]);

  const stopWebcam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setShowPlaceholder(true);
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const captureFrameAndObserve = async () => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      onObservationError("Webcam not ready or stream not available.");
      return;
    }

    setIsProcessing(true);
    setWebcamError(null);
    setCapturedImageUri(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setIsProcessing(false);
      onObservationError("Could not get canvas context.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoDataUri = canvas.toDataURL('image/jpeg');
    setCapturedImageUri(photoDataUri);

    try {
      const input: ObserveWellnessInput = { photoDataUri };
      const result: ObserveWellnessOutput = await observeWellness(input);
      onObservationComplete(result);
    } catch (err) {
      console.error("Error observing wellness:", err);
      onObservationError(err instanceof Error ? err.message : "An unknown error occurred during observation.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-6 h-6 text-primary" />
          Wellness Observer (Demo)
        </CardTitle>
        <CardDescription>
          Capture an image of your face for general, non-medical visual observations. Position your face clearly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-6">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle>Important Disclaimer</AlertTitle>
          <AlertDescription>
            This feature is for demonstration purposes only and provides general, non-medical visual observations. 
            It is NOT a medical diagnosis. Always consult a healthcare professional for any health concerns.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col items-center gap-6">
          <div className="w-full max-w-md aspect-video bg-muted rounded-lg overflow-hidden shadow-inner relative" data-ai-hint="person face">
            {showPlaceholder && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground z-10 bg-background/80">
                <VideoOff size={48} className="mb-2" />
                <p>Webcam is off. Click "Start Webcam".</p>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${showPlaceholder ? 'opacity-0' : 'opacity-100'}`}
              onCanPlay={() => setShowPlaceholder(false)}
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {webcamError && !lastErrorMessage && ( // Show webcamError only if there isn't a more specific lastErrorMessage
            <div className="flex items-center gap-2 text-destructive p-3 bg-destructive/10 rounded-md w-full">
              <AlertTriangle size={20} />
              <p>{webcamError}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 justify-center">
            {!stream ? (
              <Button onClick={startWebcam} disabled={isProcessing} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                <Camera size={18} className="mr-2" /> Start Webcam
              </Button>
            ) : (
              <>
                <Button onClick={captureFrameAndObserve} disabled={isProcessing || !stream}>
                  {isProcessing ? (
                    <Loader2 size={18} className="mr-2 animate-spin" />
                  ) : (
                    <Eye size={18} className="mr-2" />
                  )}
                  Observe Wellness
                </Button>
                <Button onClick={stopWebcam} variant="outline" disabled={isProcessing}>
                  <VideoOff size={18} className="mr-2" /> Stop Webcam
                </Button>
              </>
            )}
          </div>

          {isProcessing && (
            <div className="flex items-center gap-2 text-primary mt-4">
              <Loader2 size={20} className="animate-spin" />
              <p>Observing...</p>
            </div>
          )}

          {lastErrorMessage && !isProcessing && (
            <div className="flex items-center gap-2 text-destructive p-3 bg-destructive/10 rounded-md w-full mt-4">
              <AlertTriangle size={20} />
              <p>{lastErrorMessage}</p>
            </div>
          )}
          
          {observationResult && !isProcessing && !lastErrorMessage && (
            <Card className="mt-6 w-full bg-card shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Eye className="w-5 h-5 text-primary" />
                  Wellness Observation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {capturedImageUri && (
                     <Image
                        src={capturedImageUri}
                        alt="Captured image for wellness observation"
                        width={240}
                        height={180}
                        className="rounded-md border shadow-sm object-cover mx-auto"
                      />
                )}
                <div>
                  <h4 className="font-semibold text-card-foreground">Observations:</h4>
                  <p className="text-card-foreground whitespace-pre-wrap mt-1">
                    {observationResult.isFaceDetected ? observationResult.observations : "Could not make an observation: " + observationResult.observations}
                  </p>
                </div>
                 <Alert variant="default" className="mt-4">
                  <ShieldAlert className="h-5 w-5" />
                  <AlertTitle>Important Reminder</AlertTitle>
                  <AlertDescription>
                    {observationResult.disclaimer}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WellnessObserver;
