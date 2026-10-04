---
title: "Developing with AI: generating code and reviewing decisions"
date: "2026-09-20"
lang: "en"
summary: "How to organize tasks, review generated code and check that a solution works in the project’s environment."
tags: ["ai", "opinion", "democratization", "web", "work"]
category: "referencia"
---

A project like HIOS combines interfaces, documentation, firmware and tests. AI tools can help prepare changes in these areas, but each delivery needs a review that connects the code to the expected behavior.

The amount of generated code does not tell you how far the project has progressed. A function is useful when it solves the task, fits the architecture and can be checked in the environment where it will run.

## Request changes you can review

A bounded task makes incorrect assumptions easier to spot. Instead of requesting an entire telemetry system, define one step first: parsing a packet, validating its fields or displaying a reading.

Include the following in the request:

- The expected result and an example input and output.
- Language, framework and library versions.
- Device or browser constraints.
- Error cases the solution must handle.

For example: “Implement a parser for this eight-byte packet. Reject incomplete inputs and values outside the defined range. Add tests for those cases.” Supply the packet format and its ranges with the request; the model should not invent them.

## Review decisions as well as syntax

Compilation is an initial check. Next, check how the program handles real data, errors and dependencies that do not respond.

| Area | What to review |
|---|---|
| Interface | Loading states, errors, navigation, accessibility and screen sizes. |
| Data and services | Input validation, permissions and handling of unexpected responses. |
| Firmware | API compatibility, available memory, timeouts and failure handling. |
| Documentation | Agreement between instructions, code and the published version. |

If you do not recognize an API, find its declaration in the installed library and compare its arguments with the documentation for that version. Do not assume it exists because its name sounds plausible.

## Test in the target environment

For firmware, review buffer sizes and lifetimes, task configuration and what happens when a peripheral fails. An isolated example does not demonstrate that the whole system works on the selected board.

For a web application, go through the complete interaction. A form can render correctly and still fail when saving, restoring a session or displaying an error response.

Tests should cover the behavior that matters, including boundary conditions. A test that repeats the assumptions in the generated code can pass without detecting the problem.

## A workflow you can review

1. Define a task and its acceptance criteria.
2. Request or implement a bounded change.
3. Review dependencies, decisions and error handling.
4. Run the relevant checks.
5. Test the complete interaction or device.
6. Document what was verified and what remains pending.

If a change is too large to understand, divide it by behavior. The goal is to explain what changed, why and how it was checked.
