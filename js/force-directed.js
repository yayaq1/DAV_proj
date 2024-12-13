let forceSimulation, forceNodes, forceLinks, forceSvg, forceG;
let tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

function initForceDirected(data) {
    // Set up dimensions
    const width = document.getElementById('force-directed').clientWidth;
    const height = 400;

    // Create SVG
    forceSvg = d3.select('#force-directed')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    forceG = forceSvg.append('g')
        .attr('transform', 'translate(0,0)');

    // Add zoom behavior immediately
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            const transform = event.transform;
            forceG.attr('transform', `translate(${transform.x},${transform.y}) scale(${transform.k})`);
            saveDashboardState(); // Save state when zoom changes
        });

    forceSvg.call(zoom);

    // Process data for force layout
    const processedData = processForceData(data);
    forceNodes = processedData.nodes;
    forceLinks = processedData.links;

    // Create force simulation
    forceSimulation = d3.forceSimulation(forceNodes)
        .force('link', d3.forceLink(forceLinks).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(30));

    // Create links
    const links = forceG.selectAll('.link')
        .data(forceLinks)
        .enter()
        .append('line')
        .attr('class', 'link')
        .style('stroke', d => d.type === 'region' ? '#999' : '#ddd')
        .style('stroke-opacity', d => d.type === 'region' ? 0.6 : 0.3)
        .style('stroke-width', d => Math.sqrt(d.value) * 2);

    // Create nodes
    const nodes = forceG.selectAll('.node')
        .data(forceNodes)
        .enter()
        .append('circle')
        .attr('class', 'node')
        .attr('r', d => Math.sqrt(d.totalCases) / 100 + 5)
        .style('fill', d => d3.schemeCategory10[d.regionIndex])
        .style('stroke', '#fff')
        .style('stroke-width', 1.5)
        .call(drag(forceSimulation))
        .on('mouseover', (event, d) => {
            // Highlight connected nodes
            const connectedNodes = new Set(forceLinks
                .filter(l => l.source.id === d.id || l.target.id === d.id)
                .flatMap(l => [l.source.id, l.target.id]));

            forceG.selectAll('.node')
                .style('opacity', n => connectedNodes.has(n.id) ? 1 : 0.3);
            forceG.selectAll('.link')
                .style('opacity', l => l.source.id === d.id || l.target.id === d.id ? 1 : 0.1);
            forceG.selectAll('.label')
                .style('opacity', n => connectedNodes.has(n.id) ? 1 : 0.3);

            // Show tooltip
            tooltip
                .html(`
                    <strong>${d.id}</strong><br/>
                    Region: ${d.region}<br/>
                    Total Cases: ${d3.format(",")(d.totalCases)}<br/>
                    ${d.cured ? `Cured: ${d3.format(",")(d.cured)}<br/>` : ''}
                    ${d.deaths ? `Deaths: ${d3.format(",")(d.deaths)}` : ''}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px')
                .transition()
                .duration(200)
                .style('opacity', 0.9);
        })
        .on('mousemove', (event) => {
            tooltip
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => {
            forceG.selectAll('.node').style('opacity', 1);
            forceG.selectAll('.link').style('opacity', 1);
            forceG.selectAll('.label').style('opacity', 1);
            
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });

    // Add node labels
    const labels = forceG.selectAll('.label')
        .data(forceNodes)
        .enter()
        .append('text')
        .attr('class', 'label')
        .text(d => d.id)
        .style('font-size', '10px')
        .style('text-anchor', 'middle')
        .style('pointer-events', 'auto')
        .style('cursor', 'pointer')
        .style('fill', '#333')
        .style('font-weight', 'bold')
        .on('mouseover', (event, d) => {
            // Highlight connected nodes
            const connectedNodes = new Set(forceLinks
                .filter(l => l.source.id === d.id || l.target.id === d.id)
                .flatMap(l => [l.source.id, l.target.id]));

            forceG.selectAll('.node')
                .style('opacity', n => connectedNodes.has(n.id) ? 1 : 0.3);
            forceG.selectAll('.link')
                .style('opacity', l => l.source.id === d.id || l.target.id === d.id ? 1 : 0.1);
            forceG.selectAll('.label')
                .style('opacity', n => connectedNodes.has(n.id) ? 1 : 0.3);

            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            tooltip.html(`
                <strong>${d.id}</strong><br/>
                Region: ${d.region}<br/>
                Total Cases: ${d3.format(",")(d.totalCases)}<br/>
                Connected Countries: ${d.connections}<br/>
                ${d.cured ? `Cured: ${d3.format(",")(d.cured)}<br/>` : ''}
                ${d.deaths ? `Deaths: ${d3.format(",")(d.deaths)}` : ''}
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => {
            forceG.selectAll('.node').style('opacity', 1);
            forceG.selectAll('.link').style('opacity', 0.6);
            forceG.selectAll('.label').style('opacity', 1);
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });

    // Add hover interactions
    nodes.on('mouseover', (event, d) => {
            // Highlight connected nodes
            const connectedNodes = new Set(forceLinks
                .filter(l => l.source.id === d.id || l.target.id === d.id)
                .flatMap(l => [l.source.id, l.target.id]));

            forceG.selectAll('.node')
                .style('opacity', n => connectedNodes.has(n.id) ? 1 : 0.3);
            forceG.selectAll('.link')
                .style('opacity', l => l.source.id === d.id || l.target.id === d.id ? 1 : 0.1);
            forceG.selectAll('.label')
                .style('opacity', n => connectedNodes.has(n.id) ? 1 : 0.3);

            // Show tooltip
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            tooltip.html(`
                <strong>${d.id}</strong><br/>
                Region: ${d.region}<br/>
                Total Cases: ${d3.format(",")(d.totalCases)}<br/>
                Connected Countries: ${d.connections}<br/>
                ${d.cured ? `Cured: ${d3.format(",")(d.cured)}<br/>` : ''}
                ${d.deaths ? `Deaths: ${d3.format(",")(d.deaths)}` : ''}
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => {
            forceG.selectAll('.node').style('opacity', 1);
            forceG.selectAll('.link').style('opacity', 0.6);
            forceG.selectAll('.label').style('opacity', 1);
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });

    // Update force simulation
    forceSimulation.on('tick', () => {
        links
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        nodes
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);

        labels
            .attr('x', d => d.x)
            .attr('y', d => d.y - 15);
    });

}

// Process data for force layout
function processForceData(data) {
    const nodes = [];
    const links = [];
    const countryData = new Map();
    const regionColors = {
        'Asia': 0,
        'Africa': 1
    };

    // Process nodes
    data.forEach(d => {
        if (!countryData.has(d.country)) {
            countryData.set(d.country, {
                id: d.country,
                region: d.region,
                totalCases: 0,
                cured: 0,
                deaths: 0,
                connections: 0,
                regionIndex: regionColors[d.region] || 0
            });
        }
        const country = countryData.get(d.country);
        country.totalCases += d.cases || 0;
        country.cured += d.cured || 0;
        country.deaths += d.deaths || 0;
    });

    // Create nodes array
    nodes.push(...Array.from(countryData.values()));

    // Create meaningful links based on similar TB patterns
    nodes.forEach(source => {
        nodes.forEach(target => {
            if (source.id !== target.id) {
                // Calculate similarity based on cases and region
                const caseSimilarity = Math.abs(Math.log(source.totalCases) - Math.log(target.totalCases));
                const regionSimilarity = source.region === target.region ? 1 : 0;
                
                // Create link if countries are similar
                if (caseSimilarity < 1 || regionSimilarity === 1) {
                    const linkId = [source.id, target.id].sort().join('-');
                    if (!links.find(l => l.id === linkId)) {
                        links.push({
                            id: linkId,
                            source: source.id,
                            target: target.id,
                            value: regionSimilarity + (1 / (caseSimilarity + 1)),
                            type: source.region === target.region ? 'region' : 'pattern'
                        });
                        source.connections++;
                        target.connections++;
                    }
                }
            }
        });
    });

    return {
        nodes: nodes,
        links: links
    };
}

function updateForceDirected() {
    if (!state.data || !forceSimulation) return;

    // Filter data based on current state
    const processedData = processForceData(
        state.data.filter(d => {
            if (state.selectedRegion !== 'all' && d.region !== state.selectedRegion) return false;
            return true;
        })
    );

    // Stop the previous simulation
    forceSimulation.stop();
    
    // Clear all existing elements (except tooltip)
    forceG.selectAll('*').remove();

    // Update nodes and links
    forceNodes = processedData.nodes;
    forceLinks = processedData.links;

    // Create new elements
    const links = forceG.selectAll('.link')
        .data(forceLinks)
        .enter()
        .append('line')
        .attr('class', 'link')
        .style('stroke', d => d.type === 'region' ? '#999' : '#ddd')
        .style('stroke-opacity', d => d.type === 'region' ? 0.6 : 0.3)
        .style('stroke-width', d => Math.sqrt(d.value) * 2);

    const nodes = forceG.selectAll('.node')
        .data(forceNodes)
        .enter()
        .append('circle')
        .attr('class', 'node')
        .attr('r', d => Math.sqrt(d.totalCases) / 100 + 5)
        .style('fill', d => d3.schemeCategory10[d.regionIndex])
        .style('stroke', '#fff')
        .style('stroke-width', 1.5)
        .call(drag(forceSimulation))
        .on('mouseover', (event, d) => {
            // Highlight connected nodes
            const connectedNodes = new Set(forceLinks
                .filter(l => l.source.id === d.id || l.target.id === d.id)
                .flatMap(l => [l.source.id, l.target.id]));

            forceG.selectAll('.node')
                .style('opacity', n => connectedNodes.has(n.id) ? 1 : 0.3);
            forceG.selectAll('.link')
                .style('opacity', l => l.source.id === d.id || l.target.id === d.id ? 1 : 0.1);
            forceG.selectAll('.label')
                .style('opacity', n => connectedNodes.has(n.id) ? 1 : 0.3);

            // Show tooltip
            tooltip
                .html(`
                    <strong>${d.id}</strong><br/>
                    Region: ${d.region}<br/>
                    Total Cases: ${d3.format(",")(d.totalCases)}<br/>
                    ${d.cured ? `Cured: ${d3.format(",")(d.cured)}<br/>` : ''}
                    ${d.deaths ? `Deaths: ${d3.format(",")(d.deaths)}` : ''}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px')
                .transition()
                .duration(200)
                .style('opacity', 0.9);
        })
        .on('mousemove', (event) => {
            tooltip
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => {
            forceG.selectAll('.node').style('opacity', 1);
            forceG.selectAll('.link').style('opacity', 1);
            forceG.selectAll('.label').style('opacity', 1);
            
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });

    // Add labels
    const labels = forceG.selectAll('.label')
        .data(forceNodes)
        .enter()
        .append('text')
        .attr('class', 'label')
        .text(d => d.id)
        .style('font-size', '10px')
        .style('text-anchor', 'middle')
        .style('pointer-events', 'none');

    // Restart simulation with new nodes
    forceSimulation
        .nodes(forceNodes)
        .force('link', d3.forceLink(forceLinks).id(d => d.id).distance(100))
        .on('tick', () => {
            links
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            nodes
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            labels
                .attr('x', d => d.x)
                .attr('y', d => d.y - 15);
        })
        .alpha(1)
        .restart();

    // Add legends
    const width = forceSvg.attr('width');
    const legendG = forceG.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - 150}, 20)`);

    const regions = Array.from(new Set(forceNodes.map(d => d.region)));
    regions.forEach((region, i) => {
        const legendRow = legendG.append('g')
            .attr('transform', `translate(0, ${i * 20})`);
        
        legendRow.append('circle')
            .attr('r', 5)
            .style('fill', d3.schemeCategory10[i]);
        
        legendRow.append('text')
            .attr('x', 15)
            .attr('y', 5)
            .text(region);
    });

    const relationLegendG = forceG.append('g')
        .attr('class', 'relation-legend')
        .attr('transform', `translate(${width - 150}, ${regions.length * 20 + 40})`);

    // Regional connection
    relationLegendG.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 30)
        .attr('y2', 0)
        .style('stroke', '#999')
        .style('stroke-width', 2);

    relationLegendG.append('text')
        .attr('x', 40)
        .attr('y', 5)
        .text('Regional Connection');

    // Similar pattern
    relationLegendG.append('line')
        .attr('x1', 0)
        .attr('y1', 20)
        .attr('x2', 30)
        .attr('y2', 20)
        .style('stroke', '#ddd')
        .style('stroke-width', 2);

    relationLegendG.append('text')
        .attr('x', 40)
        .attr('y', 25)
        .text('Similar Pattern');
}

// Drag behavior
function drag(simulation) {
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
}
