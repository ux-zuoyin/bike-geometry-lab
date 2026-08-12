import { useRef } from "react";
import {
  ArrowRight,
  Bicycle,
  ChartLineUp,
  PencilSimpleLine,
} from "@phosphor-icons/react";

const ACCEPTED_IMAGE_TYPES = ".png,.jpg,.jpeg,image/png,image/jpeg";

export function WelcomeGate({ onStartPresetExperience, onSelectImage, onManualEntry }) {
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
            使用预设车型快速体验，也可以上传官网几何图或直接手动录入。
          </p>
        </header>

        <div className="welcome-gate__choices">
          <button
            type="button"
            className="welcome-choice welcome-choice--primary"
            onClick={onStartPresetExperience}
          >
            <Bicycle size={34} weight="regular" aria-hidden="true" />
            <span className="welcome-choice__eyebrow">Preset Experience</span>
            <strong>三类车架快速体验</strong>
            <small>体验耐力、综合、破风三种公路车几何与车架结构。</small>
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
            <small>仅支持耐力型 / 综合型 / 破风型公路车官方几何表</small>
            <span className="welcome-choice__formats">PNG · JPG · JPEG</span>
            <ArrowRight className="welcome-choice__arrow" size={24} weight="regular" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="welcome-choice welcome-choice--secondary welcome-choice--manual"
            onClick={onManualEntry}
          >
            <PencilSimpleLine size={34} weight="regular" aria-hidden="true" />
            <span className="welcome-choice__eyebrow">无需上传图片</span>
            <strong>手动录入几何</strong>
            <small>根据官网数据手动填写，适合图片无法识别或只录入特定尺码。</small>
            <ArrowRight className="welcome-choice__arrow" size={24} weight="regular" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
