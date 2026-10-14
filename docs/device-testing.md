# Real-device checklist (Phase 8)

Automated tests cover widths 360–1920px in Chromium, reduced motion, no-JavaScript, view
transitions and long tasks under 4× CPU throttling. These checks need real hardware. Run them on a
preview deployment once real photography is in place, and note the device, OS and browser.

**Devices:** a recent iPhone (Safari), an older iPhone on iOS 15–16 if available, a mid-range
Android phone (Chrome), and an iPad or Android tablet.

## Every device

- [ ] Home hero fills the screen without jumping when the browser bar shows or hides.
- [ ] Hero headline and caption are readable over the real photograph (sample the darkest and
      lightest areas behind the text).
- [ ] Header turns solid after a short scroll; text stays readable over the hero before that.
- [ ] Menu opens and closes, Back/Escape behave, and the page behind does not scroll.
- [ ] The sticky "Discuss your project" bar appears after the hero, hides near the footer and the
      enquiry bands, and never covers a field while typing.
- [ ] Projects: filters work; tapping a project and pressing Back returns to the same filter.
- [ ] Case study: the gallery opens, swipes left and right, closes with the back gesture, and
      returns to the same image.
- [ ] Before/after slider works with a finger and with the two buttons.
- [ ] Enquiry form: the keyboard type matches each field (email, phone), autofill works, the
      country code appears after choosing a city, errors are readable, and sending reaches the
      thank-you page.
- [ ] No horizontal scrolling anywhere, in portrait and landscape.

## iOS Safari specifically

- [ ] Hero and case-study hero heights are stable while scrolling (svh units; vh on iOS < 15.4).
- [ ] Turning on Reduce Motion (Settings → Accessibility → Motion) removes the fades and the
      image morph between pages.
- [ ] VoiceOver: skip link, menu, filters, gallery and form errors are announced sensibly.

## Android Chrome specifically

- [ ] Scrolling the home page and a long case study feels smooth on a mid-range phone.
- [ ] The page-to-page image morph runs between the projects list and a case study.
- [ ] TalkBack: same checks as VoiceOver above.

## Sign-off

| Device | OS / browser | Tester | Date | Issues |
| ------ | ------------ | ------ | ---- | ------ |
|        |              |        |      |        |
