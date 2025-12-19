# Markdown Formatter Report

- Generated: 2025-12-19T02:24:53.052Z
- Applied rules: 5
- Lint issues: 1
- Changed lines: 1, 2, 5, 7, 8, 10, 11, 20, 22, 24, 27

## Lint Results

### WARNING
- **heading-depth** @ line 27 — Heading depth exceeds limit

---

## Applied Rules
- trailing-spaces (formatter_rule_trailing_spaces)
- heading-space (formatter_rule_heading_space)
- heading-blank-lines (formatter_rule_heading_blank_lines)
- list-marker-style (formatter_rule_list_marker_style)
- blockquote-space (formatter_rule_blockquote_space)

### Original
```markdown
#Hello World
This is a sample markdown document with some formatting issues.

##Features
*  Item one
*  Item two

>This is a quote without proper spacing

```javascript
function hello() {
  console.log("Hello!")
}
```

Some text right after the code block.

### Trailing spaces   
This line has trailing spaces.   


Too many blank lines above.

####Another heading without space after #

```

### Formatted
```markdown
# Hello World

This is a sample markdown document with some formatting issues.

## Features

-  Item one
-  Item two

> This is a quote without proper spacing

```javascript
function hello() {
  console.log("Hello!")
}
```

Some text right after the code block.

### Trailing spaces

This line has trailing spaces.


Too many blank lines above.

#### Another heading without space after #

```