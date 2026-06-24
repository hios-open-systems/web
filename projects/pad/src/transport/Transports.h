// ============================================================================
//  Transports.h - Fabricas de transportes concretos. AISLAN los headers de las
//  libs HID: USBHIDKeyboard.h (TinyUSB) y BleKeyboard.h (t-vk) definen los MISMOS
//  simbolos (KEY_F*, struct KeyReport) de forma incompatible, asi que no pueden
//  convivir en una sola unidad de compilacion. main.cpp solo incluye esto y ve
//  ITransport; cada fabrica vive en su propio .cpp con UN solo header de lib.
// ============================================================================
#pragma once
#include "ITransport.h"

ITransport* usbHidInstance();   // definido en UsbHidTransport.cpp
ITransport* bleHidInstance();   // definido en BleHidTransport.cpp
