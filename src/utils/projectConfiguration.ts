type UnknownRecord = Record<string, unknown>;

const walkValues = (value: unknown, out: string[]) => {
  if (typeof value === "string") {
    if (value.trim()) out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => walkValues(item, out));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value as UnknownRecord).forEach((item) => walkValues(item, out));
  }
};

const extractBhkValues = (text: string): number[] =>
  Array.from(text.toLowerCase().matchAll(/(\d+)\s*bhk/g)).map((match) => Number(match[1]));

const formatBhkMix = (values: number[]): string => {
  if (values.length === 0) return "";
  if (values.length === 1) return `${values[0]} BHK`;
  if (values.length === 2) return `${values[0]} & ${values[1]} BHK`;
  const head = values.slice(0, -1).join(", ");
  const tail = values[values.length - 1];
  return `${head} & ${tail} BHK`;
};

export function getProjectConfigurationMix(
  project: UnknownRecord,
  dominantConfig?: string | null
): { configurationLabel: string | null; titleLabel: string } {
  const textPool: string[] = [];
  walkValues(project.bhk_config, textPool);
  walkValues(project.unit_mix_summary, textPool);
  walkValues(project.rera_configuration, textPool);
  walkValues(project.rera_config_json, textPool);
  walkValues(project.rera_unit_mix, textPool);
  walkValues(project.floor_plan_images, textPool);
  walkValues(project.unit_configurations, textPool);

  const bhkSet = new Set<number>();
  textPool.forEach((text) => {
    extractBhkValues(text).forEach((value) => {
      if (Number.isFinite(value) && value > 0) bhkSet.add(value);
    });
  });

  const values = Array.from(bhkSet).sort((a, b) => a - b).slice(0, 3);
  if (values.length > 0) {
    const mix = formatBhkMix(values);
    return { configurationLabel: mix, titleLabel: mix };
  }

  const dominant = String(dominantConfig || "").trim();
  if (dominant && /bhk/i.test(dominant)) {
    const normalized = dominant.replace(/\s+/g, " ").trim();
    return { configurationLabel: normalized, titleLabel: normalized };
  }

  return { configurationLabel: null, titleLabel: "Premium" };
}

export function getLifestyleSignals(project: UnknownRecord): string[] {
  const textPool: string[] = [];
  walkValues(project.amenities_json, textPool);
  walkValues(project.project_highlights, textPool);
  walkValues(project.specifications_json, textPool);
  const joined = textPool.join(" ").toLowerCase();

  const signals: string[] = [];
  const addIf = (condition: boolean, label: string) => {
    if (condition && !signals.includes(label)) signals.push(label);
  };

  addIf(/gated|gated community/.test(joined), "Gated community");
  addIf(/clubhouse|club house/.test(joined), "Clubhouse");
  addIf(/open space|landscape|green|garden/.test(joined), "Large open spaces");
  addIf(/igbc|green building|sustainable/.test(joined), "IGBC certified");
  addIf(/family|children|kids/.test(joined), "Family-friendly");
  addIf(/security|24x7|cctv/.test(joined), "24x7 security");

  return signals.slice(0, 6);
}

