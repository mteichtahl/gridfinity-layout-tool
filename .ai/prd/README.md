# Gridfinity Layout Tool - PRD

A web-based visual editor for planning Gridfinity drawer layouts.

## Quick Links

| Document | Purpose | When to Read |
|----------|---------|--------------|
| [Core Concepts](./01-core-concepts.md) | Drawer, layers, bins, staging, categories | Understanding the domain model |
| [Functional Requirements](./02-functional-requirements.md) | Features, interactions, keyboard shortcuts | Implementing features |
| [UI Specifications](./03-ui-specifications.md) | Layout, design tokens, components | Building the interface |
| [Edge Cases](./04-edge-cases.md) | Validation, error handling, constraints | Handling special scenarios |
| [Technical Reference](./05-technical-reference.md) | JSON schema, algorithms, data migration | Data structures and logic |
| [Non-Functional Requirements](./06-non-functional.md) | Performance, accessibility, i18n, telemetry | Quality attributes |
| [Milestones](./07-milestones.md) | M1-M4 scope, out of scope | Planning and prioritization |

## Problem Statement

When setting up Gridfinity storage, users must:
1. Measure drawer dimensions (in gridfinity units, 1u = 42mm)
2. Subdivide vertical space into layers (bins stack)
3. Plan bin placement to maximize utility
4. Generate a print list accounting for printer bed limits

Currently done with spreadsheets or graph paper. A visual tool makes this faster and less error-prone.

## Target Users

- 3D printing hobbyists organizing workshops/toolboxes
- Makers with Gridfinity-compatible printers (180mm-250mm bed)
- Users comfortable with drag-and-drop interfaces

## Success Metrics

| Metric | Target |
|--------|--------|
| Task completion | 90% complete first layout without help |
| Time to first bin | <30 seconds from page load |
| Error rate | <5% invalid placement attempts |
| Performance | 60fps drag on 30x20 grid, 100 bins |
| Render time | <16ms/frame, <100ms initial load |

## Constraints Summary

| Constraint | Value |
|------------|-------|
| Grid size | 1x1 to 50x50 |
| Layers | 1-10 per drawer |
| Categories | 1-20 |
| Undo history | 50 states |
| Min viewport | 1024px |
| Zoom range | 50%-200% |

## Prototype Reference

See `gridfinity_tool_v4.html` for working prototype. Use it to understand UX intent, but don't feel constrained by its implementation.

## How to Use This PRD

1. Start with this README for overview
2. Read [Core Concepts](./01-core-concepts.md) to understand the domain
3. Reference specific documents as needed during implementation
4. Check [Milestones](./07-milestones.md) for current scope
