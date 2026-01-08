export interface SearchParams {
    origin: string;
    destination: string;
    departDate: string;
    cabin: 'economy' | 'business' | 'first';
    airlines: string[];
    forceRefresh?: boolean;
}

export interface AwardResult {
    airline: string;
    airlineName?: string;
    flight_number?: string;
    flightNumber?: string;
    origin: string;
    destination: string;
    depart_date?: string;
    departDate?: string;
    depart_time?: string;
    departTime?: string;
    arrive_time?: string;
    arriveTime?: string;
    cabin: string;
    miles: number;
    taxes?: number;
    available_seats?: number;
    availableSeats?: number;
}

export interface SearchResponse {
    source: 'cache' | 'live';
    results: AwardResult[];
    searchId?: number;
    cacheAge?: string;
}

export interface Airline {
    code: string;
    name: string;
}
