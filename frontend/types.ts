export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  COLLECTOR = 'collector'
}

export interface User {
  username: string;
  role: UserRole;
  identifier: string; // Roll No, Faculty ID, or Staff ID
}

export interface Bin {
  id: string;
  building: string;
  level: string;
  side?: string; // Front/Behind
  location: string;
  lat: number;
  lng: number;
  status: 'empty' | 'full';
}

export interface BinReport {
  id: string; // Report ID
  binId?: string; // Linked Bin ID
  building: string;
  level: string;
  location: string;
  description: string;
  status: 'pending' | 'full' | 'cleaned';
  timestamp: number;
  reportCount: number; // For Red Alert logic
  imageUrl?: string;
}

export interface BuildingCoordinates {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

// Updated Coordinates based on user request
export const UIT_CENTER = { lat: 16.855968333831967, lng: 96.13530565385179 };

export const BUILDINGS: BuildingCoordinates[] = [
  { id: 1, name: "Building 1 (Main)", lat: 16.855968, lng: 96.135305 },
  { id: 2, name: "Building 2 (Admin)", lat: 16.856100, lng: 96.135500 },
  { id: 3, name: "Building 3 (Library)", lat: 16.855700, lng: 96.135100 },
  { id: 4, name: "Building 4 (Labs)", lat: 16.856200, lng: 96.135000 },
];