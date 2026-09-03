# Snip CLI

A zero-dependency Node.js CLI for the Snip URL shortener backend. Uses the
global `fetch` (Node 18+) — no npm dependencies required.

## Usage

```
snip add <url>    Create a short link for <url>, prints the shortUrl
snip ls           List all short links as an aligned code/hits/url table
snip open <code>  Resolve <code> and open the target URL in your browser
snip help         Show usage
```

Running with no arguments also prints usage.

## Configuration

- `SNIP_API` — backend base URL (default: `http://localhost:3000`)

## Examples

```sh
$ snip add https://example.com
http://localhost:3000/aZ3kD9

$ snip ls
CODE    HITS  URL
aZ3kD9  0     https://example.com

$ snip open aZ3kD9
Opening https://example.com
```

## Running directly

```sh
node cli.js add https://example.com
```

Or use one of the small wrapper scripts (`snip`, `snip.cmd`, `snip.ps1`) which
forward all arguments to `cli.js`.

## Errors

Invalid input, unknown short codes, and an unreachable backend all print an
`Error: ...` message to stderr and exit with status 1.
