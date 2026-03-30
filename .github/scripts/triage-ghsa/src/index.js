import * as core from '@actions/core';
import { Advisories } from './advisories.js';
import { triageSecurityAdvisory } from './security-advisory-triage.js';
import { updateStatusBlock } from './advisory-status.js';

const PENDING_PREFIX = 'PENDING: ';

async function run({
  token = process.env.GITHUB_TOKEN,
  repository = process.env.GITHUB_REPOSITORY,
} = {}) {
  if (!token) {
    core.setFailed('GITHUB_TOKEN environment variable is required');
    return;
  }

  if (!repository) {
    core.setFailed('GITHUB_REPOSITORY environment variable is required');
    return;
  }

  const advisories = new Advisories(token, repository, core);
  try {
    core.info(`Checking open security advisories for ${repository}...`);
    const openAdvisories = await advisories.listOpenAdvisories();

    if (openAdvisories.length === 0) {
      core.info('No open advisories found.');
      return;
    }

    core.info(`Found ${openAdvisories.length} open advisory(ies).`);

    let workflowFailed = false;

    for (const advisory of openAdvisories) {
      const id = advisory.ghsa_id ?? '(unknown)';
      const currentSummary = advisory.summary ?? '';
      const currentDescription = advisory.description ?? '';

      const issues = triageSecurityAdvisory(currentDescription);
      const hasFailed = issues.length > 0;

      if (hasFailed) {
        workflowFailed = true;
        for (const issue of issues) {
          core.error(`${id}: ${issue.message}`);
        }
      } else {
        core.info(`✓ ${id} conforms to requirements`);
      }

      const newSummary = hasFailed
        ? currentSummary.startsWith(PENDING_PREFIX)
          ? currentSummary
          : `${PENDING_PREFIX}${currentSummary}`
        : currentSummary.startsWith(PENDING_PREFIX)
          ? currentSummary.slice(PENDING_PREFIX.length)
          : currentSummary;

      const newDescription = updateStatusBlock(currentDescription, issues);

      const summaryChanged = newSummary !== currentSummary;
      const descriptionChanged = newDescription !== currentDescription;

      if (summaryChanged || descriptionChanged) {
        core.info(`Updating advisory ${id}...`);
        await advisories.updateAdvisory(id, {
          ...(summaryChanged && { summary: newSummary }),
          ...(descriptionChanged && { description: newDescription }),
        });
      }
    }

    if (workflowFailed) {
      core.setFailed('One or more advisories do not conform to the reporting requirements.');
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

export { run };
