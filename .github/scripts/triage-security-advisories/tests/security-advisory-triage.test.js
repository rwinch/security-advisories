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

describe('triageSecurityAdvisory', () => {
  describe('valid report', () => {
    it('returns no issues for a fully completed report', () => {
      expect(triageSecurityAdvisory(VALID_REPORT)).toEqual([]);
    });
  });

  describe('empty body', () => {
    it('returns an issue for null', () => {
      expect(triageSecurityAdvisory(null)).toEqual([{ message: 'Report body is empty' }]);
    });

    it('returns an issue for an empty string', () => {
      expect(triageSecurityAdvisory('')).toEqual([{ message: 'Report body is empty' }]);
    });

    it('returns an issue for a whitespace-only string', () => {
      expect(triageSecurityAdvisory('   \n  ')).toEqual([{ message: 'Report body is empty' }]);
    });
  });

  describe('missing sections', () => {
    it.each([
      'Summary of the CVE',
      'Advisory Checklist',
      'Instructions on running the minimal sample',
      'Instructions on reproducing the issue',
      'Describe the expected result',
      'Describe the actual result and explain why it is a vulnerability',
    ])('returns an issue when "### %s" is absent', section => {
      const body = VALID_REPORT.replace(`### ${section}`, '### Renamed Section');
      const issues = triageSecurityAdvisory(body);
      expect(issues).toContainEqual({
        message: `Missing required section: "### ${section}"`,
      });
    });
  });

  describe('checklist items', () => {
    it('returns an issue for an unchecked top-level item', () => {
      const body = VALID_REPORT.replace(
        '* [x] Instructions on how to run the sample',
        '* [ ] Instructions on how to run the sample',
      );
      expect(triageSecurityAdvisory(body)).toContainEqual({
        message: 'Unchecked checklist item: * [ ] Instructions on how to run the sample',
      });
    });

    it('returns an issue for an unchecked nested item', () => {
      const body = VALID_REPORT.replace(
        '  * [x] The sample is minimal and written in Java.',
        '  * [ ] The sample is minimal and written in Java.',
      );
      expect(triageSecurityAdvisory(body)).toContainEqual({
        message: 'Unchecked checklist item: * [ ] The sample is minimal and written in Java.',
      });
    });

    it('returns one issue per unchecked item', () => {
      const body = VALID_REPORT
        .replace('* [x] Instructions on how to run the sample', '* [ ] Instructions on how to run the sample')
        .replace('* [x] The expected result', '* [ ] The expected result');
      const uncheckedIssues = triageSecurityAdvisory(body).filter(i => i.message.startsWith('Unchecked'));
      expect(uncheckedIssues).toHaveLength(2);
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
