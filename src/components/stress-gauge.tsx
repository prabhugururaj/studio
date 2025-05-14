import type React from 'react';
import { Progress } from "@/components/ui/progress";

interface StressGaugeProps {
  score: number | null;
}

const StressGauge: React.FC<StressGaugeProps> = ({ score }) => {
  if (score === null) {
    return null;
  }

  const getStressLevelText = (currentScore: number): string => {
    if (currentScore <= 33) return "Low Stress";
    if (currentScore <= 66) return "Moderate Stress";
    return "High Stress";
  };

  // Determine text color based on score using theme semantic colors
  let textColorClass = "text-secondary-foreground"; // Dark Green from theme for Low Stress
  if (score > 33 && score <= 66) textColorClass = "text-accent-foreground"; // Dark Yellow/Brown from theme for Moderate Stress
  else if (score > 66) textColorClass = "text-destructive"; // Red from theme for High Stress


  return (
    <div className="w-full my-4 p-4 border rounded-lg shadow-sm bg-card">
      <div className="flex justify-between mb-2 items-center">
        <h3 className="text-lg font-semibold text-card-foreground">Stress Level</h3>
        <span className={`text-2xl font-bold ${textColorClass}`}>{score}/100</span>
      </div>
      <Progress value={score} className="w-full h-3 rounded-full" aria-label={`Stress score: ${score} out of 100`} />
      <p className={`text-sm font-medium mt-2 text-center ${textColorClass}`}>
        {getStressLevelText(score)}
      </p>
    </div>
  );
};

export default StressGauge;
