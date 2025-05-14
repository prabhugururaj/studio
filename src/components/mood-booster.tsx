"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { generateMoodBoosters, type GenerateMoodBoostersInput, type GenerateMoodBoostersOutput } from '@/ai/flows/generate-mood-boosters';
import { Loader2, AlertTriangle, Sparkles, Laugh, Music, Lightbulb } from 'lucide-react';

interface MoodBoosterProps {
  stressScore: number | null;
  onBoostersGenerated: (boosters: GenerateMoodBoostersOutput['suggestions']) => void;
  onBoostingError: (error: string) => void;
  isBoosting: boolean;
  setIsBoosting: (isBoosting: boolean) => void;
  currentBoosters: GenerateMoodBoostersOutput['suggestions'] | null;
}

const MoodBooster: React.FC<MoodBoosterProps> = ({
  stressScore,
  onBoostersGenerated,
  onBoostingError,
  isBoosting,
  setIsBoosting,
  currentBoosters,
}) => {
  const [internalError, setInternalError] = useState<string | null>(null);

  const fetchMoodBoosters = async () => {
    if (stressScore === null) {
      setInternalError("Please analyze your stress first to get personalized mood boosters.");
      return;
    }

    setIsBoosting(true);
    setInternalError(null);

    try {
      const input: GenerateMoodBoostersInput = { stressScore };
      const result = await generateMoodBoosters(input);
      onBoostersGenerated(result.suggestions);
    } catch (err) {
      console.error("Error generating mood boosters:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while fetching mood boosters.";
      onBoostingError(errorMessage);
      setInternalError(errorMessage);
    } finally {
      setIsBoosting(false);
    }
  };
  
  const getIconForSuggestion = (type: GenerateMoodBoostersOutput['suggestions'][0]['type']) => {
    switch (type) {
      case 'joke':
        return <Laugh className="w-6 h-6 text-accent-foreground" />;
      case 'affirmation':
        return <Lightbulb className="w-6 h-6 text-accent-foreground" />;
      case 'music':
        return <Music className="w-6 h-6 text-accent-foreground" />;
      default:
        return <Sparkles className="w-6 h-6 text-accent-foreground" />;
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Mood Improvement Suggestions
        </CardTitle>
        <CardDescription>
          Get AI-powered suggestions to lift your spirits based on your stress score.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6">
          {stressScore === null && !currentBoosters && (
            <p className="text-muted-foreground p-4 border border-dashed rounded-md">
              Analyze your stress on the 'Stress Analyzer' tab to unlock personalized mood boosters.
            </p>
          )}

          <Button 
            onClick={fetchMoodBoosters} 
            disabled={isBoosting || stressScore === null}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isBoosting ? (
              <Loader2 size={18} className="mr-2 animate-spin" />
            ) : (
              <Sparkles size={18} className="mr-2" />
            )}
            Get Mood Boosters
          </Button>

          {internalError && (
            <div className="flex items-center gap-2 text-destructive p-3 bg-destructive/10 rounded-md w-full">
              <AlertTriangle size={20} />
              <p>{internalError}</p>
            </div>
          )}

          {currentBoosters && currentBoosters.length > 0 && (
            <div className="w-full mt-4 space-y-4">
              <h3 className="text-xl font-semibold text-center text-foreground">Here are some suggestions for you:</h3>
              {currentBoosters.map((suggestion, index) => (
                <Card key={index} className="bg-card shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg text-card-foreground">
                      {getIconForSuggestion(suggestion.type)}
                      {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-card-foreground">{suggestion.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
           {currentBoosters && currentBoosters.length === 0 && !isBoosting && (
             <p className="text-muted-foreground mt-4">No mood boosters generated. Try again or adjust your stress score.</p>
           )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodBooster;
