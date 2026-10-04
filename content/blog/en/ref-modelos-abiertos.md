---
title: "Local models: evaluating compatibility and results"
date: "2026-09-22"
lang: "en"
summary: "What to check in a model card, how to test memory use and what structured outputs provide."
tags: ["ai", "open-source", "models", "huggingface", "reference"]
category: "referencia"
---

Choosing a local model means looking at the task, hardware and runtime. A list of names or sizes is not enough to tell you how a model will respond in your project.

## Start with the task

Prepare representative examples before comparing models: questions in the languages you need, files of the type you will process or code from your project. Also define how you will recognize an incorrect answer.

For a hardware integration, evaluate request interpretation and action validation separately. A model can propose a command; the application must decide whether to execute it.

## Read the model card

A model card may document intended use, limitations, evaluation and licensing. Check which information the author provides and which tests your case still needs. Promotional descriptions do not replace that check. [Hugging Face model card documentation](https://huggingface.co/docs/hub/model-cards).

If you download a conversion or quantized version, also record its origin, exact name and revision. Confirm that the installed runtime supports the file and its architecture.

## Test memory with your configuration

Context is part of the configuration you need to evaluate. Ollama documents that a larger context window requires more memory and provides `ollama ps` to inspect execution. Do not extrapolate a short query’s result to a long document. [Context in Ollama](https://docs.ollama.com/context-length).

To compare tests, record:

- Model and file variant.
- Runtime version and hardware used.
- Configured context length.
- Memory observed during loading and the query.
- Time to the first response and total time.
- Results from the evaluation examples.

Workbench’s memory tool shows illustrative numerical scenarios with simplified coefficients. It does not validate whether a model fits your hardware: that requires measuring actual execution.

## Define the output format

llama.cpp supports GBNF grammars and conversion of a subset of JSON Schema to constrain generated output. Check the options and limitations of your version. [llama.cpp grammar guide](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md).

A valid format does not prove that the values are correct. After parsing the response, check fields, ranges and permissions. Also account for incomplete responses and server errors.

## Keep comparisons reproducible

| Criterion | What to record |
|---|---|
| Quality | Examples solved and errors found. |
| Compatibility | Runtime, version, architecture and model format. |
| Resources | Memory and timings observed with the tested configuration. |
| Permitted use | License and terms applying to the chosen file. |
| Integration | Response format and application validation. |

Run the same examples again when changing models or updating the runtime. This lets you evaluate changes against your actual work.
