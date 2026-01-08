import { Component, createSignal, For, Show } from 'solid-js';

// Common airports for award travel - searchable by city, name, or code
const AIRPORTS = [
    // North America
    { code: 'JFK', city: 'New York', name: 'John F Kennedy International', country: 'USA' },
    { code: 'EWR', city: 'Newark', name: 'Newark Liberty International', country: 'USA' },
    { code: 'LGA', city: 'New York', name: 'LaGuardia', country: 'USA' },
    { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles International', country: 'USA' },
    { code: 'SFO', city: 'San Francisco', name: 'San Francisco International', country: 'USA' },
    { code: 'ORD', city: 'Chicago', name: "O'Hare International", country: 'USA' },
    { code: 'MIA', city: 'Miami', name: 'Miami International', country: 'USA' },
    { code: 'DFW', city: 'Dallas', name: 'Dallas/Fort Worth International', country: 'USA' },
    { code: 'SEA', city: 'Seattle', name: 'Seattle-Tacoma International', country: 'USA' },
    { code: 'BOS', city: 'Boston', name: 'Logan International', country: 'USA' },
    { code: 'IAD', city: 'Washington DC', name: 'Dulles International', country: 'USA' },
    { code: 'ATL', city: 'Atlanta', name: 'Hartsfield-Jackson International', country: 'USA' },
    { code: 'DEN', city: 'Denver', name: 'Denver International', country: 'USA' },
    { code: 'LAS', city: 'Las Vegas', name: 'Harry Reid International', country: 'USA' },
    { code: 'HNL', city: 'Honolulu', name: 'Daniel K Inouye International', country: 'USA' },
    { code: 'YVR', city: 'Vancouver', name: 'Vancouver International', country: 'Canada' },
    { code: 'YYZ', city: 'Toronto', name: 'Pearson International', country: 'Canada' },

    // Asia - Hong Kong & Japan
    { code: 'HKG', city: 'Hong Kong', name: 'Hong Kong International', country: 'Hong Kong' },
    { code: 'NRT', city: 'Tokyo', name: 'Narita International', country: 'Japan' },
    { code: 'HND', city: 'Tokyo', name: 'Haneda Airport', country: 'Japan' },
    { code: 'KIX', city: 'Osaka', name: 'Kansai International', country: 'Japan' },
    { code: 'NGO', city: 'Nagoya', name: 'Chubu Centrair International', country: 'Japan' },
    { code: 'FUK', city: 'Fukuoka', name: 'Fukuoka Airport', country: 'Japan' },
    { code: 'CTS', city: 'Sapporo', name: 'New Chitose Airport', country: 'Japan' },
    { code: 'OKA', city: 'Okinawa', name: 'Naha Airport', country: 'Japan' },

    // Asia - Other
    { code: 'SIN', city: 'Singapore', name: 'Changi Airport', country: 'Singapore' },
    { code: 'ICN', city: 'Seoul', name: 'Incheon International', country: 'South Korea' },
    { code: 'PEK', city: 'Beijing', name: 'Capital International', country: 'China' },
    { code: 'PVG', city: 'Shanghai', name: 'Pudong International', country: 'China' },
    { code: 'TPE', city: 'Taipei', name: 'Taoyuan International', country: 'Taiwan' },
    { code: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi Airport', country: 'Thailand' },
    { code: 'KUL', city: 'Kuala Lumpur', name: 'Kuala Lumpur International', country: 'Malaysia' },
    { code: 'MNL', city: 'Manila', name: 'Ninoy Aquino International', country: 'Philippines' },
    { code: 'DEL', city: 'Delhi', name: 'Indira Gandhi International', country: 'India' },

    // Europe
    { code: 'LHR', city: 'London', name: 'Heathrow Airport', country: 'UK' },
    { code: 'LGW', city: 'London', name: 'Gatwick Airport', country: 'UK' },
    { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle Airport', country: 'France' },
    { code: 'FRA', city: 'Frankfurt', name: 'Frankfurt Airport', country: 'Germany' },
    { code: 'MUC', city: 'Munich', name: 'Franz Josef Strauss Airport', country: 'Germany' },
    { code: 'AMS', city: 'Amsterdam', name: 'Schiphol Airport', country: 'Netherlands' },
    { code: 'MAD', city: 'Madrid', name: 'Adolfo Suárez Madrid–Barajas', country: 'Spain' },
    { code: 'BCN', city: 'Barcelona', name: 'El Prat Airport', country: 'Spain' },
    { code: 'FCO', city: 'Rome', name: 'Fiumicino Airport', country: 'Italy' },
    { code: 'ZRH', city: 'Zurich', name: 'Zurich Airport', country: 'Switzerland' },
    { code: 'DUB', city: 'Dublin', name: 'Dublin Airport', country: 'Ireland' },
    { code: 'IST', city: 'Istanbul', name: 'Istanbul Airport', country: 'Turkey' },

    // Middle East
    { code: 'DXB', city: 'Dubai', name: 'Dubai International', country: 'UAE' },
    { code: 'DOH', city: 'Doha', name: 'Hamad International', country: 'Qatar' },

    // Oceania
    { code: 'SYD', city: 'Sydney', name: 'Kingsford Smith Airport', country: 'Australia' },
    { code: 'MEL', city: 'Melbourne', name: 'Tullamarine Airport', country: 'Australia' },
    { code: 'AKL', city: 'Auckland', name: 'Auckland Airport', country: 'New Zealand' },
];

interface Airport {
    code: string;
    city: string;
    name: string;
    country: string;
}

interface AirportInputProps {
    id: string;
    label: string;
    placeholder: string;
    value: string;
    onSelect: (code: string) => void;
}

function searchAirports(query: string, limit = 6): Airport[] {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase().trim();
    return AIRPORTS
        .filter(a =>
            a.code.toLowerCase().includes(q) ||
            a.city.toLowerCase().includes(q) ||
            a.name.toLowerCase().includes(q)
        )
        .slice(0, limit);
}

const AirportInput: Component<AirportInputProps> = (props) => {
    const [query, setQuery] = createSignal(props.value);
    const [suggestions, setSuggestions] = createSignal<Airport[]>([]);
    const [showDropdown, setShowDropdown] = createSignal(false);
    const [highlightIndex, setHighlightIndex] = createSignal(-1);
    let inputRef: HTMLInputElement | undefined;

    const handleInput = (value: string) => {
        setQuery(value);
        const results = searchAirports(value);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
        setHighlightIndex(-1);

        // If user types a valid 3-letter code, auto-select
        if (value.length === 3) {
            const exact = AIRPORTS.find(a => a.code.toLowerCase() === value.toLowerCase());
            if (exact) {
                selectAirport(exact);
            }
        }
    };

    const selectAirport = (airport: Airport) => {
        setQuery(airport.code);
        props.onSelect(airport.code);
        setShowDropdown(false);
        setSuggestions([]);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        const sugs = suggestions();
        if (!showDropdown() || sugs.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex(i => Math.min(i + 1, sugs.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const idx = highlightIndex();
            if (idx >= 0 && idx < sugs.length) {
                selectAirport(sugs[idx]);
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    const handleBlur = () => {
        // Delay to allow click on suggestion
        setTimeout(() => setShowDropdown(false), 150);
    };

    return (
        <div class="form-group" style="position: relative;">
            <label for={props.id}>{props.label}</label>
            <input
                ref={inputRef}
                type="text"
                id={props.id}
                placeholder={props.placeholder}
                value={query()}
                onInput={(e) => handleInput(e.currentTarget.value)}
                onFocus={() => {
                    if (suggestions().length > 0) setShowDropdown(true);
                }}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                autocomplete="off"
            />
            <Show when={showDropdown() && suggestions().length > 0}>
                <div class="airport-dropdown">
                    <For each={suggestions()}>
                        {(airport, index) => (
                            <div
                                class={`airport-option ${highlightIndex() === index() ? 'highlighted' : ''}`}
                                onMouseDown={() => selectAirport(airport)}
                                onMouseEnter={() => setHighlightIndex(index())}
                            >
                                <span class="airport-code">{airport.code}</span>
                                <span class="airport-info">
                                    <span class="airport-city">{airport.city}</span>
                                    <span class="airport-name">{airport.name}</span>
                                </span>
                            </div>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
};

export default AirportInput;
