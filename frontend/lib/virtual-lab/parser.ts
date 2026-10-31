import type {
  BilingualText,
  CustomLabActivity,
  VirtualLabDomain,
  VirtualLabOutput,
  VirtualLabSimulationTemplate,
  VirtualLabTemplate,
  VirtualLabParameter,
} from "@/types/custom-lab";
import { validateLabFormula, LAB_FORMULA_RESERVED_IDENTIFIERS } from "@/lib/lab-formula";
import type {
  VirtualLabComponentDefinition,
  VirtualLabDragDropDefinition,
  VirtualLabSimulationDefinition,
} from "./types";

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function requiredString(value: unknown, path: string, maxLength = 200): string {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new Error(`${path} phải là chuỗi không rỗng (tối đa ${maxLength} ký tự).`);
  }
  return value.trim();
}

function optionalString(value: unknown, path: string, maxLength = 40): string {
  if (value === undefined) return "";
  if (typeof value !== "string" || value.length > maxLength) {
    throw new Error(`${path} không đúng định dạng.`);
  }
  return value.trim();
}

function finiteNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${path} phải là số hữu hạn.`);
  }
  return value;
}

function parseBilingual(value: unknown, path: string): BilingualText {
  if (!isRecord(value)) throw new Error(`${path} phải có vi và en.`);
  return {
    vi: requiredString(value.vi, `${path}.vi`, 2000),
    en: requiredString(value.en, `${path}.en`, 2000),
  };
}

function parseAnimation(value: unknown): NonNullable<CustomLabActivity["animation"]> {
  if (!isRecord(value)) throw new Error("animation phải là một đối tượng cấu hình.");
  const entrance = value.entrance ?? "fade";
  if (!["fade", "rise", "pop", "none"].includes(String(entrance))) {
    throw new Error("animation.entrance phải là fade, rise, pop hoặc none.");
  }
  const durationMs = value.durationMs ?? 250;
  const delayMs = value.delayMs ?? 0;
  if (typeof durationMs !== "number" || !Number.isInteger(durationMs) || durationMs < 0 || durationMs > 2000) {
    throw new Error("animation.durationMs phải là số nguyên từ 0 đến 2000.");
  }
  if (typeof delayMs !== "number" || !Number.isInteger(delayMs) || delayMs < 0 || delayMs > 1000) {
    throw new Error("animation.delayMs phải là số nguyên từ 0 đến 1000.");
  }
  return { entrance: entrance as "fade" | "rise" | "pop" | "none", durationMs, delayMs };
}

function parseOption(value: unknown, path: string) {
  if (!isRecord(value)) throw new Error(`${path} không hợp lệ.`);
  return {
    id: requiredString(value.id, `${path}.id`, 40),
    vi: requiredString(value.vi, `${path}.vi`, 200),
    en: requiredString(value.en, `${path}.en`, 200),
  };
}

function parseImageUrl(value: unknown): string {
  const imageUrl = requiredString(value, "imageUrl", 2000);
  if (imageUrl.startsWith("/") && !imageUrl.startsWith("//")) return imageUrl;
  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    throw new Error("imageUrl phải là đường dẫn nội bộ hoặc URL HTTPS.");
  }
  if (url.protocol !== "https:") throw new Error("Ảnh ngoài phải dùng HTTPS.");
  return url.toString();
}

function parseParameter(value: unknown, index: number): VirtualLabParameter {
  const path = `parameters[${index}]`;
  if (!isRecord(value)) throw new Error(`${path} không hợp lệ.`);
  const id = requiredString(value.id, `${path}.id`, 40);
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(id) || LAB_FORMULA_RESERVED_IDENTIFIERS.has(id)) {
    throw new Error(`${path}.id không phải tên biến hợp lệ.`);
  }
  const min = finiteNumber(value.min, `${path}.min`);
  const max = finiteNumber(value.max, `${path}.max`);
  const step = finiteNumber(value.step, `${path}.step`);
  const initialValue = finiteNumber(value.initialValue, `${path}.initialValue`);
  if (max <= min || step <= 0 || initialValue < min || initialValue > max) {
    throw new Error(`${path} cần max > min, step > 0 và initialValue trong khoảng.`);
  }
  return {
    id,
    labelVi: requiredString(value.labelVi, `${path}.labelVi`, 100),
    labelEn: requiredString(value.labelEn, `${path}.labelEn`, 100),
    unitVi: optionalString(value.unitVi, `${path}.unitVi`),
    unitEn: optionalString(value.unitEn, `${path}.unitEn`),
    min,
    max,
    step,
    initialValue,
  };
}

function parseOutput(value: unknown, index: number): VirtualLabOutput {
  const path = `outputs[${index}]`;
  if (!isRecord(value)) throw new Error(`${path} không hợp lệ.`);
  const id = requiredString(value.id, `${path}.id`, 40);
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(id) || LAB_FORMULA_RESERVED_IDENTIFIERS.has(id)) {
    throw new Error(`${path}.id không phải tên kết quả hợp lệ.`);
  }
  const formula = requiredString(value.formula, `${path}.formula`, 200);
  return {
    id,
    labelVi: requiredString(value.labelVi, `${path}.labelVi`, 100),
    labelEn: requiredString(value.labelEn, `${path}.labelEn`, 100),
    unitVi: optionalString(value.unitVi, `${path}.unitVi`),
    unitEn: optionalString(value.unitEn, `${path}.unitEn`),
    formula,
  };
}

function parseSimulationDefinition(value: JsonRecord): VirtualLabSimulationDefinition {
  const domains: VirtualLabDomain[] = ["science", "electricity", "mechanics", "fluids", "thermal"];
  const domain = value.domain ?? "mechanics";
  if (typeof domain !== "string" || !domains.includes(domain as VirtualLabDomain)) {
    throw new Error("domain phải là science, electricity, mechanics, fluids hoặc thermal.");
  }
  if (!Array.isArray(value.parameters) || value.parameters.length < 1 || value.parameters.length > 12) {
    throw new Error("Cấu hình cần từ 1 đến 12 parameters.");
  }
  if (!Array.isArray(value.outputs) || value.outputs.length < 1 || value.outputs.length > 12) {
    throw new Error("Cấu hình cần từ 1 đến 12 outputs.");
  }
  const parameters = value.parameters.map(parseParameter);
  const outputs = value.outputs.map(parseOutput);
  const parameterIds = parameters.map(({ id }) => id);
  const outputIds = outputs.map(({ id }) => id);
  if (new Set(parameterIds).size !== parameterIds.length || new Set(outputIds).size !== outputIds.length) {
    throw new Error("ID của parameters và outputs phải duy nhất.");
  }
  if (outputIds.some((id) => parameterIds.includes(id))) {
    throw new Error("ID output không được trùng ID parameter.");
  }
  outputs.forEach((output) => {
    const error = validateLabFormula(output.formula, parameterIds);
    if (error) throw new Error(`${output.id}: ${error}`);
  });

  const defaultComponents: VirtualLabComponentDefinition[] = [
    ...parameters.map(({ id }) => ({ id: `control-${id}`, type: "parameter-slider" as const, parameterId: id })),
    ...outputs.map(({ id }) => ({ id: `result-${id}`, type: "numeric-output" as const, outputId: id })),
  ];
  const components = value.components === undefined ? defaultComponents : value.components;
  if (!Array.isArray(components) || components.length > 24) {
    throw new Error("components phải là một danh sách tối đa 24 thành phần.");
  }
  const parsedComponents = components.map((component, index): VirtualLabComponentDefinition => {
    if (!isRecord(component)) throw new Error(`components[${index}] không hợp lệ.`);
    const id = requiredString(component.id, `components[${index}].id`, 80);
    if (component.type === "parameter-slider" && typeof component.parameterId === "string" && parameterIds.includes(component.parameterId)) {
      return { id, type: component.type, parameterId: component.parameterId };
    }
    if (component.type === "numeric-output" && typeof component.outputId === "string" && outputIds.includes(component.outputId)) {
      return { id, type: component.type, outputId: component.outputId };
    }
    throw new Error(`components[${index}] tham chiếu biến/kết quả không hợp lệ.`);
  });
  if (new Set(parsedComponents.map(({ id }) => id)).size !== parsedComponents.length) {
    throw new Error("ID của components phải duy nhất.");
  }

  return {
    schemaVersion: 1,
    type: "simulation",
    domain: domain as VirtualLabDomain,
    title: { vi: requiredString(value.titleVi ?? "Mô phỏng tương tác", "titleVi"), en: requiredString(value.titleEn ?? "Interactive simulation", "titleEn") },
    description: { vi: optionalString(value.descriptionVi, "descriptionVi", 1000), en: optionalString(value.descriptionEn, "descriptionEn", 1000) },
    parameters,
    outputs,
    components: parsedComponents,
  };
}

function parseDragDropDefinition(value: JsonRecord): VirtualLabDragDropDefinition {
  if (!Array.isArray(value.items) || value.items.length < 2 || value.items.length > 20) {
    throw new Error("Kéo thả cần từ 2 đến 20 items.");
  }
  if (!Array.isArray(value.targets) || value.targets.length < 2 || value.targets.length > 20) {
    throw new Error("Kéo thả cần từ 2 đến 20 targets.");
  }
  const items = value.items.map((item, index) => parseOption(item, `items[${index}]`));
  const targets = value.targets.map((item, index) => parseOption(item, `targets[${index}]`));
  const itemIds = items.map(({ id }) => id);
  const targetIds = targets.map(({ id }) => id);
  if (new Set(itemIds).size !== itemIds.length || new Set(targetIds).size !== targetIds.length) {
    throw new Error("ID của items và targets phải duy nhất.");
  }
  if (!isRecord(value.correctMatches) || Object.keys(value.correctMatches).length !== itemIds.length) {
    throw new Error("correctMatches cần xác định đích cho từng item.");
  }
  const correctMatches: Record<string, string> = {};
  for (const [itemId, targetId] of Object.entries(value.correctMatches)) {
    if (!itemIds.includes(itemId) || typeof targetId !== "string" || !targetIds.includes(targetId)) {
      throw new Error("correctMatches tham chiếu item/target không tồn tại.");
    }
    correctMatches[itemId] = targetId;
  }
  return {
    schemaVersion: 1,
    type: "drag-drop",
    title: parseBilingual({ vi: value.titleVi, en: value.titleEn }, "title"),
    instructions: parseBilingual(value.instructions, "instructions"),
    items,
    targets,
    correctMatches,
  };
}

export function parseVirtualLabActivityJson(json: string): CustomLabActivity {
  let raw: unknown;
  try {
    raw = JSON.parse(json) as unknown;
  } catch {
    throw new Error("Cấu hình Lab phải là JSON hợp lệ.");
  }
  if (!isRecord(raw)) throw new Error("Cấu hình Lab phải là một đối tượng JSON.");
  if (raw.schemaVersion !== undefined && raw.schemaVersion !== 1) {
    throw new Error("schemaVersion hiện chỉ hỗ trợ phiên bản 1.");
  }
  const base = {
    ...(raw.schemaVersion === 1 ? { schemaVersion: 1 as const } : {}),
    ...(raw.animation === undefined ? {} : { animation: parseAnimation(raw.animation) }),
    titleVi: typeof raw.titleVi === "string" ? raw.titleVi : "",
    titleEn: typeof raw.titleEn === "string" ? raw.titleEn : "",
    descriptionVi: typeof raw.descriptionVi === "string" ? raw.descriptionVi : "",
    descriptionEn: typeof raw.descriptionEn === "string" ? raw.descriptionEn : "",
  };
  if (raw.type === "simulation") {
    const definition = parseSimulationDefinition(raw);
    const simulationTemplates: VirtualLabTemplate[] = [
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
    ];
    const template = raw.template;
    if (template !== undefined && (typeof template !== "string" || !simulationTemplates.includes(template as VirtualLabTemplate))) {
      throw new Error("template không thuộc danh sách mô phỏng Khoa học/Vật lý được hỗ trợ.");
    }
    if (template && ["solar-system", "water-cycle", "food-chain", "human-body", "plant-structure"].includes(template) && definition.domain !== "science") {
      throw new Error(`Mẫu ${template} cần domain là science.`);
    }
    if (template && ["ohm-law", "series-circuit", "parallel-circuit"].includes(template) && definition.domain !== "electricity") {
      throw new Error(`Mẫu ${template} cần domain là electricity.`);
    }
    if (template && ["archimedes", "density"].includes(template) && definition.domain !== "fluids") {
      throw new Error(`Mẫu ${template} cần domain là fluids.`);
    }
    if (template && ["lever", "pulley", "spring"].includes(template) && definition.domain !== "mechanics") {
      throw new Error(`Mẫu ${template} cần domain là mechanics.`);
    }
    if (template === "pressure" && !["fluids", "mechanics"].includes(definition.domain)) {
      throw new Error("Mẫu pressure cần domain là fluids hoặc mechanics.");
    }
    return {
      ...base,
      type: "simulation",
      domain: definition.domain,
      ...(template ? { template: template as VirtualLabSimulationTemplate } : {}),
      parameters: definition.parameters,
      outputs: definition.outputs,
      components: definition.components,
    };
  }
  if (raw.type === "template" && (raw.template === "drag-drop" || raw.template === "matching")) {
    const definition = parseDragDropDefinition(raw);
    return {
      ...base,
      type: "template",
      template: raw.template,
      instructions: definition.instructions,
      items: definition.items,
      targets: definition.targets,
      correctMatches: definition.correctMatches,
    };
  }
  if (raw.type === "template" && (raw.template === "labeling" || raw.template === "diagram")) {
    const template = raw.template;
    const imageUrl = parseImageUrl(raw.imageUrl);
    if (!Array.isArray(raw.labels) || raw.labels.length < 1 || raw.labels.length > 30) {
      throw new Error("labels cần từ 1 đến 30 mục.");
    }
    const labels = raw.labels.map((label, index) => {
      if (!isRecord(label)) throw new Error(`labels[${index}] không hợp lệ.`);
      const x = finiteNumber(label.x, `labels[${index}].x`);
      const y = finiteNumber(label.y, `labels[${index}].y`);
      if (x < 0 || x > 100 || y < 0 || y > 100) {
        throw new Error(`Tọa độ labels[${index}] phải trong khoảng 0-100.`);
      }
      return { ...parseOption(label, `labels[${index}]`), x, y };
    });
    if (template === "labeling") {
      return {
        ...base,
        type: "template",
        template: "labeling",
        imageUrl,
        labels,
        instructions: parseBilingual(raw.instructions, "instructions"),
      };
    }
    return { ...base, type: "template", template: "diagram", imageUrl, labels };
  }
  if (raw.type === "template" && raw.template === "timeline") {
    if (!Array.isArray(raw.events) || raw.events.length < 2 || raw.events.length > 30) {
      throw new Error("timeline cần từ 2 đến 30 events.");
    }
    const events = raw.events.map((event, index) => {
      if (!isRecord(event)) throw new Error(`events[${index}] không hợp lệ.`);
      return {
        id: requiredString(event.id, `events[${index}].id`, 40),
        date: requiredString(event.date, `events[${index}].date`, 40),
        title: parseBilingual(event.title, `events[${index}].title`),
        description: parseBilingual(event.description, `events[${index}].description`),
      };
    });
    if (new Set(events.map(({ id }) => id)).size !== events.length) {
      throw new Error("ID của timeline events phải duy nhất.");
    }
    return { ...base, type: "template", template: "timeline", events };
  }
  if (raw.type === "template" && raw.template === "image-quiz") {
    if (!Array.isArray(raw.options) || raw.options.length < 2 || raw.options.length > 6) {
      throw new Error("image-quiz cần từ 2 đến 6 đáp án.");
    }
    const options = raw.options.map((option, index) => parseOption(option, `options[${index}]`));
    const correctIndex = finiteNumber(raw.correctIndex, "correctIndex");
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      throw new Error("correctIndex không khớp với danh sách đáp án.");
    }
    return {
      ...base,
      type: "template",
      template: "image-quiz",
      imageUrl: parseImageUrl(raw.imageUrl),
      question: parseBilingual(raw.question, "question"),
      options,
      correctIndex,
      explanation: parseBilingual(raw.explanation, "explanation"),
    };
  }
  if (raw.type === "external") {
    if ((raw.provider !== "phet" && raw.provider !== "geogebra") || typeof raw.url !== "string") {
      throw new Error("Cấu hình external cần provider và url hợp lệ.");
    }
    let url: URL;
    try {
      url = new URL(raw.url);
    } catch {
      throw new Error("URL mô phỏng bên ngoài không hợp lệ.");
    }
    const hostname = url.hostname.toLowerCase();
    const isPhet = ["phet.colorado.edu", "phet.colorado.org"].includes(hostname);
    const isGeoGebra = ["geogebra.org", "www.geogebra.org"].includes(hostname);
    if (url.protocol !== "https:" || (raw.provider === "phet" ? !isPhet : !isGeoGebra)) {
      throw new Error("Chỉ chấp nhận URL HTTPS chính thức khớp với nhà cung cấp.");
    }
    return { ...base, type: "external", provider: raw.provider, url: url.toString() };
  }
  throw new Error("type phải là simulation, template hoặc external.");
}
