// Global state management
const state = {
    data: null,
    selectedYear: 2000,
    selectedRegion: 'all',
    yearRange: [2000, 2020],
    regions: new Set(),
    isPlaying: false,
    animationSpeed: 1000 // 1 second per year
};

// Load and process data
async function loadData() {
    try {
        // Load both datasets
        const [africanData, asianData] = await Promise.all([
            d3.csv('African.csv'),
            d3.csv('Asian.csv')
        ]);

        // Merge and process the datasets
        state.data = [...africanData, ...asianData].map(d => ({
            country: d.Country,
            region: d.Region,
            year: +d.Year,
            cured: +d.Cured || 0,
            deaths: +d.Deaths || 0,
            cases: +d.Cases || 0
        }));

        // Extract unique years and regions
        state.yearRange = d3.extent(state.data, d => d.year);
        state.data.forEach(d => state.regions.add(d.region));

        // Initialize visualizations
        initializeVisualizations();
        setupEventListeners();
        
        // Load saved state after initializing visualizations
        loadDashboardState();
        
        // Update year value display
        const yearValue = document.getElementById('year-value');
        yearValue.textContent = state.selectedYear;
    } catch (error) {
        console.error('Error loading data:', error);
        document.body.innerHTML = `<div class="error">Error loading data: ${error.message}</div>`;
    }
}

// Initialize all visualizations
function initializeVisualizations() {
    // Initialize map
    initMap(state.data);
    
    // Initialize force-directed graph
    initForceDirected(state.data);
    
    // Initialize timeline
    initTimeline(state.data);
    
    // Initialize treemap
    initTreemap(state.data);
    
    // Initialize sunburst
    initSunburst(state.data);
    
    // Enable zoom behaviors after initialization
    if (typeof enableZoom === 'function') enableZoom();
}

// Setup event listeners for filters and interactions
function setupEventListeners() {
    // Region selector
    const regionSelect = document.getElementById('region');
    regionSelect.addEventListener('change', (event) => {
        state.selectedRegion = event.target.value;
        updateAllVisualizations();
        saveDashboardState(); // Save state when region changes
    });

    // Year slider
    const yearSlider = document.getElementById('year-slider');
    const yearValue = document.getElementById('year-value');
    const playButton = document.getElementById('play-button');
    
    yearSlider.addEventListener('input', (event) => {
        state.selectedYear = parseInt(event.target.value);
        yearValue.textContent = state.selectedYear;
        updateAllVisualizations();
        saveDashboardState(); // Save state when year changes
    });

    // Play button functionality
    playButton.addEventListener('click', () => {
        const icon = playButton.querySelector('i');
        if (!state.isPlaying) {
            // Start animation
            state.isPlaying = true;
            playButton.classList.add('playing');
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
            animateYears();
        } else {
            // Stop animation
            state.isPlaying = false;
            playButton.classList.remove('playing');
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
        }
    });
}

// Animate through years
function animateYears() {
    if (!state.isPlaying) return;

    const yearSlider = document.getElementById('year-slider');
    const yearValue = document.getElementById('year-value');
    const currentYear = parseInt(yearSlider.value);
    
    if (currentYear < state.yearRange[1]) {
        yearSlider.value = currentYear + 1;
        state.selectedYear = currentYear + 1;
        yearValue.textContent = state.selectedYear;
        updateAllVisualizations();
        
        setTimeout(animateYears, state.animationSpeed);
    } else {
        // Reset when reaching the end
        const playButton = document.getElementById('play-button');
        const icon = playButton.querySelector('i');
        state.isPlaying = false;
        playButton.classList.remove('playing');
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
    }
}

// Update all visualizations based on current state
function updateAllVisualizations() {
    updateMap();
    updateForceDirected();
    updateTimeline();
    updateTreemap();
    updateSunburst();
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', loadData);
