# Workflow Rules

## Trigger Classification

### Automatic (Claude decides)

Claude follows the judgment flow in CLAUDE.md and automatically calls these without user prompting:

| Action | Trigger |
|--------|---------|
| Gemini CLI (`gemini -p ...`) | Codebase analysis, external research, multimodal files |
| Subagents (Task tool) | Output > ~20 lines, or context should be preserved |
| Multimodal file delegation | PDF/video/audio/image files appear in the task |

### Manual (User must invoke)

These require explicit user input as slash commands:

| Command | Purpose |
|---------|---------|
| `/startproject` | Start large feature development (Phase 1-3: understand → research & design → plan) |
| `/team-implement` | Parallel implementation via Agent Teams (Phase 4) |
| `/team-review` | Parallel review via Agent Teams (Phase 5) |

> Note: Hooks may automatically suggest these commands based on context, but Claude does not
> invoke them autonomously — the user must explicitly run them.

---

## Spec-Driven Development Flow

When a spec file exists in `.claude/specs/`, reference it explicitly when requesting implementation:

1. **Write spec** in `.claude/specs/features/RIBBON-XXX.md`
2. **Reference spec** when asking Claude: "Implement according to `.claude/specs/features/RIBBON-XXX.md`"
3. **Claude reads spec** and implements based on requirements and acceptance criteria
4. **Tests are derived** from the acceptance criteria in the spec

### Integration with Workflow

```
Write spec (.claude/specs/features/RIBBON-XXX.md)
    ↓
/startproject (or direct implementation for small features)
    ↓ references spec
/team-implement
    ↓ implements against spec acceptance criteria
/team-review
    ↓ validates against spec
```
