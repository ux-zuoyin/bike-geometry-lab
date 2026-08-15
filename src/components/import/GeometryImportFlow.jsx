import { useEffect, useRef, useState } from "react";
import { CheckCircle, ImageSquare, Info, Plus, SpinnerGap, UploadSimple, WarningCircle } from "@phosphor-icons/react";
import { CORE_GEOMETRY_FIELD_KEYS, GEOMETRY_IMPORT_FIELDS, PRECISION_GEOMETRY_IMPORT_FIELDS, getGeometryImportDraftFieldValue, getSelectedImportSizes, MANUAL_GEOMETRY_SIZE_PLACEHOLDER } from "../../state/geometryImportState.js";
import { BIKE_CATEGORIES, getBikeCategoryLabel } from "../../config/bikeArchetypes.js";
import { sortBikeSizes } from "../../lib/geometry/sizeSorting.js";

const ACCEPTED_IMAGE_TYPES = ".png,.jpg,.jpeg,image/png,image/jpeg";

function FrameCategorySelector({ value, error, onChange }) {
  const errorId = "geometry-import-category-error";
  return (
    <div
      className={`geometry-import__category${error ? " has-error" : ""}`}
      data-validation-key="category"
      tabIndex={error ? -1 : undefined}
    >
      <span>车架类型 <b aria-hidden="true">*</b></span>
      <div
        className="geometry-import__category-options"
        role="group"
        aria-label="车架类型"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      >
        {BIKE_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={value === category ? "is-selected" : ""}
            aria-pressed={value === category}
            onClick={() => onChange(category)}
          >
            {getBikeCategoryLabel(category).replace("型", "架")}
          </button>
        ))}
      </div>
      <small>创建后作为车型固定属性，可在修改几何参数中调整。</small>
      {error && <em id={errorId} role="alert">{error}</em>}
    </div>
  );
}

export function GeometryImagePicker({ onSelectImage, compact = false, label = "重新选择" }) {
  const inputRef = useRef(null);
  const submitFiles = (files) => {
    const [file] = Array.from(files ?? []);
    if (file) onSelectImage(file);
  };
  return (
    <>
      <input ref={inputRef} className="geometry-import__file-input" type="file" accept={ACCEPTED_IMAGE_TYPES} onChange={(event) => submitFiles(event.target.files)} />
      {compact ? (
        <button type="button" className="geometry-import__text-button" onClick={() => inputRef.current?.click()}>{label}</button>
      ) : (
        <button type="button" className="geometry-upload-zone" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); submitFiles(event.dataTransfer.files); }}>
          <UploadSimple size={30} weight="regular" aria-hidden="true" /><strong>上传车型几何图</strong><span>当前仅支持公路车官方几何表：耐力型 / 综合型 / 破风型</span><small>点击选择或拖入 · PNG / JPG / JPEG</small>
        </button>
      )}
    </>
  );
}

function ImageSummary({ image, onSelectImage }) {
  return (
    <figure className="geometry-image-preview geometry-image-preview--compact">
      <img src={image.previewUrl} alt="车架几何表缩略图" />
      <figcaption>
        <ImageSquare size={19} weight="regular" aria-hidden="true" />
        <span title={image.fileName}>{image.fileName}</span>
        <GeometryImagePicker compact label="重新选择" onSelectImage={onSelectImage} />
      </figcaption>
    </figure>
  );
}

function AnalyzingState({ image, onSelectImage, onCancel }) {
  return (
    <div className="geometry-import geometry-import--analyzing" aria-live="polite">
      <section className="geometry-import__block">
        <div className="geometry-analyzing__title"><SpinnerGap className="geometry-analyzing__spinner" size={26} weight="bold" aria-hidden="true" /><div><h3>AI 正在初步提取几何数据…</h3><p>结果将在下一步供你核对和修改</p></div></div>
        <ImageSummary image={image} onSelectImage={onSelectImage} />
        <ul className="geometry-analyzing__steps">
          {["识别尺码", "识别 Stack / Reach", "识别车架关键几何参数"].map((step) => <li key={step}><CheckCircle size={17} weight="regular" aria-hidden="true" />{step}</li>)}
        </ul>
        <p className="geometry-import__helper">图片正在通过安全解析服务读取，不会作为车型预设保存。</p>
        {onCancel && <button type="button" className="geometry-import__cancel" onClick={onCancel}>取消</button>}
      </section>
    </div>
  );
}

function GeometryFieldRows({ fields, draft, errors, parserWarnings = [], parserNotices = [], onGeometryFieldChange, showRequired = false }) {
  return (
    <div className="geometry-import__field-list">
      {fields.map((field) => {
        const errorKey = `sizes.${draft.selectedSize}.${field.key}`;
        const parserRangeError = parserWarnings.find((warning) => (
          warning.code === "GEOMETRY_VALUE_OUT_OF_RANGE"
          && warning.size === draft.selectedSize
          && warning.field === field.key
        ));
        const parserRangeNotice = parserNotices.find((warning) => (
          warning.code === "GEOMETRY_VALUE_OUT_OF_RANGE"
          && warning.severity === "warning"
          && warning.size === draft.selectedSize
          && warning.field === field.key
        ));
        const error = errors[errorKey] || (parserRangeError
          ? "识别结果可能发生串列，请核对原图。"
          : null);
        const warning = !error && parserRangeNotice
          ? "数值可能异常，但不会阻止生成；请核对原图。"
          : null;
        const value = getGeometryImportDraftFieldValue(draft, draft.selectedSize, field.key);
        const errorId = `geometry-import-${draft.selectedSize}-${field.key}-error`;
        const warningId = `geometry-import-${draft.selectedSize}-${field.key}-warning`;
        const inputId = `geometry-import-${draft.selectedSize}-${field.key}`;
        const tooltipId = `${inputId}-tooltip`;
        return <div key={field.key} className={`geometry-import__field-row${error ? " has-error" : ""}${warning ? " has-warning" : ""}`}><span className="geometry-import__field-name"><label htmlFor={inputId}><strong>{field.label}{showRequired && field.required && <b aria-hidden="true"> *</b>}</strong><span className="geometry-import__field-translation">{field.reviewLabel}</span>{!field.required && value == null && <small className="geometry-import__missing">未提供</small>}</label>{field.tooltip && <span className="geometry-import__field-tooltip"><button type="button" aria-label={`查看 ${field.label} 术语说明`} aria-describedby={tooltipId}><Info size={14} weight="regular" aria-hidden="true" /></button><span id={tooltipId} role="tooltip">{field.tooltip}</span></span>}</span><span className="geometry-import__number-input"><input id={inputId} data-validation-key={errorKey} type="number" step={field.unit === "°" ? "0.1" : "1"} value={value ?? ""} placeholder="未提供" aria-invalid={Boolean(error)} aria-describedby={error ? errorId : (warning ? warningId : undefined)} onChange={(event) => onGeometryFieldChange(field.key, event.target.value)} /><small>{field.unit}</small></span>{error && <em id={errorId} role="alert">{error}</em>}{warning && <em className="geometry-import__field-warning" id={warningId}>{warning}</em>}</div>;
      })}
    </div>
  );
}

function GeometryReviewSections({ draft, errors, parserWarnings, parserNotices, onGeometryFieldChange, sizeLabel }) {
  const coreFields = CORE_GEOMETRY_FIELD_KEYS.map((key) => (
    GEOMETRY_IMPORT_FIELDS.find((field) => field.key === key)
  ));
  const completeness = draft.geometryCompleteness
    ?? draft.completenessBySize?.[draft.selectedSize]
    ?? { core: { total: 7, available: 0, complete: false }, precision: { total: 6, available: 0 }, renderable: false };
  const missingCoreCount = Math.max(0, completeness.core.total - completeness.core.available);

  return (
    <>
      <section className="geometry-import__block geometry-import__core-section">
        <div className="geometry-import__review-title">
          <div><h3>生成车架所需</h3><span>7 项核心几何决定当前车架的基本结构。</span></div>
          {sizeLabel && <span>{sizeLabel}</span>}
        </div>
        <p className={`geometry-import__core-status${completeness.core.complete ? " is-complete" : " is-incomplete"}`} role="status">
          {completeness.core.complete
            ? <><CheckCircle size={16} weight="fill" aria-hidden="true" />核心几何完整，可以生成车架</>
            : `缺少 ${missingCoreCount} 项生成车架所需参数`}
        </p>
        <GeometryFieldRows fields={coreFields} draft={draft} errors={errors} parserWarnings={parserWarnings} onGeometryFieldChange={onGeometryFieldChange} showRequired />
      </section>
      <section className="geometry-import__block geometry-import__precision-section">
        <details>
          <summary>
            <span><strong>补充几何 · {completeness.precision.available}/{completeness.precision.total}</strong><small>用于提高车架与轮轴位置精度，缺失不会影响生成。</small></span>
          </summary>
          <GeometryFieldRows fields={PRECISION_GEOMETRY_IMPORT_FIELDS} draft={draft} errors={errors} parserNotices={parserNotices} onGeometryFieldChange={onGeometryFieldChange} />
        </details>
      </section>
    </>
  );
}

function ReviewState({ mode, image, draft, errors, onSelectImage, onDraftMetaChange, onSelectSize, onToggleImportSize, onAddSize, onCopySize, onManualSizeChange, onGeometryFieldChange, onConfirm, onReanalyze, onCancel }) {
  const [newSize, setNewSize] = useState("");
  const [submitFeedback, setSubmitFeedback] = useState(null);
  const [sizeSelectionHint, setSizeSelectionHint] = useState(null);
  const [errorNavigation, setErrorNavigation] = useState(null);
  const formRef = useRef(null);
  const submitAttemptRef = useRef(0);
  const sizes = getSelectedImportSizes(draft).filter((size) => draft.sizes[String(size)]);
  const candidateSizeSource = [...new Set([
    ...(draft.detectedSizes ?? []).map(String),
    ...Object.keys(draft.candidateSizes ?? draft.sizes),
  ])];
  const candidateSizes = sortBikeSizes(candidateSizeSource, { sourceOrder: candidateSizeSource });
  const parserWarnings = Array.isArray(draft.parserWarnings) ? draft.parserWarnings : [];
  const parserNotices = Array.isArray(draft.parserNotices) ? draft.parserNotices : [];
  const detectedSizeCount = draft.detectedSizeCount ?? sizes.length;
  const confirmationCount = draft.parserConfirmationCount || parserWarnings.length;
  const isManual = mode === "manual" || draft.entryMode === "manual";
  const manualSizeName = draft.selectedSize === MANUAL_GEOMETRY_SIZE_PLACEHOLDER ? "" : draft.selectedSize;
  useEffect(() => {
    if (!errorNavigation?.key) return;
    const target = formRef.current?.querySelector(`[data-validation-key="${errorNavigation.key}"]`);
    if (!target) return;
    const scrollContainer = formRef.current.closest(".side-panel__scroll");
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const stickyFooter = formRef.current.querySelector(".geometry-import__review-actions");
      const stickyHeight = stickyFooter?.getBoundingClientRect().height ?? 0;
      const targetTop = scrollContainer.scrollTop + targetRect.top - containerRect.top;
      const visibleHeight = Math.max(0, scrollContainer.clientHeight - stickyHeight);
      scrollContainer.scrollTo({
        top: Math.max(0, targetTop - Math.max(24, (visibleHeight - targetRect.height) / 2)),
        behavior: "smooth",
      });
    } else {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    target.focus({ preventScroll: true });
  }, [errorNavigation, draft.selectedSize]);
  useEffect(() => {
    if (!submitFeedback) return undefined;
    const timer = window.setTimeout(() => setSubmitFeedback(null), 2800);
    return () => window.clearTimeout(timer);
  }, [submitFeedback]);
  const addSize = () => {
    const size = newSize.trim();
    if (!size || draft.candidateSizes?.[size]) return;
    onAddSize(size);
    setNewSize("");
  };
  const copySize = () => {
    const size = newSize.trim();
    if (!size || draft.candidateSizes?.[size]) return;
    onCopySize(size);
    setNewSize("");
  };
  const toggleCandidateSize = (size) => {
    if (sizes.includes(size) && sizes.length === 1) {
      setSizeSelectionHint("至少保留一个尺码");
      return;
    }
    setSizeSelectionHint(null);
    onToggleImportSize(size);
  };
  const submit = () => {
    const validation = onConfirm();
    if (!validation?.isValid) {
      submitAttemptRef.current += 1;
      setSubmitFeedback({ message: `还有 ${validation?.errorCount ?? 1} 项必填信息需要补充`, attempt: submitAttemptRef.current });
      setErrorNavigation({ key: validation?.firstErrorKey, attempt: submitAttemptRef.current });
    }
  };
  if (isManual) {
    return (
      <form ref={formRef} className="geometry-import geometry-import--review geometry-import--manual" noValidate onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <section className="geometry-import__block">
          <div className="geometry-import__state-heading"><div><h3>基础信息</h3><span>手动录入官网数据，不会调用图片识别</span></div></div>
          <div className="geometry-import__identity-fields">
            <label><span>品牌名称</span><input data-validation-key="brand" type="text" value={draft.brand} placeholder="例如 Specialized" aria-invalid={Boolean(errors.brand)} aria-describedby={errors.brand ? "geometry-import-brand-error" : undefined} onChange={(event) => onDraftMetaChange("brand", event.target.value)} />{errors.brand && <small id="geometry-import-brand-error" role="alert">{errors.brand}</small>}</label>
            <label><span>车型名称 <small>选填</small></span><input type="text" value={draft.model} placeholder="未命名车型" onChange={(event) => onDraftMetaChange("model", event.target.value)} /></label>
            <FrameCategorySelector value={draft.category} error={errors.category} onChange={(category) => onDraftMetaChange("category", category)} />
            <label><span>尺码名称</span><input data-validation-key="sizes" type="text" value={manualSizeName} placeholder="例如 54、430、S" aria-invalid={Boolean(errors.sizes)} aria-describedby={errors.sizes ? "geometry-import-sizes-error" : undefined} onChange={(event) => onManualSizeChange(event.target.value)} />{errors.sizes && <small id="geometry-import-sizes-error" role="alert">{errors.sizes}</small>}</label>
          </div>
          {sizes.length > 1 && <div className="geometry-import__selected-sizes size-selector-grid" role="group" aria-label="当前录入尺码">{sizes.map((size) => <button type="button" key={size} className={size === draft.selectedSize ? "is-selected" : ""} aria-pressed={size === draft.selectedSize} title={size} onClick={() => onSelectSize(size)}>{size === MANUAL_GEOMETRY_SIZE_PLACEHOLDER ? "待填写" : size}</button>)}</div>}
          <div className="geometry-import__manual-size-actions">
            <input type="text" value={newSize} aria-label="新尺码名称" placeholder="新增尺码名称" onChange={(event) => setNewSize(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSize(); } }} />
            <button type="button" onClick={addSize}><Plus size={16} />添加尺码</button>
            <button type="button" onClick={copySize}>复制当前尺码参数</button>
          </div>
        </section>
        <GeometryReviewSections
          draft={draft}
          errors={errors}
          parserWarnings={[]}
          parserNotices={[]}
          onGeometryFieldChange={onGeometryFieldChange}
          sizeLabel={manualSizeName || "待填写尺码"}
        />
        <div className="geometry-import__review-actions">
          {submitFeedback && <p className="geometry-import__submit-feedback" role="status" aria-live="polite">{submitFeedback.message}</p>}
          <div className="geometry-import__review-buttons">
            {onCancel && <button type="button" className="geometry-import__cancel" onClick={onCancel}>取消</button>}
            <button type="submit" className="geometry-import__primary">确认生成车架</button>
          </div>
        </div>
      </form>
    );
  }
  return (
    <form ref={formRef} className="geometry-import geometry-import--review" noValidate onSubmit={(event) => { event.preventDefault(); submit(); }}>
      <section className="geometry-import__block">
        <div className="geometry-import__state-heading"><div><h3>几何数据确认</h3><span>AI 初步提取结果，请逐项核对</span></div></div>
        <div className={`geometry-import__parser-status${parserWarnings.length ? " needs-confirmation" : " is-complete"}`} role="status">
          <strong>{parserWarnings.length
            ? `检测到 ${detectedSizeCount} 个尺码，其中 ${confirmationCount} 项数据需要确认`
            : `AI 已提取生成车架所需的 ${draft.completenessBySize?.[draft.selectedSize]?.core.total ?? 7} 项核心几何`}</strong>
          {parserWarnings.length > 0 && (
            <ul>
              {parserWarnings.map((warning, index) => <li key={`${warning.code}-${warning.field ?? "all"}-${warning.size ?? "all"}-${index}`}>{warning.message}</li>)}
            </ul>
          )}
        </div>
        {image && <ImageSummary image={image} onSelectImage={onSelectImage} />}
        <div className="geometry-import__identity-fields">
          <label><span>品牌名称</span><input data-validation-key="brand" type="text" value={draft.brand} placeholder="例如 TREK" aria-invalid={Boolean(errors.brand)} aria-describedby={errors.brand ? "geometry-import-brand-error" : undefined} onChange={(event) => onDraftMetaChange("brand", event.target.value)} />{errors.brand && <small id="geometry-import-brand-error" role="alert">{errors.brand}</small>}</label>
          <label><span>车型名称 <small>选填</small></span><input type="text" value={draft.model} placeholder="未命名车型" onChange={(event) => onDraftMetaChange("model", event.target.value)} /></label>
          <FrameCategorySelector value={draft.category} error={errors.category} onChange={(category) => onDraftMetaChange("category", category)} />
        </div>
      </section>
      <section className="geometry-import__block">
        <div className="geometry-import__review-title"><div><h3>你想导入哪些尺码？</h3><span>默认全部导入，可取消不需要的尺码</span></div><span>已选 {sizes.length} 个</span></div>
        <div className="geometry-import__candidate-sizes size-selector-grid" role="group" aria-label="可导入尺码">
          {candidateSizes.map((size) => <button type="button" key={size} className={sizes.includes(size) ? "is-selected" : ""} aria-pressed={sizes.includes(size)} title={size} onClick={() => toggleCandidateSize(size)}>{size}</button>)}
        </div>
        {sizeSelectionHint && <p className="geometry-import__selection-hint" role="status" aria-live="polite">{sizeSelectionHint}</p>}
        {sizes.length > 1 && <div className="geometry-import__selected-sizes size-selector-grid" role="group" aria-label="当前校对尺码">{sizes.map((size) => <button type="button" key={size} className={size === draft.selectedSize ? "is-selected" : ""} aria-pressed={size === draft.selectedSize} title={size} onClick={() => onSelectSize(size)}>{size}</button>)}</div>}
        <div className="geometry-import__add-size"><input data-validation-key="sizes" type="text" inputMode="decimal" value={newSize} aria-label="补充尺码" placeholder="输入尺码，例如 58" aria-invalid={Boolean(errors.sizes)} aria-describedby={errors.sizes ? "geometry-import-sizes-error" : undefined} onChange={(event) => setNewSize(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSize(); } }} /><button type="button" onClick={addSize}><Plus size={16} />补充尺码</button></div>
        {errors.sizes && <p id="geometry-import-sizes-error" className="geometry-import__inline-error" role="alert">{errors.sizes}</p>}
      </section>
      <GeometryReviewSections
        draft={draft}
        errors={errors}
        parserWarnings={parserWarnings}
        parserNotices={parserNotices}
        onGeometryFieldChange={onGeometryFieldChange}
        sizeLabel={`${draft.selectedSize} 码`}
      />
      <div className="geometry-import__review-actions">
        {submitFeedback && <p className="geometry-import__submit-feedback" role="status" aria-live="polite">{submitFeedback.message}</p>}
        {mode === "edit" && image?.file && <button type="button" className="geometry-import__secondary" onClick={onReanalyze}>重新识别原图</button>}
        <div className="geometry-import__review-buttons">
          {onCancel && <button type="button" className="geometry-import__cancel" onClick={onCancel}>取消</button>}
          <button type="submit" className="geometry-import__primary">{mode === "edit" ? "保存修改" : "确认生成车架"}</button>
        </div>
      </div>
    </form>
  );
}

const INPUT_ERROR_PRESENTATIONS = Object.freeze({
  NOT_GEOMETRY_IMAGE: {
    title: "这似乎不是车架几何图",
    message: "当前仅支持公路车官方 Geometry / 几何数据表，请上传包含尺码、Stack、Reach 等参数的图片。",
    canReanalyze: false,
  },
  UNSUPPORTED_BIKE_TYPE: {
    title: "当前暂不支持这种车型",
    message: "Bike Geometry Lab 目前仅支持耐力型、综合型和破风型公路车几何。",
    canReanalyze: false,
  },
  GEOMETRY_IMAGE_UNREADABLE: {
    title: "暂时无法读取这张几何图",
    message: "请尝试上传更清晰、完整的官网几何表，避免裁切掉尺码或参数区域。",
    canReanalyze: true,
  },
});

function ErrorState({ code, message, image, onSelectImage, onReanalyze, onCancel }) {
  const presentation = INPUT_ERROR_PRESENTATIONS[code] ?? {
    title: "AI 暂时无法提取这张图片",
    message,
    canReanalyze: true,
  };
  return <div className="geometry-import geometry-import--error"><section className="geometry-import__block"><WarningCircle size={30} weight="regular" aria-hidden="true" /><h3>{presentation.title}</h3><p>{presentation.message}</p><div className="geometry-import__error-actions">{presentation.canReanalyze && image && onReanalyze && <button type="button" className="geometry-import__secondary" onClick={onReanalyze}>重新识别</button>}<GeometryImagePicker compact label="重新上传图片" onSelectImage={onSelectImage} />{onCancel && <button type="button" className="geometry-import__cancel" onClick={onCancel}>取消</button>}</div></section></div>;
}

export function GeometryImportFlow({ status, mode = "add", image, draft, errors, errorCode, errorMessage, onSelectImage, onDraftMetaChange, onSelectSize, onToggleImportSize, onAddSize, onCopySize, onManualSizeChange, onGeometryFieldChange, onConfirm, onReanalyze, onCancel }) {
  if (status === "analyzing" && image) return <AnalyzingState image={image} onSelectImage={onSelectImage} onCancel={onCancel} />;
  if (status === "review" && draft) return <ReviewState mode={mode} image={image} draft={draft} errors={errors} onSelectImage={onSelectImage} onDraftMetaChange={onDraftMetaChange} onSelectSize={onSelectSize} onToggleImportSize={onToggleImportSize} onAddSize={onAddSize} onCopySize={onCopySize} onManualSizeChange={onManualSizeChange} onGeometryFieldChange={onGeometryFieldChange} onConfirm={onConfirm} onReanalyze={onReanalyze} onCancel={onCancel} />;
  return <ErrorState code={errorCode} message={errorMessage} image={image} onSelectImage={onSelectImage} onReanalyze={onReanalyze} onCancel={onCancel} />;
}
