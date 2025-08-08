import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy } from 'lucide-react';

export interface SnackData {
  name: string;
  area: number;
  type: 'parippuvada' | 'vazhaikkapam';
}

interface LeaderboardProps {
  snacks: SnackData[];
}

export default function Leaderboard({ snacks }: LeaderboardProps) {
  return (
    <Card className="shadow-lg animate-in fade-in-0 slide-in-from-bottom-5 duration-500">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-primary" />
          <div>
            <CardTitle className="font-headline">Snack Hall of Fame</CardTitle>
            <CardDescription>Top 5 snacks by surface area</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Snack</TableHead>
              <TableHead className="text-right">Area (cm²)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snacks.map((snack, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{snack.name}</TableCell>
                <TableCell className="text-right font-mono">{snack.area.toFixed(1)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
