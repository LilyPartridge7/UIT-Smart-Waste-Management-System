export function getRoomOrLandmark(
    buildingId: number,
    level: number | string,
    side: 'front' | 'behind'
): string | null {
    const lvl = typeof level === 'string' ? parseInt(level, 10) : level;

    // Basement (Shared Zone)
    // "B" or 0 usually denotes basement. The prompt says "Basement".
    // Assuming level might be "B" or 0. If it's a number, 0 is likely basement.
    // Actually, let's restart the types to be careful.
    // The prompt implies "Basement" has no building ID relevant (Shared Zone).
    // But the function signature takes buildingId.
    // We'll handle level "B" or 0 as Basement.
    // Let's assume input level is capable of being "B".

    if (String(level).toUpperCase() === 'B' || lvl === 0) {
        if (side === 'front') return "Canteen Bins";
        if (side === 'behind') return "Car Parking Area";
        return null;
    }

    // Ensure level is a valid number for other floors
    if (isNaN(lvl)) return null;

    // Level 1 (Ground Floor) Landmarks
    if (lvl === 1) {
        if (buildingId === 2) {
            return side === 'front' ? "Student Affairs" : "Accounting Department";
        }
        if (buildingId === 3) {
            return side === 'front' ? "Library" : "Meeting Room";
        }
        if (buildingId === 1 || buildingId === 4) {
            // Front is Lobby. Behind is not specified as a landmark, but "Ground Floor Lobby" implies the main area.
            // prompt: Buildings 1 & 4: "Ground Floor Lobby."
            // If side is behind, return null unless we want to map it to Lobby too?
            // Prompt says: Buildings 1 & 4: "Ground Floor Lobby." - likely refers to the main entry/front.
            // I will return "Ground Floor Lobby" for front, and null for behind to be safe/strict,
            // or maybe "Ground Floor Lobby" for both?
            // "Level 1 (Ground Floor) Landmarks: Buildings 1 & 4: 'Ground Floor Lobby.'"
            // It doesn't distinguish sides. I'll assume it's the whole floor or Front.
            // Let's stick to Front = "Ground Floor Lobby", Behind = null (or maybe "Ground Floor Lobby" if it's a zone).
            // Given the specific "Front Side" vs "Behind Side" distinction in the prompt for other floors,
            // and specific landmarks for B2/B3 having Front/Behind,
            // I will return "Ground Floor Lobby" for Front.
            // For Behind, if not specified, I'll return null to indicate no specific bin/room there.
            // Actually, let's return "Ground Floor Lobby" for Front only, as that's the "Landmark".
            if (side === 'front') return "Ground Floor Lobby";
            return null;
        }
    }

    // Level 2
    if (lvl === 2) {
        // CRITICAL EXCEPTION (Building 1 & 2, Level 2)
        if (buildingId === 1 || buildingId === 2) {
            // No "Behind Side".
            if (side === 'behind') return null;
            // Front Side: "Theatre Entry Corridor"
            if (side === 'front') return "Theatre Entry Corridor";
        }
        // Building 3 & 4 at Level 2 -> Standard X-Notation Rule (explicitly stated: "Level 2 for Bldg 3 & 4")
    }

    // Standard Floors (Levels 3-6 for all / Level 2 for Bldg 3 & 4)
    // Logic: Front Side = "Room X[Level]2"; Behind Side = "Room X[Level]5"
    // X = Building ID
    if ((lvl >= 3 && lvl <= 6) || (lvl === 2 && (buildingId === 3 || buildingId === 4))) {
        const suffix = side === 'front' ? '2' : '5';
        return `Room ${buildingId}${lvl}${suffix}`;
    }

    return null;
}
