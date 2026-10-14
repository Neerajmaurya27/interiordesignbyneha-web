---
# DEVELOPMENT FIXTURE — every optional block filled, to exercise the case-study template.
# Not a real project; never publish.
title: Fixture residence A [VERIFY]
locality: '[VERIFY locality]'
city: Mumbai
country: India
region: mumbai
type: residence
year: 2026
status: completed
services: ['[VERIFY] Service one', '[VERIFY] Service two']
teamLead: '[VERIFY team lead]'
architect: '[VERIFY architect]'
contractor: '[VERIFY contractor]'
craftPartners:
  - { name: '[VERIFY workshop]', craft: '[VERIFY craft]', city: Mumbai }
photographer: '[VERIFY photographer]'
essence: '[VERIFY] One-line essence of the project, written by the studio.'
brief: >-
  [VERIFY] Brief and challenge, 60–100 words in the studio's own voice. This fixture paragraph only
  sets the measure and rhythm of the section so the layout can be reviewed before real copy arrives.
concept: >-
  [VERIFY] Concept and rationale, 60–100 words. Like the brief, this is structural filler that shows
  how the concept text sits beside its sketch or mood image.
execution: >-
  [VERIFY] Execution and constraints, documented only. Structural filler for the optional
  execution section.
conceptImage:
  src: ./fixture-a-24-concept-landscape.jpg
  alt: Fixture concept image
  caption: Concept visualisation [VERIFY]
  orientation: landscape
siteImages:
  - {
      src: ./fixture-a-25-site-landscape.jpg,
      alt: Fixture site photograph 1,
      orientation: landscape,
    }
  - {
      src: ./fixture-a-26-site-landscape.jpg,
      alt: Fixture site photograph 2,
      orientation: landscape,
    }
hero:
  desktop: ./fixture-a-01-hero-landscape.jpg
  mobile: ./fixture-a-02-hero-portrait.jpg
  alt: Fixture image A, landscape crop
homeImages:
  - src: ./fixture-a-03-living-portrait.jpg
    alt: Fixture image A, second portrait
    orientation: portrait
sequence:
  - layout: full
    caption: '[VERIFY] Entrance and living'
    images:
      - {
          src: ./fixture-a-05-room-landscape.jpg,
          alt: Fixture sequence image 05,
          orientation: landscape,
        }
  - layout: pair
    caption: '[VERIFY] Living room'
    images:
      - {
          src: ./fixture-a-06-room-portrait.jpg,
          alt: Fixture sequence image 06,
          orientation: portrait,
        }
      - {
          src: ./fixture-a-07-room-portrait.jpg,
          alt: Fixture sequence image 07,
          orientation: portrait,
        }
  - layout: full
    images:
      - {
          src: ./fixture-a-08-room-landscape.jpg,
          alt: Fixture sequence image 08,
          orientation: landscape,
        }
  - layout: trio
    caption: '[VERIFY] Dining and kitchen'
    images:
      - {
          src: ./fixture-a-09-room-portrait.jpg,
          alt: Fixture sequence image 09,
          orientation: portrait,
        }
      - {
          src: ./fixture-a-10-room-portrait.jpg,
          alt: Fixture sequence image 10,
          orientation: portrait,
        }
      - {
          src: ./fixture-a-11-room-portrait.jpg,
          alt: Fixture sequence image 11,
          orientation: portrait,
        }
  - layout: spread
    caption: '[VERIFY] View across the main room'
    images:
      - { src: ./fixture-a-15-spread-wide.jpg, alt: Fixture spread image, orientation: landscape }
  - layout: pair-offset
    caption: '[VERIFY] Bedroom'
    images:
      - { src: ./fixture-a-13-room-square.jpg, alt: Fixture sequence image 13, orientation: square }
      - { src: ./fixture-a-14-room-square.jpg, alt: Fixture sequence image 14, orientation: square }
details:
  - {
      src: ./fixture-a-16-detail-square.jpg,
      alt: Fixture detail 16,
      caption: '[VERIFY] Material and maker, detail one',
    }
  - {
      src: ./fixture-a-17-detail-square.jpg,
      alt: Fixture detail 17,
      caption: '[VERIFY] Material and maker, detail two',
    }
  - {
      src: ./fixture-a-18-detail-square.jpg,
      alt: Fixture detail 18,
      caption: '[VERIFY] Material and maker, detail three',
    }
  - {
      src: ./fixture-a-19-detail-square.jpg,
      alt: Fixture detail 19,
      caption: '[VERIFY] Material and maker, detail four',
    }
madeForThisHome:
  - {
      name: '[VERIFY] Piece one',
      material: '[VERIFY] Material',
      maker: '[VERIFY] Maker',
      image: ./fixture-a-20-piece-portrait.jpg,
      alt: Fixture piece one,
    }
  - {
      name: '[VERIFY] Piece two',
      material: '[VERIFY] Material',
      image: ./fixture-a-21-piece-portrait.jpg,
      alt: Fixture piece two,
    }
plan:
  svg: plan.svg
  description: '[VERIFY] Text description of the plan: five rooms around a central living space.'
  steps:
    - { room: living, label: Living, text: '[VERIFY] Note about the living room.' }
    - { room: dining, label: Dining, text: '[VERIFY] Note about the dining room.' }
    - { room: bedroom, label: Bedroom, text: '[VERIFY] Note about the bedroom.' }
beforeAfter:
  - {
      before: ./fixture-a-22-before-landscape.jpg,
      after: ./fixture-a-23-after-landscape.jpg,
      alt: Fixture before and after of the living room,
    }
testimonial:
  quote: '[VERIFY] Sample quote used only to lay out this block.'
  attribution: '[VERIFY] Owner, residence, Mumbai'
  permissionRef: fixture
featured: true
homeOrder: 1
indexOrder: 1
related: [fixture-c]
published: false
verified:
  facts: false
  testimonial: false
  credits: false
---
