import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Box, Info, X } from "lucide-react";
import { productImage, type Device } from "../lib/model";
export function Photo({
  device,
  large = false,
}: {
  device: Device;
  large?: boolean;
}) {
  const src = productImage(device);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <span className={`photo ${large ? "photo-large" : ""}`}>
      {src && !failed ? (
        <img src={src} alt={device.name} onError={() => setFailed(true)} />
      ) : (
        <Box size={large ? 64 : 24} aria-label="暂无照片" />
      )}
    </span>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = old;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={wide ? "dialog wide" : "dialog"}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const rect = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            onClose();
        }
      }}
      aria-labelledby="dialog-title"
    >
      <div className="dialog-heading">
        <h2 id="dialog-title">{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="关闭">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          aria-pressed={value === o.value}
          className={value === o.value ? "selected" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function CostHelp() {
  const id = useId();
  const [open, setOpen] = useState(false);
  return <span className={`cost-help ${open ? "is-open" : ""}`}>
    <button type="button" aria-label="日均成本计算说明" aria-describedby={id} aria-expanded={open}
      onClick={() => setOpen(!open)} onBlur={() => setOpen(false)} onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
      <Info size={14} />
    </button>
    <span id={id} className="cost-help-tooltip" role="tooltip">
      日均 =（购入 + 已发生追加 − 已回收金额）÷ 使用天数。购入当天至少计 1 天；停用后回收不增加天数。
    </span>
  </span>;
}
