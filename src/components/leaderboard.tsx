import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Crown } from 'lucide-react';
import { ParippuvadaIcon, VazhaikkapamIcon } from './snack-icons';

export interface SnackData {
  name: string;
  area: number;
  type: 'parippuvada' | 'vazhaikkapam';
}

interface LeaderboardProps {
  snacks: SnackData[];
}

const rankColors = [
    'text-amber-400', // Gold
    'text-slate-400', // Silver
    'text-orange-600', // Bronze
    'text-slate-500',
    'text-slate-500',
];

export default function Leaderboard({ snacks }: LeaderboardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Crown className="w-8 h-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-primary">Snack Hall of Fame</CardTitle>
            <CardDescription>Vellethinte rajakkal!</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] text-center">Rank</TableHead>
              <TableHead>Snack</TableHead>
              <TableHead className="text-right">Area (cm²)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snacks.map((snack, index) => (
              <TableRow key={index} className="font-medium">
                <TableCell className="text-center text-lg">
                    <span className={rankColors[index] || 'text-muted-foreground'}>
                        {index + 1}
                    </span>
                </TableCell>
                <TableCell>
                    <div className='flex items-center gap-3'>
                        {snack.type === 'parippuvada' ? 
                            <ParippuvadaIcon className="h-6 w-6 text-primary/80" /> : 
                            <VazhaikkapamIcon className="h-6 w-6 text-accent/80" />
                        }
                        <span className="font-body">{snack.name}</span>
                    </div>
                </TableCell>
                <TableCell className="text-right font-mono text-lg">{snack.area.toFixed(1)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
