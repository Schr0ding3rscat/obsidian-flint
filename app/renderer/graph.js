(function () {
  function layout(graph) {
    const count = graph.nodes.length || 1;
    const radius = Math.min(250, count * 12 + 150);
    return graph.nodes.map((node, index) => {
      const angle = (index / count) * Math.PI * 2;
      return {
        ...node,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });
  }

  function render(canvas, graph, activeId) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const positioned = layout(graph);
    const nodeMap = new Map(positioned.map((node) => [node.id, node]));

    ctx.save();
    ctx.translate(width / 2, height / 2);

    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;
    for (const edge of graph.edges) {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) continue;
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    }

    for (const node of positioned) {
      ctx.beginPath();
      ctx.fillStyle = node.id === activeId ? "#8a63d2" : "#ccc";
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 2;
      ctx.arc(node.x, node.y, node.id === activeId ? 14 : 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#f5f5f5";
      ctx.font = "12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(node.title.slice(0, 24), node.x, node.y + 12);
    }

    ctx.restore();
  }

  window.GraphView = {
    render,
  };
})();
