import {
  Bicycle,
  PersonSimpleBike,
  SlidersHorizontal,
  Armchair,
  CircleNotch,
  Database,
} from "@phosphor-icons/react";
import { moduleItems } from "../../data/bikes.js";

const icons = {
  frame: Bicycle,
  cockpit: SlidersHorizontal,
  saddle: Armchair,
  crank: CircleNotch,
  data: Database,
};

export function IconRail({ active, onChange }) {
  return (
    <aside className="icon-rail" aria-label="工具模块">
      <div className="rail-mark"><PersonSimpleBike size={24} weight="fill" /></div>
      <nav>
        {moduleItems.map((item) => {
          const Icon = icons[item.id];
          return (
            <button
              type="button"
              key={item.id}
              className={active === item.id ? "is-active" : ""}
              onClick={() => onChange(item.id)}
              aria-label={item.label}
              data-tooltip={`${item.index} ${item.label}`}
            >
              <Icon size={20} weight={active === item.id ? "fill" : "regular"} />
              <span>{item.index}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
