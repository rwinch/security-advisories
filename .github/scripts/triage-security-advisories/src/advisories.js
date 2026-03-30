import { Octokit } from '@octokit/rest';

const _noOpCore = {
  debug: () => {},
  info: () => {},
  warning: () => {},
  error: () => {},
};

/**
 * A class for interacting with GitHub repository security advisories.
 *
 * @author Rob Winch
 */
class Advisories {
  /**
   * @param {string} token - The GitHub token needed to query advisories
   * @param {string} repo - The GitHub repository, like {@code spring-projects/security-advisories}
   * @param {object} core - The {@code @actions/core} instance for logging (optional)
   */
  constructor(token, repo, core = _noOpCore) {
    const baseUrl = process.env.OCTOKIT_BASE_URL;
    this.gh = new Octokit({ auth: token, ...(baseUrl && { baseUrl }) });
    [this.owner, this.repo] = repo.split('/');
    this.core = core;
  }

  /**
   * Returns all draft security advisories for the repository.
   *
   * @returns {Promise<object[]>}
   */
  async listDraftAdvisories() {
    this.core.debug(`Fetching draft advisories for ${this.owner}/${this.repo}`);
    return this.gh.paginate(this.gh.rest.securityAdvisories.listRepositoryAdvisories, {
      owner: this.owner,
      repo: this.repo,
      state: 'draft',
      per_page: 100,
    });
  }

  /**
   * Updates fields on a security advisory.
   *
   * @param {string} ghsaId - The GHSA identifier (e.g. {@code GHSA-xxxx-yyyy-zzzz})
   * @param {{ summary?: string, description?: string }} fields - Fields to update
   * @returns {Promise<object>}
   */
  async updateAdvisory(ghsaId, { summary, description } = {}) {
    this.core.debug(`Updating advisory ${ghsaId}`);
    return this.gh.rest.securityAdvisories.updateRepositoryAdvisory({
      owner: this.owner,
      repo: this.repo,
      ghsa_id: ghsaId,
      ...(summary !== undefined && { summary }),
      ...(description !== undefined && { description }),
    });
  }
}

export { Advisories };
