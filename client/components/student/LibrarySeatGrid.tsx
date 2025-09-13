import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { librarySeatsApi } from "@/lib/api";
import { useAuth } from "@/context/auth";

// seat states: free, occupied, reserved
type SeatState = "free" | "occupied" | "reserved";

function Seat({ state, onClick, title }: { state: SeatState; onClick?: () => void; title: string }) {
  const style =
    state === "free"
      ? "bg-green-500/90 border-green-300/60 shadow-[0_0_12px_rgba(34,197,94,0.8)]"
      : state === "occupied"
      ? "bg-red-500/90 border-red-300/60 shadow-[0_0_12px_rgba(239,68,68,0.6)]"
      : "bg-yellow-400/90 border-yellow-200/70 shadow-[0_0_12px_rgba(250,204,21,0.8)]";
  return (
    <button
      className={`h-4 w-4 rounded-sm border outline-none ${style}`}
      onClick={onClick}
      title={title}
    />
  );
}

function Lane({ label, seats, onToggle }: { label: string; seats: SeatState[]; onToggle: (idx: number) => void }) {
  const occupiedCount = seats.filter((s) => s !== "free").length;
  const ratio = occupiedCount / seats.length; // heatmap intensity
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 shrink-0 text-xs text-muted-foreground">{label}</div>
      <div className="grid grid-cols-6 gap-1 rounded px-1" style={{ boxShadow: `inset 0 0 20px rgba(255,20,147,${ratio * 0.25})` }}>
        {seats.map((s, i) => (
          <Seat key={`${label}-${i}`} state={s} onClick={() => onToggle(i)} title={`Lane ${label} • Seat ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}

export default function LibrarySeatGrid({ lanes = 50, chairsPerLane = 6 }: { lanes?: number; chairsPerLane?: number }) {
  const { profile } = useAuth();
  const [seats, setSeats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wing, setWing] = useState<"Left" | "Right">("Left");

  // Load real seat data from database
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const seatData = await librarySeatsApi.getAll();
        setSeats(seatData);
      } catch (error) {
        console.error('Error fetching seat data:', error);
        // Fallback to mock data if API fails
        const mockSeats = Array.from({ length: lanes * chairsPerLane }, (_, i) => ({
          id: i,
          lane_number: Math.floor(i / chairsPerLane) + 1,
          seat_number: (i % chairsPerLane) + 1,
          is_occupied: Math.random() > 0.7,
          occupied_by: null
        }));
        setSeats(mockSeats);
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [lanes, chairsPerLane]);

  // Convert flat seat array to grid structure
  const current = useMemo(() => {
    const grid: SeatState[][] = Array.from({ length: lanes }, () => 
      Array.from({ length: chairsPerLane }, () => "free" as SeatState)
    );

    seats.forEach(seat => {
      const laneIdx = seat.lane_number - 1;
      const seatIdx = seat.seat_number - 1;
      
      if (laneIdx >= 0 && laneIdx < lanes && seatIdx >= 0 && seatIdx < chairsPerLane) {
        if (seat.is_occupied) {
          grid[laneIdx][seatIdx] = seat.occupied_by === profile?.id ? "reserved" : "occupied";
        } else {
          grid[laneIdx][seatIdx] = "free";
        }
      }
    });

    return grid;
  }, [seats, lanes, chairsPerLane, profile?.id]);

  const totals = useMemo(() => {
    const flat = current.flat();
    const free = flat.filter(s => s === "free").length;
    const reserved = flat.filter(s => s === "reserved").length;
    const occupied = flat.length - free - reserved;
    return { free, reserved, occupied, total: flat.length };
  }, [current]);

  const suggest = useMemo(() => {
    // Pick first lane with most free seats, return first free position
    let bestLane = 0;
    let bestFree = -1;
    current.forEach((row, i) => {
      const f = row.filter(s => s === "free").length;
      if (f > bestFree) { bestFree = f; bestLane = i; }
    });
    const seatIdx = current[bestLane].findIndex(s => s === "free");
    return { lane: bestLane + 1, seat: seatIdx + 1 };
  }, [current]);

  const toggleSeat = async (laneIdx: number, seatIdx: number) => {
    const seatData = seats.find(s => 
      s.lane_number === laneIdx + 1 && s.seat_number === seatIdx + 1
    );
    
    if (!seatData || !profile) return;

    try {
      if (seatData.is_occupied && seatData.occupied_by === profile.id) {
        // Release the seat
        await librarySeatsApi.update(seatData.id, {
          is_occupied: false,
          occupied_by: null
        });
      } else if (!seatData.is_occupied) {
        // Occupy the seat
        await librarySeatsApi.update(seatData.id, {
          is_occupied: true,
          occupied_by: profile.id
        });
      }
      
      // Refresh seat data
      const updatedSeats = await librarySeatsApi.getAll();
      setSeats(updatedSeats);
    } catch (error) {
      console.error('Error updating seat:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Library Seat Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted/20 rounded w-1/3" />
            <div className="h-64 bg-muted/20 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Library Seat Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center gap-3 text-sm">
          <div className="inline-flex items-center gap-2">
            <span>Wing:</span>
            <select value={wing} onChange={(e)=>setWing(e.target.value as any)} className="h-8 rounded-md border border-white/10 bg-background px-2 text-xs">
              <option>Left</option>
              <option>Right</option>
            </select>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="rounded-md border border-white/10 bg-background px-2 py-1">Free: {totals.free}</span>
            <span className="rounded-md border border-white/10 bg-background px-2 py-1">Reserved: {totals.reserved}</span>
            <span className="rounded-md border border-white/10 bg-background px-2 py-1">Occupied: {totals.occupied}</span>
          </div>
        </div>
        <div className="max-h-[360px] overflow-auto rounded-md border border-white/10 p-3 bg-background/40">
          {Array.from({ length: lanes }).map((_, li) => (
            <Lane key={`lane-${wing}-${li}`} label={`${li + 1}`} seats={current[li]} onToggle={(idx) => toggleSeat(li, idx)} />
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">Pink = free, Red = occupied, Yellow = reserved</div>
        <div className="mt-3 text-sm">Suggestion: Try Lane {suggest.lane}, Seat {suggest.seat} (quiet zone)</div>
      </CardContent>
    </Card>
  );
}
