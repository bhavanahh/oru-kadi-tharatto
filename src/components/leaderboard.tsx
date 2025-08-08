
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Crown } from 'lucide-react';
import { ParippuvadaIcon, VazhaikkapamIcon } from './snack-icons';
import type { Snack } from '@/app/actions';
import Image from 'next/image';

interface LeaderboardProps {
  snacks: Snack[];
}

const rankColors = [
    'text-amber-400', // Gold
    'text-slate-400', // Silver
    'text-orange-600', // Bronze
    'text-slate-500',
    'text-slate-500',
];

export default function Leaderboard({ snacks }: LeaderboardProps) {
  if (snacks.length === 0) {
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
          <div className="text-center text-muted-foreground py-8">
            <p>No snacks on the leaderboard yet. Analyze one to get started!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
              <TableRow key={snack.id} className="font-medium">
                <TableCell className="text-center text-lg">
                    <span className={rankColors[index] || 'text-muted-foreground'}>
                        {index + 1}
                    </span>
                </TableCell>
                <TableCell>
                    <div className='flex items-center gap-3'>
                        <Image src={snack.imageData} alt={snack.type} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                        <span className="font-body capitalize">{snack.type}</span>
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
