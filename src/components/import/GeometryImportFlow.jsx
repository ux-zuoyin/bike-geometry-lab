import { useEffect, useRef, useState } from "react";
import { CheckCircle, ImageSquare, Plus, SpinnerGap, UploadSimple, WarningCircle } from "@phosphor-icons/react";
import { GEOMETRY_IMPORT_FIELDS } from "../../state/geometryImportState.js";

const ACCEPTED_IMAGE_TYPES = ".png,.jpg,.jpeg,image/png,image/jpeg";

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
          <UploadSimple size={30} weight="regular" aria-hidden="true" /><strong>上传车型几何图</strong><span>点击选择或拖入图片</span><small>PNG · JPG · JPEG</small>
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

function ReviewState({ mode, image, draft, errors, onSelectImage, onDraftMetaChange, onSelectSize, onAddSize, onGeometryFieldChange, onConfirm, onReanalyze, onCancel }) {
  const [newSize, setNewSize] = useState("");
  const [submitFeedback, setSubmitFeedback] = useState(null);
  const [errorNavigation, setErrorNavigation] = useState(null);
  const formRef = useRef(null);
  const submitAttemptRef = useRef(0);
  const sizes = Object.keys(draft.sizes);
  const selectedGeometry = draft.sizes[draft.selectedSize] ?? {};
  const parserWarnings = Array.isArray(draft.parserWarnings) ? draft.parserWarnings : [];
  const detectedSizeCount = draft.detectedSizeCount ?? sizes.length;
  const confirmationCount = draft.parserConfirmationCount || parserWarnings.length;
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
    if (!size || draft.sizes[size]) return;
    onAddSize(size);
    setNewSize("");
  };
  const submit = () => {
    const validation = onConfirm();
    if (!validation?.isValid) {
      submitAttemptRef.current += 1;
      setSubmitFeedback({ message: `还有 ${validation?.errorCount ?? 1} 项信息需要修正`, attempt: submitAttemptRef.current });
      setErrorNavigation({ key: validation?.firstErrorKey, attempt: submitAttemptRef.current });
    }
  };
  return (
    <form ref={formRef} className="geometry-import geometry-import--review" noValidate onSubmit={(event) => { event.preventDefault(); submit(); }}>
      <section className="geometry-import__block">
        <div className="geometry-import__state-heading"><div><h3>几何数据确认</h3><span>AI 初步提取结果，请逐项核对</span></div></div>
        <div className={`geometry-import__parser-status${parserWarnings.length ? " needs-confirmation" : " is-complete"}`} role="status">
          <strong>{parserWarnings.length
            ? `检测到 ${detectedSizeCount} 个尺码，其中 ${confirmationCount} 项数据需要确认`
            : `AI 已提取 ${detectedSizeCount} 个尺码，请核对数据后生成车架`}</strong>
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
          <div className="geometry-import__category"><span>车架类型</span><strong>耐力型</strong><small>本阶段仅支持 Endurance</small></div>
        </div>
      </section>
      <section className="geometry-import__block">
        <div className="geometry-import__review-title"><div><h3>已识别尺码</h3><span>AI 可能遗漏尺码，可手动补充</span></div><span>{sizes.length} 个</span></div>
        <div className="geometry-import__sizes" role="group" aria-label="已识别尺码">
          {sizes.map((size) => <button type="button" key={size} className={size === draft.selectedSize ? "is-selected" : ""} aria-pressed={size === draft.selectedSize} onClick={() => onSelectSize(size)}>{size}</button>)}
        </div>
        <div className="geometry-import__add-size"><input data-validation-key="sizes" type="text" inputMode="decimal" value={newSize} aria-label="补充尺码" placeholder="输入尺码，例如 58" aria-invalid={Boolean(errors.sizes)} aria-describedby={errors.sizes ? "geometry-import-sizes-error" : undefined} onChange={(event) => setNewSize(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSize(); } }} /><button type="button" onClick={addSize}><Plus size={16} />补充尺码</button></div>
        {errors.sizes && <p id="geometry-import-sizes-error" className="geometry-import__inline-error" role="alert">{errors.sizes}</p>}
      </section>
      <section className="geometry-import__block">
        <div className="geometry-import__review-title"><h3>关键几何参数</h3><span>{draft.selectedSize} 码</span></div>
        <div className="geometry-import__field-list">
          {GEOMETRY_IMPORT_FIELDS.map((field) => {
            const errorKey = `sizes.${draft.selectedSize}.${field.key}`;
            const error = errors[errorKey];
            const value = selectedGeometry[field.key];
            const errorId = `geometry-import-${draft.selectedSize}-${field.key}-error`;
            return <label key={field.key} className={error ? "has-error" : ""}><span><strong>{field.label}</strong>{!field.required && value == null && <small>未识别</small>}</span><span className="geometry-import__number-input"><input data-validation-key={errorKey} type="number" step={field.unit === "°" ? "0.1" : "1"} value={value ?? ""} placeholder="未识别" aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} onChange={(event) => onGeometryFieldChange(field.key, event.target.value)} /><small>{field.unit}</small></span>{error && <em id={errorId} role="alert">{error}</em>}</label>;
          })}
        </div>
      </section>
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

function ErrorState({ message, image, onSelectImage, onReanalyze, onCancel }) {
  return <div className="geometry-import geometry-import--error"><section className="geometry-import__block"><WarningCircle size={30} weight="regular" aria-hidden="true" /><h3>AI 暂时无法提取这张图片</h3><p>{message}</p><div className="geometry-import__error-actions">{image && onReanalyze && <button type="button" className="geometry-import__secondary" onClick={onReanalyze}>重新识别</button>}<GeometryImagePicker compact label="重新上传图片" onSelectImage={onSelectImage} />{onCancel && <button type="button" className="geometry-import__cancel" onClick={onCancel}>取消</button>}</div></section></div>;
}

export function GeometryImportFlow({ status, mode = "add", image, draft, errors, errorMessage, onSelectImage, onDraftMetaChange, onSelectSize, onAddSize, onGeometryFieldChange, onConfirm, onReanalyze, onCancel }) {
  if (status === "analyzing" && image) return <AnalyzingState image={image} onSelectImage={onSelectImage} onCancel={onCancel} />;
  if (status === "review" && draft) return <ReviewState mode={mode} image={image} draft={draft} errors={errors} onSelectImage={onSelectImage} onDraftMetaChange={onDraftMetaChange} onSelectSize={onSelectSize} onAddSize={onAddSize} onGeometryFieldChange={onGeometryFieldChange} onConfirm={onConfirm} onReanalyze={onReanalyze} onCancel={onCancel} />;
  return <ErrorState message={errorMessage} image={image} onSelectImage={onSelectImage} onReanalyze={onReanalyze} onCancel={onCancel} />;
}
