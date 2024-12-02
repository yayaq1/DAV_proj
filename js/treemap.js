let treemapSvg, treemapG;
let currentMetric = 'cases';

function updateTreemap() {
    if (!state.data || !treemapG) return;

    // Clear existing elements
    treemapG.selectAll('*').remove();

    // Filter data
    const filteredData = state.data.filter(d => {
        if (state.selectedYear && d.year !== state.selectedYear) return false;
        if (state.selectedRegion !== 'all' && d.region !== state.selectedRegion) return false;
        return true;
    });

    if (filteredData.length === 0) {
        treemapG.append('text')
            .attr('x', treemapSvg.attr('width') / 2)
            .attr('y', treemapSvg.attr('height') / 2)
            .attr('text-anchor', 'middle')
            .text('No data available for selected filters');
        return;
    }

    // Create flat hierarchy for simplicity
    const regionData = Array.from(d3.group(filteredData, d => d.region), ([region, countries]) => ({
        name: region,
        children: Array.from(d3.group(countries, d => d.country), ([country, values]) => ({
            name: country,
            value: d3.sum(values, d => d[currentMetric] || 0)
        }))
    }));

    // Create hierarchy
    const root = d3.hierarchy({
        name: "root",
        children: regionData
    })
    .sum(d => d.value || 0)
    .sort((a, b) => b.value - a.value);

    // Create treemap layout with more padding
    const treemap = d3.treemap()
        .size([treemapSvg.attr('width'), treemapSvg.attr('height') - 30]) // Reduced top margin
        .paddingTop(15)    // Reduced top padding
        .paddingRight(1)   // Reduced right padding
        .paddingBottom(1)  // Reduced bottom padding
        .paddingLeft(1)    // Reduced left padding
        .paddingInner(1);  // Reduced inner padding between cells

    treemap(root);

    // Create color scale
    const colorScale = d3.scaleOrdinal()
        .domain(['Asia', 'Africa'])
        .range(['#2196F3', '#FF9800']);

    // Draw cells
    const cell = treemapG.selectAll('g')
        .data(root.leaves())
        .join('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

    // Add rectangles
    cell.append('rect')
        .attr('width', d => Math.max(0, d.x1 - d.x0))
        .attr('height', d => Math.max(0, d.y1 - d.y0))
        .attr('fill', d => {
            const region = d.parent ? d.parent.data.name : null;
            return colorScale(region);
        })
        .attr('opacity', 0.8)
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('opacity', 1)
                .attr('stroke', '#000')
                .attr('stroke-width', 2);

            const tooltip = d3.select('.treemap-tooltip');
            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);

            const region = d.parent ? d.parent.data.name : 'Unknown';
            tooltip.html(`
                <div style="margin-bottom: 5px;"><strong>${d.data.name}</strong></div>
                <div style="color: #666;">Region: ${region}</div>
                <div style="font-size: 16px; margin-top: 5px;">${currentMetric}: ${d3.format(',')(d.value)}</div>
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('opacity', 0.8)
                .attr('stroke', 'none');

            d3.select('.treemap-tooltip')
                .transition()
                .duration(500)
                .style('opacity', 0);
        });

    // Add labels with adaptive font sizing
    cell.append('text')
        .attr('class', 'cell-label')
        .attr('x', 4)
        .style('fill', 'white')
        .style('font-weight', 'bold')
        .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.6)')
        .each(function(d) {
            const node = d3.select(this);
            const cellWidth = d.x1 - d.x0;
            const cellHeight = d.y1 - d.y0;
            const padding = 8;
            const maxWidth = cellWidth - (padding * 2);
            
            // Start with a large font size
            let fontSize = Math.min(cellWidth / 8, cellHeight / 4);
            fontSize = Math.min(Math.max(fontSize, 10), 16); // Clamp between 10 and 16
            
            node.style('font-size', fontSize + 'px');
            
            // Split text into words
            const words = d.data.name.split(/\s+/);
            const lineHeight = fontSize * 1.1;
            let lines = [];
            let currentLine = [];
            
            // Create lines of text
            words.forEach(word => {
                currentLine.push(word);
                node.text(currentLine.join(' '));
                
                if (this.getComputedTextLength() > maxWidth && currentLine.length > 1) {
                    currentLine.pop();
                    lines.push(currentLine.join(' '));
                    currentLine = [word];
                }
            });
            if (currentLine.length > 0) {
                lines.push(currentLine.join(' '));
            }
            
            // Clear the text element
            node.text('');
            
            // Add lines as tspans
            lines.forEach((line, i) => {
                node.append('tspan')
                    .attr('x', 4)
                    .attr('dy', i === 0 ? fontSize : lineHeight)
                    .text(line);
            });
        });
}

function initTreemap(data) {
    // Clear any existing SVG
    d3.select('#treemap').selectAll('svg').remove();
    d3.selectAll('.treemap-tooltip').remove();

    // Set up metric selector
    d3.select('#treemap-metric')
        .on('change', function() {
            currentMetric = this.value;
            updateTreemap();
        });

    // Set up dimensions
    const width = document.getElementById('treemap').clientWidth;
    const height = 500;

    // Create SVG
    treemapSvg = d3.select('#treemap')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Create main group for treemap
    treemapG = treemapSvg.append('g')
        .attr('transform', 'translate(0, 40)');

    // Create tooltip if it doesn't exist
    if (d3.select('.treemap-tooltip').empty()) {
        d3.select('body').append('div')
            .attr('class', 'tooltip treemap-tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background-color', 'white')
            .style('border', '1px solid #ddd')
            .style('border-radius', '4px')
            .style('padding', '10px')
            .style('pointer-events', 'none')
            .style('font-size', '14px')
            .style('z-index', '1000');
    }

    // Initialize with data
    updateTreemap();
}
