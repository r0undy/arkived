/**
 * Accessible tabs primitive (DSD §4). Controlled or uncontrolled.
 *
 * Usage:
 *   <Tabs
 *     tabs={[{ id: 'a', label: 'Overview' }, { id: 'b', label: 'Activity' }]}
 *     value={active}
 *     onChange={setActive}
 *   />
 */
import { useId, useState } from 'react';

export default function Tabs({ tabs = [], value, defaultValue, onChange, className = '' }) {
  const baseId = useId();
  const [internal, setInternal] = useState(defaultValue ?? tabs[0]?.id);
  const active = value ?? internal;

  const select = (id) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };

  const onKeyDown = (event) => {
    const index = tabs.findIndex((tab) => tab.id === active);
    if (index < 0) return;
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    select(tabs[next].id);
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className={`inline-flex items-center gap-1 rounded-lg border border-neutral-750 bg-neutral-800 p-1 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            id={`${baseId}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => select(tab.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              isActive ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {tab.icon ? <tab.icon className="h-4 w-4" aria-hidden="true" /> : null}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
