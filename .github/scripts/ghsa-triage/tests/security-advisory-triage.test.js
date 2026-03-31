import {
  triageSecurityAdvisory,
  findUncheckedItems,
} from '../src/security-advisory-triage.js';

const VALID_REPORT = `
### Summary of the CVE

A path traversal vulnerability exists in Spring Framework.
An attacker can craft a URL with \`../\` sequences to access arbitrary files on the server.
This affects all supported versions prior to 6.2.x.

### Advisory Checklist

Ensure that you have completed all requirements:

* [x] The report includes a 1–3 sentence Summary of the CVE
* [x] The report includes a sample following the guidelines.
  * [x] The sample is minimal and written in Java.
  * [x] The sample uses the latest patch version of a supported generation.
  * [x] The sample demonstrates a vulnerability in the Spring Project.
  * [x] The sample has been shared on the sample branch.
* [x] Instructions on how to run the sample
* [x] Instructions on how to reproduce the issue
* [x] The expected result
* [x] The actual result and explain why it is a vulnerability

### Instructions on running the minimal sample

Clone the sample branch and run \`./mvnw spring-boot:run\`.

### Instructions on reproducing the issue

Send \`GET /files?path=../../../etc/passwd\` to the running application.

### Describe the expected result

A 400 Bad Request response is returned for paths containing \`../\`.

### Describe the actual result and explain why it is a vulnerability

The file contents are returned, exposing sensitive server files to unauthenticated callers.
`;

const MISSING_CONTENT_MESSAGE = 'Thank you for responsibly reporting your concern.';
const UNCHECKED_ITEMS_MESSAGE = 'Thank you for responsibly reporting your concern.';

describe('triageSecurityAdvisory', () => {
  describe('valid report', () => {
    it('returns no issues for a fully completed report', () => {
      expect(triageSecurityAdvisory(VALID_REPORT)).toEqual([]);
    });
  });

  describe('empty body', () => {
    it('returns the missing-content issue for null', () => {
      const issues = triageSecurityAdvisory(null);
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain(MISSING_CONTENT_MESSAGE);
    });

    it('returns the missing-content issue for an empty string', () => {
      const issues = triageSecurityAdvisory('');
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain(MISSING_CONTENT_MESSAGE);
    });

    it('returns the missing-content issue for a whitespace-only string', () => {
      const issues = triageSecurityAdvisory('   \n  ');
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain(MISSING_CONTENT_MESSAGE);
    });
  });

  describe('missing content', () => {
    it.each([
      '### Summary of the CVE',
      '### Advisory Checklist',
      '### Instructions on running the minimal sample',
      '### Instructions on reproducing the issue',
      '### Describe the expected result',
      '### Describe the actual result and explain why it is a vulnerability',
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
    ])('returns the missing-content issue when "%s" is absent', content => {
      const body = VALID_REPORT.replace(content, '~~removed~~');
      const issues = triageSecurityAdvisory(body);
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain(MISSING_CONTENT_MESSAGE);
    });
  });

  describe('unchecked checklist items', () => {
    it('returns the unchecked-items issue when an item is unchecked', () => {
      const body = VALID_REPORT.replace(
        '* [x] Instructions on how to run the sample',
        '* [ ] Instructions on how to run the sample',
      );
      const issues = triageSecurityAdvisory(body);
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain(UNCHECKED_ITEMS_MESSAGE);
    });

    it('returns the unchecked-items issue regardless of how many items are unchecked', () => {
      const body = VALID_REPORT
        .replace('* [x] Instructions on how to run the sample', '* [ ] Instructions on how to run the sample')
        .replace('* [x] The expected result', '* [ ] The expected result');
      const issues = triageSecurityAdvisory(body);
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain(UNCHECKED_ITEMS_MESSAGE);
    });

    it('returns the missing-content issue when content is absent even if items are also unchecked', () => {
      const body = VALID_REPORT
        .replace('### Summary of the CVE', '### Renamed Section')
        .replace('* [x] Instructions on how to run the sample', '* [ ] Instructions on how to run the sample');
      const issues = triageSecurityAdvisory(body);
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toContain(MISSING_CONTENT_MESSAGE);
    });
  });

  describe('README link', () => {
    it('includes a plain README reference when no URL is provided', () => {
      const issues = triageSecurityAdvisory(null);
      expect(issues[0].message).toContain('README');
      expect(issues[0].message).not.toContain('](');
    });

    it('includes a markdown link when a readmeUrl is provided', () => {
      const issues = triageSecurityAdvisory(null, 'https://github.com/owner/repo');
      expect(issues[0].message).toContain('[README](https://github.com/owner/repo)');
    });

    it('does not include a README link in the unchecked-items message', () => {
      const body = VALID_REPORT.replace(
        '* [x] Instructions on how to run the sample',
        '* [ ] Instructions on how to run the sample',
      );
      const issues = triageSecurityAdvisory(body, 'https://github.com/owner/repo');
      expect(issues[0].message).not.toContain('](');
    });
  });
});

describe('findUncheckedItems', () => {
  it('returns an empty array when all items are checked', () => {
    expect(findUncheckedItems('* [x] Item one\n* [x] Item two\n  * [x] Sub item')).toEqual([]);
  });

  it('finds unchecked items using asterisk syntax', () => {
    expect(findUncheckedItems('* [ ] Item one')).toEqual(['* [ ] Item one']);
  });

  it('finds unchecked items using hyphen syntax', () => {
    expect(findUncheckedItems('- [ ] Item one')).toEqual(['- [ ] Item one']);
  });

  it('finds and trims indented unchecked items', () => {
    expect(findUncheckedItems('  * [ ] Nested item')).toEqual(['* [ ] Nested item']);
  });

  it('does not match checked items', () => {
    expect(findUncheckedItems('* [x] Done\n* [X] Also done')).toEqual([]);
  });
});
