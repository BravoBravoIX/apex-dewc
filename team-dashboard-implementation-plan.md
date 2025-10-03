# Team Dashboard - Detailed Implementation Plan

**Last Updated:** October 1, 2025
**Estimated Time:** 9-13 hours
**Target:** Maritime scenario team dashboards (Blue/Red teams)

---

## Prerequisites

- Working team-dashboard container running
- MQTT connection functional
- Injects delivering via timeline JSON
- Node.js 18+ environment

---

## Phase 1: Backup & Setup (45 minutes)

### Step 1.0: Create Backup

**IMPORTANT:** Backup existing team-dashboard before making changes.

**Directory size:** ~120MB total (mostly node_modules), ~30KB source files

```bash
# From scip-v3 root directory
cd /Users/brettburford/Development/CyberOps/scip-v3

# Create timestamped backup
DATE=$(date +%Y%m%d_%H%M%S)
cp -r team-dashboard team-dashboard-backup-${DATE}

# Verify backup
ls -lh team-dashboard-backup-${DATE}/src/
```

**Files being backed up:**
- `src/App.tsx` (13KB - main component)
- `src/main.tsx` (~200B - entry point)
- `src/index.css` (~200B - styles)
- `src/hooks/useMqtt.ts` (MQTT hook)
- `src/EWIntel.tsx` (4.6KB - SATCOM component)
- `src/SpaceOps.tsx` (6.8KB - SATCOM component)
- `package.json`, `vite.config.ts`, `tsconfig.json`

**To revert if needed:**
```bash
# If something breaks
rm -rf team-dashboard
mv team-dashboard-backup-${DATE} team-dashboard
docker-compose build team-dashboard
```

### Step 1.1: Install Dependencies

```bash
cd team-dashboard
npm install react-router-dom@6.20.0 lucide-react
```

### Step 1.2: Verify Current Structure

Expected files:
```
team-dashboard/
├── src/
│   ├── App.tsx          (main component - will be replaced)
│   ├── main.tsx         (entry point - will be updated)
│   ├── index.css        (global styles - will be updated)
│   └── hooks/
│       └── useMqtt.ts   (MQTT hook - unchanged)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Phase 2: Theme System (2 hours)

### Step 2.1: Create Theme Context

**IMPORTANT:** This is copied directly from client-dashboard to ensure consistency.

**File:** `src/contexts/ThemeContext.tsx`

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to light theme, but check localStorage
  // NOTE: Using 'team-dashboard-theme' to separate from client-dashboard
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('team-dashboard-theme');
    return (saved as Theme) || 'light';
  });

  useEffect(() => {
    // Apply theme to document (matches client-dashboard)
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    // Save to localStorage
    localStorage.setItem('team-dashboard-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Step 2.2: Add CSS Variables & Tailwind Config

**IMPORTANT:** These colors are copied EXACTLY from client-dashboard.

**File:** `src/index.css`

Replace entire contents with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Default to light theme - EXACT match to client-dashboard */
:root {
  /* Light theme colors */
  --color-background: #f9fafb; /* gray-50 */
  --color-surface: #ffffff;
  --color-surface-light: #f3f4f6; /* gray-100 */
  --color-primary: #3b82f6; /* blue-500 */
  --color-accent: #8b5cf6; /* purple-500 */
  --color-text-primary: #111827; /* gray-900 */
  --color-text-secondary: #6b7280; /* gray-500 */
  --color-text-muted: #9ca3af; /* gray-400 */
  --color-border: #e5e7eb; /* gray-200 */

  /* Status colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}

/* Dark theme - EXACT match to client-dashboard */
[data-theme="dark"] {
  --color-background: #0a0a0f;
  --color-surface: #1a1a2e;
  --color-surface-light: #0f0f23;
  --color-primary: #3b82f6; /* Keep blue in dark theme */
  --color-accent: #f39c12;
  --color-text-primary: #e5e5e5;
  --color-text-secondary: #a0a0a0;
  --color-text-muted: #6c6c6c;
  --color-border: #2a2a3e;

  /* Status colors for dark theme */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}

@layer base {
  body {
    @apply bg-background text-text-primary transition-colors duration-200;
  }
}

@layer components {
  /* Card component adapts to theme */
  .card {
    @apply bg-surface border border-border rounded-lg shadow-sm;
  }

  /* Light theme specific card styling */
  [data-theme="light"] .card {
    @apply shadow-md hover:shadow-lg transition-shadow;
  }

  /* Dark theme specific card styling */
  [data-theme="dark"] .card {
    @apply shadow-lg;
  }

  /* Button styles */
  .btn-primary {
    @apply px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity;
  }
}
```

**File:** `tailwind.config.js` (create if it doesn't exist)

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-light': 'var(--color-surface-light)',
        primary: 'var(--color-primary)',
        accent: 'var(--color-accent)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        border: 'var(--color-border)',

        // Status colors
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
      },
    },
  },
  plugins: [],
}
```

### Step 2.3: Install lucide-react & Create Theme Toggle

**Install icon library** (same as client-dashboard):

```bash
cd team-dashboard
npm install lucide-react
```

**File:** `src/components/ThemeToggle.tsx`

**IMPORTANT:** This matches client-dashboard Header theme toggle styling.

```tsx
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-surface-light hover:bg-primary/10 transition-colors"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? (
        <Moon size={20} className="text-text-secondary" />
      ) : (
        <Sun size={20} className="text-text-secondary" />
      )}
    </button>
  );
};
```

---

## Phase 3: Routing Setup (1.5 hours)

### Step 3.1: Create Router Configuration

**File:** `src/router.tsx`

```tsx
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AllInjectsPage } from './pages/AllInjectsPage';
import { NewsPage } from './pages/NewsPage';
import { SocialPage } from './pages/SocialPage';
import { EmailPage } from './pages/EmailPage';
import { SMSPage } from './pages/SMSPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <AllInjectsPage /> },
      { path: 'news', element: <NewsPage /> },
      { path: 'social', element: <SocialPage /> },
      { path: 'email', element: <EmailPage /> },
      { path: 'sms', element: <SMSPage /> },
    ],
  },
]);
```

### Step 3.2: Create Inject Context (State Management)

**File:** `src/contexts/InjectContext.tsx`

```tsx
import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useMqtt } from '../hooks/useMqtt';

export interface Inject {
  id: string;
  time: number;
  type?: string;
  content?: string | {
    headline?: string;
    body?: string;
    source?: string;
    from?: string;
    to?: string;
    subject?: string;
  };
  message?: string;
  data?: any;
  delivered_at?: number;
  team_id?: string;
  exercise_id?: string;
  media?: string[];
  action?: {
    type: string;
    data?: any;
  };
}

interface InjectContextType {
  injects: Inject[];
  timer: string;
  exerciseState: 'RUNNING' | 'PAUSED' | 'STOPPED';
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  lastUpdate: Date | null;
}

const InjectContext = createContext<InjectContextType | undefined>(undefined);

export const InjectProvider = ({ children }: { children: ReactNode }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('team') || 'default-team';
  const exerciseName = urlParams.get('exercise') || 'test';
  const topic = `/exercise/${exerciseName}/team/${teamId}/feed`;

  const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  const brokerUrl = `ws://${hostname}:9001`;

  const timerTopic = `/exercise/${exerciseName}/timer`;
  const controlTopic = `/exercise/${exerciseName}/control`;

  const mqttTopics = useMemo(() => [topic, timerTopic, controlTopic], [topic, timerTopic, controlTopic]);
  const { messages, connectionStatus } = useMqtt(brokerUrl, mqttTopics);

  const [timer, setTimer] = useState<string>('T+00:00');
  const [injects, setInjects] = useState<Inject[]>([]);
  const [exerciseState, setExerciseState] = useState<'RUNNING' | 'PAUSED' | 'STOPPED'>('RUNNING');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    messages.forEach(msg => {
      try {
        const parsed = JSON.parse(msg);

        if (parsed.formatted && parsed.elapsed !== undefined) {
          setTimer(parsed.formatted);
          setLastUpdate(new Date());
        } else if (parsed.command) {
          switch (parsed.command) {
            case 'pause':
              setExerciseState('PAUSED');
              break;
            case 'resume':
              setExerciseState('RUNNING');
              break;
            case 'stop':
              setExerciseState('STOPPED');
              break;
          }
        } else if (parsed.id) {
          setInjects(prev => {
            const exists = prev.some(inject => inject.id === parsed.id);
            if (exists) return prev;
            return [parsed, ...prev];
          });
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    });
  }, [messages]);

  return (
    <InjectContext.Provider
      value={{
        injects,
        timer,
        exerciseState,
        connectionStatus,
        lastUpdate,
      }}
    >
      {children}
    </InjectContext.Provider>
  );
};

export const useInjects = () => {
  const context = useContext(InjectContext);
  if (!context) {
    throw new Error('useInjects must be used within InjectProvider');
  }
  return context;
};
```

### Step 3.3: Create Layout Component

**File:** `src/components/Layout.tsx`

```tsx
import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { Header } from './Header';

export const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
};
```

### Step 3.4: Create Header Component

**IMPORTANT:** Header styling matches client-dashboard exactly.

**File:** `src/components/Header.tsx`

```tsx
import { useInjects } from '../contexts/InjectContext';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => {
  const { timer, exerciseState } = useInjects();
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('team') || 'default-team';

  const getStateColor = () => {
    switch (exerciseState) {
      case 'RUNNING': return 'text-success';
      case 'PAUSED': return 'text-warning';
      case 'STOPPED': return 'text-error';
      default: return 'text-text-muted';
    }
  };

  return (
    <header className="bg-surface w-full p-4 border-b border-border">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">
          Team Dashboard: <span className="text-primary capitalize">{teamId}</span>
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-primary">{timer}</div>
            <div className={`text-sm font-semibold ${getStateColor()}`}>
              {exerciseState}
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
```

### Step 3.5: Create Navigation Component

**IMPORTANT:** Uses client-dashboard color scheme and hover states.

**File:** `src/components/Navigation.tsx`

```tsx
import { NavLink } from 'react-router-dom';
import { useInjects } from '../contexts/InjectContext';
import { useMemo } from 'react';

export const Navigation = () => {
  const { injects, connectionStatus, lastUpdate } = useInjects();

  // Calculate counts per type
  const counts = useMemo(() => {
    const result = {
      all: injects.length,
      news: 0,
      social: 0,
      email: 0,
      sms: 0,
    };

    injects.forEach(inject => {
      const type = inject.type?.toLowerCase();
      if (type === 'news') result.news++;
      else if (type === 'social' || type === 'social_media') result.social++;
      else if (type === 'email') result.email++;
      else if (type === 'sms') result.sms++;
    });

    return result;
  }, [injects]);

  // Preserve URL params in navigation
  const search = window.location.search;

  return (
    <div className="bg-surface border-b border-border">
      <div className="container mx-auto">
        {/* Connection Status */}
        <div className="px-4 py-2 border-b border-border">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-success animate-pulse' :
                connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'bg-warning animate-pulse' :
                'bg-error'
              }`}></span>
              <span className={`${
                connectionStatus === 'connected' ? 'text-success' :
                connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'text-warning' :
                'text-error'
              }`}>
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'connecting' ? 'Connecting...' :
                 connectionStatus === 'reconnecting' ? 'Reconnecting...' :
                 'Disconnected'}
              </span>
            </div>
            <div className="text-text-secondary">
              {lastUpdate && connectionStatus === 'connected' && `Last update: ${lastUpdate.toLocaleTimeString()}`}
            </div>
          </div>
        </div>

        {/* Navigation Tabs - matches client-dashboard NavLink styling */}
        <nav className="flex gap-1 px-4">
          <NavLink
            to={`/${search}`}
            end
            className={({ isActive }) =>
              `px-4 py-3 font-medium transition-colors ${
                isActive
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`
            }
          >
            All Injects ({counts.all})
          </NavLink>
          <NavLink
            to={`/news${search}`}
            className={({ isActive }) =>
              `px-4 py-3 font-medium transition-colors ${
                isActive
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`
            }
          >
            News ({counts.news})
          </NavLink>
          <NavLink
            to={`/social${search}`}
            className={({ isActive }) =>
              `px-4 py-3 font-medium transition-colors ${
                isActive
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`
            }
          >
            Social Media ({counts.social})
          </NavLink>
          <NavLink
            to={`/email${search}`}
            className={({ isActive }) =>
              `px-4 py-3 font-medium transition-colors ${
                isActive
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`
            }
          >
            Email ({counts.email})
          </NavLink>
          <NavLink
            to={`/sms${search}`}
            className={({ isActive }) =>
              `px-4 py-3 font-medium transition-colors ${
                isActive
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`
            }
          >
            SMS ({counts.sms})
          </NavLink>
        </nav>
      </div>
    </div>
  );
};
```

---

## Phase 4: Page Components (3.5 hours)

### Step 4.1: All Injects Page

**File:** `src/pages/AllInjectsPage.tsx`

```tsx
import { useInjects } from '../contexts/InjectContext';
import { InjectCard } from '../components/InjectCard';

export const AllInjectsPage = () => {
  const { injects } = useInjects();

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">All Injects ({injects.length})</h2>

      {injects.length === 0 ? (
        <div className="text-center py-8 text-text-secondary">
          <p>Waiting for injects...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {injects.map((inject, idx) => (
            <InjectCard key={idx} inject={inject} />
          ))}
        </div>
      )}
    </div>
  );
};
```

### Step 4.2: News Page

**File:** `src/pages/NewsPage.tsx`

```tsx
import { useMemo } from 'react';
import { useInjects } from '../contexts/InjectContext';
import { InjectCard } from '../components/InjectCard';

export const NewsPage = () => {
  const { injects } = useInjects();

  const newsInjects = useMemo(() => {
    return injects.filter(inject => inject.type?.toLowerCase() === 'news');
  }, [injects]);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">News ({newsInjects.length})</h2>

      {newsInjects.length === 0 ? (
        <div className="text-center py-8 text-text-secondary">
          <p>No news injects yet...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {newsInjects.map((inject, idx) => (
            <InjectCard key={idx} inject={inject} />
          ))}
        </div>
      )}
    </div>
  );
};
```

### Step 4.3: Social Media Page

**File:** `src/pages/SocialPage.tsx`

```tsx
import { useMemo } from 'react';
import { useInjects } from '../contexts/InjectContext';
import { InjectCard } from '../components/InjectCard';

export const SocialPage = () => {
  const { injects } = useInjects();

  const socialInjects = useMemo(() => {
    return injects.filter(inject => {
      const type = inject.type?.toLowerCase();
      return type === 'social' || type === 'social_media';
    });
  }, [injects]);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Social Media ({socialInjects.length})</h2>

      {socialInjects.length === 0 ? (
        <div className="text-center py-8 text-text-secondary">
          <p>No social media injects yet...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {socialInjects.map((inject, idx) => (
            <InjectCard key={idx} inject={inject} />
          ))}
        </div>
      )}
    </div>
  );
};
```

### Step 4.4: Email Page (Special - Clickable)

**File:** `src/pages/EmailPage.tsx`

```tsx
import { useMemo, useState } from 'react';
import { useInjects } from '../contexts/InjectContext';
import type { Inject } from '../contexts/InjectContext';

export const EmailPage = () => {
  const { injects } = useInjects();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const emailInjects = useMemo(() => {
    return injects.filter(inject => inject.type?.toLowerCase() === 'email');
  }, [injects]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getEmailContent = (inject: Inject) => {
    if (typeof inject.content === 'object') {
      return {
        from: inject.content.from || 'Unknown Sender',
        to: inject.content.to || 'Team',
        subject: inject.content.subject || inject.content.headline || 'No Subject',
        body: inject.content.body || '',
      };
    }
    return {
      from: 'Unknown Sender',
      to: 'Team',
      subject: 'No Subject',
      body: inject.content || inject.message || '',
    };
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Email ({emailInjects.length})</h2>

      {emailInjects.length === 0 ? (
        <div className="text-center py-8 text-text-secondary">
          <p>No emails yet...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {emailInjects.map((inject) => {
            const email = getEmailContent(inject);
            const isExpanded = expandedId === inject.id;
            const timestamp = inject.delivered_at !== undefined
              ? `T+${Math.floor(inject.delivered_at/60).toString().padStart(2, '0')}:${(inject.delivered_at%60).toString().padStart(2, '0')}`
              : `T+${Math.floor(inject.time/60).toString().padStart(2, '0')}:${(inject.time%60).toString().padStart(2, '0')}`;

            return (
              <div key={inject.id} className="card rounded-lg overflow-hidden">
                {/* Email List Item */}
                <button
                  onClick={() => toggleExpand(inject.id)}
                  className="w-full text-left p-4 hover:bg-surface transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-text-primary">
                        {email.from}
                      </div>
                      <div className="text-text-primary font-medium mt-1">
                        {email.subject}
                      </div>
                      {!isExpanded && (
                        <div className="text-text-secondary text-sm mt-1 truncate">
                          {email.body.substring(0, 100)}...
                        </div>
                      )}
                    </div>
                    <div className="text-text-secondary text-sm ml-4 flex-shrink-0">
                      {timestamp}
                    </div>
                  </div>
                </button>

                {/* Expanded Email Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border">
                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <span className="text-text-secondary">From:</span>{' '}
                        <span className="text-text-primary">{email.from}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">To:</span>{' '}
                        <span className="text-text-primary">{email.to}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">Subject:</span>{' '}
                        <span className="text-text-primary">{email.subject}</span>
                      </div>
                    </div>
                    <div className="mt-4 text-text-primary whitespace-pre-wrap">
                      {email.body}
                    </div>
                    {inject.media && inject.media.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {inject.media.map((mediaPath, idx) => (
                          <img
                            key={idx}
                            src={`http://localhost:8001${mediaPath}`}
                            alt="Email attachment"
                            className="rounded cursor-pointer hover:opacity-90"
                            style={{ maxWidth: '400px', maxHeight: '300px', objectFit: 'contain' }}
                            onClick={() => window.open(`http://localhost:8001${mediaPath}`, '_blank')}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
```

### Step 4.5: SMS Page (Simple Feed)

**File:** `src/pages/SMSPage.tsx`

```tsx
import { useMemo } from 'react';
import { useInjects } from '../contexts/InjectContext';
import type { Inject } from '../contexts/InjectContext';

export const SMSPage = () => {
  const { injects } = useInjects();

  const smsInjects = useMemo(() => {
    return injects.filter(inject => inject.type?.toLowerCase() === 'sms');
  }, [injects]);

  const getSender = (inject: Inject): string => {
    if (typeof inject.content === 'object' && inject.content.from) {
      return inject.content.from;
    }
    return 'Unknown';
  };

  const getMessage = (inject: Inject): string => {
    if (typeof inject.content === 'object' && inject.content.body) {
      return inject.content.body;
    }
    return inject.content || inject.message || '';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">SMS ({smsInjects.length})</h2>

      {smsInjects.length === 0 ? (
        <div className="text-center py-8 text-text-secondary">
          <p>No SMS messages yet...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {smsInjects.map((inject) => {
            const sender = getSender(inject);
            const message = getMessage(inject);
            const timestamp = inject.delivered_at !== undefined
              ? `T+${Math.floor(inject.delivered_at/60).toString().padStart(2, '0')}:${(inject.delivered_at%60).toString().padStart(2, '0')}`
              : `T+${Math.floor(inject.time/60).toString().padStart(2, '0')}:${(inject.time%60).toString().padStart(2, '0')}`;

            return (
              <div key={inject.id} className="card p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm font-semibold text-primary">SMS</div>
                    <div className="text-sm text-text-secondary">From: {sender}</div>
                  </div>
                  <span className="text-xs text-text-secondary font-mono">
                    {timestamp}
                  </span>
                </div>

                <div className="text-text-primary mt-2">
                  {message}
                </div>

                {/* Media attachments (MMS) */}
                {inject.media && inject.media.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {inject.media.map((mediaPath, idx) => (
                      <img
                        key={idx}
                        src={`http://localhost:8001${mediaPath}`}
                        alt="MMS attachment"
                        className="rounded cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ maxWidth: '400px', maxHeight: '300px', objectFit: 'contain' }}
                        onClick={() => window.open(`http://localhost:8001${mediaPath}`, '_blank')}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
```

### Step 4.6: Shared InjectCard Component

**File:** `src/components/InjectCard.tsx`

```tsx
import type { Inject } from '../contexts/InjectContext';

interface InjectCardProps {
  inject: Inject;
}

export const InjectCard = ({ inject }: InjectCardProps) => {
  const getInjectIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'news': return '📰';
      case 'email': return '📧';
      case 'social':
      case 'social_media': return '📱';
      case 'sms': return '💬';
      case 'intel':
      case 'intelligence': return '🔍';
      case 'alert': return '🚨';
      default: return '📄';
    }
  };

  const timestamp = inject.delivered_at !== undefined
    ? `T+${Math.floor(inject.delivered_at/60).toString().padStart(2, '0')}:${(inject.delivered_at%60).toString().padStart(2, '0')}`
    : `T+${Math.floor(inject.time/60).toString().padStart(2, '0')}:${(inject.time%60).toString().padStart(2, '0')}`;

  return (
    <div className="card p-4 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getInjectIcon(inject.type)}</span>
          <div>
            <span className="text-sm font-semibold text-primary">
              {inject.type?.toUpperCase() || 'INJECT'}
            </span>
            <span className="text-xs text-text-secondary ml-2">
              ID: {inject.id}
            </span>
          </div>
        </div>
        <span className="text-xs text-text-secondary font-mono">
          {timestamp}
        </span>
      </div>

      <div className="text-text-primary mt-2">
        {inject.message ? (
          inject.message
        ) : inject.content ? (
          typeof inject.content === 'object' ? (
            <div>
              {inject.content.headline && (
                <div className="font-semibold mb-1">{inject.content.headline}</div>
              )}
              {inject.content.body && (
                <div className="mb-1">{inject.content.body}</div>
              )}
              {inject.content.source && (
                <div className="text-sm text-text-secondary italic">Source: {inject.content.source}</div>
              )}
            </div>
          ) : (
            inject.content
          )
        ) : (
          <div className="text-sm font-mono bg-background p-2 rounded">
            {JSON.stringify(inject.data || inject, null, 2)}
          </div>
        )}
      </div>

      {inject.media && inject.media.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {inject.media.map((mediaPath, idx) => (
            <img
              key={idx}
              src={`http://localhost:8001${mediaPath}`}
              alt="Inject media"
              className="rounded cursor-pointer hover:opacity-90 transition-opacity"
              style={{ maxWidth: '400px', maxHeight: '300px', objectFit: 'contain' }}
              onClick={() => window.open(`http://localhost:8001${mediaPath}`, '_blank')}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## Phase 5: Update Main App (30 minutes)

### Step 5.1: Update main.tsx

**File:** `src/main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { InjectProvider } from './contexts/InjectContext';
import { router } from './router';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <InjectProvider>
        <RouterProvider router={router} />
      </InjectProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
```

### Step 5.2: Remove old App.tsx

The old `App.tsx` is now replaced by the routing structure. It can be deleted or kept as reference.

---

## Phase 6: Testing (2 hours)

### Test Checklist

#### Functional Tests
- [ ] Theme toggle switches between light/dark
- [ ] Theme persists on page reload
- [ ] Theme is per-team (different teams have separate theme settings)
- [ ] Navigation tabs work and preserve URL params (`?team=X&exercise=Y`)
- [ ] All Injects page shows all injects
- [ ] News page shows ONLY news injects
- [ ] Social page shows ONLY social injects
- [ ] Email page shows ONLY email injects
- [ ] SMS page shows ONLY SMS injects
- [ ] Tab counts update in real-time
- [ ] Connection status displays correctly
- [ ] Timer updates every second
- [ ] New injects appear immediately on correct page
- [ ] Email expand/collapse works
- [ ] SMS bubbles show correct sender colors
- [ ] Media images display and click-to-enlarge works

#### Visual Tests
- [ ] Light theme looks clean and professional
- [ ] Dark theme is readable and consistent
- [ ] Active tab highlighting works
- [ ] Email inbox looks like email client
- [ ] SMS page shows intercepted messages clearly
- [ ] Cards have proper spacing and consistent layout
- [ ] Mobile responsive (test at 768px, 425px)

#### Performance Tests
- [ ] Route switching is instant
- [ ] Filtering doesn't cause lag with 20+ injects
- [ ] Theme switch is smooth
- [ ] MQTT updates don't slow down app

---

## Deployment

### Step 1: Build and Test

```bash
cd team-dashboard
npm run build
```

### Step 2: Rebuild Docker Image

```bash
cd ..
docker-compose build team-dashboard
```

### Step 3: Restart Team Dashboard Containers

If maritime exercise is running:
```bash
docker stop team-dashboard-maritime-crisis-scenario-blue team-dashboard-maritime-crisis-scenario-red
docker rm team-dashboard-maritime-crisis-scenario-blue team-dashboard-maritime-crisis-scenario-red
```

Then redeploy the exercise from client dashboard to launch new containers.

---

## Troubleshooting

### Issue: Everything is broken, need to revert

**Solution:** Restore from backup:

```bash
cd /Users/brettburford/Development/CyberOps/scip-v3
rm -rf team-dashboard
mv team-dashboard-backup-YYYYMMDD_HHMMSS team-dashboard  # Use your backup timestamp
docker-compose build team-dashboard
```

Then redeploy exercise from client dashboard.

### Issue: Routes not working, 404 errors

**Solution:** Check nginx.conf has proper SPA routing:

```nginx
location / {
  try_files $uri /index.html;
}
```

### Issue: URL params lost on navigation

**Solution:** Ensure Navigation component appends `search` to all NavLink `to` props:

```tsx
<NavLink to={`/news${search}`}>
```

### Issue: Theme not persisting

**Solution:** Check localStorage key includes team ID:

```tsx
const storageKey = `team-dashboard-theme-${teamId}`;
```

### Issue: MQTT connection lost on route change

**Solution:** MQTT connection is in InjectContext which wraps the entire router, so it should persist. Verify InjectProvider wraps RouterProvider in main.tsx.

### Issue: Injects not appearing on filtered pages

**Solution:** Check inject `type` field in timeline JSON matches expected values (`news`, `social`, `email`, `sms`).

---

## Timeline JSON Verification

Before testing, verify timeline JSON files have correct `type` fields:

**File:** `scenarios/timelines/timeline-blue.json`

```json
{
  "injects": [
    {
      "id": "inject-001",
      "time": 60,
      "type": "news",
      "content": {
        "headline": "Port Security Alert",
        "body": "...",
        "source": "Maritime News"
      }
    },
    {
      "id": "inject-002",
      "time": 120,
      "type": "email",
      "content": {
        "from": "harbormaster@port.gov",
        "to": "blue-team@navy.mil",
        "subject": "Urgent: Vessel Inspection Required",
        "body": "..."
      }
    }
  ]
}
```

Ensure variety: news, social, email, sms types for testing all pages.

---

## Estimated Time Breakdown

- Phase 1 (Backup & Setup): 45 min
- Phase 2 (Theme): 2 hours
- Phase 3 (Routing): 1.5 hours
- Phase 4 (Pages): 3.5 hours
- Phase 5 (Main App): 30 min
- Phase 6 (Testing): 1.5 hours

**Total: ~10 hours**
**Expected debugging/polish: +1.5 hours**
**Realistic total: ~11.5 hours**

---

## Success Criteria

✅ Theme toggle works and persists per team
✅ All navigation tabs functional
✅ Each inject type appears ONLY on its designated page
✅ All injects appear on "All Injects" page
✅ Email page has clickable inbox interface
✅ News, Social, SMS pages have clean feed layout
✅ Real-time updates work on all pages
✅ Tab counts update dynamically
✅ Media displays correctly
✅ Mobile responsive

---

## Next Steps After Implementation

1. Add Intel/Alert inject types
2. Implement inject acknowledgment system
3. Add search within each type
4. Export capabilities per inject type
5. Notification sounds for new injects
