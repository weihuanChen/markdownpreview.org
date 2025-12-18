import { format, initializeRules, type FormatRuleId } from '../lib/formatter'

type TestCase = {
  name: string
  ruleId: FormatRuleId
  input: string
  expected: string
}

const stringify = (value: string) => JSON.stringify(value)

initializeRules()

const tests: TestCase[] = [
  {
    name: 'trailing-spaces removes trailing spaces outside code blocks',
    ruleId: 'trailing-spaces',
    input: 'Line  \n```\ncode   \n```\nEnd\t \n',
    expected: 'Line\n```\ncode   \n```\nEnd\n',
  },
  {
    name: 'eof-newline appends a single newline',
    ruleId: 'eof-newline',
    input: 'Hello',
    expected: 'Hello\n',
  },
  {
    name: 'consecutive-blanks compresses extra blank lines',
    ruleId: 'consecutive-blanks',
    input: 'a\n\n\n\nB\n',
    expected: 'a\n\nB\n',
  },
  {
    name: 'heading-space inserts missing space after #',
    ruleId: 'heading-space',
    input: '#Title\n##Subtitle\n### Title\n',
    expected: '# Title\n## Subtitle\n### Title\n',
  },
  {
    name: 'heading-blank-lines normalizes blank lines around headings',
    ruleId: 'heading-blank-lines',
    input: 'para\n# Heading\ntext\n## Sub\n\nnext',
    expected: 'para\n\n# Heading\n\ntext\n\n## Sub\n\nnext',
  },
  {
    name: 'list-marker-style normalizes list markers',
    ruleId: 'list-marker-style',
    input: '* item\n+ item2\n- item3\n',
    expected: '- item\n- item2\n- item3\n',
  },
  {
    name: 'list-indent normalizes list indentation',
    ruleId: 'list-indent',
    input: '- item\n   - sub\n',
    expected: '- item\n    - sub\n',
  },
  {
    name: 'blockquote-space enforces spacing after >',
    ruleId: 'blockquote-space',
    input: '>quote\n>>deep\n> > spaced\n>\n',
    expected: '> quote\n>> deep\n>> spaced\n>\n',
  },
  {
    name: 'code-fence-style normalizes fence characters',
    ruleId: 'code-fence-style',
    input: '~~~js\ncode\n~~~',
    expected: '```js\ncode\n```',
  },
  {
    name: 'code-fence-spacing adds blank lines around fences',
    ruleId: 'code-fence-spacing',
    input: 'Text\n```js\ncode\n```\nNext',
    expected: 'Text\n\n```js\ncode\n```\n\nNext',
  },
]

let failed = 0

for (const test of tests) {
  const result = format(test.input, { enabledRules: [test.ruleId] })
  const hasRule = result.appliedRules.includes(test.ruleId)
  const matches = result.formatted === test.expected
  const pass = hasRule && matches

  if (pass) {
    console.log(`PASS: ${test.name}`)
  } else {
    failed += 1
    console.log(`FAIL: ${test.name}`)
    console.log(`  rule applied: ${hasRule}`)
    console.log(`  expected: ${stringify(test.expected)}`)
    console.log(`  actual:   ${stringify(result.formatted)}`)
  }
}

if (failed > 0) {
  console.log(`\n${failed} test(s) failed.`)
  process.exitCode = 1
} else {
  console.log(`\nAll ${tests.length} tests passed.`)
}
