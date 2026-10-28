import type { Request, Response } from "express";
import { unlink } from "node:fs/promises";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "../../config/db.js";
import { AppError } from "../../utils/app-error.js";
import { success } from "../../utils/api-response.js";
import {
  getCourseMediaUrl,
  isValidGlbFile,
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

const equipmentSchema = z.array(pairedTextSchema).min(1).max(30);
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
  type: z.enum(["IMAGE", "PDF", "VIDEO", "MODEL_3D", "DOCUMENT"]),
  url: z.string().url().max(2000),
});

const activityBase = {
  titleVi: z.string().trim().max(200).default(""),
  titleEn: z.string().trim().max(200).default(""),
  descriptionVi: z.string().trim().max(1000).default(""),
  descriptionEn: z.string().trim().max(1000).default(""),
};
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
  }),
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
  grade: z.enum(["6", "7", "8", "9"]),
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
  createdById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CustomLabSelect;

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
        createdById: req.user.id,
      },
      select: customLabSelect,
    });

    res.status(201).json(success(lab, "Lab experiment created"));
  } catch (error) {
    await Promise.all(uploadedFiles.map((file) => unlink(file.path)));
    throw error;
  }
}
