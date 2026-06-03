"use client";

import Icon from "@/components/Icon";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-primary no-print">
      Imprimer / PDF <Icon name="book" size={16} strokeWidth={2.2} />
    </button>
  );
}
