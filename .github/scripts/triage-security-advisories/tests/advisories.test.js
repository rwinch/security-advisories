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

describe('Advisories', () => {
  let advisories;

  beforeEach(() => {
    advisories = new Advisories('token', 'owner/repo');
  });

  describe('listDraftAdvisories', () => {
    it('paginates draft advisories with the correct parameters', async () => {
      mockListRepositoryAdvisories.mockResolvedValue({
        data: [{ ghsa_id: 'GHSA-aaaa-bbbb-cccc', description: 'body' }],
      });

      const result = await advisories.listDraftAdvisories();

      expect(mockPaginate).toHaveBeenCalledWith(mockListRepositoryAdvisories, {
        owner: 'owner',
        repo: 'repo',
        state: 'draft',
        per_page: 100,
      });
      expect(result).toEqual([{ ghsa_id: 'GHSA-aaaa-bbbb-cccc', description: 'body' }]);
    });

    it('returns an empty array when no advisories exist', async () => {
      mockListRepositoryAdvisories.mockResolvedValue({ data: [] });
      expect(await advisories.listDraftAdvisories()).toEqual([]);
    });

    it('returns multiple advisories', async () => {
      mockListRepositoryAdvisories.mockResolvedValue({
        data: [
          { ghsa_id: 'GHSA-aaaa-bbbb-1111', description: 'first' },
          { ghsa_id: 'GHSA-aaaa-bbbb-2222', description: 'second' },
        ],
      });

      const result = await advisories.listDraftAdvisories();
      expect(result).toHaveLength(2);
    });
  });

  describe('constructor', () => {
    it('splits the repo into owner and repo parts', () => {
      expect(advisories.owner).toBe('owner');
      expect(advisories.repo).toBe('repo');
    });

    it('passes OCTOKIT_BASE_URL when set', () => {
      process.env.OCTOKIT_BASE_URL = 'http://localhost:18080';
      new Advisories('token', 'owner/repo');
      expect(mockOctokit).toHaveBeenCalledWith(
        expect.objectContaining({ baseUrl: 'http://localhost:18080' }),
      );
      delete process.env.OCTOKIT_BASE_URL;
    });
  });
});
