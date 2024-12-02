// Utility functions for the dashboard

// Export visualization as SVG
function exportAsSVG(svgElement, filename) {
    // Get SVG data
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgElement);
    
    // Add XML declaration
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// Export data as CSV
function exportAsCSV(data, filename) {
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// Save dashboard state
function saveDashboardState() {
    const dashboardState = {
        selectedYear: state.selectedYear,
        selectedRegion: state.selectedRegion,
        filters: state.filters || {},
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('tbDashboardState', JSON.stringify(dashboardState));
}

// Load dashboard state
function loadDashboardState() {
    const savedState = localStorage.getItem('tbDashboardState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        state.selectedYear = parsedState.selectedYear;
        state.selectedRegion = parsedState.selectedRegion;
        state.filters = parsedState.filters || {};
        
        // Update UI to reflect loaded state
        updateAllVisualizations();
    }
}

// Update all visualizations
function updateAllVisualizations() {
    if (typeof updateSunburst === 'function') updateSunburst();
    if (typeof updateTreemap === 'function') updateTreemap();
    if (typeof updateTimeline === 'function') updateTimeline();
    if (typeof updateMap === 'function') updateMap();
    if (typeof updateForceDirected === 'function') updateForceDirected();
}

// Add export buttons to visualization containers
function addExportButtons() {
    const containers = document.querySelectorAll('.viz-container');
    containers.forEach(container => {
        const exportGroup = document.createElement('div');
        exportGroup.className = 'export-group';
        
        // Add SVG export button
        const svgBtn = document.createElement('button');
        svgBtn.className = 'export-btn';
        svgBtn.innerHTML = '<i class="fas fa-download"></i> SVG';
        svgBtn.onclick = () => {
            const svg = container.querySelector('svg');
            if (svg) {
                const filename = `${container.querySelector('h2').textContent.toLowerCase().replace(/\s+/g, '-')}.svg`;
                exportAsSVG(svg, filename);
            }
        };
        
        // Add CSV export button
        const csvBtn = document.createElement('button');
        csvBtn.className = 'export-btn';
        csvBtn.innerHTML = '<i class="fas fa-table"></i> CSV';
        csvBtn.onclick = () => {
            const filename = `${container.querySelector('h2').textContent.toLowerCase().replace(/\s+/g, '-')}.csv`;
            exportAsCSV(state.data, filename);
        };
        
        exportGroup.appendChild(svgBtn);
        exportGroup.appendChild(csvBtn);
        container.querySelector('h2').parentNode.insertBefore(exportGroup, container.querySelector('h2').nextSibling);
    });
}

// Confetti celebration
function initCelebration() {
    const celebrateBtn = document.getElementById('celebrateBtn');
    if (celebrateBtn) {
        celebrateBtn.addEventListener('click', () => {
            // First burst
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            // Cannon left
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 }
                });
            }, 250);

            // Cannon right
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 }
                });
            }, 400);

            // Finale
            setTimeout(() => {
                const duration = 3000;
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

                function randomInRange(min, max) {
                    return Math.random() * (max - min) + min;
                }

                const interval = setInterval(function() {
                    const timeLeft = animationEnd - Date.now();

                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }

                    const particleCount = 50 * (timeLeft / duration);
                    confetti(Object.assign({}, defaults, {
                        particleCount,
                        origin: {
                            x: randomInRange(0.1, 0.3),
                            y: Math.random() - 0.2
                        }
                    }));
                    confetti(Object.assign({}, defaults, {
                        particleCount,
                        origin: {
                            x: randomInRange(0.7, 0.9),
                            y: Math.random() - 0.2
                        }
                    }));
                }, 250);
            }, 1500);
        });
    }
}

// Initialize all features
document.addEventListener('DOMContentLoaded', () => {
    addExportButtons();
    loadDashboardState();
    initCelebration();
});
