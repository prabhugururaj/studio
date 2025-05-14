
"use client";

import type React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { detectObjectAndSpell, type DetectObjectAndSpellInput, type DetectObjectAndSpellOutput } from '@/ai/flows/detect-object-and-spell';
import { Camera, Loader2, AlertTriangle, VideoOff, ScanText, Sparkles } from 'lucide-react';

interface SpellingLearnerProps {
  onObjectDetected: (name: string, spelling: string, imageUri: string) => void;
  onDetectionError: (error: string) => void;
  isDetecting: boolean;
  setIsDetecting: (isDetecting: boolean) => void;
  detectedObjectName: string | null;
  detectedObjectSpelling: string | null;
  capturedObjectImageUri: string | null;
  detectionReason: string | null;
}

const SpellingLearner: React.FC<SpellingLearnerProps> = ({
  onObjectDetected,
  onDetectionError,
  isDetecting,
  setIsDetecting,
  detectedObjectName,
  detectedObjectSpelling,
  capturedObjectImageUri,
  detectionReason,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

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
    }
  }, []);

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

  const captureFrameAndDetect = async () => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      onDetectionError("Webcam not ready or stream not available.");
      return;
    }

    setIsDetecting(true);
    setWebcamError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setIsDetecting(false);
      onDetectionError("Could not get canvas context.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoDataUri = canvas.toDataURL('image/jpeg');

    try {
      const input: DetectObjectAndSpellInput = { photoDataUri };
      const result: DetectObjectAndSpellOutput = await detectObjectAndSpell(input);

      if (result.isObjectDetected && result.objectName && result.spelling) {
        onObjectDetected(result.objectName, result.spelling, photoDataUri);
      } else {
        onDetectionError(result.reasonIfNotDetected || "Could not detect a suitable object. Please try a different object or angle.");
      }
    } catch (err) {
      console.error("Error detecting object:", err);
      onDetectionError(err instanceof Error ? err.message : "An unknown error occurred during object detection.");
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanText className="w-6 h-6 text-primary" />
          Spelling Learner
        </CardTitle>
        <CardDescription>
          Show an object to the camera, and we'll help you learn its spelling!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6">
          <div className="w-full max-w-md aspect-video bg-muted rounded-lg overflow-hidden shadow-inner relative" data-ai-hint="toy block">
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

          {webcamError && (
            <div className="flex items-center gap-2 text-destructive p-3 bg-destructive/10 rounded-md w-full">
              <AlertTriangle size={20} />
              <p>{webcamError}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 justify-center">
            {!stream ? (
              <Button onClick={startWebcam} disabled={isDetecting} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                <Camera size={18} className="mr-2" /> Start Webcam
              </Button>
            ) : (
              <>
                <Button onClick={captureFrameAndDetect} disabled={isDetecting || !stream}>
                  {isDetecting ? (
                    <Loader2 size={18} className="mr-2 animate-spin" />
                  ) : (
                    <ScanText size={18} className="mr-2" />
                  )}
                  Detect Object
                </Button>
                <Button onClick={stopWebcam} variant="outline" disabled={isDetecting}>
                  <VideoOff size={18} className="mr-2" /> Stop Webcam
                </Button>
              </>
            )}
          </div>

          {isDetecting && (
            <div className="flex items-center gap-2 text-primary mt-4">
              <Loader2 size={20} className="animate-spin" />
              <p>Looking for an object...</p>
            </div>
          )}

          {capturedObjectImageUri && detectedObjectName && detectedObjectSpelling && (
            <Card className="mt-6 w-full bg-card shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="w-5 h-5 text-accent" />
                  Look what we found!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                  <Image
                    src={capturedObjectImageUri}
                    alt={`Captured image of ${detectedObjectName}`}
                    width={160}
                    height={120}
                    className="rounded-md border shadow-sm object-cover"
                  />
                  <div className="text-center md:text-left">
                    <p className="text-lg">
                      <span className="font-semibold text-card-foreground">Object:</span>{' '}
                      <span className="text-primary font-bold text-xl">{detectedObjectName}</span>
                    </p>
                    <p className="text-lg mt-2">
                      <span className="font-semibold text-card-foreground">Spelling:</span>{' '}
                      <span className="text-primary font-mono tracking-widest text-2xl">{detectedObjectSpelling}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {detectionReason && !detectedObjectName && (
             <div className="mt-6 w-full text-center p-4 bg-muted rounded-md">
                <p className="text-muted-foreground">{detectionReason}</p>
             </div>
          )}

        </div>
      </CardContent>
    </Card>
  );
};

export default SpellingLearner;
