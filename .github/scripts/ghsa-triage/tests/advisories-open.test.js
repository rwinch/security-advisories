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

describe('Advisories.listOpenAdvisories', () => {
  let advisories;

  beforeEach(() => {
    advisories = new Advisories('token', 'owner/repo');
  });

  it('fetches both triage and draft advisories', async () => {
    mockListRepositoryAdvisories.mockResolvedValue({ data: [] });

    await advisories.listOpenAdvisories();

    const states = mockPaginate.mock.calls.map(call => call[1].state);
    expect(states).toContain('triage');
    expect(states).toContain('draft');
  });

  it('returns triage and draft advisories combined', async () => {
    const triageAdvisory = { ghsa_id: 'GHSA-aaaa-bbbb-1111', description: 'triage' };
    const draftAdvisory = { ghsa_id: 'GHSA-aaaa-bbbb-2222', description: 'draft' };

    mockListRepositoryAdvisories.mockImplementation(async ({ state }) =>
      state === 'triage'
        ? { data: [triageAdvisory] }
        : { data: [draftAdvisory] },
    );

    const result = await advisories.listOpenAdvisories();

    expect(result).toContainEqual(triageAdvisory);
    expect(result).toContainEqual(draftAdvisory);
    expect(result).toHaveLength(2);
  });

  it('returns an empty array when neither state has advisories', async () => {
    mockListRepositoryAdvisories.mockResolvedValue({ data: [] });
    expect(await advisories.listOpenAdvisories()).toEqual([]);
  });

  it('returns only triage advisories when draft is empty', async () => {
    const triageAdvisory = { ghsa_id: 'GHSA-aaaa-bbbb-1111', description: 'triage' };

    mockListRepositoryAdvisories.mockImplementation(async ({ state }) =>
      state === 'triage' ? { data: [triageAdvisory] } : { data: [] },
    );

    const result = await advisories.listOpenAdvisories();
    expect(result).toEqual([triageAdvisory]);
  });

  it('returns only draft advisories when triage is empty', async () => {
    const draftAdvisory = { ghsa_id: 'GHSA-aaaa-bbbb-2222', description: 'draft' };

    mockListRepositoryAdvisories.mockImplementation(async ({ state }) =>
      state === 'draft' ? { data: [draftAdvisory] } : { data: [] },
    );

    const result = await advisories.listOpenAdvisories();
    expect(result).toEqual([draftAdvisory]);
  });
});
