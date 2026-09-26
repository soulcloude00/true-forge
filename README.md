# SafeShip

SafeShip is a TrueForge release-captain concept: inspect a real GitHub repository, prepare release notes, run the declared checks in a disposable sandbox, and stop for human approval before creating a draft pull request.

> **Hackathon integrity:** the `Agents That Act` event requires project code to be built on the event day. This repository currently contains planning and setup documentation only; it is not a finished submission. Implement the application during the event and disclose AI assistants used in this README.

## Why this job

Release preparation is repetitive but consequential. SafeShip aims to gather evidence from GitHub, verify its proposed changes in isolation, and put a person in control before it writes back. The first version should support one repository, one release-note file, one safe check command, and draft PR creation only.

## TrueForge setup

Requirements: Node.js 22.14 or newer. Start the local TrueForge harness:

```sh
npx @truefoundry/trueforge@latest
```

Open <http://localhost:8790>. Configure a model under **Settings → Models**. Connect a real GitHub MCP server under **Settings → Connectors**, starting with read-only access. Configure a sandbox provider under **Settings → Sandbox providers** if sandbox execution is part of the demo. The event page's quickstart uses Daytona. Create a `SafeShip release captain` agent and enable only the connectors and runtime capabilities needed for the task.

Local TrueForge is intended for localhost and personal use. It has no login by default; do not expose it to the public internet. Keep credentials out of this repository and out of sandbox files.

## Implementation plan for event day

1. Make TrueForge visibly read a real repository's issues, pull requests, and recent changes through GitHub.
2. Ask it for one concise release-note change with links to its evidence.
3. Stage the proposed file in the TrueForge sandbox and run the repository's declared validation command there.
4. Show the exact diff, target branch, check output, and planned side effect.
5. Configure a TrueForge approval checkpoint before a narrowly scoped GitHub action creates a draft PR. Rejecting approval must leave GitHub unchanged.
6. Never allow this demo agent to merge, publish, deploy, delete, modify permissions, or access production secrets.

Do not invent TrueForge SDK/API calls. The running server exposes the OpenAPI docs at `http://localhost:8790/api/v1/docs`; use that schema or the matching official SDK docs if adding a custom UI or API client.

## Demo acceptance checklist

- [ ] The TrueForge session visibly calls a real GitHub tool.
- [ ] Generated code or file work runs in the TrueForge sandbox, and the validation result is shown.
- [ ] The harness pauses for human approval before its external write.
- [ ] Approval creates a draft PR; rejection creates nothing.
- [ ] A clean clone can follow this README without hidden local state.
- [ ] Team members can explain the architecture and safety boundary.
- [ ] Disclose the AI assistants used during implementation here before submission.

## Event rubric alignment

The event scores harness use (30), working software (25), safety boundary (20), value of the delegated job (15), and demo clarity (10). See [`research/agents-that-act-trueforge-research.md`](research/agents-that-act-trueforge-research.md) for the researched event profile, source links, TrueForge capabilities, and detailed rubric mapping.

## AI assistance disclosure

TODO: list the AI assistants actually used by the team during implementation.
