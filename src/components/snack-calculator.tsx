
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ParippuvadaIcon, VazhaikkapamIcon } from '@/components/snack-icons';
import { checkSnackExpert } from '@/app/actions';
import type { SnackExpertBadgeOutput } from '@/ai/flows/snack-expert-badge';
import SnackExpertBadge from './snack-expert-badge';
import { useToast } from '@/hooks/use-toast';
import { ChartConfig, ChartContainer } from './ui/chart';
import CameraUpload from './camera-upload';
import type { SnackDimensionsOutput } from '@/ai/flows/snack-dimensions';
import Leaderboard, { type SnackData } from './leaderboard';
import { UtensilsCrossed } from 'lucide-react';

const parippuvadaSchema = z.object({
  diameter: z.coerce.number().min(1, 'Must be > 0').max(100, 'Must be < 100'),
});
type ParippuvadaFormValues = z.infer<typeof parippuvadaSchema>;

const vazhaikkapamSchema = z.object({
  length: z.coerce.number().min(1, 'Must be > 0').max(100, 'Must be < 100'),
  width: z.coerce.number().min(1, 'Must be > 0').max(100, 'Must be < 100'),
});
type VazhaikkapamFormValues = z.infer<typeof vazhaikkapamSchema>;

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


export default function SnackCalculator() {
  const [parippuvadaArea, setParippuvadaArea] = useState(0);
  const [vazhaikkapamArea, setVazhaikkapamArea] = useState(0);
  const [activeTab, setActiveTab] = useState('parippuvada');
  const [expertBadge, setExpertBadge] = useState<SnackExpertBadgeOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [leaderboard, setLeaderboard] = useState<SnackData[]>(initialLeaderboard);

  const parippuvadaForm = useForm<ParippuvadaFormValues>({
    resolver: zodResolver(parippuvadaSchema),
    defaultValues: { diameter: 10 },
    mode: 'onChange',
  });

  const vazhaikkapamForm = useForm<VazhaikkapamFormValues>({
    resolver: zodResolver(vazhaikkapamSchema),
    defaultValues: { length: 12, width: 7 },
    mode: 'onChange',
  });

  const diameter = parippuvadaForm.watch('diameter');
  const { length, width } = vazhaikkapamForm.watch();

  const updateLeaderboard = (snackName: string, area: number, type: 'parippuvada' | 'vazhaikkapam') => {
    const newSnack: SnackData = { name: snackName, area, type };
    const updatedLeaderboard = [...leaderboard, newSnack]
      .sort((a, b) => b.area - a.area)
      .slice(0, 5);
    setLeaderboard(updatedLeaderboard);
  };

  const handleAreaCheck = (area: number, type: 'parippuvada' | 'vazhaikkapam') => {
    if (area <= 0) return;
    
    startTransition(async () => {
      setExpertBadge(null);
      const result = await checkSnackExpert({ snackArea: area });
      if (result.reason.includes('Could not determine')) {
        toast({
          variant: "destructive",
          title: "Ayyo! AI pani tharanu.",
          description: "Snack expert aano ennu nokkaan pattiyilla. Kurachu kazhinju try cheyyu.",
        });
      }
      setExpertBadge(result);
    });

    if (type === 'parippuvada') {
      updateLeaderboard('Nammude Parippuvada', area, 'parippuvada');
    } else if (type === 'vazhaikkapam') {
      updateLeaderboard('Nammude Vazhaikkapam', area, 'vazhaikkapam');
    }
  };
  
  const activeSnackType = activeTab;


  const handleDimensionsUpdate = (dimensions: SnackDimensionsOutput) => {
    if (dimensions.snackType === 'parippuvada' && dimensions.diameter) {
      parippuvadaForm.setValue('diameter', dimensions.diameter, { shouldValidate: true });
      setActiveTab('parippuvada');
    }
    if (dimensions.snackType === 'vazhaikkapam' && dimensions.length && dimensions.width) {
      vazhaikkapamForm.setValue('length', dimensions.length, { shouldValidate: true });
      vazhaikkapamForm.setValue('width', dimensions.width, { shouldValidate: true });
      setActiveTab('vazhaikkapam');
    }
  };


  useEffect(() => {
    parippuvadaForm.trigger('diameter');
    const { success } = parippuvadaSchema.safeParse({ diameter });
    if (success) {
      const radius = diameter / 2;
      const area = Math.PI * radius * radius;
      setParippuvadaArea(area);
      if (activeSnackType === 'parippuvada') handleAreaCheck(area, 'parippuvada');
    } else {
      setParippuvadaArea(0);
    }
  }, [diameter, parippuvadaForm.formState.isValid, activeSnackType]);

  useEffect(() => {
    vazhaikkapamForm.trigger(['length', 'width']);
    const { success } = vazhaikkapamSchema.safeParse({ length, width });
    if (success) {
      const area = Math.PI * (length / 2) * (width / 2);
      setVazhaikkapamArea(area);
      if (activeSnackType === 'vazhaikkapam') handleAreaCheck(area, 'vazhaikkapam');
    } else {
        setVazhaikkapamArea(0);
    }
  }, [length, width, vazhaikkapamForm.formState.isValid, activeSnackType]);
  
  const chartData = [
    { snack: 'Parippuvada', area: parippuvadaArea > 0 ? parippuvadaArea : null, fill: 'var(--color-parippuvada)' },
    { snack: 'Vazhaikkapam', area: vazhaikkapamArea > 0 ? vazhaikkapamArea: null, fill: 'var(--color-vazhaikkapam)' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in-0 slide-in-from-bottom-5 duration-500">
        <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                <CardTitle className="font-headline">Snack Alavumaash</CardTitle>
                <CardDescription>Snackinte alavukal koduthu area kandu pidikkam.</CardDescription>
                </CardHeader>
                <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="parippuvada">Parippuvada</TabsTrigger>
                    <TabsTrigger value="vazhaikkapam">Vazhaikkapam</TabsTrigger>
                    </TabsList>
                    <TabsContent value="parippuvada" className="mt-6">
                    <div className="grid md:grid-cols-2 gap-6 items-center">
                        <Form {...parippuvadaForm}>
                        <form className="space-y-4">
                            <FormField
                            control={parippuvadaForm.control}
                            name="diameter"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Diameter (cm)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 10" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </form>
                        </Form>
                        <div className="bg-muted rounded-lg p-6 text-center space-y-3">
                        <ParippuvadaIcon className="h-16 w-16 mx-auto text-primary" />
                        <p className="text-sm text-muted-foreground">Surface Area</p>
                        <p className="text-4xl font-bold font-mono text-primary">{parippuvadaArea.toFixed(1)} cm²</p>
                        {activeSnackType === 'parippuvada' && <SnackExpertBadge isLoading={isPending} badgeData={expertBadge} className="justify-center" />}
                        </div>
                    </div>
                    </TabsContent>
                    <TabsContent value="vazhaikkapam" className="mt-6">
                    <div className="grid md:grid-cols-2 gap-6 items-center">
                        <Form {...vazhaikkapamForm}>
                        <form className="space-y-4">
                            <FormField
                            control={vazhaikkapamForm.control}
                            name="length"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Length (cm)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 12" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={vazhaikkapamForm.control}
                            name="width"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Width (cm)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 7" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </form>
                        </Form>
                        <div className="bg-muted rounded-lg p-6 text-center space-y-3">
                        <VazhaikkapamIcon className="h-16 w-16 mx-auto text-accent" />
                        <p className="text-sm text-muted-foreground">Surface Area</p>
                        <p className="text-4xl font-bold font-mono text-accent">{vazhaikkapamArea.toFixed(1)} cm²</p>
                        {activeSnackType === 'vazhaikkapam' && <SnackExpertBadge isLoading={isPending} badgeData={expertBadge} className="justify-center" />}
                        </div>
                    </div>
                    </TabsContent>
                </Tabs>
                </CardContent>
            </Card>

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
                                    {payload[0].value?.toFixed(1)} cm²
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
            <CameraUpload onDimensionsCalculated={handleDimensionsUpdate} />
            <Leaderboard snacks={leaderboard} />
        </div>
    </div>
  );
}
