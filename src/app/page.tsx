"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import StressAnalyzer from '@/components/stress-analyzer';
import MoodBooster from '@/components/mood-booster';
import type { GenerateMoodBoostersOutput } from '@/ai/flows/generate-mood-boosters';
import { Smile, Bot } from 'lucide-react';

export default function MoodBoostPage() {
  const [stressScore, setStressScore] = useState<number | null>(null);
  const [analysisText, setAnalysisText] = useState<string>("");
  const [moodBoosters, setMoodBoosters] = useState<GenerateMoodBoostersOutput['suggestions'] | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  
  const { toast } = useToast();

  const handleStressAnalyzed = (score: number, analysis: string) => {
    setStressScore(score);
    setAnalysisText(analysis);
    setIsAnalyzing(false); // This should be handled by StressAnalyzer itself
    toast({ title: "Stress Analysis Complete!", description: `Your stress score is ${score}. Check out the analysis.` });
    // Automatically switch to mood booster or suggest it
    if (score > 50) { // Example threshold
        toast({
            title: "Feeling Stressed?",
            description: "Consider checking the Mood Improvement tab for some suggestions.",
            duration: 5000,
        });
    }
  };

  const handleAnalysisError = (errorMessage: string) => {
    setIsAnalyzing(false); // This should be handled by StressAnalyzer itself
    toast({ variant: "destructive", title: "Analysis Error", description: errorMessage });
  };

  const handleBoostersGenerated = (boosters: GenerateMoodBoostersOutput['suggestions']) => {
    setMoodBoosters(boosters);
    setIsBoosting(false); // This should be handled by MoodBooster itself
    toast({ title: "Mood Boosters Ready!", description: "Check out your personalized suggestions." });
  };

  const handleBoostingError = (errorMessage: string) => {
    setIsBoosting(false); // This should be handled by MoodBooster itself
    toast({ variant: "destructive", title: "Mood Booster Error", description: errorMessage });
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
          MoodBoost AI
        </h1>
        <p className="text-muted-foreground mt-2 text-lg md:text-xl max-w-2xl mx-auto">
          Discover your stress levels with AI-powered facial analysis and get personalized tips to brighten your day.
        </p>
      </header>

      <Tabs defaultValue="analyzer" className="w-full max-w-3xl">
        <TabsList className="grid w-full grid-cols-2 rounded-lg p-1 bg-muted shadow-sm">
          <TabsTrigger value="analyzer" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md transition-all">
            Stress Analyzer
          </TabsTrigger>
          <TabsTrigger value="booster" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md rounded-md transition-all">
            Mood Improvement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyzer" className="mt-6">
          <StressAnalyzer
            onStressAnalyzed={handleStressAnalyzed}
            onAnalysisError={handleAnalysisError}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing} // Pass down to control shared state if needed, or let component manage its own spinner
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
            setIsBoosting={setIsBoosting} // Similar to isAnalyzing
            currentBoosters={moodBoosters}
          />
        </TabsContent>
      </Tabs>
       <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} MoodBoost AI. All rights reserved.</p>
        <p>Powered by Genkit and Next.js.</p>
      </footer>
    </div>
  );
}
