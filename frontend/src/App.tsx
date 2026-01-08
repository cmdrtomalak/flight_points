import { Component, createSignal, createResource, Show } from 'solid-js';
import SearchForm from './components/SearchForm';
import ResultsTable from './components/ResultsTable';
import type { SearchParams, SearchResponse } from './types';

const App: Component = () => {
    const [searchParams, setSearchParams] = createSignal<SearchParams | null>(null);
    const [error, setError] = createSignal<string | null>(null);
    const [lastSearchParams, setLastSearchParams] = createSignal<SearchParams | null>(null);

    const [results] = createResource(searchParams, async (params) => {
        if (!params) return null;

        setError(null);

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Search failed');
            }

            // Store last search params (without forceRefresh) for refresh button
            const { forceRefresh, ...baseParams } = params;
            setLastSearchParams(baseParams as SearchParams);

            return await response.json() as SearchResponse;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            return null;
        }
    });

    const handleSearch = (params: SearchParams) => {
        setSearchParams({ ...params, forceRefresh: false });
    };

    const handleRefresh = () => {
        const last = lastSearchParams();
        if (last) {
            // Force a new search by creating a new object with forceRefresh=true
            setSearchParams({ ...last, forceRefresh: true });
        }
    };

    return (
        <div class="app">
            <div class="container">
                <header class="header">
                    <div class="brand-logo-container">
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                            <svg viewBox="0 0 100 60" style="height: 50px; width: auto; overflow: visible;">
                                {/* Stylized Hollow Airplane - Rotated & Coral */}
                                <g transform="translate(50, 30) rotate(-45) scale(2.8)">
                                    <path
                                        d="M22 16L22 14L14 9V3.5C14 2.67 13.33 2 12.5 2C11.67 2 11 2.67 11 3.5V9L3 14V16L11 13.5V19L9 20.5V22L11.5 21.5L14 22V20.5L12 19V13.5L22 16Z"
                                        fill="none"
                                        stroke="#ff385c"
                                        stroke-width="1.0"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                </g>
                            </svg>
                            <span style="font-family: 'Great Vibes', cursive; font-size: 3.5rem; color: #ff385c; line-height: 0.8; margin-top: -5px; text-shadow: 0 0 1px rgba(255,56,92,0.1);">
                                Flight Points
                            </span>
                        </div>
                    </div>
                    <p>Find award flights and see exactly how many points you need</p>
                </header>

                <div class="card">
                    <h2 class="card-title">Search Flights</h2>
                    <SearchForm onSearch={handleSearch} isLoading={results.loading} />
                </div>

                <Show when={error()}>
                    <div class="error fade-in" style="margin-top: 1rem;">
                        {error()}
                    </div>
                </Show>

                <Show when={results.loading}>
                    <div class="card fade-in" style="margin-top: 1.5rem;">
                        <div class="loading">
                            <div class="spinner"></div>
                            <p class="loading-text">Searching for award availability...</p>
                            <p class="loading-text" style="font-size: 0.75rem;">This may take 30-60 seconds for live searches</p>
                        </div>
                    </div>
                </Show>

                <Show when={!results.loading && results()}>
                    <div class="card results-section fade-in" style="margin-top: 1.5rem;">
                        <div class="results-header">
                            <h2 class="card-title">Results</h2>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <Show when={results()?.source}>
                                    <span class={`results-source ${results()?.source}`}>
                                        {results()?.source === 'cache' ? '📦 Cached' : '🔴 Live'}
                                        <Show when={results()?.cacheAge}>
                                            {' '}• {results()?.cacheAge} ago
                                        </Show>
                                    </span>
                                </Show>
                                <Show when={lastSearchParams()}>
                                    <button
                                        class="btn-refresh"
                                        onClick={handleRefresh}
                                        disabled={results.loading}
                                        title="Get fresh data from airlines"
                                    >
                                        🔄 Refresh Live
                                    </button>
                                </Show>
                            </div>
                        </div>

                        <Show
                            when={results()?.results && results()!.results.length > 0}
                            fallback={
                                <div class="empty-state">
                                    <h3>No Results Found</h3>
                                    <p>Try different dates or airlines</p>
                                </div>
                            }
                        >
                            <p class="results-count">{results()!.results.length} flights found</p>
                            <ResultsTable results={results()!.results} />
                        </Show>
                    </div>
                </Show>

                <div class="status-bar">
                    <div class="status-item">
                        <span>Cache Duration:</span>
                        <strong>Configurable via .env</strong>
                    </div>
                    <div class="status-item">
                        <span>Airlines:</span>
                        <strong>8 supported</strong>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
