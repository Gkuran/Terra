export const connectorFloraMarkerSvgMarkup = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
  <circle cx="14" cy="14" r="11.4" fill="rgba(255,255,255,0.94)" stroke="rgba(18,31,26,0.12)" stroke-width="1.2"/>
  <path d="M14 22c-.8 0-1.4-.6-1.4-1.4v-3.4c0-2.3 1.1-4.3 2.9-5.5-3.7.3-6.6-1.4-8.4-5C9.7 4.5 12.5 3.9 15.3 4.7c1.9.6 3.3 1.8 4.1 3.7 2-1.6 4-1.7 6.1-.3-.9 4.8-3.7 7.4-8.3 7.7-2 .2-3.2 1.3-3.2 3.2v1.6c0 .8-.6 1.4-1.4 1.4Z" fill="#4f7d4c"/>
  <path d="M14 18.5c-.2 0-.4-.1-.6-.2a.95.95 0 0 1-.1-1.3l5.4-6.1c.3-.4.9-.4 1.3-.1.4.3.4.9.1 1.3l-5.4 6.1c-.2.2-.4.3-.7.3Z" fill="#eff7e9"/>
</svg>
`

export const connectorFaunaMarkerSvgMarkup = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
  <circle cx="14" cy="14" r="11.4" fill="rgba(255,255,255,0.94)" stroke="rgba(18,31,26,0.12)" stroke-width="1.2"/>
  <circle cx="9.1" cy="9.1" r="2.4" fill="#8a5a36"/>
  <circle cx="18.9" cy="9.1" r="2.4" fill="#8a5a36"/>
  <circle cx="6.9" cy="14" r="1.95" fill="#8a5a36"/>
  <circle cx="21.1" cy="14" r="1.95" fill="#8a5a36"/>
  <path d="M14 21.6c3.4 0 6.1-2.1 6.1-4.9 0-3-2.7-5.7-6.1-5.7s-6.1 2.7-6.1 5.7c0 2.8 2.7 4.9 6.1 4.9Z" fill="#8a5a36"/>
  <path d="M11.8 17.1c0 1 1 1.7 2.2 1.7s2.2-.7 2.2-1.7" fill="none" stroke="#fff7e7" stroke-width="1.5" stroke-linecap="round"/>
</svg>
`

export function ConnectorFloraMarkerIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28">
      <path d="M14 25c-1 0-1.8-.8-1.8-1.8v-4.3c0-2.9 1.4-5.4 3.6-7-4.7.4-8.4-1.8-10.7-6.4C8.4 2.8 12 2 15.6 3c2.4.7 4.2 2.3 5.2 4.7 2.5-2 5.1-2.2 7.8-.4-1.1 6.1-4.7 9.4-10.5 9.8-2.6.2-4 1.6-4 4v2.1c0 1-.8 1.8-1.8 1.8Z" fill="#4f7d4c" />
      <path d="M14 20.5c-.3 0-.6-.1-.8-.3a1.2 1.2 0 0 1-.1-1.7l6.9-7.8c.4-.5 1.2-.5 1.7-.1s.5 1.2.1 1.7L14.9 20a1.2 1.2 0 0 1-.9.5Z" fill="#eff7e9" />
    </svg>
  )
}

export function ConnectorFaunaMarkerIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28">
      <circle cx="8.1" cy="8.3" r="3.2" fill="#8a5a36" />
      <circle cx="19.9" cy="8.3" r="3.2" fill="#8a5a36" />
      <circle cx="5.4" cy="14.2" r="2.6" fill="#8a5a36" />
      <circle cx="22.6" cy="14.2" r="2.6" fill="#8a5a36" />
      <path d="M14 23.4c4.1 0 7.3-2.6 7.3-5.9 0-3.7-3.2-6.8-7.3-6.8s-7.3 3.1-7.3 6.8c0 3.3 3.2 5.9 7.3 5.9Z" fill="#8a5a36" />
      <path d="M11.3 17.8c0 1.2 1.2 2.1 2.7 2.1s2.7-.9 2.7-2.1" fill="none" stroke="#fff7e7" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
