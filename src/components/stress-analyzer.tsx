
"use client";

import type React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { analyzeStress, type AnalyzeStressInput, type AnalyzeStressOutput } from '@/ai/flows/analyze-stress';
import StressGauge from './stress-gauge';
import MoodBooster from './mood-booster'; // Import MoodBooster
import type { GenerateMoodBoostersOutput } from '@/ai/flows/generate-mood-boosters'; // Import type
import { Camera, Loader2, AlertTriangle, VideoOff, Smile } from 'lucide-react';
import Image from 'next/image';

interface StressAnalyzerProps {
  onStressAnalyzed: (score: number, analysis: string) => void;
  onAnalysisError: (error: string) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  currentStressScore: number | null;
  currentAnalysisText: string;
  // Props for integrated MoodBooster
  onBoostersGenerated: (boosters: GenerateMoodBoostersOutput['suggestions']) => void;
  onBoostingError: (error: string) => void;
  isBoostingMood: boolean;
  setIsBoostingMood: (isBoosting: boolean) => void;
  currentBoosters: GenerateMoodBoostersOutput['suggestions'] | null;
}

const StressAnalyzer: React.FC<StressAnalyzerProps> = ({
  onStressAnalyzed,
  onAnalysisError,
  isAnalyzing,
  setIsAnalyzing,
  currentStressScore,
  currentAnalysisText,
  // MoodBooster props
  onBoostersGenerated,
  onBoostingError,
  isBoostingMood,
  setIsBoostingMood,
  currentBoosters,
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
      setWebcamError("Could not access webcam. Please ensure permissions are granted.");
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

    setIsAnalyzing(true);
    setWebcamError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setIsAnalyzing(false);
      onAnalysisError("Could not get canvas context.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoDataUri = canvas.toDataURL('image/jpeg');

    try {
      const input: AnalyzeStressInput = { photoDataUri };
      const result: AnalyzeStressOutput = await analyzeStress(input);

      if (!result.isRelevant) {
        onAnalysisError("The image captured does not seem to be a face. Please try again.");
        return;
      }
      onStressAnalyzed(result.stressScore, result.analysis);
    } catch (err) {
      console.error("Error analyzing stress:", err);
      onAnalysisError(err instanceof Error ? err.message : "An unknown error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smile className="w-6 h-6 text-primary" /> {/* Changed icon to Smile */}
          Facial Stress Analysis
        </CardTitle>
        <CardDescription>
          Use your webcam to analyze your current stress level. Position your face clearly in the frame. 
          You can also get mood improvement suggestions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6">
          <div className="w-full max-w-md aspect-video bg-muted rounded-lg overflow-hidden shadow-inner relative">
            {showPlaceholder && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground z-10 bg-background/80">
                <VideoOff size={48} className="mb-2" />
                <p>Webcam is off or not started.</p>
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
            <div className="flex items-center gap-2 text-destructive p-3 bg-destructive/10 rounded-md">
              <AlertTriangle size={20} />
              <p>{webcamError}</p>
            </div>
          )}

          <div className="flex gap-4">
            {!stream ? (
              <Button onClick={startWebcam} disabled={isAnalyzing} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                <Camera size={18} className="mr-2" /> Start Webcam
              </Button>
            ) : (
              <>
                <Button onClick={captureFrameAndAnalyze} disabled={isAnalyzing || !stream}>
                  {isAnalyzing ? (
                    <Loader2 size={18} className="mr-2 animate-spin" />
                  ) : (
                    <Camera size={18} className="mr-2" />
                  )}
                  Analyze Stress
                </Button>
                <Button onClick={stopWebcam} variant="outline" disabled={isAnalyzing}>
                  <VideoOff size={18} className="mr-2" /> Stop Webcam
                </Button>
              </>
            )}
          </div>

          {currentStressScore !== null && (
            <div className="w-full mt-4 space-y-6">
              <StressGauge score={currentStressScore} />
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-xl">Analysis Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-card-foreground whitespace-pre-wrap">{currentAnalysisText}</p>
                </CardContent>
              </Card>
              
              {/* Integrated MoodBooster section */}
              <MoodBooster
                stressScore={currentStressScore}
                onBoostersGenerated={onBoostersGenerated}
                onBoostingError={onBoostingError}
                isBoosting={isBoostingMood}
                setIsBoosting={setIsBoostingMood}
                currentBoosters={currentBoosters}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StressAnalyzer;
