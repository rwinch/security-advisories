import { describe, it, expect } from 'vitest';
import { buildStatusBlock, updateStatusBlock } from '../src/advisory-status.js';

const ORIGINAL = '### Summary of the CVE\n\nSome content.';
const ONE_ISSUE = [{ message: 'Missing required section: "### Summary of the CVE"' }];
const TWO_ISSUES = [
  { message: 'Missing required section: "### Summary of the CVE"' },
  { message: '- [ ] Unchecked item' },
];

describe('buildStatusBlock', () => {
  describe('with no issues', () => {
    it('contains the PASSING label', () => {
      expect(buildStatusBlock([])).toContain('PASSING');
    });

    it('does not contain FAILING', () => {
      expect(buildStatusBlock([])).not.toContain('FAILING');
    });

    it('is wrapped in HTML comment markers', () => {
      const block = buildStatusBlock([]);
      expect(block).toContain('<!-- advisory-check-status-start -->');
      expect(block).toContain('<!-- advisory-check-status-end -->');
    });
  });

  describe('with issues', () => {
    it('contains the FAILING label', () => {
      expect(buildStatusBlock(ONE_ISSUE)).toContain('FAILING');
    });

    it('includes each issue message', () => {
      const block = buildStatusBlock(ONE_ISSUE);
      expect(block).toContain('Missing required section');
    });

    it('includes every issue when there are multiple', () => {
      const block = buildStatusBlock(TWO_ISSUES);
      expect(block).toContain('Missing required section');
      expect(block).toContain('Unchecked item');
    });

    it('reports the correct issue count', () => {
      expect(buildStatusBlock(TWO_ISSUES)).toContain('2 issue(s) found');
    });

    it('does not contain PASSING', () => {
      expect(buildStatusBlock(ONE_ISSUE)).not.toContain('PASSING');
    });
  });
});

describe('updateStatusBlock', () => {
  describe('when no status block exists', () => {
    it('appends the status block after the original content', () => {
      const result = updateStatusBlock(ORIGINAL, []);
      expect(result).toContain(ORIGINAL);
      expect(result).toContain('PASSING');
      expect(result.indexOf(ORIGINAL)).toBeLessThan(result.indexOf('PASSING'));
    });

    it('adds a failing block when there are issues', () => {
      const result = updateStatusBlock(ORIGINAL, ONE_ISSUE);
      expect(result).toContain('FAILING');
      expect(result).toContain('Missing required section');
    });
  });

  describe('when a status block already exists', () => {
    it('replaces a failing block with a passing one', () => {
      const withFailing = updateStatusBlock(ORIGINAL, ONE_ISSUE);
      const updated = updateStatusBlock(withFailing, []);
      expect(updated).toContain('PASSING');
      expect(updated).not.toContain('FAILING');
    });

    it('replaces a passing block with a failing one', () => {
      const withPassing = updateStatusBlock(ORIGINAL, []);
      const updated = updateStatusBlock(withPassing, ONE_ISSUE);
      expect(updated).toContain('FAILING');
      expect(updated).not.toContain('PASSING');
    });

    it('preserves original content before the block', () => {
      const withBlock = updateStatusBlock(ORIGINAL, ONE_ISSUE);
      const updated = updateStatusBlock(withBlock, []);
      expect(updated).toContain('### Summary of the CVE');
      expect(updated).toContain('Some content.');
    });
  });

  describe('idempotency', () => {
    it('produces the same result when issues do not change (passing)', () => {
      const first = updateStatusBlock(ORIGINAL, []);
      const second = updateStatusBlock(first, []);
      expect(second).toBe(first);
    });

    it('produces the same result when issues do not change (failing)', () => {
      const first = updateStatusBlock(ORIGINAL, ONE_ISSUE);
      const second = updateStatusBlock(first, ONE_ISSUE);
      expect(second).toBe(first);
    });
  });
});
