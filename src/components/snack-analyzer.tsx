
'use client';

import { useEffect, useState, useTransition } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ParippuvadaIcon, VazhaikkapamIcon } from '@/components/snack-icons';
import type { SnackAnalysisResult } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ChartConfig, ChartContainer } from './ui/chart';
import CameraUpload from './camera-upload';
import Leaderboard, { type SnackData } from './leaderboard';
import { UtensilsCrossed, MessageSquareQuote } from 'lucide-react';
import Image from 'next/image';

const chartConfig = {
  area: {
    label: "Area (cm²)",
  },
  parippuvada: {
    label: "Parippuvada",
    color: "hsl(var(--primary))",
  },
  vazhaikkapam: {
    label: "Vazhaikkapam",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

const initialLeaderboard: SnackData[] = [
  { name: 'Amma\'s Special Parippuvada', area: 153.9, type: 'parippuvada' },
  { name: 'The Colossal Vazhaikkapam', area: 125.6, type: 'vazhaikkapam' },
  { name: 'Chettan\'s Crispy Parippuvada', area: 95.0, type: 'parippuvada' },
  { name: 'Standard Tea-Stall Vada', area: 78.5, type: 'parippuvada' },
  { name: 'Afternoon Delight Vazhaikkapam', area: 65.3, type: 'vazhaikkapam' },
];

interface SnackResult extends SnackAnalysisResult {
    imageData: string | null;
}

export default function SnackAnalyzer() {
  const [snackResult, setSnackResult] = useState<SnackResult | null>(null);
  const { toast } = useToast();
  const [leaderboard, setLeaderboard] = useState<SnackData[]>(initialLeaderboard);
  const [chartData, setChartData] = useState<{ snack: string; area: number; fill: string; }[]>([]);

  const updateLeaderboard = (snackName: string, area: number, type: 'parippuvada' | 'vazhaikkapam') => {
    const newSnack: SnackData = { name: snackName, area, type };
    const updatedLeaderboard = [...leaderboard, newSnack]
      .sort((a, b) => b.area - a.area)
      .slice(0, 5);
    setLeaderboard(updatedLeaderboard);
  };
  
  const handleAnalysisComplete = (result: SnackAnalysisResult & { imageData: string }) => {
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Ayyo! Oru pani kitti.",
        description: result.error,
      });
      setSnackResult(null);
      return;
    }
    
    setSnackResult({ ...result, imageData: result.imageData });

    if (result.snackType && result.snackType !== 'unknown' && result.area && result.area > 0) {
      updateLeaderboard(`Your ${result.snackType}`, result.area, result.snackType);
    }
  };
  
  useEffect(() => {
    const latestParippuvada = leaderboard.find(s => s.type === 'parippuvada');
    const latestVazhaikkapam = leaderboard.find(s => s.type === 'vazhaikkapam');

    const data = [];
    if (latestParippuvada) {
        data.push({ snack: 'Parippuvada', area: latestParippuvada.area, fill: 'var(--color-parippuvada)' });
    }
    if (latestVazhaikkapam) {
        data.push({ snack: 'Vazhaikkapam', area: latestVazhaikkapam.area, fill: 'var(--color-vazhaikkapam)' });
    }
    setChartData(data);
  }, [leaderboard]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in-0 slide-in-from-bottom-5 duration-500">
        <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className="font-headline">Snack Analyzer</CardTitle>
                    <CardDescription>Upload or snap a picture of your snack to see how it measures up!</CardDescription>
                </CardHeader>
                <CardContent>
                   <CameraUpload onAnalysisComplete={handleAnalysisComplete} />
                </CardContent>
            </Card>

            {snackResult && !snackResult.error && snackResult.area ? (
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-in fade-in-0 zoom-in-95 duration-500">
                  <CardHeader>
                      <CardTitle className="font-headline">Analysis Results</CardTitle>
                      <CardDescription>Here's the lowdown on your snack.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="grid md:grid-cols-2 gap-6 items-center">
                          {snackResult.imageData && (
                              <Image
                                  src={snackResult.imageData}
                                  alt="Analyzed snack"
                                  width={400}
                                  height={400}
                                  className="rounded-lg object-contain border bg-muted"
                                  data-ai-hint="snack"
                              />
                          )}
                          <div className="bg-muted rounded-lg p-6 text-center space-y-3">
                              {snackResult.snackType === 'parippuvada' ? 
                                  <ParippuvadaIcon className="h-16 w-16 mx-auto text-primary" /> :
                                  <VazhaikkapamIcon className="h-16 w-16 mx-auto text-accent" />
                              }
                              <p className="text-lg">Ithu oru <span className="font-bold capitalize text-primary">{snackResult.snackType}</span> aanu!</p>
                              
                              <div>
                                  <p className="text-sm text-muted-foreground">Surface Area</p>
                                  <p className="text-4xl font-bold font-mono text-primary">{snackResult.area?.toFixed(1)} cm²</p>
                              </div>
                              
                              <div className="text-sm text-muted-foreground border-t border-border pt-3">
                                  {snackResult.snackType === 'parippuvada' && snackResult.diameter && snackResult.diameter > 0 && (
                                      <div>
                                          <p>Perimeter: <span className="font-mono font-medium text-foreground">{(Math.PI * snackResult.diameter).toFixed(1)} cm</span></p>
                                      </div>
                                  )}
                                  {snackResult.snackType === 'vazhaikkapam' && snackResult.length && snackResult.length > 0 && snackResult.width && snackResult.width > 0 && (
                                      <div className="flex justify-center gap-4">
                                          <p>Length: <span className="font-mono font-medium text-foreground">{snackResult.length.toFixed(1)} cm</span></p>
                                          <p>Width: <span className="font-mono font-medium text-foreground">{snackResult.width.toFixed(1)} cm</span></p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                      {snackResult.commentary && (
                          <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                              <div className="flex">
                                  <div className="flex-shrink-0">
                                      <MessageSquareQuote className="h-5 w-5 text-amber-500" aria-hidden="true" />
                                  </div>
                                  <div className="ml-3">
                                      <p className="text-sm text-amber-800">
                                          {snackResult.commentary}
                                      </p>
                                  </div>
                              </div>
                          </div>
                      )}
                  </CardContent>
              </Card>
            ) : (
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="font-headline">Awaiting Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-muted rounded-lg p-6 text-center space-y-3 flex flex-col items-center justify-center min-h-[250px]">
                            <UtensilsCrossed className="h-16 w-16 mx-auto text-muted-foreground/50" />
                            <p className="text-muted-foreground">Waiting for a snack...</p>
                            <p className="text-sm text-muted-foreground/80">Your snack analysis will appear here.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <UtensilsCrossed className="w-6 h-6 text-primary" />
                        <div>
                        <CardTitle className="font-headline">Snack Porattam</CardTitle>
                        <CardDescription>Ningade snackukal thammil oru cheriya malsaram.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="snack" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis />
                    <ChartTooltip
                        content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Snack
                                    </span>
                                    <span className="font-bold text-muted-foreground">
                                    {payload[0].payload.snack}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Area
                                    </span>
                                    <span className="font-bold">
                                    {payload[0].value ? Number(payload[0].value).toFixed(1) : 0} cm²
                                    </span>
                                </div>
                                </div>
                            </div>
                            )
                        }

                        return null
                        }}
                    />
                    <Bar dataKey="area" radius={8} />
                    </BarChart>
                </ChartContainer>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-8">
            <Leaderboard snacks={leaderboard} />
        </div>
    </div>
  );
}
