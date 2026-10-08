export function printPdf(bytes: Uint8Array) {
  const url = URL.createObjectURL(new Blob([Uint8Array.from(bytes)], { type: "application/pdf" }));
  const frame = document.createElement("iframe");
  frame.className = "print-frame";
  frame.src = url;
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
  };
  document.body.append(frame);
  setTimeout(() => {
    frame.remove();
    URL.revokeObjectURL(url);
  }, 120_000);
}
