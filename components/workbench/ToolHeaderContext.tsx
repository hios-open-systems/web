'use client';

import { createContext } from 'react';

/** Only the client tool island uses this; the prerendered header stays outside. */
export const ToolHeaderRenderedContext = createContext(false);
