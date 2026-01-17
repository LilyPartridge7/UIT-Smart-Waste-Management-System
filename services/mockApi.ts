import { BinReport, User, UserRole, Bin, BUILDINGS } from '../types';

// --- Mock Data ---
// Pre-seed some bins with new coordinates
let bins: Bin[] = [
    { id: 'b1-l1-01', building: '1', level: '1', location: 'Ground Floor Lobby', lat: 16.855968, lng: 96.135305, status: 'empty' },
    { id: 'b2-l3-01', building: '2', level: '3', side: 'Front', location: 'Room 322', lat: 16.856100, lng: 96.135500, status: 'full' },
    { id: 'b3-l2-01', building: '3', level: '2', side: 'Behind', location: 'Room 225', lat: 16.855700, lng: 96.135100, status: 'full' },
    { id: 'b4-l1-01', building: '4', level: '1', location: 'Ground Floor Lobby', lat: 16.856200, lng: 96.135000, status: 'empty' },
];

let reports: BinReport[] = [
  {
    id: 'r1',
    binId: 'b2-l3-01',
    building: '2',
    level: '3',
    location: 'Room 322',
    description: 'Overflowing heavily',
    status: 'full',
    timestamp: Date.now() - 3600000,
    reportCount: 4 // Red Alert!
  },
  {
    id: 'r2',
    binId: 'b3-l2-01',
    building: '3',
    level: '2',
    location: 'Room 225',
    description: 'Bad smell',
    status: 'full',
    timestamp: Date.now() - 7200000,
    reportCount: 1
  }
];

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

export const findNearestBuilding = (lat: number, lng: number) => {
  let closest = BUILDINGS[0];
  let minDist = Infinity;

  BUILDINGS.forEach(b => {
    const dist = calculateDistance(lat, lng, b.lat, b.lng);
    if (dist < minDist) {
      minDist = dist;
      closest = b;
    }
  });
  return closest;
};

// --- API Methods ---

export const apiLogin = async (username: string, password: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  // Simulating Database Check
  const validUsers = ['student', 'teacher', 'collector', 'admin'];
  const userExists = validUsers.some(u => username.toLowerCase().startsWith(u) || username === u);

  if (!userExists && username !== 'error') { // Allow 'error' for generic testing
     throw new Error("Username does not exist");
  }

  if (password !== 'password123') {
     throw new Error("Password does not match");
  }

  // Mock role based on username prefix
  if (username.startsWith('st')) return { username, role: UserRole.STUDENT, identifier: 'ST-1234' };
  if (username.startsWith('te')) return { username, role: UserRole.TEACHER, identifier: 'FAC-99' };
  if (username.startsWith('co')) return { username, role: UserRole.COLLECTOR, identifier: 'STF-01' };

  return { username, role: UserRole.STUDENT, identifier: 'ST-0000' };
};

export const apiSubmitReport = async (report: Partial<BinReport>): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Find if bin exists or create a temp one logic (simplified)
  const existingReport = reports.find(r => r.location === report.location && r.status !== 'cleaned');
  
  if (existingReport) {
    existingReport.reportCount += 1;
    existingReport.timestamp = Date.now();
  } else {
    const newReport: BinReport = {
        id: `r-${Date.now()}`,
        building: report.building || '1',
        level: report.level || '1',
        location: report.location || 'Unknown',
        description: report.description || '',
        status: 'full',
        timestamp: Date.now(),
        reportCount: 1,
        imageUrl: report.imageUrl
    };
    reports.unshift(newReport);
    
    // Update bin status if it exists
    const bin = bins.find(b => b.location === report.location);
    if(bin) bin.status = 'full';
  }
};

export const apiGetReports = async (): Promise<BinReport[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...reports];
};

export const apiGetBins = async (): Promise<Bin[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Sync bin status with reports for demo
    return bins.map(b => {
        const hasActiveReport = reports.some(r => r.location === b.location && r.status === 'full');
        return { ...b, status: hasActiveReport ? 'full' : 'empty' };
    });
};

export const apiMarkBinEmpty = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  // Clean report
  const report = reports.find(r => r.id === id);
  if (report) {
      report.status = 'cleaned';
      report.reportCount = 0;
      
      // Clean bin
      const bin = bins.find(b => b.location === report.location);
      if(bin) bin.status = 'empty';
  }
};

export const apiAddBin = async (bin: Partial<Bin>): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newBin: Bin = {
        id: `b-${Date.now()}`,
        building: bin.building || '1',
        level: bin.level || '1',
        side: bin.side,
        location: bin.location || 'Unknown',
        lat: bin.lat || 16.8559,
        lng: bin.lng || 96.1353,
        status: 'empty'
    };
    bins.push(newBin);
};

// Analytics Data Helper
export const apiGetAnalytics = async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const today = new Date();
    const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('en-US', { weekday: 'short' });
    }).reverse();

    return {
        dailyCleaned: reports.filter(r => r.status === 'cleaned').length + 12, // Fake history
        activeReports: reports.filter(r => r.status === 'full').length,
        redAlerts: reports.filter(r => r.status === 'full' && r.reportCount >= 3).length,
        weeklyData: last7Days.map(day => ({
            name: day,
            reports: Math.floor(Math.random() * 20) + 5
        }))
    };
};