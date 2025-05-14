
"use client";

import type React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { analyzePosture, type AnalyzePostureInput, type AnalyzePostureOutput } from '@/ai/flows/analyze-posture';
import { Camera, Loader2, AlertTriangle, VideoOff, PersonStanding, UserCheck } from 'lucide-react';

interface PostureAnalyzerProps {
  onPostureAnalyzed: (score: number, analysis: string) => void;
  onAnalysisError: (message: string) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  analyzedScore: number | null;
  analyzedText: string | null;
  analysisMessage: string | null; // For errors or "not relevant" messages
}

const PostureAnalyzer: React.FC<PostureAnalyzerProps> = ({
  onPostureAnalyzed,
  onAnalysisError,
  isProcessing,
  setIsProcessing,
  analyzedScore,
  analyzedText,
  analysisMessage,
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

  const captureFrameAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      onAnalysisError("Webcam not ready or stream not available.");
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
      onAnalysisError("Could not get canvas context.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoDataUri = canvas.toDataURL('image/jpeg');
    setCapturedImageUri(photoDataUri); // Store captured image for display

    try {
      const input: AnalyzePostureInput = { photoDataUri };
      const result: AnalyzePostureOutput = await analyzePosture(input);

      if (result.isRelevant) {
        onPostureAnalyzed(result.postureScore, result.analysis);
      } else {
        // If not relevant, the 'analysis' field from the flow contains the reason.
        onAnalysisError(result.analysis || "The image was not suitable for posture analysis.");
      }
    } catch (err) {
      console.error("Error analyzing posture:", err);
      onAnalysisError(err instanceof Error ? err.message : "An unknown error occurred during posture analysis.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PersonStanding className="w-6 h-6 text-primary" />
          Posture Analyzer
        </CardTitle>
        <CardDescription>
          Use your webcam to analyze your posture. Try to capture your upper body or full body in the frame.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6">
          <div className="w-full max-w-md aspect-video bg-muted rounded-lg overflow-hidden shadow-inner relative" data-ai-hint="person standing">
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
              <Button onClick={startWebcam} disabled={isProcessing} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                <Camera size={18} className="mr-2" /> Start Webcam
              </Button>
            ) : (
              <>
                <Button onClick={captureFrameAndAnalyze} disabled={isProcessing || !stream}>
                  {isProcessing ? (
                    <Loader2 size={18} className="mr-2 animate-spin" />
                  ) : (
                    <PersonStanding size={18} className="mr-2" />
                  )}
                  Analyze Posture
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
              <p>Analyzing your posture...</p>
            </div>
          )}

          {analyzedScore !== null && analyzedText && (
            <Card className="mt-6 w-full bg-card shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Posture Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {capturedImageUri && (
                     <Image
                        src={capturedImageUri}
                        alt="Captured image for posture analysis"
                        width={240} // Adjusted size
                        height={180} // Adjusted size
                        className="rounded-md border shadow-sm object-cover mx-auto"
                      />
                )}
                <p className="text-lg text-center md:text-left">
                  <span className="font-semibold text-card-foreground">Posture Score:</span>{' '}
                  <span className="text-primary font-bold text-2xl">{analyzedScore}/100</span>
                </p>
                <div>
                  <h4 className="font-semibold text-card-foreground text-center md:text-left">Feedback & Suggestions:</h4>
                  <p className="text-card-foreground whitespace-pre-wrap mt-1">{analyzedText}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {analysisMessage && analyzedScore === null && ( // Show only if there's no score (i.e., it's an error or "not relevant" message)
             <div className="mt-6 w-full text-center p-4 bg-muted rounded-md">
                <p className="text-muted-foreground">{analysisMessage}</p>
             </div>
          )}

        </div>
      </CardContent>
    </Card>
  );
};

export default PostureAnalyzer;
