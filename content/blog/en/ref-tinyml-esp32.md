---
title: "TinyML on ESP32-S3: preparing a test"
date: "2026-09-23"
lang: "en"
summary: "Choose a compatible example, review memory and measure results before integrating inference into a device."
tags: ["ai", "tinyml", "esp32", "tensorflow-lite", "reference"]
category: "referencia"
---

A TinyML test needs a concrete task: classifying a signal, recognizing a pattern or detecting an event. Define the input, expected result and available response time before choosing the model.

This guide is a reference for experimentation. TinyML and voice capture are not implemented in the current HIOS Node AI firmware, which queries Ollama on another computer.

## Start with a compatible example

Espressif maintains the `esp-tflite-micro` component for ESP-IDF, with examples such as `hello_world`, `micro_speech` and `person_detection`. Its documentation describes supported versions, build steps and ESP-NN integration. Choose an example suited to your board and follow its README. [Official esp-tflite-micro repository](https://github.com/espressif/esp-tflite-micro).

For speech recognition, also consult ESP-SR. Its guide separates components such as WakeNet and MultiNet and documents their requirements. Confirm supported models, languages and boards before designing the interaction. [Official ESP-SR guide for ESP32-S3](https://docs.espressif.com/projects/esp-sr/en/latest/esp32s3/index.html).

## Review memory configuration

The model file size does not describe the application’s total memory use. You also need to consider input buffers, interpreter working memory and the rest of the firmware.

Do not treat a universal rule such as “the arena must always be in SRAM” as a completed design. Record buffer locations and sizes, run the example and measure the result on the chosen board.

Performance figures published by a provider apply to a particular model and configuration. Keep those conditions if you want to reproduce the test; do not present the figures as the latency of any application.

## Check the complete path

1. Run the original example and save its output.
2. Identify the format, dimensions and type of the input data.
3. Prepare known samples and verify preprocessing.
4. Run inference and review how the output is interpreted.
5. Measure memory and response time with the other components active.
6. Test unexpected inputs and initialization failures.

If you change the model or its quantization, repeat the evaluation. The application must interpret tensors according to the loaded model. Do not treat every output as a floating-point number or apply a fixed threshold without validating it.

## Distinguish a demonstration from a product feature

A test that recognizes one sample does not yet show that the feature is ready for continuous use. Document the test set, capture conditions and observed errors.

Before connecting it to a physical action, define what happens when a classification is uncertain, a response is delayed or the model fails. That logic is part of the device design.
