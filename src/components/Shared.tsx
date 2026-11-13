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
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <Box size={large ? 64 : 24} aria-label="暂无照片" />
      )}
    </span>
  );
}
let modalLocks = 0;
let originalBodyOverflow = "";

export function Modal({
  title,
  children,
  onClose,
  wide = false,
  className = "",
  id,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (modalLocks++ === 0) {
      originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    dialog.showModal();
    return () => {
      dialog.close();
      if (--modalLocks === 0)
        document.body.style.overflow = originalBodyOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      id={id}
      className={`dialog ${wide ? "wide" : ""} ${className}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
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
      aria-labelledby={titleId}
    >
      <div className="dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="关闭"
          autoFocus
        >
          <X size={20} />
        </button>
      </div>
      {className === "device-dialog" ? (
        <div className="dialog-content">{children}</div>
      ) : (
        children
      )}
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
  const [position, setPosition] = useState({ left: 16, top: 16 });

  function positionTooltip(button: HTMLElement) {
    const bounds = button.getBoundingClientRect();
    const width = Math.min(272, window.innerWidth - 32);
    const left = Math.max(
      16,
      Math.min(bounds.left - width * 0.3, window.innerWidth - width - 16),
    );
    const top =
      window.innerHeight - bounds.bottom > 160
        ? bounds.bottom + 8
        : Math.max(16, bounds.top - 160);
    setPosition({ left, top });
  }

  return (
    <span className={`cost-help ${open ? "is-open" : ""}`}>
      <button
        type="button"
        aria-label="日均成本计算说明"
        aria-describedby={id}
        aria-expanded={open}
        onPointerEnter={(event) => positionTooltip(event.currentTarget)}
        onFocus={(event) => positionTooltip(event.currentTarget)}
        onClick={(event) => {
          positionTooltip(event.currentTarget);
          setOpen(!open);
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            event.preventDefault();
            setOpen(false);
            event.currentTarget.blur();
          }
        }}
      >
        <Info size={14} />
      </button>
      <span
        id={id}
        className="cost-help-tooltip"
        role="tooltip"
        style={position}
      >
        日均 =（购入 + 已发生追加 − 已回收金额）÷ 使用天数。购入当天至少计 1
        天；停用后回收不增加天数。
      </span>
    </span>
  );
}
