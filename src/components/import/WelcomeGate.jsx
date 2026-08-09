import { useRef } from "react";
import {
  ArrowRight,
  Bicycle,
  ChartLineUp,
} from "@phosphor-icons/react";

const ACCEPTED_IMAGE_TYPES = ".png,.jpg,.jpeg,image/png,image/jpeg";

export function WelcomeGate({ onUsePreset, onSelectImage }) {
  const inputRef = useRef(null);

  return (
    <section
      className="welcome-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-gate-title"
      aria-describedby="welcome-gate-description"
    >
      <div className="welcome-gate__content">
        <header className="welcome-gate__heading">
          <h1 id="welcome-gate-title">先选一辆车，开始你的几何实验</h1>
          <p id="welcome-gate-description">
            使用预设车型快速体验，或上传官网几何图生成自己的车架。
          </p>
        </header>

        <div className="welcome-gate__choices">
          <button
            type="button"
            className="welcome-choice welcome-choice--primary"
            onClick={onUsePreset}
          >
            <Bicycle size={34} weight="regular" aria-hidden="true" />
            <span className="welcome-choice__eyebrow">使用预设车型体验</span>
            <strong>TREK Domane</strong>
            <small>立即体验几何、骑行设定与配件调整</small>
            <ArrowRight className="welcome-choice__arrow" size={24} weight="regular" aria-hidden="true" />
          </button>

          <input
            ref={inputRef}
            className="geometry-import__file-input"
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            onChange={(event) => {
              const [file] = Array.from(event.target.files ?? []);
              if (file) onSelectImage(file);
            }}
          />
          <button
            type="button"
            className="welcome-choice welcome-choice--secondary"
            onClick={() => inputRef.current?.click()}
          >
            <ChartLineUp size={34} weight="regular" aria-hidden="true" />
            <span className="welcome-choice__eyebrow">上传官网几何图</span>
            <strong>官方车架几何图</strong>
            <small>上传品牌官网 Geometry 图片，读取尺寸与几何数据</small>
            <span className="welcome-choice__formats">PNG · JPG · JPEG</span>
            <ArrowRight className="welcome-choice__arrow" size={24} weight="regular" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
