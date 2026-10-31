# Virtual Lab activity templates

The existing Lab routes and the 23 built-in interactive experiments remain in
`app/lab` and `components/lab/VirtualLabSimulator.tsx`. Configured activities
are authored as JSON and stored with teacher-created Labs in the existing
`CustomLab.activities` JSON column.

## Engine framework

```text
lib/virtual-lab/
├── engine/
│   ├── types.ts             # Plugin and renderer contracts
│   ├── registry.ts          # Duplicate-safe lazy engine registry
│   └── catalog.ts           # Built-in domain/template/plugin registrations
├── parser.ts                # Untrusted JSON validation
├── formula-engine.ts        # Restricted formula evaluator
├── physics-engine.ts        # Domain limits and calculated outputs
├── component-registry.tsx   # Configurable input/output components
├── event-engine.ts          # Per-session typed event bus
├── state-store.ts           # Zustand session state and result events
└── student-result-collector.ts

components/lab/virtual-lab/
├── EngineRenderer.tsx       # Simulation renderer, lazy router, animation
├── templates.tsx            # Reusable primary-school template views
└── engines/
    ├── SimulationEngine.tsx # Formula-driven science and physics
    ├── InteractionEngine.tsx
    ├── TemplateEngine.tsx
    └── ExternalEngine.tsx
```

Engine modules are loaded with `React.lazy` and dynamic imports when an activity
of that type is rendered. The current LMS frontend is Next.js; these standard
React/TypeScript/Tailwind modules are mounted directly by the existing Lab
route.

To add a renderer, implement a component using `EngineRendererProps`, register a
loader in `lib/virtual-lab/engine/catalog.ts`, and extend the activity union and
the frontend/backend validators together. Engine IDs are namespaced
(`simulation:mechanics`, `template:matching`, `interaction:quiz`); duplicate
registrations fail immediately.

Every activity may configure its entrance animation:

```json
{
  "animation": {
    "entrance": "rise",
    "durationMs": 250,
    "delayMs": 0
  }
}
```

Allowed entrances are `fade`, `rise`, `pop`, and `none`. Durations and delays
are bounded by the frontend parser and backend schema, and user reduced-motion
preferences disable animation.

## Runtime flow

1. A teacher pastes an activity JSON document into the Lab Builder.
2. `parseVirtualLabActivityJson` parses and validates it before adding it to
   the Lab draft.
3. `POST /api/labs` validates the same activity shape on the server before
   saving it.
4. `CustomLabPlayer` delegates each activity to `EngineRenderer`, which resolves
   an engine ID in `EngineRegistry` and lazy-loads that renderer. Matching,
   labeling, timeline, and image-quiz activities use the reusable template
   registry. Formula simulations use the component registry and
   physics/formula engine.
5. Zustand stores interactions in a per-practice session and publishes typed
   events through that session's event bus. Students can export the captured
   session as JSON; measurements can also be exported as CSV.

## Supported templates

### Primary-school activities

`drag-drop`, `matching`, `labeling`, `timeline`, and `image-quiz`.

### Reusable science/physics simulations

Science (`domain: "science"`): `solar-system`, `water-cycle`, `food-chain`,
`human-body`, `plant-structure`.

Electricity (`domain: "electricity"`): `ohm-law`, `series-circuit`,
`parallel-circuit`.

Fluids (`domain: "fluids"`): `archimedes`, `density`.

Mechanics (`domain: "mechanics"`): `lever`, `pulley`, `spring`.

`pressure` accepts `fluids` or `mechanics`. These simulation template names
share the same data-driven parameter, formula, and output renderer; they are
not separate implementations of individual experiments. A new experiment
normally requires a JSON document and assets, not a React component.

## Simulation JSON shape

```json
{
  "schemaVersion": 1,
  "type": "simulation",
  "template": "ohm-law",
  "domain": "electricity",
  "titleVi": "Định luật Ôm",
  "titleEn": "Ohm's law",
  "descriptionVi": "Thay đổi hiệu điện thế và điện trở.",
  "descriptionEn": "Change voltage and resistance.",
  "parameters": [
    {
      "id": "voltage",
      "labelVi": "Hiệu điện thế",
      "labelEn": "Voltage",
      "unitVi": "V",
      "unitEn": "V",
      "min": 1,
      "max": 24,
      "step": 1,
      "initialValue": 12
    },
    {
      "id": "resistance",
      "labelVi": "Điện trở",
      "labelEn": "Resistance",
      "unitVi": "Ω",
      "unitEn": "Ω",
      "min": 1,
      "max": 50,
      "step": 1,
      "initialValue": 10
    }
  ],
  "outputs": [
    {
      "id": "current",
      "labelVi": "Cường độ dòng điện",
      "labelEn": "Electric current",
      "unitVi": "A",
      "unitEn": "A",
      "formula": "voltage / resistance"
    }
  ]
}
```

Parameters become slider controls and outputs become calculated result cards.
Formulas are parsed by the restricted formula engine; arbitrary JavaScript is
not executed. Optional `components` can explicitly arrange the supported
`parameter-slider` and `numeric-output` renderers. When omitted, the parser
creates these components from the parameter/output lists.

## Validation and compatibility

- Activity JSON uses `schemaVersion: 1`; existing records without that field
  remain readable.
- IDs must be unique within their collection and formulas can reference only
  declared parameter IDs and approved math functions.
- Image assets must use an internal absolute path or an HTTPS URL.
- Each simulation supports at most 12 parameters and 12 outputs.
- Grades 1–9 are accepted by the Custom Lab API.
- The frontend parser and backend Zod schema both validate data. Keep their
  limits and template/domain rules in sync when extending the schema.

## Examples

Runnable starter JSON is in `examples/`: `drag-drop.json`, `matching.json`,
`labeling.json`, `timeline.json`, `image-quiz.json`, `solar-system.json`, and
`ohm-law.json`. The plant diagram asset used by the image activities is at
`/virtual-lab/examples/plant-structure.svg`.

To add another experiment, copy the closest example, update its bilingual
content, IDs, values, and formulas, then add it as an activity in the Lab
Builder. The existing lab library is not replaced by this engine.
