(function () {
  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderInline(text) {
    let result = escapeHtml(text);
    result = result.replace(/`([^`]+)`/g, "<code>$1</code>");
    result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    result = result.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    result = result.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    result = result.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img alt="$1" src="$2" />',
    );
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    result = result.replace(
      /\[\[([^\]]+)\]\]/g,
      '<span class="wikilink">$1</span>',
    );
    result = result.replace(
      /(^|\s)#([\p{L}0-9_\-\/]+)/gu,
      '$1<span class="tag">#$2</span>',
    );
    return result;
  }

  function renderMarkdown(source) {
    const lines = source.replace(/\r\n?/g, "\n").split("\n");
    const html = [];
    let inList = false;
    let inCodeBlock = false;
    let codeLanguage = "";
    let codeBuffer = [];

    const flushList = () => {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
    };

    const flushCode = () => {
      if (inCodeBlock) {
        const code = escapeHtml(codeBuffer.join("\n"));
        html.push(
          `<pre><code class="language-${codeLanguage}">${code}</code></pre>`,
        );
        inCodeBlock = false;
        codeLanguage = "";
        codeBuffer = [];
      }
    };

    for (const line of lines) {
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          flushCode();
        } else {
          flushList();
          inCodeBlock = true;
          codeLanguage = line.trim().slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      if (line.trim() === "") {
        flushList();
        html.push("<p></p>");
        continue;
      }

      const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
      if (headingMatch) {
        flushList();
        const level = headingMatch[1].length;
        html.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
        continue;
      }

      const listMatch = /^[-*+]\s+(.*)$/.exec(line.trim());
      if (listMatch) {
        if (!inList) {
          inList = true;
          html.push("<ul>");
        }
        html.push(`<li>${renderInline(listMatch[1])}</li>`);
        continue;
      }

      const orderedMatch = /^\d+\.\s+(.*)$/.exec(line.trim());
      if (orderedMatch) {
        if (!inList) {
          inList = true;
          html.push("<ol>");
        }
        html.push(`<li>${renderInline(orderedMatch[1])}</li>`);
        continue;
      }

      flushList();
      html.push(`<p>${renderInline(line)}</p>`);
    }

    flushList();
    flushCode();

    return html.join("\n");
  }

  window.Markdown = {
    render: renderMarkdown,
  };
})();
