/* global globalThis:readonly */
/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */

function setMetaTag(name, content) {
  try {
    const { document } = globalThis;

    if (typeof document !== 'undefined' && document.createElement && document.head && document.head.appendChild) {
      const meta = document.querySelector(`html meta[name="${encodeURI(name)}"]`) || document.createElement('meta');

      meta.setAttribute('name', name);
      meta.setAttribute('content', content);

      document.head.appendChild(meta);
    }
  } catch (err) {}
}

export default function addVersionToMetaTag() {
  // @ts-ignore
  setMetaTag('react-scroll-to-bottom:version', import.meta.env.VITE_APP_VERSION || '0.0.0');
}
