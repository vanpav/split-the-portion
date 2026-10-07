#!/usr/bin/env node
// PreToolUse hook for Bash: wraps simple test/build/lint commands so that only
// errors (max 100 lines) reach the context. Anything else passes through untouched.
import { readFileSync } from 'node:fs'

const input = JSON.parse(readFileSync(0, 'utf8'))
const command = (input.tool_input?.command ?? '').trim()

// Only plain commands: no chaining, pipes, redirects or substitutions.
const SAFE = /^[^;&|<>`$()\n]+$/
const TARGET =
  /^(pnpm (run )?(test|build|lint)|pnpm (exec )?(vitest|tsc|oxlint)|npx (vitest|tsc|oxlint)|vitest|tsc|oxlint)( |$)/

if (!SAFE.test(command) || !TARGET.test(command) || /--watch|test:watch|\bwatch\b/.test(command)) {
  process.exit(0)
}

const wrapped = [
  'out=$(mktemp)',
  `{ ${command}; } >"$out" 2>&1`,
  'rc=$?',
  'if [ $rc -eq 0 ]; then tail -n 5 "$out"',
  'else errs=$(grep -iE "error|fail|✗|×|✖|TS[0-9]{4}" "$out" | head -n 100)',
  'if [ -n "$errs" ]; then printf "%s\\n" "$errs"; else tail -n 40 "$out"; fi',
  'echo "exit code: $rc"; fi',
  'rm -f "$out"',
  'exit $rc',
].join('; ')

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      updatedInput: { ...input.tool_input, command: wrapped },
    },
  }),
)
