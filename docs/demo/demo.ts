import { html, render } from 'lit';
import { elements } from '@patternfly/pfe-tools/environment.js';
import { URLPattern } from 'urlpattern-polyfill';
import { installRouter } from 'pwa-helpers/router.js';

const pattern = new URLPattern({ pathname: '/demo/:element/' });
const include = document.querySelector<HTMLElement & { src?: string }>('html-include');
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('main-nav');
const viewer = document.querySelector<HTMLElement & { src?: string }>('api-viewer');
const github = document.getElementById('github-link') as HTMLAnchorElement;
const form = document.querySelector<HTMLFormElement>('#component-header form');
const context = document.getElementById('context-selector') as HTMLElement;
const contextSelect = context.querySelector('select');
const componentHeader = document.getElementById('component-header');

const contextToColor = new Map(Object.entries({
  dark: 'darkest',
  saturated: 'accent',
  light: 'lightest',
}));

function pretty(tagName: string): string {
  return tagName
    .replace('pfe-', '')
    .toLowerCase()
    .replace(/(?:^|[\s-/])\w/g, x => x.toUpperCase())
    .replace(/-/g, ' ');
}

/**
 * Load demo scripts and scroll to element with id in the URL hash.
 * @this {HTMLElement}
 */
async function onLoad(element: string, base: 'elements', location: Location) {
  // not every demo has a script
  // eslint-disable-next-line no-console
  await import(`/${base}/${element}/demo/${element}.js`).catch(console.error.bind(console, element));
  if (location.hash) {
    include.shadowRoot?.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' });
  }
  form.hidden = include.shadowRoot.querySelectorAll('.contextual').length < 1;
  include.classList.remove('loading');
  componentHeader.classList.remove('loading');
  onContextChange();
}

/** Load up the requested element's demo in a separate shadow root */
async function go(location = window.location) {
  const { element } = pattern.exec(location.href)?.pathname?.groups ?? {};

  if (element) {
    const base = 'elements';
    include.classList.add('loading');
    componentHeader.classList.add('loading');
    include.addEventListener('load', onLoad.bind(include, element, base, location), { once: true });
    include.setAttribute('data-demo', element);
    include.src = `/${base}/${element}/demo/${element}.html`;
    viewer.src = `/${base}/${element}/custom-elements.json`;
    viewer.hidden = false;
    document.title = `${pretty(element)} | scope/repo Elements`;
    document.querySelector('h1').textContent = `<${element}>`;
    github.href = `https://github.com/scope/repo/tree/main/${base}/${element}`;
    toggleNav(false);
  } else {
    viewer.src = '';
    viewer.hidden = true;
    document.querySelector('h1').textContent = 'Select a demo from the Menu';
  }
}

/** Change the context of the accordions */
function onContextChange() {
  for (const element of include.shadowRoot.querySelectorAll('.contextual')) {
    element.setAttribute('color', contextToColor.get(contextSelect.value) ?? 'lightest');
  }
}

function toggleNav(force?: boolean | Event) {
  if (window.matchMedia('(max-width: 640px)').matches) {
    const old = typeof force === 'boolean' ? !force : hamburger.getAttribute('aria-expanded') === 'true';
    const next = !old;
    hamburger.setAttribute('aria-expanded', String(next));
    nav.classList.toggle('expanded');
    if (next) {
      const link: HTMLAnchorElement = nav.querySelector('a:active') ?? nav.querySelector('a');
      link.focus();
    }
  }
}

const li = (element: string) => html`
  <li class="site-navigation__item">
    <a class="site-navigation__link" href="/demo/${element}/">${pretty(element)}</a>
  </li>
`;

render([
  ...elements.map(li),
], document.getElementById('elements-container'));

installRouter(go);

go();

form.addEventListener('submit', e => e.preventDefault());

context.addEventListener('select', onContextChange);
hamburger.addEventListener('click', toggleNav);
document.addEventListener('click', event => {
  if (hamburger.getAttribute('aria-expanded') === 'true') {
    const path = event.composedPath();

    if (!path.includes(nav) && !path.includes(hamburger)) {
      event.preventDefault();
      event.stopPropagation();
      toggleNav(false);
    }
  }
});

nav.addEventListener('keydown', event => {
  if (hamburger.getAttribute('aria-expanded') === 'true') {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        toggleNav(false);
    }
  }
});
