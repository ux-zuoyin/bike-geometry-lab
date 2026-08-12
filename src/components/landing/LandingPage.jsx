import { useEffect } from "react";
import brandLogo from "../../assets/brand/logo_bai.png";
import landingBikePartsImage from "../../assets/splash/landing-bike-parts.webp";
import DotField from "./DotField";

export const LANDING_TRANSITION_DURATION = 560;

export function LandingPage({ onEnterLab, transitionState = null, onTransitionComplete }) {
  useEffect(() => {
    if (!transitionState || !onTransitionComplete) return undefined;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(
      () => onTransitionComplete(transitionState),
      reduceMotion ? 0 : LANDING_TRANSITION_DURATION,
    );
    return () => window.clearTimeout(timeout);
  }, [onTransitionComplete, transitionState]);

  return (
    <main className={`landing-page${transitionState ? ` landing-page--${transitionState}` : ""}`}>
      <div className="landing-page__wall" aria-hidden="true">
        <img className="landing-page__background" src={landingBikePartsImage} alt="" />
        <div className="landing-page__dot-field">
          <DotField
            dotRadius={1.5}
            dotSpacing={14}
            maxDots={5200}
            bulgeStrength={67}
            glowRadius={0}
            sparkle={false}
            waveAmplitude={0}
            gradientFrom="rgba(255, 255, 255, 0.28)"
            gradientTo="rgba(255, 255, 255, 0.14)"
            glowColor="#05070A"
          />
        </div>
      </div>

      <header className="landing-page__header">
        <img className="landing-page__header-logo" src={brandLogo} alt="Bike Geometry Lab" />
        <span className="landing-page__copyright">©Design By Sardine</span>
      </header>

      <section className="landing-page__hero" aria-labelledby="landing-page-title">
        <div className="landing-page__content-stack">
          <div className="landing-page__copy">
            <p className="landing-page__eyebrow">Understand the bike beneath the ride.</p>
            <h1 id="landing-page-title">理解几何，<br />找到属于你的那辆车</h1>
            <p className="landing-page__description">
              从车架几何、骑行姿态到配置选择，理解一辆车为何适合你。
            </p>
            <button className="landing-page__cta" type="button" onClick={onEnterLab}>
              进入几何实验室 <span aria-hidden="true">→</span>
            </button>
          </div>
          <section className="landing-page__capabilities" aria-label="核心能力">
            <article className="landing-page__capability">
              <span className="landing-page__capability-index">01</span>
              <h2>先感受，再选择</h2>
              <p>耐力、综合、破风三类车架，直观看见不同几何带来的差异。</p>
            </article>
            <article className="landing-page__capability">
              <span className="landing-page__capability-index">02</span>
              <h2>让几何自己说话</h2>
              <p>上传官方 Geometry 图，把复杂参数转成可理解的车架。</p>
            </article>
            <article className="landing-page__capability">
              <span className="landing-page__capability-index">03</span>
              <h2>定义你的那辆车</h2>
              <p>从几何数据开始，手动构建属于自己的车架方案。</p>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
