const REQUIRED_CONTENT = [
  // Required sections from the advisory template
  '### Summary of the CVE',
  '### Advisory Checklist',
  '### Instructions on running the minimal sample',
  '### Instructions on reproducing the issue',
  '### Describe the expected result',
  '### Describe the actual result and explain why it is a vulnerability',
  // Required checklist items from the README
  'The report includes a 1–3 sentence Summary of the CVE',
  'The report includes a sample following the',
  'written in Java',
  'latest patch version of a supported generation',
  'demonstrates a vulnerability in the Spring Project',
  'shared on the sample branch',
  'Instructions on how to run the sample',
  'Instructions on how to reproduce the issue',
  'The expected result',
  'The actual result and explain why it is a vulnerability',
];

/**
 * Validates a security advisory report body against the required content and checklist.
 * Returns at most one issue:
 * - Missing required content → directs the reporter to the README.
 * - All content present but items unchecked → asks the reporter to complete the checklist.
 *
 * @param {string|null} body - The Markdown body of the advisory
 * @param {string} [readmeUrl=''] - URL to the repository README for the missing-content message
 * @returns {{ message: string }[]} Array with at most one issue; empty means the report is valid
 */
function triageSecurityAdvisory(body, readmeUrl = '') {
  if (!body || body.trim() === '') {
    return [buildMissingContentIssue(readmeUrl)];
  }

  const hasMissingContent = REQUIRED_CONTENT.some(content => !body.includes(content));
  if (hasMissingContent) {
    return [buildMissingContentIssue(readmeUrl)];
  }

  if (findUncheckedItems(body).length > 0) {
    return [buildUncheckedItemsIssue()];
  }

  return [];
}

/**
 * Builds the issue message for when required content is absent, directing the reporter to the README.
 *
 * @param {string} readmeUrl - URL to the repository README; omit for a plain-text fallback
 * @returns {{ message: string }}
 */
function buildMissingContentIssue(readmeUrl) {
  const readmeLink = readmeUrl ? `[README](${readmeUrl})` : 'README';
  return {
    message: `Thank you for responsibly reporting your concern. In order to streamline the process, please update this security advisory to align with the instructions provided in the ${readmeLink}.`,
  };
}

/**
 * Builds the issue message for when all required content is present but checklist items remain unchecked.
 *
 * @returns {{ message: string }}
 */
function buildUncheckedItemsIssue() {
  return {
    message:
      'Thank you for responsibly reporting your concern. Once every item is marked as completed, the security advisory will be assigned for triage.',
  };
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
