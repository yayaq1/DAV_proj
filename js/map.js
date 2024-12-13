let mapSvg, mapProjection, mapG, mapTooltip, mapLegend;

function initMap(data) {
    // Set up map dimensions with proper margins
    const width = document.getElementById('map-chart').clientWidth;
    const height = 500;
    const margin = { top: 20, right: 160, bottom: 20, left: 20 };
    const mapWidth = width - margin.left - margin.right;
    const mapHeight = height - margin.top - margin.bottom;

    // Create SVG
    mapSvg = d3.select('#map-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Create map group with margins
    mapG = mapSvg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create projection centered on Africa and Asia
    mapProjection = d3.geoMercator()
        .scale((mapWidth) / 5) // Increased scale to zoom in
        .center([60, 20]) // Centered between Africa and Asia
        .translate([mapWidth / 2, mapHeight / 2]);

    // Create tooltip
    mapTooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    // Create legend group
    mapLegend = mapSvg.append('g')
        .attr('class', 'map-legend')
        .attr('transform', `translate(${width - margin.right + 20},${margin.top})`);

    // Add zoom behavior immediately
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', (event) => {
            const transform = event.transform;
            mapG.attr('transform', `translate(${transform.x},${transform.y}) scale(${transform.k})`);
            saveDashboardState();
        });

    mapSvg.call(zoom);

    // Load world map data
    d3.json('https://unpkg.com/world-atlas@2/countries-110m.json')
        .then(worldData => {
            // Create a map of country names to features for later use
            const countries = topojson.feature(worldData, worldData.objects.countries);
            window.countryFeatures = {};
            
            // Filter to show only African and Asian countries
            const relevantRegions = {
                // African countries
                'Algeria': true, 'Angola': true, 'Benin': true, 'Botswana': true, 
                'Burkina Faso': true, 'Burundi': true, 'Cameroon': true, 
                'Central African Republic': true, 'Chad': true, 'Congo': true, 
                'Democratic Republic of the Congo': true, 'Djibouti': true, 
                'Egypt': true, 'Equatorial Guinea': true, 'Eritrea': true, 
                'Ethiopia': true, 'Gabon': true, 'Gambia': true, 'Ghana': true, 
                'Guinea': true, 'Guinea-Bissau': true, 'Ivory Coast': true, 
                'Kenya': true, 'Lesotho': true, 'Liberia': true, 'Libya': true, 
                'Madagascar': true, 'Malawi': true, 'Mali': true, 'Mauritania': true, 
                'Morocco': true, 'Mozambique': true, 'Namibia': true, 'Niger': true, 
                'Nigeria': true, 'Rwanda': true, 'Senegal': true, 'Sierra Leone': true, 
                'Somalia': true, 'South Africa': true, 'South Sudan': true, 'Sudan': true, 
                'Swaziland': true, 'Tanzania': true, 'Togo': true, 'Tunisia': true, 
                'Uganda': true, 'Zambia': true, 'Zimbabwe': true,
                // Asian countries
                'Afghanistan': true, 'Bangladesh': true, 'Bhutan': true, 
                'Brunei': true, 'Cambodia': true, 'China': true, 'India': true, 
                'Indonesia': true, 'Japan': true, 'Kazakhstan': true, 
                'Kyrgyzstan': true, 'Laos': true, 'Malaysia': true, 'Mongolia': true, 
                'Myanmar': true, 'Nepal': true, 'North Korea': true, 'Pakistan': true, 
                'Philippines': true, 'Singapore': true, 'South Korea': true, 
                'Sri Lanka': true, 'Taiwan': true, 'Tajikistan': true, 
                'Thailand': true, 'Turkmenistan': true, 'Uzbekistan': true, 
                'Vietnam': true
            };

            // Filter features to only include relevant countries
            const filteredFeatures = countries.features.filter(feature => 
                feature.properties && relevantRegions[feature.properties.name]
            );
            
            countries.features = filteredFeatures;
            
            filteredFeatures.forEach(feature => {
                if (feature.properties) {
                    window.countryFeatures[feature.properties.name] = feature;
                }
            });
            
            // Draw country boundaries
            mapG.selectAll('path')
                .data(filteredFeatures)
                .enter()
                .append('path')
                .attr('d', d3.geoPath().projection(mapProjection))
                .attr('class', 'country')
                .attr('fill', '#f0f0f0')
                .attr('stroke', '#fff')
                .attr('stroke-width', 0.5);

            // Update map with data
            updateMap(data);
        });
}

function updateMap() {
    if (!state.data || !mapG) return;

    // Filter data based on current state
    const filteredData = state.data.filter(d => {
        if (state.selectedYear && d.year !== state.selectedYear) return false;
        if (state.selectedRegion !== 'all' && d.region !== state.selectedRegion) return false;
        return true;
    });

    // Create color scale for TB cases
    const maxCases = d3.max(filteredData, d => d.cases);
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
        .domain([0, maxCases]);

    // Create a map of country data for quick lookup
    const countryDataMap = {};
    filteredData.forEach(d => {
        countryDataMap[d.country] = d;
    });

    // Update country colors
    mapG.selectAll('.country')
        .attr('fill', function(d) {
            const countryName = d.properties.name;
            const countryData = countryDataMap[countryName];
            return countryData ? colorScale(countryData.cases) : '#f0f0f0';
        })
        .on('mouseover', (event, d) => {
            const countryName = d.properties.name;
            const countryData = countryDataMap[countryName];
            
            if (countryData) {
                // Highlight country
                d3.select(event.currentTarget)
                    .attr('stroke', '#000')
                    .attr('stroke-width', 1.5);

                mapTooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                mapTooltip.html(`
                    <strong>${countryData.country}</strong><br/>
                    <hr style="margin: 5px 0;">
                    Year: ${countryData.year}<br/>
                    Total Cases: ${d3.format(",")(countryData.cases)}<br/>
                    Deaths: ${d3.format(",")(countryData.deaths)}<br/>
                    Cured: ${d3.format(",")(countryData.cured)}<br/>
                    Mortality Rate: ${d3.format(".1%")(countryData.deaths/countryData.cases)}
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            }
        })
        .on('mouseout', (event) => {
            // Restore country style
            d3.select(event.currentTarget)
                .attr('stroke', '#fff')
                .attr('stroke-width', 0.5);

            mapTooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });

    // Update legend
    updateMapLegend(colorScale, maxCases);
}

function updateMapLegend(colorScale, maxCases) {
    // Clear existing legend
    mapLegend.selectAll('*').remove();

    // Add title
    mapLegend.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .text('TB Cases')
        .style('font-weight', 'bold')
        .style('font-size', '12px');

    const legendHeight = 150;
    const legendWidth = 20;

    // Create linear scale for legend
    const legendScale = d3.scaleLinear()
        .domain([0, maxCases])
        .range([legendHeight, 0]);

    // Create gradient
    const defs = mapLegend.append('defs');
    const gradient = defs.append('linearGradient')
        .attr('id', 'legend-gradient')
        .attr('x1', '0%')
        .attr('x2', '0%')
        .attr('y1', '0%')
        .attr('y2', '100%');

    // Add gradient stops
    const numStops = 10;
    d3.range(numStops).forEach(i => {
        const offset = i / (numStops - 1);
        gradient.append('stop')
            .attr('offset', `${offset * 100}%`)
            .attr('stop-color', colorScale(maxCases * (1 - offset)));
    });

    // Add gradient rectangle
    mapLegend.append('rect')
        .attr('x', 0)
        .attr('y', 20)
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#legend-gradient)');

    // Add axis
    const legendAxis = d3.axisRight(legendScale)
        .ticks(5)
        .tickFormat(d3.format('.0s'));

    mapLegend.append('g')
        .attr('transform', `translate(${legendWidth}, 20)`)
        .call(legendAxis);
}
