import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { formatBytes } from '../../utils/format'
import type { DiskNode } from '../../../shared/types'

interface TreeMapProps {
  data: DiskNode
  width?: number
  height?: number
  onNodeClick?: (node: DiskNode) => void
}

export default function TreeMap({ data, width = 800, height = 450, onNodeClick }: TreeMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (!svgRef.current || !data) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const root = d3
      .hierarchy(data)
      .sum((d) => d.size || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    const treemapLayout = d3
      .treemap<DiskNode>()
      .size([width, height])
      .paddingOuter(4)
      .paddingInner(2)
      .tile(d3.treemapSquarify)

    treemapLayout(root)

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10)
    const leaves = root.leaves() as d3.HierarchyRectangularNode<DiskNode>[]

    const nodes = svg
      .selectAll('g')
      .data(leaves)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`)
      .style('cursor', 'pointer')
      .on('click', (_, d) => {
        if (onNodeClick) onNodeClick(d.data)
      })

    // Rectangles
    nodes
      .append('rect')
      .attr('width', (d) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d) => Math.max(0, d.y1 - d.y0))
      .attr('rx', 6)
      .attr('fill', (_, i) => colorScale(i.toString()))
      .attr('opacity', 0.85)
      .attr('stroke', 'rgba(255,255,255,0.2)')
      .on('mouseover', function () {
        d3.select(this).attr('opacity', 1).attr('stroke', '#fff')
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.85).attr('stroke', 'rgba(255,255,255,0.2)')
      })

    // Labels (only if cell width > 45 and height > 25)
    nodes
      .filter((d) => d.x1 - d.x0 > 45 && d.y1 - d.y0 > 25)
      .append('text')
      .attr('x', 6)
      .attr('y', 16)
      .text((d) => d.data.name)
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#ffffff')
      .style('pointer-events', 'none')

    nodes
      .filter((d) => d.x1 - d.x0 > 55 && d.y1 - d.y0 > 38)
      .append('text')
      .attr('x', 6)
      .attr('y', 30)
      .text((d) => formatBytes(d.value || 0))
      .attr('font-size', '10px')
      .attr('fill', 'rgba(255,255,255,0.8)')
      .style('pointer-events', 'none')
  }, [data, width, height, onNodeClick])

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-gray-900/50 p-2">
      <svg ref={svgRef} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} />
    </div>
  )
}
