# Manual accessibility checklist

Run this checklist on the live site at https://manayab.github.io/Portfolio/ after deploying a change. Use a fresh browser tab, then repeat at a narrow mobile viewport and a desktop viewport.

## Keyboard-only navigation

- [ ] Reload the page, do not use the mouse, and press **Tab** repeatedly from the top.
- [ ] The first focusable control is **Skip to main content**; it becomes visible when focused.
- [ ] Focus proceeds in a logical visual order through the brand link, navigation toggle (when shown), navigation links, hero calls to action, and the remaining page links.
- [ ] Press **Enter** on the skip link; focus/scroll moves to the main content.
- [ ] At mobile/tablet width, focus the navigation toggle and press **Enter** or **Space**. The menu opens and `aria-expanded` changes to `true`; activate a menu link and confirm the menu closes.
- [ ] Press **Shift+Tab** to move backwards; focus order remains predictable and no focus trap occurs.
- [ ] Use **Enter** to activate links and **Space/Enter** to activate buttons. No essential action requires a pointer.

## Focus visibility and contrast

- [ ] Every focused link/button has a clearly visible outline or equivalent focus indicator against the dark background.
- [ ] Focus is not hidden behind the sticky/header area or clipped by cards/containers.
- [ ] Hover-only styling is not required to discover or operate controls.
- [ ] At 200% zoom, text remains readable and controls remain available without overlapping.

## Skip link and landmarks

- [ ] With the page at the top, press Tab once: the skip link becomes visible.
- [ ] Activate it and verify the viewport reaches the main content.
- [ ] With a screen reader, navigate by landmarks. There is one banner/header, a labelled primary navigation, one main landmark, and a footer/content-info landmark.
- [ ] The primary navigation has a meaningful accessible name; the mobile menu toggle announces its purpose and expanded/collapsed state.
- [ ] Headings form a useful outline: one page-level H1 followed by section H2s and subordinate headings.
- [ ] Decorative canvas, icons, and ornamentation are not announced as meaningful content.

## Screen reader: mobile and desktop

- [ ] On a mobile viewport, use VoiceOver (iOS) or TalkBack (Android): navigate by landmarks and headings; the nav toggle announces its expanded state and the links are reachable after opening it.
- [ ] On desktop, use NVDA with Firefox/Chrome or VoiceOver with Safari: navigate by landmarks, headings, links, and buttons.
- [ ] Link text communicates its destination (avoid relying on “click here” or an icon alone).
- [ ] The contact email/phone and DocuExtract links announce meaningful names and work when activated.
- [ ] The animated terminal text/counters and decorative streams do not repeatedly interrupt screen-reader speech. Enable reduced motion in OS/browser settings and confirm decorative animation stops.
- [ ] If any check fails, note browser, screen reader, viewport, exact element, and steps to reproduce before changing markup.

Automated axe checks are useful but do not replace this manual pass. Record results and any exceptions below.

## Results

- Date / browser / screen reader:
- Mobile results:
- Desktop results:
- Issues to fix:
