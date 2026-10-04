---
title: "AI API usage: limits and monitoring"
date: "2026-09-21"
lang: "en"
summary: "How to define limits for requests, responses and tool use to control the workload of an AI integration."
tags: ["ai", "security", "ethics", "opinion"]
category: "referencia"
---

An AI integration needs operational limits as well as useful responses. If a request can grow, repeat or call tools without a cap, it becomes difficult to anticipate how much work the system will perform.

OWASP lists unbounded consumption among the risks of applications using language models. It can affect availability, resources and costs. Proposed measures include usage limits, resource controls and consumption monitoring. [OWASP: Unbounded Consumption](https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/).

## Define what is limited

A requests-per-minute limit does not, by itself, describe the work each request generates. Also review input size, allowed output, concurrency and the actions the model can request.

| Control | Design question |
|---|---|
| Requests | How many can each user or client start within a period? |
| Input | What sizes and formats does the application accept? |
| Output | How much content can a response generate? |
| Tools | How many calls or retries can one operation make? |
| Concurrency | How many operations are processed at the same time? |
| Duration | When is an operation cancelled if it does not finish? |

Values should reflect the intended use and system tests. A number chosen for a demonstration is not a universal configuration.

## Distinguish an alert from a limit

An alert reports that a threshold was reached. An effective limit stops the operation from continuing or rejects additional work. Verify which behavior each provider control offers and which behavior your application implements.

The same principle applies to retries: record when they occur, how many are allowed and how the operation ends if it does not recover. Do not let retries grow without an exit condition.

## Enforce controls where the resource is managed

A client button can prevent repeated clicks during a query, but it does not replace checks in the service that accepts the work. If several clients share a server, define where their combined usage is counted.

For a local prototype, start by recording requests, duration, failures and simultaneous operations. If you add a billed provider, include the usage tracking appropriate to its API and terms.

## Test what happens at each limit

For each control, prepare a case that reaches its limit and check:

- That work is rejected or cancelled as intended.
- That the user receives an understandable status.
- That automatic retries do not continue indefinitely.
- That the operation’s resources are released.
- That the event is available for diagnosis.

This guide describes design criteria. It does not imply that all these controls are implemented in HIOS prototypes: check the published scope of each project.
