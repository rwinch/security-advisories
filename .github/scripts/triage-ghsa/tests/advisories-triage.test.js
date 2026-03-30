import { vi } from 'vitest';
import { Advisories } from '../src/advisories.js';

const { mockListRepositoryAdvisories, mockPaginate, mockOctokit } = vi.hoisted(() => {
  const mockListRepositoryAdvisories = vi.fn();
  const mockPaginate = vi.fn(async (endpoint, params) => {
    const response = await endpoint(params);
    return response.data;
  });
  const mockOctokit = vi.fn(function () {
    return {
      rest: {
        securityAdvisories: {
          listRepositoryAdvisories: mockListRepositoryAdvisories,
        },
      },
      paginate: mockPaginate,
    };
  });
  return { mockListRepositoryAdvisories, mockPaginate, mockOctokit };
});

vi.mock('@octokit/rest', () => ({
  Octokit: mockOctokit,
}));

describe('Advisories.listTriageAdvisories', () => {
  let advisories;

  beforeEach(() => {
    advisories = new Advisories('token', 'owner/repo');
  });

  it('paginates triage advisories with the correct parameters', async () => {
    mockListRepositoryAdvisories.mockResolvedValue({
      data: [{ ghsa_id: 'GHSA-aaaa-bbbb-cccc', description: 'body' }],
    });

    const result = await advisories.listTriageAdvisories();

    expect(mockPaginate).toHaveBeenCalledWith(mockListRepositoryAdvisories, {
      owner: 'owner',
      repo: 'repo',
      state: 'triage',
      per_page: 100,
    });
    expect(result).toEqual([{ ghsa_id: 'GHSA-aaaa-bbbb-cccc', description: 'body' }]);
  });

  it('returns an empty array when no triage advisories exist', async () => {
    mockListRepositoryAdvisories.mockResolvedValue({ data: [] });
    expect(await advisories.listTriageAdvisories()).toEqual([]);
  });

  it('returns multiple triage advisories', async () => {
    mockListRepositoryAdvisories.mockResolvedValue({
      data: [
        { ghsa_id: 'GHSA-aaaa-bbbb-1111', description: 'first' },
        { ghsa_id: 'GHSA-aaaa-bbbb-2222', description: 'second' },
      ],
    });

    const result = await advisories.listTriageAdvisories();
    expect(result).toHaveLength(2);
  });
});
