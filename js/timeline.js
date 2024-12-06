// Global variables for chart dimensions and elements
let timelineSvg, timelineG, timelineTooltip;
let width, height, margin, chartWidth, chartHeight;

function initTimeline(data) {
    if (!document.getElementById('timeline')) return;

    // Set up dimensions with proper margins for labels and legend
    width = document.getElementById('timeline').clientWidth;
    height = 500;
    margin = { top: 40, right: 160, bottom: 60, left: 80 };
    chartWidth = width - margin.left - margin.right;
    chartHeight = height - margin.top - margin.bottom;

    // Clear any existing SVG and tooltips
    d3.select('#timeline').selectAll('svg').remove();
    d3.selectAll('.timeline-tooltip').remove();

    // Create SVG
    timelineSvg = d3.select('#timeline')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Add title
    timelineSvg.append('text')
        .attr('class', 'chart-title')
        .attr('x', width / 2)
        .attr('y', 25)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('font-weight', 'bold')
        .text('TB Cases Trend Analysis (2007-2020)');

    // Create chart group
    timelineG = timelineSvg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create tooltip
    timelineTooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip timeline-tooltip')
        .style('opacity', 0);

    // Update timeline with data
    updateTimeline();
}

function updateTimeline() {
    if (!state.data || !timelineG) return;

    // Clear existing elements
    timelineG.selectAll('*').remove();
    timelineSvg.selectAll('.legend').remove();

    // Process data by year and type
    const yearlyData = d3.group(state.data, d => d.year);
    const timelineData = Array.from(yearlyData, ([year, values]) => ({
        year: year,
        totalCases: d3.sum(values, d => d.cases),
        totalCured: d3.sum(values, d => d.cured),
        totalDeaths: d3.sum(values, d => d.deaths)
    })).sort((a, b) => a.year - b.year);

    if (timelineData.length === 0) return;

    // Set up scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(timelineData, d => d.year))
        .range([0, chartWidth])
        .nice();

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(timelineData, d => Math.max(d.totalCases, d.totalCured, d.totalDeaths))])
        .range([chartHeight, 0])
        .nice();

    // Create line generators
    const createLine = metric => {
        return d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d[metric]))
            .curve(d3.curveMonotoneX);
    };

    // Define line colors and labels
    const lines = [
        { metric: 'totalCases', color: '#2196F3', label: 'Total Cases' },
        { metric: 'totalCured', color: '#4CAF50', label: 'Cured Cases' },
        { metric: 'totalDeaths', color: '#F44336', label: 'Deaths' }
    ];

    // Draw axes
    const xAxis = d3.axisBottom(xScale)
        .ticks(Math.min(timelineData.length, 10))
        .tickFormat(d3.format('d'));
    
    const yAxis = d3.axisLeft(yScale)
        .ticks(10)
        .tickFormat(d3.format(','));

    // Add X axis
    timelineG.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(xAxis)
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)');  // Rotate labels for better readability

    // Add X axis label
    timelineG.append('text')
        .attr('class', 'x-label')
        .attr('x', chartWidth / 2)
        .attr('y', chartHeight + 40)
        .style('text-anchor', 'middle')
        .text('Year');

    // Add Y axis
    timelineG.append('g')
        .attr('class', 'y-axis')
        .call(yAxis);

    // Add Y axis label
    timelineG.append('text')
        .attr('class', 'y-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -chartHeight / 2)
        .attr('y', -60)
        .style('text-anchor', 'middle')
        .text('Number of Cases');

    // Draw lines and points
    lines.forEach(line => {
        // Draw the line with animation
        const path = timelineG.append('path')
            .datum(timelineData)
            .attr('class', `line-${line.metric}`)
            .attr('fill', 'none')
            .attr('stroke', line.color)
            .attr('stroke-width', 2)
            .attr('d', createLine(line.metric));

        // Get the total length of the path
        const totalLength = path.node().getTotalLength();

        // Set up the initial state of the line
        path
            .attr('stroke-dasharray', totalLength + ' ' + totalLength)
            .attr('stroke-dashoffset', totalLength)
            .transition()
            .duration(2000)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', 0);

        // Add dots for each data point
        timelineG.selectAll(`.dot-${line.metric}`)
            .data(timelineData)
            .join('circle')
            .attr('class', `dot-${line.metric}`)
            .attr('cx', d => xScale(d.year))
            .attr('cy', d => yScale(d[line.metric]))
            .attr('r', 4)
            .attr('fill', line.color)
            .on('mouseover', (event, d) => {
                // Highlight point
                d3.select(event.currentTarget)
                    .attr('r', 6)
                    .attr('stroke', '#000')
                    .attr('stroke-width', 2);

                // Show tooltip
                timelineTooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                timelineTooltip.html(`
                    <strong>Year: ${d.year}</strong><br/>
                    <hr style="margin: 5px 0;">
                    Total Cases: ${d3.format(',')(d.totalCases)}<br/>
                    Cured: ${d3.format(',')(d.totalCured)}<br/>
                    Deaths: ${d3.format(',')(d.totalDeaths)}
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', (event) => {
                // Restore point style
                d3.select(event.currentTarget)
                    .attr('r', 4)
                    .attr('stroke', 'none');

                // Hide tooltip
                timelineTooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
    });

    // Add CSS styles for legend interactivity
    const style = document.createElement('style');
    style.textContent = `
        .legend-item.inactive line,
        .legend-item.inactive circle {
            opacity: 0.2;
        }
        .legend-item.inactive text {
            opacity: 0.5;
        }
        .legend-item:hover {
            opacity: 0.8;
        }
    `;
    document.head.appendChild(style);

    // Add legend
    const legend = timelineSvg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - margin.right + 20},${margin.top})`);

    lines.forEach((line, i) => {
        const legendItem = legend.append('g')
            .attr('transform', `translate(0,${i * 25})`)
            .attr('class', `legend-item legend-${line.metric}`)
            .style('cursor', 'pointer')
            .on('click', function() {
                // Toggle active state
                const active = !d3.select(this).classed('inactive');
                d3.select(this).classed('inactive', active);
                
                // Update line visibility
                timelineG.selectAll(`.line-${line.metric}`)
                    .transition()
                    .duration(300)
                    .style('opacity', active ? 0.2 : 1);
                
                // Update points visibility
                timelineG.selectAll(`.dot-${line.metric}`)
                    .transition()
                    .duration(300)
                    .style('opacity', active ? 0.2 : 1);
            });

        // Add line to legend
        legendItem.append('line')
            .attr('x1', 0)
            .attr('x2', 20)
            .attr('y1', 10)
            .attr('y2', 10)
            .attr('stroke', line.color)
            .attr('stroke-width', 2);

        // Add point to legend
        legendItem.append('circle')
            .attr('cx', 10)
            .attr('cy', 10)
            .attr('r', 4)
            .attr('fill', line.color);

        // Add label to legend
        legendItem.append('text')
            .attr('x', 30)
            .attr('y', 15)
            .text(line.label)
            .style('font-size', '12px');
    });
}

function toggleAnimation() {
    const button = d3.select('.play-button');
    if (button.text() === '▶') {
        button.text('⏸');
        startAnimation();
    } else {
        button.text('▶');
        stopAnimation();
    }
}

function startAnimation() {
    const years = d3.range(
        d3.min(state.data, d => d.year),
        d3.max(state.data, d => d.year) + 1
    );
    let currentIndex = years.indexOf(state.selectedYear) + 1;
    
    animationInterval = setInterval(() => {
        if (currentIndex >= years.length) {
            currentIndex = 0;
        }
        state.selectedYear = years[currentIndex];
        updateVisualizations();
        d3.select('.timeline-slider').property('value', state.selectedYear);
        currentIndex++;
    }, 1000);
}

function stopAnimation() {
    clearInterval(animationInterval);
}
