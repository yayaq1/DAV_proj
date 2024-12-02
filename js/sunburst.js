let sunburstSvg, sunburstG;

function initSunburst(data) {
    // Set up dimensions
    const width = document.getElementById('sunburst').clientWidth;
    const height = 500;
    const radius = Math.min(width, height) / 2;

    // Clear previous SVG if it exists
    d3.select('#sunburst').selectAll('svg').remove();

    // Create SVG
    sunburstSvg = d3.select('#sunburst')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    sunburstG = sunburstSvg.append('g')
        .attr('transform', `translate(${width/2},${height/2})`);

    // Create tooltip
    const tooltip = d3.select('body').selectAll('.sunburst-tooltip').data([0])
        .join('div')
        .attr('class', 'tooltip sunburst-tooltip')
        .style('opacity', 0);

    updateSunburst();
}

function updateSunburst() {
    if (!state.data) return;

    const width = sunburstSvg.attr('width');
    const height = sunburstSvg.attr('height');
    const radius = Math.min(width, height) / 2;

    // Filter data based on current state
    const filteredData = state.data.filter(d => {
        if (state.selectedYear && d.year !== state.selectedYear) return false;
        if (state.selectedRegion !== 'all' && d.region !== state.selectedRegion) return false;
        return true;
    });

    // Create hierarchical structure
    const root = d3.hierarchy({
        name: "Total TB Cases",
        children: Array.from(
            d3.group(filteredData, d => d.region),
            ([region, regionData]) => ({
                name: region,
                children: Array.from(
                    d3.group(regionData, d => d.country),
                    ([country, countryData]) => ({
                        name: country,
                        value: d3.sum(countryData, d => d.cases),
                        metrics: {
                            cases: d3.sum(countryData, d => d.cases),
                            cured: d3.sum(countryData, d => d.cured),
                            deaths: d3.sum(countryData, d => d.deaths)
                        }
                    })
                )
            })
        )
    });

    // Calculate values for the hierarchy
    root.sum(d => d.value || 0);

    // Create partition layout
    const partition = d3.partition()
        .size([2 * Math.PI, radius]);

    const arcData = partition(root).descendants();

    // Create arc generator
    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1);

    // Color scale
    const color = d3.scaleOrdinal()
        .domain(['Asia', 'Africa'])
        .range(['#2196F3', '#FF9800']);

    const getColor = (d) => {
        if (!d.parent) return '#f5f5f5';
        if (d.depth === 1) return color(d.data.name);
        return d3.color(color(d.parent.data.name)).brighter(0.5);
    };

    // Update paths
    const paths = sunburstG.selectAll('path')
        .data(arcData);

    paths.exit().remove();

    const pathsEnter = paths.enter()
        .append('path');

    paths.merge(pathsEnter)
        .attr('d', arc)
        .attr('fill', getColor)
        .attr('opacity', 0.8)
        .attr('stroke', '#fff')
        .attr('stroke-width', '0.5')
        .on('mouseover', (event, d) => {
            d3.select(event.currentTarget).attr('opacity', 1);

            let tooltipContent = '';
            const percentage = ((d.value / root.value) * 100).toFixed(1);

            if (!d.parent) {
                tooltipContent = `
                    <strong>Total TB Cases</strong><br/>
                    Cases: ${d3.format(',')(d.value)}<br/>
                    Regions: ${d.children.length}
                `;
            } else if (!d.children) {
                const metrics = d.data.metrics;
                tooltipContent = `
                    <strong>${d.data.name}</strong><br/>
                    Total Cases: ${d3.format(',')(metrics.cases)}<br/>
                    Cured: ${d3.format(',')(metrics.cured)} (${((metrics.cured / metrics.cases) * 100).toFixed(1)}%)<br/>
                    Deaths: ${d3.format(',')(metrics.deaths)} (${((metrics.deaths / metrics.cases) * 100).toFixed(1)}%)<br/>
                    ${percentage}% of total cases
                `;
            } else {
                const totalCases = d3.sum(d.leaves(), d => d.value);
                const totalCured = d3.sum(d.leaves(), d => d.data.metrics.cured);
                const totalDeaths = d3.sum(d.leaves(), d => d.data.metrics.deaths);
                
                tooltipContent = `
                    <strong>${d.data.name}</strong><br/>
                    Total Cases: ${d3.format(',')(totalCases)}<br/>
                    Cured: ${d3.format(',')(totalCured)} (${((totalCured / totalCases) * 100).toFixed(1)}%)<br/>
                    Deaths: ${d3.format(',')(totalDeaths)} (${((totalDeaths / totalCases) * 100).toFixed(1)}%)<br/>
                    Countries: ${d.children.length}<br/>
                    ${percentage}% of total cases
                `;
            }

            d3.select('.sunburst-tooltip')
                .style('opacity', 1)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px')
                .html(tooltipContent);
        })
        .on('mouseout', (event) => {
            d3.select(event.currentTarget).attr('opacity', 0.8);
            d3.select('.sunburst-tooltip').style('opacity', 0);
        })
        .on('click', (event, d) => {
            // Update center text
            updateCenterText(d);
        });

    // Initialize center text
    updateCenterText(root);
}

function updateCenterText(d) {
    // Remove all existing text elements
    sunburstG.selectAll('.center-text, .center-text-sub').remove();

    // Add new center text
    const centerText = sunburstG.append('text')
        .attr('class', 'center-text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', '16px')
        .attr('fill', '#2c3e50');

    if (d.parent) {
        centerText.text(d.data.name);
        
        // Add subtitle with total cases if available
        if (d.data.metrics || d.children) {
            const cases = d.data.metrics ? 
                d.data.metrics.cases : 
                d3.sum(d.leaves(), d => d.value);
            
            sunburstG.append('text')
                .attr('class', 'center-text-sub')
                .attr('text-anchor', 'middle')
                .attr('dy', '2em')
                .attr('font-size', '12px')
                .attr('fill', '#666')
                .text(`${d3.format(',')(cases)} cases`);
        }
    } else {
        centerText.text('TB Cases');
        
        // Only show the year text if a year is selected
        const yearText = state.selectedYear ? ` (${state.selectedYear})` : '';
        const totalCases = d3.format(',')(d.value);
        
        sunburstG.append('text')
            .attr('class', 'center-text-sub')
            .attr('text-anchor', 'middle')
            .attr('dy', '2em')
            .attr('font-size', '12px')
            .attr('fill', '#666')
            .text(`${totalCases} total cases${yearText}`);
    }
}
