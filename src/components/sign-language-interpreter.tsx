
"use client";

import type React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { interpretSignLanguage, type InterpretSignLanguageInput, type InterpretSignLanguageOutput } from '@/ai/flows/interpret-sign-language';
import { Camera, Loader2, AlertTriangle, VideoOff, Hand, MessageSquareText } from 'lucide-react';

interface SignLanguageInterpreterProps {
  onSignInterpreted: (text: string, imageUri: string) => void;
  onInterpretationError: (error: string) => void;
  isInterpreting: boolean;
  setIsInterpreting: (isInterpreting: boolean) => void;
  interpretedText: string | null;
  capturedSignImageUri: string | null;
  interpretationMessage: string | null; // For errors or "not detected" messages
}

const SignLanguageInterpreter: React.FC<SignLanguageInterpreterProps> = ({
  onSignInterpreted,
  onInterpretationError,
  isInterpreting,
  setIsInterpreting,
  interpretedText,
  capturedSignImageUri,
  interpretationMessage,
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
      setWebcamError("Could not access webcam. Please ensure permissions are granted and camera is not in use.");
      setShowPlaceholder(true);
      onInterpretationError("Webcam access denied or unavailable.");
    }
  }, [onInterpretationError]);

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

  const captureFrameAndInterpret = async () => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      onInterpretationError("Webcam not ready or stream not available.");
      return;
    }

    setIsInterpreting(true);
    setWebcamError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setIsInterpreting(false);
      onInterpretationError("Could not get canvas context.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoDataUri = canvas.toDataURL('image/jpeg');

    try {
      const input: InterpretSignLanguageInput = { photoDataUri };
      const result: InterpretSignLanguageOutput = await interpretSignLanguage(input);

      if (result.isSignDetected && result.interpretedText) {
        onSignInterpreted(result.interpretedText, photoDataUri);
      } else {
        onInterpretationError(result.reasonIfNotDetected || "Could not interpret the sign. Please try a clearer gesture or ensure good lighting.");
      }
    } catch (err) {
      console.error("Error interpreting sign:", err);
      onInterpretationError(err instanceof Error ? err.message : "An unknown error occurred during sign interpretation.");
    } finally {
      setIsInterpreting(false);
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hand className="w-6 h-6 text-primary" />
          Sign Language to Text (Demo)
        </CardTitle>
        <CardDescription>
          Show a clear ASL sign to the camera. The AI will try to interpret it. For best results, use simple, common signs with good lighting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6">
          <div className="w-full max-w-md aspect-video bg-muted rounded-lg overflow-hidden shadow-inner relative" data-ai-hint="hand sign">
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
              <Button onClick={startWebcam} disabled={isInterpreting} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                <Camera size={18} className="mr-2" /> Start Webcam
              </Button>
            ) : (
              <>
                <Button onClick={captureFrameAndInterpret} disabled={isInterpreting || !stream}>
                  {isInterpreting ? (
                    <Loader2 size={18} className="mr-2 animate-spin" />
                  ) : (
                    <Hand size={18} className="mr-2" />
                  )}
                  Interpret Sign
                </Button>
                <Button onClick={stopWebcam} variant="outline" disabled={isInterpreting}>
                  <VideoOff size={18} className="mr-2" /> Stop Webcam
                </Button>
              </>
            )}
          </div>

          {isInterpreting && (
            <div className="flex items-center gap-2 text-primary mt-4">
              <Loader2 size={20} className="animate-spin" />
              <p>Interpreting your sign...</p>
            </div>
          )}

          {capturedSignImageUri && interpretedText && !interpretationMessage && (
            <Card className="mt-6 w-full bg-card shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <MessageSquareText className="w-5 h-5 text-accent" />
                  Interpretation Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                  <Image
                    src={capturedSignImageUri}
                    alt="Captured sign language gesture"
                    width={160}
                    height={120}
                    className="rounded-md border shadow-sm object-cover"
                  />
                  <div className="text-center md:text-left">
                    <p className="text-lg">
                      <span className="font-semibold text-card-foreground">Detected Sign:</span>{' '}
                      <span className="text-primary font-bold text-2xl">{interpretedText}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {interpretationMessage && !interpretedText && ( // Show only if there's a message and no successful interpretation
             <div className="mt-6 w-full text-center p-4 bg-muted rounded-md">
                <p className="text-muted-foreground">{interpretationMessage}</p>
             </div>
          )}

        </div>
      </CardContent>
    </Card>
  );
};

export default SignLanguageInterpreter;
