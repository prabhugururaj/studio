
"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import StressAnalyzer from '@/components/stress-analyzer';
import MoodBooster from '@/components/mood-booster';
import SpellingLearner from '@/components/spelling-learner';
import type { GenerateMoodBoostersOutput } from '@/ai/flows/generate-mood-boosters';
import { Bot, ScanText, Smile } from 'lucide-react';

export default function AiWellnessLearningPage() {
  const [stressScore, setStressScore] = useState<number | null>(null);
  const [analysisText, setAnalysisText] = useState<string>("");
  const [moodBoosters, setMoodBoosters] = useState<GenerateMoodBoostersOutput['suggestions'] | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);

  // State for Spelling Learner
  const [detectedObjectName, setDetectedObjectName] = useState<string | null>(null);
  const [detectedObjectSpelling, setDetectedObjectSpelling] = useState<string | null>(null);
  const [capturedObjectImageUri, setCapturedObjectImageUri] = useState<string | null>(null);
  const [isDetectingObject, setIsDetectingObject] = useState(false);
  const [objectDetectionReason, setObjectDetectionReason] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleStressAnalyzed = (score: number, analysis: string) => {
    setStressScore(score);
    setAnalysisText(analysis);
    // setIsAnalyzing is handled within StressAnalyzer
    toast({ title: "Stress Analysis Complete!", description: `Your stress score is ${score}.` });
    if (score > 50) {
        toast({
            title: "Feeling Stressed?",
            description: "Consider checking the Mood Improvement tab.",
            duration: 5000,
        });
    }
  };

  const handleAnalysisError = (errorMessage: string) => {
    // setIsAnalyzing is handled within StressAnalyzer
    toast({ variant: "destructive", title: "Analysis Error", description: errorMessage });
  };

  const handleBoostersGenerated = (boosters: GenerateMoodBoostersOutput['suggestions']) => {
    setMoodBoosters(boosters);
    // setIsBoosting is handled within MoodBooster
    toast({ title: "Mood Boosters Ready!", description: "Check your personalized suggestions." });
  };

  const handleBoostingError = (errorMessage: string) => {
    // setIsBoosting is handled within MoodBooster
    toast({ variant: "destructive", title: "Mood Booster Error", description: errorMessage });
  };

  // Handlers for Spelling Learner
  const handleObjectDetected = (name: string, spelling: string, imageUri: string) => {
    setDetectedObjectName(name);
    setDetectedObjectSpelling(spelling);
    setCapturedObjectImageUri(imageUri);
    setObjectDetectionReason(null); // Clear any previous error/reason
    toast({ title: "Object Detected!", description: `We found a ${name}!` });
  };

  const handleObjectDetectionError = (errorMessage: string) => {
    setDetectedObjectName(null);
    setDetectedObjectSpelling(null);
    setCapturedObjectImageUri(null);
    setObjectDetectionReason(errorMessage);
    toast({ variant: "destructive", title: "Object Detection Error", description: errorMessage });
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
          AI Wellness & Learning Hub
        </h1>
        <p className="text-muted-foreground mt-2 text-lg md:text-xl max-w-2xl mx-auto">
          Analyze stress, boost your mood, or learn spelling with our AI tools.
        </p>
      </header>

      <Tabs defaultValue="analyzer" className="w-full max-w-3xl">
        <TabsList className="grid w-full grid-cols-3 rounded-lg p-1 bg-muted shadow-sm">
          <TabsTrigger value="analyzer" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md transition-all">
            <Smile className="w-4 h-4 mr-2" /> Stress Analyzer
          </TabsTrigger>
          <TabsTrigger value="booster" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md rounded-md transition-all">
            Mood Improvement
          </TabsTrigger>
          <TabsTrigger value="spelling" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:shadow-md rounded-md transition-all">
            <ScanText className="w-4 h-4 mr-2" /> Spelling Learner
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyzer" className="mt-6">
          <StressAnalyzer
            onStressAnalyzed={handleStressAnalyzed}
            onAnalysisError={handleAnalysisError}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing} 
            currentStressScore={stressScore}
            currentAnalysisText={analysisText}
          />
        </TabsContent>

        <TabsContent value="booster" className="mt-6">
          <MoodBooster
            stressScore={stressScore}
            onBoostersGenerated={handleBoostersGenerated}
            onBoostingError={handleBoostingError}
            isBoosting={isBoosting}
            setIsBoosting={setIsBoosting}
            currentBoosters={moodBoosters}
          />
        </TabsContent>

        <TabsContent value="spelling" className="mt-6">
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
        <p>&copy; {new Date().getFullYear()} AI Wellness & Learning Hub. All rights reserved.</p>
        <p>Powered by Genkit and Next.js.</p>
      </footer>
    </div>
  );
}
