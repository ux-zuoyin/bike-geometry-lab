import { useEffect, useRef, useState } from "react";
import brandLogo from "../../assets/brand/logo_bai.png";
import landingBikePartsImage from "../../assets/splash/landing-bike-parts.webp";
import DotField from "./DotField";

export const LANDING_TRANSITION_DURATION = 560;

export function DeveloperAboutModal({ isOpen, onClose, returnFocusRef }) {
  const developerCloseRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    window.requestAnimationFrame(() => developerCloseRef.current?.focus());

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      returnFocusRef?.current?.focus();
    };
  }, [isOpen, onClose, returnFocusRef]);

  if (!isOpen) return null;

  return (
    <div
      className="landing-developer-about-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="landing-developer-about"
        role="dialog"
        aria-modal="true"
        aria-labelledby="landing-developer-about-title"
        aria-describedby="landing-developer-about-story"
      >
        <button
          ref={developerCloseRef}
          className="landing-developer-about__close"
          type="button"
          aria-label="关闭开发者介绍"
          onClick={onClose}
        >
          ×
        </button>

        <p className="landing-developer-about__eyebrow">SARDINE / DEVELOPER</p>
        <h2 id="landing-developer-about-title">关于这个小破站</h2>
        <p className="landing-developer-about__identity"><strong>Sardine / 沙丁鱼</strong>上海骑友 · UX 设计狗 · Bike Geometry Lab 野生开发者</p>

        <div id="landing-developer-about-story" className="landing-developer-about__story">
          <p>第一次认真买公路车的时候，我其实也和很多刚入坑的骑友一样。</p>
          <p>看官网车图、看尺码推荐、看各种参数，觉得：<strong>“应该差不多吧。”</strong></p>
          <p>直到后来发现，耐力架官图里的 STS 视觉，和一辆车真正落到自己身上的几何感受，完全不是一回事。</p>
          <p>车买回来以后才逐渐意识到：Stack、Reach、头管长度、座管角度、把立、垫圈……那些以前看起来很抽象的数字，最后都会真实地变成：<strong>我到底趴不趴得下去、车到底大不大、姿态到底顺不顺眼。</strong></p>
          <p>痛定思痛，久久不能忘怀。</p>
          <p>于是干脆自己折腾了这个：<strong>Bike Geometry Lab</strong></p>
          <p>想把那些官网里密密麻麻、看起来很工程的数据，变成一辆：</p>
          <ul>
            <li>能直接看到</li>
            <li>能切换尺码</li>
            <li>能比较车型</li>
            <li>能调整骑行设定</li>
            <li>还能换换轮组和配件</li>
          </ul>
          <p>的车。</p>
          <p>它不是专业 Bike Fitting 软件，也不打算替你决定：<strong>“你就应该买这个尺码。”</strong></p>
          <p>我更希望做的是：</p>
          <blockquote>把车架几何摊开给你看。</blockquote>
          <p>让那些 <code>Stack / Reach / Wheelbase / Head Tube / Seat Tube</code> 不再只是一串数字。</p>
          <p>最后还是由你自己判断：<strong>哪辆车更接近你真正想骑的样子。</strong></p>
          <p>如果这个小工具能让下一个准备买车的骑友：少一点看官图猜尺码，少一点“应该差不多”的玄学，少买错一辆车，那我这段时间的折腾就算没白费。</p>
          <p><strong>免费给车友玩。</strong></p>
          <p>能少制造一个和我一样久久不能释怀的悲剧，就已经值了。</p>
        </div>

        <div className="landing-developer-about__tags" aria-label="开发者标签">
          <span>上海骑友</span><span>UX 设计狗</span><span>AI Coding</span><span>免费工具</span>
        </div>
        <footer className="landing-developer-about__signature">
          <strong>Ride more. Guess less.</strong>
          <span>Built for riders, by a rider.</span>
        </footer>
      </section>
    </div>
  );
}

export function LandingPage({ onEnterLab, transitionState = null, onTransitionComplete }) {
  const [isDeveloperAboutOpen, setIsDeveloperAboutOpen] = useState(false);
  const developerTriggerRef = useRef(null);

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
        <button
          ref={developerTriggerRef}
          className="landing-page__copyright"
          type="button"
          onClick={() => setIsDeveloperAboutOpen(true)}
        >
          ©Design By Sardine
        </button>
      </header>

      <section className="landing-page__hero" aria-labelledby="landing-page-title">
        <div className="landing-page__content-stack">
          <div className="landing-page__copy">
            <p className="landing-page__eyebrow">Understand the bike beneath the ride.</p>
            <h1 id="landing-page-title">理解几何，<br />找到属于你的那辆车</h1>
            <p className="landing-page__description">
              从车架几何、骑行姿态到配置选择，理解一辆车为何适合你。
            </p>
            <div className="landing-page__cta-wrap">
              <span className="landing-page__cta-badge">免费体验</span>
              <button className="landing-page__cta" type="button" onClick={onEnterLab}>
                进入几何实验室 <span aria-hidden="true">→</span>
              </button>
            </div>
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

      <DeveloperAboutModal
        isOpen={isDeveloperAboutOpen}
        onClose={() => setIsDeveloperAboutOpen(false)}
        returnFocusRef={developerTriggerRef}
      />
    </main>
  );
}
