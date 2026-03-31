const STATUS_START = '<!-- advisory-check-status-start -->';
const STATUS_END = '<!-- advisory-check-status-end -->';

/**
 * Builds the status block Markdown string that is embedded in the advisory description.
 *
 * @param {{ message: string }[]} issues - Validation failures; empty means passing.
 * @returns {string}
 */
function buildStatusBlock(issues) {
  const lines = [STATUS_START, '', '---', ''];

  if (issues.length === 0) {
    lines.push('**Advisory Check Status: ✅ PASSING** — Thank you for responsibly reporting your concern. The report is now ready for triage.');
  } else {
    lines.push(`**Advisory Check Status: ⚠️ FAILING** — ${issues.length} issue(s) found:`, '');
    for (const { message } of issues) {
      lines.push(`- ${message}`);
    }
  }

  lines.push('', STATUS_END);
  return lines.join('\n');
}

/**
 * Inserts or replaces the status block inside an advisory description.
 * Content outside the marker comments is left untouched.
 *
 * @param {string} description - The current advisory description.
 * @param {{ message: string }[]} issues - Validation failures from the current run.
 * @returns {string} Updated description.
 */
function updateStatusBlock(description, issues) {
  const newBlock = buildStatusBlock(issues);
  const startIdx = description.indexOf(STATUS_START);
  const endIdx = description.indexOf(STATUS_END);

  if (startIdx !== -1 && endIdx !== -1) {
    const before = description.slice(0, startIdx).trimEnd();
    const after = description.slice(endIdx + STATUS_END.length).trimStart();
    return before + '\n\n' + newBlock + (after ? '\n\n' + after : '');
  }

  return description.trimEnd() + '\n\n' + newBlock;
}

export { buildStatusBlock, updateStatusBlock };
