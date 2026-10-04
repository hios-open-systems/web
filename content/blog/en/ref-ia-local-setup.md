---
title: "Local AI: preparing a test with llama.cpp"
date: "2026-09-22"
lang: "en"
summary: "Choose a build, load a GGUF model and measure memory and timings with a reproducible configuration."
tags: ["ai", "llama-cpp", "llm", "local", "reference"]
category: "referencia"
---

llama.cpp can run compatible models in different environments. To prepare a test, first identify your operating system, available hardware and model file. Keep those details alongside the runtime version.

## Install or build

You can use a distribution prepared for your platform or build the project. If you choose to build it, follow the dependencies and backend options for your hardware. The documentation includes alternatives such as CUDA and Vulkan; enabling an option does not replace installing its requirements. [Official build guide](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md).

Before downloading a model, check that its architecture and format are compatible with the installed version. Also review its license and the file’s origin.

## Weight size and total memory

An approximate calculation for weights stored with a uniform number of bits is:

`weight bytes ≈ parameter count × bits per parameter / 8`

With eight billion parameters and four bits per parameter, this calculation gives four billion bytes. It approximates the weights, not the complete memory budget for running the model.

The file may contain metadata and quantization that does not use the same format for every tensor. Execution adds other memory use. Measure the actual load with the context and options you intend to use.

## First run

Read the `llama-cli` help and prepare a short query. Record the model path, context, output limit and GPU configuration. Available names and options must match your version. [llama-cli documentation](https://github.com/ggml-org/llama.cpp/tree/master/tools/cli).

For conversational models, review the chat template in use. If the response has an unexpected format, check that configuration along with the prompt and model compatibility.

## Measure before adjusting

| Observation | Next step |
|---|---|
| The model does not load | Review the error, compatibility and available memory. |
| The response takes too long | Record timings and CPU/GPU use with the current configuration. |
| The response format is wrong | Review the template, prompt and structured output options. |
| A long query fails | Compare context and memory use with a short query. |

Change one variable at a time and repeat the same test case. This helps identify which adjustment caused the difference.

## Minimum record

Keep the runtime version, exact model name, execution options, hardware and results. Include errors and limitations alongside successful tests.

Memory estimates help with planning. The timings and results observed on your hardware are the reference for deciding whether the configuration meets the project’s needs.
