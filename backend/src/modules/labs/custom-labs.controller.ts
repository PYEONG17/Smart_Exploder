import type { NextFunction, Request, Response } from "express";
import { unlink } from "node:fs/promises";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "../../config/db.js";
import { AppError } from "../../utils/app-error.js";
import { success } from "../../utils/api-response.js";
import {
  createCustomLabThumbnail,
  getCourseMediaUrl,
  isValidGlbFile,
  removeCourseMediaByUrls,
} from "../../utils/course-media.js";

const bilingualTextSchema = z.object({
  vi: z.string().trim().max(2000),
  en: z.string().trim().max(2000),
});

const pairedTextSchema = bilingualTextSchema.superRefine((value, context) => {
  if (!value.vi && !value.en) {
    context.addIssue({
      code: "custom",
      message: "Provide text in Vietnamese or English",
    });
  }
});

const equipmentSchema = z.array(pairedTextSchema).max(30).default([]);
const stepSchema = pairedTextSchema.extend({
  safety: z.boolean().default(false),
});
const vocabularySchema = z.array(
  pairedTextSchema.extend({
    ipa: z.string().trim().max(100).default(""),
    definitionVi: z.string().trim().max(1000).default(""),
    definitionEn: z.string().trim().max(1000).default(""),
  }),
).max(50);
const attachmentSchema = z.object({
  name: z.string().trim().min(1).max(150),
  type: z.enum(["IMAGE", "PDF", "VIDEO", "MODEL_3D", "DOCUMENT", "HTML"]),
  url: z.string().url().max(2000),
});

function isHtmlLabFile(file: Express.Multer.File): boolean {
  return (
    /\.(?:html?)$/i.test(file.originalname) &&
    ["", "text/html", "application/octet-stream"].includes(file.mimetype)
  );
}

const activityBase = {
  schemaVersion: z.literal(1).optional(),
  titleVi: z.string().trim().max(200).default(""),
  titleEn: z.string().trim().max(200).default(""),
  descriptionVi: z.string().trim().max(1000).default(""),
  descriptionEn: z.string().trim().max(1000).default(""),
  animation: z.object({
    entrance: z.enum(["fade", "rise", "pop", "none"]).default("fade"),
    durationMs: z.number().int().min(0).max(2000).default(250),
    delayMs: z.number().int().min(0).max(1000).default(0),
  }).optional(),
};
const optionSchema = z.object({
  id: z.string().trim().min(1).max(40),
  vi: z.string().trim().min(1).max(200),
  en: z.string().trim().min(1).max(200),
});
const positionedOptionSchema = optionSchema.extend({
  x: z.number().finite().min(0).max(100),
  y: z.number().finite().min(0).max(100),
});
const templateNames = [
  "drag-drop",
  "matching",
  "labeling",
  "timeline",
  "image-quiz",
  "diagram",
] as const;
const simulationTemplateNames = [
  "solar-system",
  "water-cycle",
  "food-chain",
  "human-body",
  "plant-structure",
  "ohm-law",
  "series-circuit",
  "parallel-circuit",
  "archimedes",
  "density",
  "lever",
  "pulley",
  "spring",
  "pressure",
] as const;
const imageUrlSchema = z.string().trim().min(1).max(2000).superRefine((value, context) => {
  if (value.startsWith("/") && !value.startsWith("//")) return;
  try {
    if (new URL(value).protocol === "https:") return;
  } catch {
    // Report the same validation error for malformed and insecure URLs.
  }
  context.addIssue({ code: "custom", message: "Image URLs must be internal paths or HTTPS URLs" });
});
const templateActivitySchema = z.object({
  ...activityBase,
  type: z.literal("template"),
  template: z.enum(templateNames),
  instructions: bilingualTextSchema.optional(),
  items: z.array(optionSchema).min(2).max(20).optional(),
  targets: z.array(optionSchema).min(2).max(20).optional(),
  correctMatches: z.record(z.string(), z.string()).optional(),
  imageUrl: imageUrlSchema.optional(),
  labels: z.array(positionedOptionSchema).min(1).max(30).optional(),
  events: z.array(z.object({
    id: z.string().trim().min(1).max(40),
    date: z.string().trim().min(1).max(40),
    title: bilingualTextSchema,
    description: bilingualTextSchema,
  })).min(2).max(30).optional(),
  question: bilingualTextSchema.optional(),
  options: z.array(optionSchema).min(2).max(6).optional(),
  correctIndex: z.number().int().min(0).max(5).optional(),
  explanation: bilingualTextSchema.optional(),
}).superRefine((activity, context) => {
  const addIssue = (path: string, message: string) => {
    context.addIssue({ code: "custom", path: [path], message });
  };
  const uniqueIds = (ids: string[]) => new Set(ids).size === ids.length;

  if (activity.template === "drag-drop" || activity.template === "matching") {
    const { items, targets, correctMatches, instructions } = activity;
    if (!items || !targets || !correctMatches || !instructions) {
      addIssue("items", "Matching templates require items, targets, instructions, and correctMatches");
      return;
    }
    const itemIds = items.map(({ id }) => id);
    const targetIds = targets.map(({ id }) => id);
    if (!uniqueIds(itemIds) || !uniqueIds(targetIds)) {
      addIssue("items", "Item and target IDs must be unique");
    }
    if (Object.keys(correctMatches).length !== itemIds.length) {
      addIssue("correctMatches", "Every item must have exactly one correct target");
    }
    for (const [itemId, targetId] of Object.entries(correctMatches)) {
      if (!itemIds.includes(itemId) || !targetIds.includes(targetId)) {
        addIssue("correctMatches", "Correct matches must reference existing items and targets");
        break;
      }
    }
  } else if (activity.template === "labeling" || activity.template === "diagram") {
    if (!activity.imageUrl || !activity.labels) {
      addIssue("imageUrl", "Image templates require an image and at least one label");
      return;
    }
    if (!uniqueIds(activity.labels.map(({ id }) => id))) {
      addIssue("labels", "Label IDs must be unique");
    }
    if (activity.template === "labeling" && !activity.instructions) {
      addIssue("instructions", "Labeling templates require instructions");
    }
  } else if (activity.template === "timeline") {
    if (!activity.events || !uniqueIds(activity.events.map(({ id }) => id))) {
      addIssue("events", "Timeline events must be provided with unique IDs");
    }
  } else if (activity.template === "image-quiz") {
    if (
      !activity.imageUrl ||
      !activity.question ||
      !activity.options ||
      activity.correctIndex === undefined ||
      !activity.explanation
    ) {
      addIssue("question", "Image quizzes require an image, question, options, correct answer, and explanation");
      return;
    }
    if (activity.correctIndex >= activity.options.length) {
      addIssue("correctIndex", "Correct answer must match one of the options");
    }
    if (!uniqueIds(activity.options.map(({ id }) => id))) {
      addIssue("options", "Option IDs must be unique");
    }
  }
});
const activitySchema = z.discriminatedUnion("type", [
  z.object({
    ...activityBase,
    type: z.literal("observe"),
    prompt: pairedTextSchema,
  }),
  z.object({
    ...activityBase,
    type: z.literal("slider"),
    min: z.number().finite(),
    max: z.number().finite(),
    step: z.number().positive().finite(),
    initialValue: z.number().finite(),
    unitVi: z.string().trim().max(40).default(""),
    unitEn: z.string().trim().max(40).default(""),
    lowResult: pairedTextSchema,
    highResult: pairedTextSchema,
  }).superRefine((value, context) => {
    if (value.max <= value.min) {
      context.addIssue({
        code: "custom",
        path: ["max"],
        message: "Maximum must be greater than minimum",
      });
    }
    if (value.initialValue < value.min || value.initialValue > value.max) {
      context.addIssue({
        code: "custom",
        path: ["initialValue"],
        message: "Initial value must be within the slider range",
      });
    }
  }),
  z.object({
    ...activityBase,
    type: z.literal("switch"),
    initialOn: z.boolean().default(false),
    onLabel: pairedTextSchema,
    offLabel: pairedTextSchema,
    onResult: pairedTextSchema,
    offResult: pairedTextSchema,
  }),
  z.object({
    ...activityBase,
    type: z.literal("quiz"),
    question: pairedTextSchema,
    options: z.array(pairedTextSchema).min(2).max(6),
    correctIndex: z.number().int().min(0).max(5),
    explanation: pairedTextSchema,
  }).superRefine((value, context) => {
    if (value.correctIndex >= value.options.length) {
      context.addIssue({
        code: "custom",
        path: ["correctIndex"],
        message: "Correct answer must match one of the options",
      });
    }
  }),
  z.object({
    ...activityBase,
    type: z.literal("simulation"),
    domain: z.enum(["science", "electricity", "mechanics", "fluids", "thermal"]).optional(),
    template: z.enum(simulationTemplateNames).optional(),
    parameters: z.array(z.object({
      id: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]{0,39}$/),
      labelVi: z.string().trim().min(1).max(100),
      labelEn: z.string().trim().min(1).max(100),
      unitVi: z.string().trim().max(30).default(""),
      unitEn: z.string().trim().max(30).default(""),
      min: z.number().finite(),
      max: z.number().finite(),
      step: z.number().positive().finite(),
      initialValue: z.number().finite(),
    }).superRefine((parameter, context) => {
      if (parameter.max <= parameter.min) {
        context.addIssue({ code: "custom", path: ["max"], message: "Maximum must be greater than minimum" });
      }
      if (parameter.initialValue < parameter.min || parameter.initialValue > parameter.max) {
        context.addIssue({ code: "custom", path: ["initialValue"], message: "Initial value must be within its range" });
      }
    })).min(1).max(12),
    outputs: z.array(z.object({
      id: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]{0,39}$/),
      labelVi: z.string().trim().min(1).max(100),
      labelEn: z.string().trim().min(1).max(100),
      unitVi: z.string().trim().max(30).default(""),
      unitEn: z.string().trim().max(30).default(""),
      formula: z.string().trim().min(1).max(200),
    })).min(1).max(12),
    components: z.array(z.discriminatedUnion("type", [
      z.object({
        id: z.string().trim().min(1).max(80),
        type: z.literal("parameter-slider"),
        parameterId: z.string().trim().min(1).max(40),
      }),
      z.object({
        id: z.string().trim().min(1).max(80),
        type: z.literal("numeric-output"),
        outputId: z.string().trim().min(1).max(40),
      }),
    ])).max(24).optional(),
  }).superRefine((simulation, context) => {
    const parameterIds = simulation.parameters.map(({ id }) => id);
    const outputIds = simulation.outputs.map(({ id }) => id);
    if (new Set(parameterIds).size !== parameterIds.length) {
      context.addIssue({ code: "custom", path: ["parameters"], message: "Parameter IDs must be unique" });
    }
    if (new Set(outputIds).size !== outputIds.length) {
      context.addIssue({ code: "custom", path: ["outputs"], message: "Output IDs must be unique" });
    }
    if (outputIds.some((id) => parameterIds.includes(id))) {
      context.addIssue({ code: "custom", path: ["outputs"], message: "Output IDs must not match parameter IDs" });
    }
    const reservedIdentifiers = new Set([
      "abs", "cos", "e", "exp", "log", "max", "min", "pi", "round", "sin", "sqrt", "tan",
      "__proto__", "constructor", "prototype", "toString",
    ]);
    if ([...parameterIds, ...outputIds].some((id) => reservedIdentifiers.has(id))) {
      context.addIssue({ code: "custom", path: ["parameters"], message: "IDs cannot use reserved formula names" });
    }
    const allowedIdentifiers = new Set([
      ...parameterIds,
      "pi", "e", "abs", "cos", "exp", "log", "max", "min", "round", "sin", "sqrt", "tan",
    ]);
    simulation.outputs.forEach((output, index) => {
      if (!/^[0-9A-Za-z_+\-*/^().,\s]+$/.test(output.formula)) {
        context.addIssue({ code: "custom", path: ["outputs", index, "formula"], message: "Formula contains unsupported characters" });
        return;
      }
      const identifiers = output.formula.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
      if (identifiers.some((identifier) => !allowedIdentifiers.has(identifier))) {
        context.addIssue({ code: "custom", path: ["outputs", index, "formula"], message: "Formula references an unknown variable or function" });
      }
    });
    const domain = simulation.domain ?? "mechanics";
    const expectedDomain = simulation.template
      ? ["solar-system", "water-cycle", "food-chain", "human-body", "plant-structure"].includes(simulation.template)
        ? "science"
        : ["ohm-law", "series-circuit", "parallel-circuit"].includes(simulation.template)
          ? "electricity"
          : ["archimedes", "density"].includes(simulation.template)
            ? "fluids"
            : ["lever", "pulley", "spring"].includes(simulation.template)
              ? "mechanics"
              : ["fluids", "mechanics"].includes(domain) ? domain : null
      : domain;
    if (expectedDomain && domain !== expectedDomain) {
      context.addIssue({
        code: "custom",
        path: ["domain"],
        message: `Template ${simulation.template} requires the ${expectedDomain} domain`,
      });
    }
    if (simulation.template === "pressure" && !["fluids", "mechanics"].includes(domain)) {
      context.addIssue({
        code: "custom",
        path: ["domain"],
        message: "The pressure template requires fluids or mechanics domain",
      });
    }
    const parameterIdsSet = new Set(parameterIds);
    simulation.components?.forEach((component, index) => {
      const reference = component.type === "parameter-slider" ? component.parameterId : component.outputId;
      const valid = component.type === "parameter-slider"
        ? parameterIdsSet.has(reference)
        : outputIds.includes(reference);
      if (!valid) {
        context.addIssue({ code: "custom", path: ["components", index], message: "Component references an unknown parameter or output" });
      }
    });
    if (simulation.components && new Set(simulation.components.map(({ id }) => id)).size !== simulation.components.length) {
      context.addIssue({ code: "custom", path: ["components"], message: "Component IDs must be unique" });
    }
  }),
  templateActivitySchema,
  z.object({
    ...activityBase,
    type: z.literal("external"),
    provider: z.enum(["phet", "geogebra"]),
    url: z.string().url().max(2000),
  }).superRefine(({ url, provider }, context) => {
    const parsedUrl = z.string().url().safeParse(url);
    if (!parsedUrl.success) return;
    const hostname = new URL(parsedUrl.data).hostname.toLowerCase();
    const isPhetHost = ["phet.colorado.edu", "phet.colorado.org"].includes(hostname);
    const isGeoGebraHost = ["geogebra.org", "www.geogebra.org"].includes(hostname);
    if (!url.startsWith("https://") || !(isPhetHost || isGeoGebraHost)) {
      context.addIssue({ code: "custom", path: ["url"], message: "Only official PhET or GeoGebra HTTPS URLs are allowed" });
    } else if ((provider === "phet" && !isPhetHost) || (provider === "geogebra" && !isGeoGebraHost)) {
      context.addIssue({ code: "custom", path: ["url"], message: "Simulation provider does not match URL" });
    }
  }),
]);

const customLabSchema = z.object({
  title: z.string().trim().min(2).max(150),
  titleEn: z.string().trim().min(2).max(150),
  subject: z.enum(["science", "physics", "chemistry", "biology"]),
  grade: z.enum(["1", "2", "3", "4", "5", "6", "7", "8", "9"]),
  summary: z.string().trim().min(1).max(2000),
  summaryEn: z.string().trim().min(1).max(2000),
  safetyNotice: z.string().trim().max(2000).default(""),
  safetyNoticeEn: z.string().trim().max(2000).default(""),
  equipment: equipmentSchema,
  steps: z.array(stepSchema).min(1).max(40),
  vocabulary: vocabularySchema,
  activities: z.array(activitySchema).max(30),
  attachments: z.array(attachmentSchema).max(10).default([]),
});

const customLabSelect = {
  id: true,
  title: true,
  titleEn: true,
  subject: true,
  grade: true,
  summary: true,
  summaryEn: true,
  safetyNotice: true,
  safetyNoticeEn: true,
  equipment: true,
  steps: true,
  vocabulary: true,
  activities: true,
  attachments: true,
  thumbnailUrl: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CustomLabSelect;

export async function authorizeCustomLabWrite(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    next(new AppError("Authentication required", 401));
    return;
  }
  try {
    const lab = await prisma.customLab.findUnique({
      where: { id: String(req.params.id) },
      select: { createdById: true },
    });
    if (!lab) {
      next(new AppError("Lab experiment not found", 404));
      return;
    }
    if (lab.createdById !== req.user.id) {
      next(new AppError("You can only manage Labs you created", 403));
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
}

export async function listCustomLabs(_req: Request, res: Response) {
  const labs = await prisma.customLab.findMany({
    select: customLabSelect,
    orderBy: { createdAt: "desc" },
  });
  res.status(200).json(success(labs));
}

export async function getCustomLab(req: Request, res: Response) {
  const lab = await prisma.customLab.findUnique({
    where: { id: String(req.params.id) },
    select: customLabSelect,
  });
  if (!lab) throw new AppError("Lab experiment not found", 404);
  res.status(200).json(success(lab));
}

export async function createCustomLab(req: Request, res: Response) {
  if (!req.user) throw new AppError("Authentication required", 401);
  const uploadedFiles = Array.isArray(req.files) ? req.files : [];
  let requestBody: unknown = req.body;
  if (typeof req.body.input === "string") {
    try {
      requestBody = JSON.parse(req.body.input) as unknown;
    } catch {
      await Promise.all(uploadedFiles.map((file) => unlink(file.path)));
      throw new AppError("Lab details must be valid JSON", 400);
    }
  }

  const parsed = customLabSchema.safeParse(requestBody);
  if (!parsed.success) {
    await Promise.all(uploadedFiles.map((file) => unlink(file.path)));
    res.status(400).json({
      success: false,
      message: "Lab details are invalid. Check the bilingual text and activity settings.",
      errors: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const input = parsed.data;
  let thumbnailUrl: string | null = null;
  try {
    if (input.attachments.length + uploadedFiles.length > 10) {
      throw new AppError("A Lab can contain at most 10 attachments", 400);
    }
    const attachments = [];
    for (const file of uploadedFiles) {
      let type: z.infer<typeof attachmentSchema>["type"];
      if (file.mimetype.startsWith("image/")) {
        type = "IMAGE";
        if (file.size > 15 * 1024 * 1024) {
          throw new AppError("Images must not exceed 15 MB", 400);
        }
      } else if (file.mimetype.startsWith("video/")) {
        type = "VIDEO";
      } else if (isHtmlLabFile(file)) {
        type = "HTML";
        if (file.size > 10 * 1024 * 1024) {
          throw new AppError("HTML Lab files must not exceed 10 MB", 400);
        }
      } else if (file.mimetype === "application/pdf") {
        type = "PDF";
        if (file.size > 50 * 1024 * 1024) {
          throw new AppError("Documents must not exceed 50 MB", 400);
        }
      } else if (
        file.mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.mimetype ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        file.mimetype === "text/plain"
      ) {
        type = "DOCUMENT";
        if (file.size > 50 * 1024 * 1024) {
          throw new AppError("Documents must not exceed 50 MB", 400);
        }
      } else {
        type = "MODEL_3D";
        if (file.size > 100 * 1024 * 1024) {
          throw new AppError("3D models must not exceed 100 MB", 400);
        }
        const validGlb = await isValidGlbFile(file.path);
        if (!validGlb) {
          throw new AppError("The uploaded file is not a valid GLB 2.0 model", 400);
        }
      }

      attachments.push({
        name: file.originalname
          .replace(/[\\/]/g, "")
          .replace(/[\u0000-\u001f]/g, "")
          .trim()
          .slice(0, 150) || "Lab attachment",
        type,
        url: getCourseMediaUrl(req, req.user.id, file.filename),
      });
    }

    thumbnailUrl = await createCustomLabThumbnail(
      req,
      req.user.id,
      input.title,
      input.subject,
      input.grade,
    );
    const lab = await prisma.customLab.create({
      data: {
        title: input.title,
        titleEn: input.titleEn,
        subject: input.subject,
        grade: input.grade,
        summary: input.summary,
        summaryEn: input.summaryEn,
        safetyNotice: input.safetyNotice || null,
        safetyNoticeEn: input.safetyNoticeEn || null,
        equipment: input.equipment as Prisma.InputJsonValue,
        steps: input.steps as Prisma.InputJsonValue,
        vocabulary: input.vocabulary as Prisma.InputJsonValue,
        activities: input.activities as Prisma.InputJsonValue,
        attachments: [...input.attachments, ...attachments] as Prisma.InputJsonValue,
        thumbnailUrl,
        createdById: req.user.id,
      },
      select: customLabSelect,
    });

    res.status(201).json(success(lab, "Lab experiment created"));
  } catch (error) {
    await Promise.all(uploadedFiles.map((file) => unlink(file.path)));
    await removeCourseMediaByUrls([thumbnailUrl]);
    throw error;
  }
}

export async function updateCustomLab(req: Request, res: Response) {
  if (!req.user) throw new AppError("Authentication required", 401);
  const id = String(req.params.id);
  const existing = await prisma.customLab.findUnique({
    where: { id },
    select: { createdById: true, attachments: true, thumbnailUrl: true },
  });
  if (!existing) throw new AppError("Lab experiment not found", 404);
  if (existing.createdById !== req.user.id) {
    throw new AppError("You can only edit Labs you created", 403);
  }

  const uploadedFiles = Array.isArray(req.files) ? req.files : [];
  let requestBody: unknown = req.body;
  if (typeof req.body.input === "string") {
    try {
      requestBody = JSON.parse(req.body.input) as unknown;
    } catch {
      await Promise.all(uploadedFiles.map((file) => unlink(file.path)));
      throw new AppError("Lab details must be valid JSON", 400);
    }
  }
  const parsed = customLabSchema.safeParse(requestBody);
  if (!parsed.success) {
    await Promise.all(uploadedFiles.map((file) => unlink(file.path)));
    res.status(400).json({
      success: false,
      message: "Lab details are invalid. Check the bilingual text and activity settings.",
      errors: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const input = parsed.data;
  let thumbnailUrl: string | null = null;
  const existingAttachments = Array.isArray(existing.attachments)
    ? existing.attachments.flatMap((attachment) => {
        const result = attachmentSchema.safeParse(attachment);
        return result.success ? [result.data] : [];
      })
    : [];
  try {
    const retainedAttachments = input.attachments.map((attachment) => {
      const saved = existingAttachments.find(({ url }) => url === attachment.url);
      if (!saved) throw new AppError("Attachments can only be retained from this Lab", 400);
      return saved;
    });
    if (retainedAttachments.length + uploadedFiles.length > 10) {
      throw new AppError("A Lab can contain at most 10 attachments", 400);
    }

    const newAttachments: z.infer<typeof attachmentSchema>[] = [];
    for (const file of uploadedFiles) {
      let type: z.infer<typeof attachmentSchema>["type"];
      if (file.mimetype.startsWith("image/")) {
        type = "IMAGE";
        if (file.size > 15 * 1024 * 1024) {
          throw new AppError("Images must not exceed 15 MB", 400);
        }
      } else if (file.mimetype.startsWith("video/")) {
        type = "VIDEO";
      } else if (isHtmlLabFile(file)) {
        type = "HTML";
        if (file.size > 10 * 1024 * 1024) {
          throw new AppError("HTML Lab files must not exceed 10 MB", 400);
        }
      } else if (file.mimetype === "application/pdf") {
        type = "PDF";
        if (file.size > 50 * 1024 * 1024) {
          throw new AppError("Documents must not exceed 50 MB", 400);
        }
      } else if (
        file.mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.mimetype ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        file.mimetype === "text/plain"
      ) {
        type = "DOCUMENT";
        if (file.size > 50 * 1024 * 1024) {
          throw new AppError("Documents must not exceed 50 MB", 400);
        }
      } else {
        type = "MODEL_3D";
        if (file.size > 100 * 1024 * 1024) {
          throw new AppError("3D models must not exceed 100 MB", 400);
        }
        if (!(await isValidGlbFile(file.path))) {
          throw new AppError("The uploaded file is not a valid GLB 2.0 model", 400);
        }
      }

      newAttachments.push({
        name: file.originalname
          .replace(/[\\/]/g, "")
          .replace(/[\u0000-\u001f]/g, "")
          .trim()
          .slice(0, 150) || "Lab attachment",
        type,
        url: getCourseMediaUrl(req, req.user.id, file.filename),
      });
    }

    thumbnailUrl = await createCustomLabThumbnail(
      req,
      req.user.id,
      input.title,
      input.subject,
      input.grade,
    );
    const updatedLab = await prisma.customLab.update({
      where: { id },
      data: {
        title: input.title,
        titleEn: input.titleEn,
        subject: input.subject,
        grade: input.grade,
        summary: input.summary,
        summaryEn: input.summaryEn,
        safetyNotice: input.safetyNotice || null,
        safetyNoticeEn: input.safetyNoticeEn || null,
        equipment: input.equipment as Prisma.InputJsonValue,
        steps: input.steps as Prisma.InputJsonValue,
        vocabulary: input.vocabulary as Prisma.InputJsonValue,
        activities: input.activities as Prisma.InputJsonValue,
        attachments: [...retainedAttachments, ...newAttachments] as Prisma.InputJsonValue,
        thumbnailUrl,
      },
      select: customLabSelect,
    });

    const retainedUrls = new Set(retainedAttachments.map(({ url }) => url));
    await removeCourseMediaByUrls(
      existingAttachments
        .filter(({ url }) => !retainedUrls.has(url))
        .map(({ url }) => url),
    );
    await removeCourseMediaByUrls([existing.thumbnailUrl]);
    res.status(200).json(success(updatedLab, "Lab experiment updated"));
  } catch (error) {
    await Promise.all(uploadedFiles.map((file) => unlink(file.path)));
    await removeCourseMediaByUrls([thumbnailUrl]);
    throw error;
  }
}

export async function deleteCustomLab(req: Request, res: Response) {
  if (!req.user) throw new AppError("Authentication required", 401);
  const id = String(req.params.id);
  const existing = await prisma.customLab.findUnique({
    where: { id },
    select: { createdById: true, attachments: true, thumbnailUrl: true },
  });
  if (!existing) throw new AppError("Lab experiment not found", 404);
  if (existing.createdById !== req.user.id) {
    throw new AppError("You can only delete Labs you created", 403);
  }

  await prisma.customLab.delete({ where: { id } });
  const attachmentUrls = Array.isArray(existing.attachments)
    ? existing.attachments.flatMap((attachment) => {
        const result = attachmentSchema.safeParse(attachment);
        return result.success ? [result.data.url] : [];
      })
    : [];
  await removeCourseMediaByUrls([...attachmentUrls, existing.thumbnailUrl]);
  res.status(200).json(success({ id }, "Lab experiment deleted"));
}
