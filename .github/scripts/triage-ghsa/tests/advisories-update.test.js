import { vi } from 'vitest';
import { Advisories } from '../src/advisories.js';

const { mockUpdateRepositoryAdvisory, mockOctokit } = vi.hoisted(() => {
  const mockUpdateRepositoryAdvisory = vi.fn();
  const mockOctokit = vi.fn(function () {
    return {
      rest: {
        securityAdvisories: {
          updateRepositoryAdvisory: mockUpdateRepositoryAdvisory,
        },
      },
      paginate: vi.fn(),
    };
  });
  return { mockUpdateRepositoryAdvisory, mockOctokit };
});

vi.mock('@octokit/rest', () => ({
  Octokit: mockOctokit,
}));

describe('Advisories.updateAdvisory', () => {
  let advisories;

  beforeEach(() => {
    advisories = new Advisories('token', 'owner/repo');
    mockUpdateRepositoryAdvisory.mockResolvedValue({ data: {} });
  });

  it('calls the REST endpoint with owner, repo, and ghsa_id', async () => {
    await advisories.updateAdvisory('GHSA-aaaa-bbbb-cccc', { summary: 'New title' });
    expect(mockUpdateRepositoryAdvisory).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'owner',
        repo: 'repo',
        ghsa_id: 'GHSA-aaaa-bbbb-cccc',
      }),
    );
  });

  it('passes summary when provided', async () => {
    await advisories.updateAdvisory('GHSA-aaaa-bbbb-cccc', { summary: 'New title' });
    expect(mockUpdateRepositoryAdvisory).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'New title' }),
    );
  });

  it('passes description when provided', async () => {
    await advisories.updateAdvisory('GHSA-aaaa-bbbb-cccc', { description: 'New body' });
    expect(mockUpdateRepositoryAdvisory).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'New body' }),
    );
  });

  it('omits summary when not provided', async () => {
    await advisories.updateAdvisory('GHSA-aaaa-bbbb-cccc', { description: 'New body' });
    expect(mockUpdateRepositoryAdvisory).toHaveBeenCalledWith(
      expect.not.objectContaining({ summary: expect.anything() }),
    );
  });

  it('omits description when not provided', async () => {
    await advisories.updateAdvisory('GHSA-aaaa-bbbb-cccc', { summary: 'New title' });
    expect(mockUpdateRepositoryAdvisory).toHaveBeenCalledWith(
      expect.not.objectContaining({ description: expect.anything() }),
    );
  });

  it('passes both summary and description when both are provided', async () => {
    await advisories.updateAdvisory('GHSA-aaaa-bbbb-cccc', {
      summary: 'New title',
      description: 'New body',
    });
    expect(mockUpdateRepositoryAdvisory).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'New title', description: 'New body' }),
    );
  });
});
