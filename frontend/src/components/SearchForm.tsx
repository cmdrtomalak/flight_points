import { Component, createSignal, For } from 'solid-js';
import type { SearchParams } from '../types';
import AirportInput from './AirportInput';

const AIRLINES = [
    { code: 'ac', name: 'Aeroplan' },
    { code: 'as', name: 'Alaska' },
    { code: 'ba', name: 'British Airways' },
    { code: 'cx', name: 'Cathay Pacific' },
    { code: 'ke', name: 'Korean Air' },
    { code: 'nh', name: 'ANA' },
    { code: 'qf', name: 'Qantas' },
    { code: 'sq', name: 'Singapore' },
];

interface SearchFormProps {
    onSearch: (params: SearchParams) => void;
    isLoading: boolean;
}

const SearchForm: Component<SearchFormProps> = (props) => {
    const [origin, setOrigin] = createSignal('');
    const [destination, setDestination] = createSignal('');
    const [departDate, setDepartDate] = createSignal('');
    const [cabin, setCabin] = createSignal<'economy' | 'business' | 'first'>('economy');
    const [selectedAirlines, setSelectedAirlines] = createSignal<string[]>(
        AIRLINES.map((a) => a.code)
    );

    const toggleAirline = (code: string) => {
        setSelectedAirlines((prev) =>
            prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
        );
    };

    const selectAll = () => setSelectedAirlines(AIRLINES.map((a) => a.code));
    const selectNone = () => setSelectedAirlines([]);

    const handleSubmit = (e: Event) => {
        e.preventDefault();

        if (!origin() || !destination() || !departDate()) {
            return;
        }

        props.onSearch({
            origin: origin().toUpperCase(),
            destination: destination().toUpperCase(),
            departDate: departDate(),
            cabin: cabin(),
            airlines: selectedAirlines(),
        });
    };

    const tomorrow = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    };

    return (
        <form class="search-form" onSubmit={handleSubmit}>
            <div class="form-row">
                <AirportInput
                    id="origin"
                    label="From"
                    placeholder="City or airport code..."
                    value={origin()}
                    onSelect={setOrigin}
                />

                <AirportInput
                    id="destination"
                    label="To"
                    placeholder="City or airport code..."
                    value={destination()}
                    onSelect={setDestination}
                />

                <div class="form-group">
                    <label for="departDate">Departure Date</label>
                    <input
                        type="date"
                        id="departDate"
                        value={departDate() || tomorrow()}
                        onInput={(e) => setDepartDate(e.currentTarget.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                    />
                </div>

                <div class="form-group">
                    <label for="cabin">Cabin Class</label>
                    <select
                        id="cabin"
                        value={cabin()}
                        onChange={(e) => setCabin(e.currentTarget.value as any)}
                    >
                        <option value="economy">Economy</option>
                        <option value="business">Business</option>
                        <option value="first">First Class</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label>
                    Airlines
                    <span style="margin-left: 1rem; font-weight: normal;">
                        <button type="button" class="btn-link" onClick={selectAll}>
                            Select All
                        </button>
                        {' | '}
                        <button type="button" class="btn-link" onClick={selectNone}>
                            Clear
                        </button>
                    </span>
                </label>
                <div class="airline-grid">
                    <For each={AIRLINES}>
                        {(airline) => (
                            <label class="airline-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedAirlines().includes(airline.code)}
                                    onChange={() => toggleAirline(airline.code)}
                                />
                                <span>{airline.name}</span>
                            </label>
                        )}
                    </For>
                </div>
            </div>

            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button
                    type="submit"
                    class="btn btn-primary"
                    disabled={props.isLoading || !origin() || !destination() || !departDate() || selectedAirlines().length === 0}
                >
                    {props.isLoading ? (
                        <>
                            <span class="spinner" style="width: 18px; height: 18px; border-width: 2px;"></span>
                            Searching...
                        </>
                    ) : (
                        <>🔍 Search Awards</>
                    )}
                </button>
            </div>
        </form>
    );
};

export default SearchForm;
