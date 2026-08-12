import { lazy, Suspense, useEffect, useState } from "react";
import { ColorPalette } from "../ui/ColorPalette.jsx";
import { SegmentedControl } from "../ui/Stepper.jsx";
import { PanelSection } from "./PanelSection.jsx";
import { sortBikeSizes } from "../../lib/geometry/sizeSorting.js";

const GEOMETRY_LANGUAGE_STORAGE_KEY = "bike-geometry-lab:geometry-language";
const lazyNamed = (loader, name) => lazy(() => loader().then((module) => ({ default: module[name] })));
const GeometryImagePicker = lazyNamed(() => import("../import/GeometryImportFlow.jsx"), "GeometryImagePicker");
const GeometryImportFlow = lazyNamed(() => import("../import/GeometryImportFlow.jsx"), "GeometryImportFlow");

const geometryDetails = [
  { key: "seatTubeLengthMm", unit: "mm", zh: "座管长度", en: "Seat Tube" },
  { key: "seatTubeAngleDeg", unit: "°", zh: "座管角", en: "Seat Tube Angle" },
  { key: "headTubeAngleDeg", unit: "°", zh: "头管角", en: "Head Tube Angle" },
  { key: "effectiveTopTubeMm", unit: "mm", zh: "有效上管", en: "Effective Top Tube" },
  { key: "bbDropMm", unit: "mm", zh: "五通下沉", en: "BB Drop" },
  { key: "chainstayMm", unit: "mm", zh: "后下叉长度", en: "Chainstay" },
  { key: "forkOffsetMm", unit: "mm", zh: "前叉偏移", en: "Fork Offset" },
  { key: "trailMm", unit: "mm", zh: "拖曳距", en: "Trail" },
  { key: "standoverMm", unit: "mm", zh: "跨高", en: "Standover" },
];

const displayGeometryValue = (value) => (value == null || value === "" ? "未识别" : value);

const seatStayStyleOptions = Object.freeze([
  { value: "low", label: "低" },
  { value: "mid", label: "中" },
  { value: "high", label: "高" },
]);

function GeometryTaskLauncher({ mode, onSelectImage, onStartManual }) {
  const isManual = mode === "manual";
  return (
    <div className="geometry-import geometry-import--selected geometry-task-launcher">
      <section className="geometry-import__block">
        <div className="geometry-import__state-heading">
          <div>
            <h3>{isManual ? "手动录入几何" : "上传官网几何图"}</h3>
            <span>{isManual
              ? "跳过图片识别，直接填写一个或多个尺码的官网数据。"
              : "选择品牌官网 Geometry 图片，AI 将提取尺码与几何参数。"}</span>
          </div>
        </div>
        {isManual ? (
          <button type="button" className="geometry-import__primary geometry-task-launcher__manual" onClick={onStartManual}>开始手动录入</button>
        ) : (
          <Suspense fallback={<div className="geometry-import__loading" aria-live="polite" />}>
            <GeometryImagePicker onSelectImage={onSelectImage} />
          </Suspense>
        )}
      </section>
    </div>
  );
}

export function FrameGeometryPanel({ bike, setFrameSize, setSeatStayStyle, updateComponentSetup, geometryImport, workspaceTaskMode = null, isStageFullscreen = false }) {
  const sizeData = bike.sizeData;
  const orderedSizes = sortBikeSizes(bike.sizes, { sourceOrder: bike.sizes });
  const isImportReady = geometryImport.status === "ready";
  const isTaskLauncherVisible = isImportReady && workspaceTaskMode != null;
  const isManualImport = geometryImport.mode === "manual" || geometryImport.draft?.entryMode === "manual";
  const [geometryLanguage, setGeometryLanguage] = useState(() => {
    try {
      return window.localStorage.getItem(GEOMETRY_LANGUAGE_STORAGE_KEY) === "en" ? "en" : "zh";
    } catch {
      return "zh";
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(GEOMETRY_LANGUAGE_STORAGE_KEY, geometryLanguage);
    } catch {
      // Storage can be unavailable in privacy-restricted contexts; session state still works.
    }
  }, [geometryLanguage]);

  return (
    <aside className="side-panel frame-panel" aria-label="车架与几何" aria-hidden={isStageFullscreen} inert={isStageFullscreen ? true : undefined}>
      <header className="panel-heading">
        <h2>车架几何</h2>
        <p>{isTaskLauncherVisible
          ? (workspaceTaskMode === "manual" ? "填写官网几何数据，不会调用图片识别。" : "选择官网几何图，识别后逐项核对数据。")
          : isImportReady
          ? `选择车型与尺码。当前使用${bike.sourceLabel}。`
          : (isManualImport ? "填写官网几何数据，缺失的补充参数可留空。" : "请核对 AI 初步提取的车架几何数据。")}</p>
      </header>

      <div className="side-panel__scroll">
        {isTaskLauncherVisible ? (
          <GeometryTaskLauncher
            mode={workspaceTaskMode}
            onSelectImage={geometryImport.onSelectImage}
            onStartManual={geometryImport.onStartManual}
          />
        ) : !isImportReady ? (
          <Suspense fallback={<div className="geometry-import__loading" aria-live="polite" />}>
            <GeometryImportFlow {...geometryImport} />
          </Suspense>
        ) : (
          <>
        <PanelSection
          title="车型"
          className="frame-model-section"
          action={(
            <div className={`model-action-slot${bike.source === "upload" ? " is-visible" : ""}`} aria-hidden={bike.source !== "upload"}>
              <button
                type="button"
                className="panel-quiet-action"
                tabIndex={bike.source === "upload" ? 0 : -1}
                onClick={geometryImport.onEdit}
              >
                修改几何参数
              </button>
            </div>
          )}
        >
          <article className="model-card is-selected" aria-label={`${bike.brand} ${bike.model} ${bike.categoryLabel}，${bike.sizes.length} 个尺码`}>
            <div className="model-card__identity">
              <strong>{bike.brand} {bike.model}</strong>
              <span>{bike.categoryLabel}</span>
            </div>
            <small className="model-card__size-count">{bike.sizes.length} 个尺码</small>
          </article>
        </PanelSection>

        <PanelSection title="尺码" hint={`已选择 · ${bike.size}`} className="frame-size-section">
          <div className="size-selector-area">
            <SegmentedControl className="size-selector-grid" options={orderedSizes} value={bike.size} onChange={setFrameSize} />
          </div>
          <p className="section-note">切换尺码不会改变右侧骑行设定和配件选择。</p>
        </PanelSection>

        <PanelSection title="车架外观">
          {bike.category !== "aero" && (
            <div className="frame-structure-control">
              <SegmentedControl
                label="后上叉连接"
                options={seatStayStyleOptions}
                value={bike.seatStayStyle ?? "mid"}
                onChange={setSeatStayStyle}
              />
            </div>
          )}
          <div className="frame-appearance__palette">
            <ColorPalette
              label="车架颜色"
              value={bike.frameColor}
              onChange={(value) => updateComponentSetup("frameColor", value)}
            />
          </div>
          <div className="frame-appearance__palette">
            <ColorPalette
              label="前叉颜色"
              value={bike.forkColor}
              onChange={(value) => updateComponentSetup("forkColor", value)}
            />
          </div>
        </PanelSection>

        <PanelSection title="几何摘要" hint="核心参数">
          <div className="geometry-grid">
            {[
              ["Stack", sizeData.stackMm],
              ["Reach", sizeData.reachMm],
              ["头管长度", sizeData.headTubeLengthMm],
              ["轴距", sizeData.wheelbaseMm],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <div className="geometry-grid__value">
                  <strong>{displayGeometryValue(value)}</strong>
                  <small aria-hidden={value == null}>{value != null ? "mm" : ""}</small>
                </div>
              </div>
            ))}
          </div>
        </PanelSection>

        <PanelSection
          title="几何详情"
          hint={bike.sourceLabel}
          action={(
            <div className="geometry-language-toggle" role="group" aria-label="几何参数语言">
              <button
                type="button"
                className={geometryLanguage === "zh" ? "is-active" : ""}
                aria-pressed={geometryLanguage === "zh"}
                onClick={() => setGeometryLanguage("zh")}
              >
                中文
              </button>
              <button
                type="button"
                className={geometryLanguage === "en" ? "is-active" : ""}
                aria-pressed={geometryLanguage === "en"}
                onClick={() => setGeometryLanguage("en")}
              >
                EN
              </button>
            </div>
          )}
        >
          <dl className="geometry-detail-list">
            {geometryDetails.map(({ key, unit, ...labels }) => (
              <div key={key} data-geometry-field={key}>
                <dt>{labels[geometryLanguage]}</dt>
                <dd>
                  <strong>{displayGeometryValue(sizeData[key])}</strong>
                  <span aria-hidden={sizeData[key] == null}>{sizeData[key] != null ? unit : ""}</span>
                </dd>
              </div>
            ))}
          </dl>
        </PanelSection>
          </>
        )}
      </div>

      <footer><span className="status-dot" />{isTaskLauncherVisible
        ? (workspaceTaskMode === "manual" ? "手动录入 · 本地 Draft · 不调用 AI" : "上传几何图 · 等待选择图片")
        : isImportReady
        ? `${bike.brand} ${bike.model} · ${bike.sourceLabel} · mm / °`
        : (isManualImport ? "手动录入 · 本地 Draft · 不调用 AI" : "本地图片 · AI 初步提取 · 不上传")}</footer>
    </aside>
  );
}
