const REQUIRED_SECTIONS = [
  'Summary of the CVE',
  'Advisory Checklist',
  'Instructions on running the minimal sample',
  'Instructions on reproducing the issue',
  'Describe the expected result',
  'Describe the actual result and explain why it is a vulnerability',
];

/**
 * Validates a security advisory report body against the required template.
 *
 * @param {string|null} body - The Markdown body of the advisory
 * @returns {{ message: string }[]} Array of validation failures; empty means the report is valid
 */
function triageSecurityAdvisory(body) {
  if (!body || body.trim() === '') {
    return [{ message: 'Report body is empty' }];
  }

  const issues = [];

  for (const section of REQUIRED_SECTIONS) {
    if (!body.includes(`### ${section}`)) {
      issues.push({ message: `Missing required section: "### ${section}"` });
    }
  }

  for (const item of findUncheckedItems(body)) {
    issues.push({ message: `Unchecked checklist item: ${item}` });
  }

  return issues;
}

/**
 * Returns all unchecked task-list items (`* [ ]` or `- [ ]`) in the body.
 *
 * @param {string} body
 * @returns {string[]}
 */
function findUncheckedItems(body) {
  return body
    .split('\n')
    .filter(line => /^\s*[-*]\s*\[\s+\]/.test(line))
    .map(line => line.trim());
}

export { triageSecurityAdvisory, findUncheckedItems };
