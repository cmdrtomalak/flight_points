import { Component, createSignal, For, createMemo } from 'solid-js';
import type { AwardResult } from '../types';

interface ResultsTableProps {
    results: AwardResult[];
}

type SortKey = 'miles' | 'airline' | 'time' | 'cabin';
type SortDir = 'asc' | 'desc';

// Airline booking URLs - these go directly to award booking pages
const AIRLINE_PROGRAMS: Record<string, { name: string; program: string; bookingUrl: string }> = {
    ac: {
        name: 'Air Canada',
        program: 'Aeroplan',
        bookingUrl: 'https://www.aeroplan.com/book-flights.do'
    },
    as: {
        name: 'Alaska Airlines',
        program: 'Mileage Plan',
        bookingUrl: 'https://www.alaskaair.com/planbook/productselection'
    },
    ba: {
        name: 'British Airways',
        program: 'Avios',
        bookingUrl: 'https://www.britishairways.com/travel/redeem/execclub/_gf/en_us'
    },
    cx: {
        name: 'Cathay Pacific',
        program: 'Asia Miles',
        bookingUrl: 'https://www.asiamiles.com/en/redeem-awards/flight-awards.html'
    },
    ke: {
        name: 'Korean Air',
        program: 'SKYPASS',
        bookingUrl: 'https://www.koreanair.com/booking/skypass-booking'
    },
    nh: {
        name: 'ANA',
        program: 'Mileage Club',
        bookingUrl: 'https://www.ana.co.jp/en/us/amc/reservation/'
    },
    qf: {
        name: 'Qantas',
        program: 'Frequent Flyer',
        bookingUrl: 'https://www.qantas.com/au/en/book-a-trip/flights/search-results.html/reward'
    },
    sq: {
        name: 'Singapore',
        program: 'KrisFlyer',
        bookingUrl: 'https://www.singaporeair.com/en_UK/ppsclub-krisflyer/use-miles/redeem-flights/'
    },
};

const ResultsTable: Component<ResultsTableProps> = (props) => {
    const [sortKey, setSortKey] = createSignal<SortKey>('miles');
    const [sortDir, setSortDir] = createSignal<SortDir>('asc');

    const toggleSort = (key: SortKey) => {
        if (sortKey() === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const sortedResults = createMemo(() => {
        const results = [...props.results];
        const dir = sortDir() === 'asc' ? 1 : -1;

        return results.sort((a, b) => {
            switch (sortKey()) {
                case 'miles':
                    return (a.miles - b.miles) * dir;
                case 'airline':
                    return (a.airline || '').localeCompare(b.airline || '') * dir;
                case 'time':
                    const timeA = a.depart_time || a.departTime || '';
                    const timeB = b.depart_time || b.departTime || '';
                    return timeA.localeCompare(timeB) * dir;
                case 'cabin':
                    return a.cabin.localeCompare(b.cabin) * dir;
                default:
                    return 0;
            }
        });
    });

    const formatMiles = (miles: number): string => {
        return miles.toLocaleString();
    };

    const getAirlineInfo = (code: string) => {
        return AIRLINE_PROGRAMS[code] || {
            name: code.toUpperCase(),
            program: 'Miles',
            bookingUrl: '#'
        };
    };

    const getAvailability = (result: AwardResult): number => {
        return result.available_seats || result.availableSeats || 0;
    };

    const SortIcon = (key: SortKey) => (
        <span style="margin-left: 4px; opacity: 0.6;">
            {sortKey() === key ? (sortDir() === 'asc' ? '↑' : '↓') : ''}
        </span>
    );

    return (
        <div style="overflow-x: auto;">
            <table class="results-table">
                <thead>
                    <tr>
                        <th class="sortable" onClick={() => toggleSort('airline')}>
                            Airline {SortIcon('airline')}
                        </th>
                        <th>Route</th>
                        <th class="sortable" onClick={() => toggleSort('time')}>
                            Departure {SortIcon('time')}
                        </th>
                        <th class="sortable" onClick={() => toggleSort('cabin')}>
                            Class {SortIcon('cabin')}
                        </th>
                        <th class="sortable" onClick={() => toggleSort('miles')}>
                            Points Required {SortIcon('miles')}
                        </th>
                        <th>Seats</th>
                    </tr>
                </thead>
                <tbody>
                    <For each={sortedResults()}>
                        {(result) => {
                            const airlineInfo = getAirlineInfo(result.airline);
                            const flightNum = result.flight_number || result.flightNumber || result.airline.toUpperCase();
                            return (
                                <tr>
                                    <td>
                                        <div class="airline-badge">
                                            <span class="airline-name">{airlineInfo.name}</span>
                                            <a
                                                href={airlineInfo.bookingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="flight-link"
                                                title={`Book ${flightNum} with ${airlineInfo.program} points`}
                                            >
                                                {flightNum} ↗
                                            </a>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="flight-route">
                                            <span class="city">{result.origin}</span>
                                            <span class="arrow">→</span>
                                            <span class="city">{result.destination}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="flight-times">
                                            <span class="time">
                                                {result.depart_time || result.departTime || '—'}
                                            </span>
                                            <span class="label">
                                                {result.depart_date || result.departDate}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class={`cabin-badge ${result.cabin}`}>
                                            {result.cabin}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="points-display">
                                            <div class="points-value">
                                                {formatMiles(result.miles)}
                                                <span class="unit">pts</span>
                                            </div>
                                            <div class="points-program">{airlineInfo.program}</div>
                                            <div class="taxes">+ ${(result.taxes || 0).toFixed(0)} taxes</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="availability">
                                            <span
                                                class={`availability-dot ${getAvailability(result) <= 2 ? 'low' : ''} ${getAvailability(result) === 0 ? 'none' : ''}`}
                                            ></span>
                                            <span>{getAvailability(result) || '?'} left</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }}
                    </For>
                </tbody>
            </table>
        </div>
    );
};

export default ResultsTable;
