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
  type: "IMAGE" | "PDF" | "VIDEO" | "MODEL_3D" | "DOCUMENT";
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

type CustomLabActivityBase = {
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  descriptionEn: string;
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
      parameters: VirtualLabParameter[];
      outputs: VirtualLabOutput[];
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
  grade: "6" | "7" | "8" | "9";
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
  createdById: string;
  createdAt: string;
  updatedAt: string;
};
