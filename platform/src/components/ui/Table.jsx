/**
 * Unified table primitives (Dashboard redesign R3 — one table language).
 * Compose: <TableContainer><Table><THead>…</THead><TBody>…</TBody></Table></TableContainer>
 */

export function TableContainer({ className = '', children }) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-neutral-750 bg-neutral-800 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Table({ className = '', children }) {
  return <table className={`min-w-full text-left text-sm ${className}`}>{children}</table>;
}

export function THead({ children }) {
  return (
    <thead className="border-b border-neutral-750 bg-neutral-900/50">
      <tr className="text-[11px] uppercase tracking-wider text-neutral-500">{children}</tr>
    </thead>
  );
}

export function Th({ align = 'left', className = '', children, ...props }) {
  return (
    <th className={`px-4 py-3 font-medium ${align === 'right' ? 'text-right' : 'text-left'} ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TBody({ className = '', children }) {
  return <tbody className={`divide-y divide-neutral-800 ${className}`}>{children}</tbody>;
}

export function Tr({ highlight = false, className = '', children, ...props }) {
  return (
    <tr
      className={`transition-colors hover:bg-neutral-800/60 ${highlight ? 'bg-info-500/10' : ''} ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function Td({ align = 'left', className = '', children, ...props }) {
  return (
    <td className={`px-4 py-3 align-middle ${align === 'right' ? 'text-right' : ''} ${className}`} {...props}>
      {children}
    </td>
  );
}
