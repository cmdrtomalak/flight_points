// Supported airlines
const airlines: Record<string, string> = {
    'ac': 'Aeroplan (Air Canada)',
    'as': 'Alaska Airlines',
    'ba': 'British Airways',
    'cx': 'AsiaMiles (Cathay Pacific)',
    'ke': 'Korean Air SKYPASS',
    'nh': 'ANA Mileage Club',
    'qf': 'Qantas Frequent Flyer',
    'sq': 'Singapore KrisFlyer',
};

export type AirlineCode = keyof typeof airlines;

export interface SearchParams {
    origin: string;
    destination: string;
    departDate: string;
    cabin?: 'economy' | 'business' | 'first';
    airlines?: string[];
    forceRefresh?: boolean;
}

export interface AwardSearchResult {
    airline: string;
    airlineName: string;
    flightNumber?: string;
    origin: string;
    destination: string;
    departDate: string;
    departTime?: string;
    arriveTime?: string;
    cabin: string;
    miles: number;
    taxes?: number;
    availableSeats?: number;
}

// Generate mock data for development/demo
function generateMockResults(params: SearchParams): AwardSearchResult[] {
    const selectedAirlines = params.airlines || Object.keys(airlines);
    const results: AwardSearchResult[] = [];

    for (const airlineCode of selectedAirlines) {
        const airlineName = airlines[airlineCode as AirlineCode] || airlineCode.toUpperCase();

        // Generate 1-3 mock results per airline
        const count = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < count; i++) {
            const departHour = 6 + Math.floor(Math.random() * 16);
            const flightDuration = 8 + Math.floor(Math.random() * 8);

            results.push({
                airline: airlineCode,
                airlineName,
                flightNumber: `${airlineCode.toUpperCase()}${100 + Math.floor(Math.random() * 900)}`,
                origin: params.origin,
                destination: params.destination,
                departDate: params.departDate,
                departTime: `${departHour.toString().padStart(2, '0')}:${(Math.floor(Math.random() * 60)).toString().padStart(2, '0')}`,
                arriveTime: `${((departHour + flightDuration) % 24).toString().padStart(2, '0')}:${(Math.floor(Math.random() * 60)).toString().padStart(2, '0')}`,
                cabin: params.cabin || 'economy',
                miles: getMilesForCabin(params.cabin || 'economy'),
                taxes: 50 + Math.floor(Math.random() * 200),
                availableSeats: Math.floor(Math.random() * 4) + 1,
            });
        }
    }

    return results.sort((a, b) => a.miles - b.miles);
}

function getMilesForCabin(cabin: string): number {
    const baseRanges: Record<string, [number, number]> = {
        economy: [25000, 60000],
        business: [50000, 120000],
        first: [80000, 200000],
    };

    const [min, max] = baseRanges[cabin] || baseRanges.economy;
    return Math.floor(Math.random() * (max - min) + min);
}

// Mock search (real Flightplan integration would go here)
export async function searchAwards(params: SearchParams): Promise<AwardSearchResult[]> {
    console.log('Searching for awards:', params);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    return generateMockResults(params);
}

export function getSupportedAirlines(): { code: string; name: string }[] {
    return Object.entries(airlines).map(([code, name]) => ({ code, name }));
}

export function getAirlines(): Record<string, string> {
    return airlines;
}
