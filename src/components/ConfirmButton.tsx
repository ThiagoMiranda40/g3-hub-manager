import { useEffect, useRef, useState } from "react";

/**
 * Botão de exclusão com confirmação leve: o primeiro clique troca o rótulo para
 * "Confirmar exclusão?" por alguns segundos; o segundo clique executa a ação.
 */
export function ConfirmButton({
  onConfirm,
  label = "Excluir",
  confirmLabel = "Confirmar exclusão?",
  className = "",
  confirmClassName = "",
  disabled,
  title,
  timeoutMs = 4000,
}: {
  onConfirm: () => void;
  label?: string;
  confirmLabel?: string;
  className?: string;
  confirmClassName?: string;
  disabled?: boolean;
  title?: string;
  timeoutMs?: number;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setArmed(false), timeoutMs);
          return;
        }
        if (timer.current) clearTimeout(timer.current);
        setArmed(false);
        onConfirm();
      }}
      className={armed ? confirmClassName || className : className}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}
