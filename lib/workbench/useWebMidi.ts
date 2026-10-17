'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
}

export interface UseWebMidiOptions {
  onNoteOn?: (pitch: number, velocity: number) => void;
  onNoteOff?: (pitch: number) => void;
}

export function useWebMidi({ onNoteOn, onNoteOff }: UseWebMidiOptions = {}) {
  const [supported, setSupported] = useState(false);
  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState<MidiDevice[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('all');
  const [lastNote, setLastNote] = useState<{ pitch: number; velocity: number } | null>(null);

  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const onNoteOnRef = useRef(onNoteOn);
  const onNoteOffRef = useRef(onNoteOff);
  onNoteOnRef.current = onNoteOn;
  onNoteOffRef.current = onNoteOff;

  useEffect(() => {
    setSupported(typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator);
  }, []);

  const refreshDevices = useCallback((access: MIDIAccess) => {
    const list: MidiDevice[] = [];
    access.inputs.forEach((input) => {
      list.push({
        id: input.id,
        name: input.name || `Dispositivo ${list.length + 1}`,
        manufacturer: input.manufacturer || 'MIDI',
      });
    });
    setDevices(list);
    return list;
  }, []);

  const handleMidiMessage = useCallback((event: MIDIMessageEvent) => {
    if (!event.data || event.data.length < 3) return;
    const [status, pitch, velocity] = event.data;
    const cmd = status >> 4;
    if (cmd === 9 && velocity > 0) {
      setLastNote({ pitch, velocity });
      onNoteOnRef.current?.(pitch, velocity);
    } else if (cmd === 8 || (cmd === 9 && velocity === 0)) {
      onNoteOffRef.current?.(pitch);
    }
  }, []);

  const bindInputs = useCallback((access: MIDIAccess, targetId: string) => {
    access.inputs.forEach((input) => {
      input.onmidimessage = null;
      if (targetId === 'all' || input.id === targetId) {
        input.onmidimessage = handleMidiMessage;
      }
    });
  }, [handleMidiMessage]);

  const connect = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('requestMIDIAccess' in navigator)) return false;
    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      midiAccessRef.current = access;
      refreshDevices(access);
      setConnected(true);
      bindInputs(access, activeDeviceId);
      access.onstatechange = () => {
        refreshDevices(access);
        bindInputs(access, activeDeviceId);
      };
      return true;
    } catch {
      setConnected(false);
      return false;
    }
  }, [refreshDevices, bindInputs, activeDeviceId]);

  useEffect(() => {
    if (midiAccessRef.current) bindInputs(midiAccessRef.current, activeDeviceId);
  }, [activeDeviceId, bindInputs]);

  return {
    supported,
    connected,
    devices,
    activeDeviceId,
    setActiveDeviceId,
    lastNote,
    connect,
  };
}
