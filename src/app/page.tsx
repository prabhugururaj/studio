
"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import StressAnalyzer from '@/components/stress-analyzer';
// MoodBooster component will be imported and used by StressAnalyzer directly
import SpellingLearner from '@/components/spelling-learner';
import PostureAnalyzer from '@/components/posture-analyzer';
import WellnessObserver from '@/components/wellness-observer';
import type { GenerateMoodBoostersOutput } from '@/ai/flows/generate-mood-boosters';
import type { ObserveWellnessOutput } from '@/ai/flows/observe-wellness';
import { Bot, ScanText, Smile, PersonStanding, Activity } from 'lucide-react';

export default function AiWellnessLearningPage() {
  const [stressScore, setStressScore] = useState<number | null>(null);
  const [analysisText, setAnalysisText] = useState<string>("");
  const [moodBoosters, setMoodBoosters] = useState<GenerateMoodBoostersOutput['suggestions'] | null>(null);

  const [isAnalyzingStress, setIsAnalyzingStress] = useState(false);
  const [isBoostingMood, setIsBoostingMood] = useState(false);

  // State for Spelling Learner (Kids Zone)
  const [detectedObjectName, setDetectedObjectName] = useState<string | null>(null);
  const [detectedObjectSpelling, setDetectedObjectSpelling] = useState<string | null>(null);
  const [capturedObjectImageUri, setCapturedObjectImageUri] = useState<string | null>(null);
  const [isDetectingObject, setIsDetectingObject] = useState(false);
  const [objectDetectionReason, setObjectDetectionReason] = useState<string | null>(null);

  // State for Posture Analyzer
  const [postureScore, setPostureScore] = useState<number | null>(null);
  const [postureAnalysisText, setPostureAnalysisText] = useState<string | null>(null);
  const [isAnalyzingPosture, setIsAnalyzingPosture] = useState(false);
  const [postureAnalysisMessage, setPostureAnalysisMessage] = useState<string | null>(null);
  
  // State for Wellness Observer
  const [wellnessObservationResult, setWellnessObservationResult] = useState<ObserveWellnessOutput | null>(null);
  const [isObservingWellness, setIsObservingWellness] = useState(false);
  const [wellnessObservationError, setWellnessObservationError] = useState<string | null>(null);

  const { toast } = useToast();

  const handleStressAnalyzed = (score: number, analysis: string) => {
    setStressScore(score);
    setAnalysisText(analysis);
    toast({ title: "Stress Analysis Complete!", description: `Your stress score is ${score}.` });
    // Suggest mood boosters directly if score is high
    if (score > 50) {
        toast({
            title: "High Stress Detected",
            description: "Consider getting some mood improvement suggestions below.",
            duration: 5000,
        });
    }
  };

  const handleStressAnalysisError = (errorMessage: string) => {
    toast({ variant: "destructive", title: "Stress Analysis Error", description: errorMessage });
  };

  const handleBoostersGenerated = (boosters: GenerateMoodBoostersOutput['suggestions']) => {
    setMoodBoosters(boosters);
    toast({ title: "Mood Boosters Ready!", description: "Check your personalized suggestions." });
  };

  const handleBoostingError = (errorMessage: string) => {
    toast({ variant: "destructive", title: "Mood Booster Error", description: errorMessage });
  };

  const handleObjectDetected = (name: string, spelling: string, imageUri: string) => {
    setDetectedObjectName(name);
    setDetectedObjectSpelling(spelling);
    setCapturedObjectImageUri(imageUri);
    setObjectDetectionReason(null);
    toast({ title: "Object Detected!", description: `We found a ${name}!` });
  };

  const handleObjectDetectionError = (errorMessage: string) => {
    setDetectedObjectName(null);
    setDetectedObjectSpelling(null);
    setCapturedObjectImageUri(null);
    setObjectDetectionReason(errorMessage);
    toast({ variant: "destructive", title: "Object Detection Error", description: errorMessage });
  };

  const handlePostureAnalyzed = (score: number, analysis: string) => {
    setPostureScore(score);
    setPostureAnalysisText(analysis);
    setPostureAnalysisMessage(null); 
    toast({ title: "Posture Analysis Complete!", description: `Your posture score is ${score}.` });
  };

  const handlePostureAnalysisError = (message: string) => {
    setPostureScore(null);
    setPostureAnalysisText(null);
    setPostureAnalysisMessage(message);
    toast({ variant: "destructive", title: "Posture Analysis Issue", description: message });
  };

  const handleWellnessObservationComplete = (result: ObserveWellnessOutput) => {
    setWellnessObservationResult(result);
    setWellnessObservationError(null);
    if (result.isFaceDetected) {
      toast({ title: "Wellness Observation Complete!", description: "Check the general observations." });
    } else {
      toast({ variant: "default", title: "Observation Note", description: result.observations || "Could not make an observation." });
    }
  };

  const handleWellnessObservationError = (message: string) => {
    setWellnessObservationResult(null);
    setWellnessObservationError(message);
    toast({ variant: "destructive", title: "Wellness Observation Error", description: message });
  };


  return (
    <div className="container mx-auto px-2 py-8 md:px-4 min-h-screen flex flex-col items-center">
      <header className="mb-8 md:mb-12 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/20 rounded-full mb-4">
            <Bot size={48} className="text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight"
            style={{
              background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
        >
          MedCam AI
        </h1>
        <p className="text-muted-foreground mt-2 text-lg md:text-xl max-w-2xl mx-auto">
          Analyze stress, observe wellness, improve posture, or engage in learning activities with our AI tools.
        </p>
      </header>

      <Tabs defaultValue="analyzer" className="w-full max-w-3xl">
        <TabsList className="grid w-full grid-cols-4 rounded-lg p-1 bg-muted shadow-sm">
          <TabsTrigger value="analyzer" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md transition-all">
            <Smile className="w-4 h-4 mr-2" /> Stress Analyzer
          </TabsTrigger>
           <TabsTrigger value="wellness" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md transition-all">
            <Activity className="w-4 h-4 mr-2" /> Wellness Observer
          </TabsTrigger>
          <TabsTrigger value="posture" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md transition-all">
            <PersonStanding className="w-4 h-4 mr-2" /> Posture Analyzer
          </TabsTrigger>
          <TabsTrigger value="kidszone" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:shadow-md rounded-md transition-all">
            <ScanText className="w-4 h-4 mr-2" /> Kids Zone
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyzer" className="mt-6">
          <StressAnalyzer
            onStressAnalyzed={handleStressAnalyzed}
            onAnalysisError={handleStressAnalysisError}
            isAnalyzing={isAnalyzingStress}
            setIsAnalyzing={setIsAnalyzingStress} 
            currentStressScore={stressScore}
            currentAnalysisText={analysisText}
            // MoodBooster props
            onBoostersGenerated={handleBoostersGenerated}
            onBoostingError={handleBoostingError}
            isBoostingMood={isBoostingMood}
            setIsBoostingMood={setIsBoostingMood}
            currentBoosters={moodBoosters}
          />
        </TabsContent>

        <TabsContent value="wellness" className="mt-6">
          <WellnessObserver
            onObservationComplete={handleWellnessObservationComplete}
            onObservationError={handleWellnessObservationError}
            isProcessing={isObservingWellness}
            setIsProcessing={setIsObservingWellness}
            observationResult={wellnessObservationResult}
            lastErrorMessage={wellnessObservationError}
          />
        </TabsContent>

        <TabsContent value="posture" className="mt-6">
          <PostureAnalyzer
            onPostureAnalyzed={handlePostureAnalyzed}
            onAnalysisError={handlePostureAnalysisError}
            isProcessing={isAnalyzingPosture}
            setIsProcessing={setIsAnalyzingPosture}
            analyzedScore={postureScore}
            analyzedText={postureAnalysisText}
            analysisMessage={postureAnalysisMessage}
          />
        </TabsContent>

        <TabsContent value="kidszone" className="mt-6">
          <SpellingLearner
            onObjectDetected={handleObjectDetected}
            onDetectionError={handleObjectDetectionError}
            isDetecting={isDetectingObject}
            setIsDetecting={setIsDetectingObject}
            detectedObjectName={detectedObjectName}
            detectedObjectSpelling={detectedObjectSpelling}
            capturedObjectImageUri={capturedObjectImageUri}
            detectionReason={objectDetectionReason}
          />
        </TabsContent>
      </Tabs>
       <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} MedCam AI. All rights reserved.</p>
        <p>Powered by Genkit and Next.js. Wellness features are for informational and demonstrative purposes only and not medical advice.</p>
      </footer>
    </div>
  );
}
