export type BilingualText = {
  vi: string;
  en: string;
};

export type CustomLabStep = BilingualText & {
  safety: boolean;
};

export type CustomLabVocabulary = BilingualText & {
  ipa: string;
  definitionVi: string;
  definitionEn: string;
};

export type CustomLabAttachment = {
  name: string;
  type: "IMAGE" | "PDF" | "VIDEO" | "MODEL_3D" | "DOCUMENT" | "HTML";
  url: string;
};

export type VirtualLabParameter = {
  id: string;
  labelVi: string;
  labelEn: string;
  unitVi: string;
  unitEn: string;
  min: number;
  max: number;
  step: number;
  initialValue: number;
};

export type VirtualLabOutput = {
  id: string;
  labelVi: string;
  labelEn: string;
  unitVi: string;
  unitEn: string;
  formula: string;
};

export type VirtualLabDomain = "science" | "electricity" | "mechanics" | "fluids" | "thermal";
export type VirtualLabSimulationTemplate =
  | "solar-system"
  | "water-cycle"
  | "food-chain"
  | "human-body"
  | "plant-structure"
  | "ohm-law"
  | "series-circuit"
  | "parallel-circuit"
  | "archimedes"
  | "density"
  | "lever"
  | "pulley"
  | "spring"
  | "pressure";
export type VirtualLabComponentDefinition =
  | { id: string; type: "parameter-slider"; parameterId: string }
  | { id: string; type: "numeric-output"; outputId: string };
export type VirtualLabOption = BilingualText & { id: string };
export type VirtualLabTemplate =
  | "drag-drop"
  | "matching"
  | "labeling"
  | "timeline"
  | "image-quiz"
  | "diagram"
  | VirtualLabSimulationTemplate;

type CustomLabActivityBase = {
  schemaVersion?: 1;
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  descriptionEn: string;
  animation?: VirtualLabAnimationConfig;
};

export type VirtualLabAnimationConfig = {
  entrance: "fade" | "rise" | "pop" | "none";
  durationMs: number;
  delayMs: number;
};

export type CustomLabActivity =
  | (CustomLabActivityBase & {
      type: "observe";
      prompt: BilingualText;
    })
  | (CustomLabActivityBase & {
      type: "slider";
      min: number;
      max: number;
      step: number;
      initialValue: number;
      unitVi: string;
      unitEn: string;
      lowResult: BilingualText;
      highResult: BilingualText;
    })
  | (CustomLabActivityBase & {
      type: "switch";
      initialOn: boolean;
      onLabel: BilingualText;
      offLabel: BilingualText;
      onResult: BilingualText;
      offResult: BilingualText;
    })
  | (CustomLabActivityBase & {
      type: "quiz";
      question: BilingualText;
      options: BilingualText[];
      correctIndex: number;
      explanation: BilingualText;
    })
  | (CustomLabActivityBase & {
      type: "simulation";
      domain?: VirtualLabDomain;
      template?: VirtualLabSimulationTemplate;
      parameters: VirtualLabParameter[];
      outputs: VirtualLabOutput[];
      components?: VirtualLabComponentDefinition[];
    })
  | (CustomLabActivityBase & {
      type: "template";
      template: "drag-drop" | "matching";
      instructions: BilingualText;
      items: VirtualLabOption[];
      targets: VirtualLabOption[];
      correctMatches: Record<string, string>;
      imageUrl?: string;
      labels?: Array<VirtualLabOption & { x: number; y: number }>;
      events?: Array<{ id: string; date: string; title: BilingualText; description: BilingualText }>;
      question?: BilingualText;
      options?: VirtualLabOption[];
      correctIndex?: number;
      explanation?: BilingualText;
    })
  | (CustomLabActivityBase & {
      type: "template";
      template: "labeling";
      imageUrl: string;
      instructions: BilingualText;
      labels: Array<VirtualLabOption & { x: number; y: number }>;
    })
  | (CustomLabActivityBase & {
      type: "template";
      template: "timeline";
      events: Array<{ id: string; date: string; title: BilingualText; description: BilingualText }>;
    })
  | (CustomLabActivityBase & {
      type: "template";
      template: "image-quiz";
      imageUrl: string;
      question: BilingualText;
      options: VirtualLabOption[];
      correctIndex: number;
      explanation: BilingualText;
    })
  | (CustomLabActivityBase & {
      type: "template";
      template: "diagram";
      imageUrl: string;
      labels: Array<VirtualLabOption & { x: number; y: number }>;
    })
  | (CustomLabActivityBase & {
      type: "external";
      provider: "phet" | "geogebra";
      url: string;
    });

export type CustomLabInput = {
  title: string;
  titleEn: string;
  subject: "science" | "physics" | "chemistry" | "biology";
  grade: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
  summary: string;
  summaryEn: string;
  safetyNotice: string;
  safetyNoticeEn: string;
  equipment: BilingualText[];
  steps: CustomLabStep[];
  vocabulary: CustomLabVocabulary[];
  activities: CustomLabActivity[];
  attachments: CustomLabAttachment[];
};

export type CustomLabRecord = CustomLabInput & {
  id: string;
  thumbnailUrl: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};
