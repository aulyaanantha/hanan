export function createPanelScrollLock() {
  let activePanels = 0;
  let savedOverflow = "";
  return (body: { style: { overflow: string } }) => {
    if (activePanels++ === 0) { savedOverflow = body.style.overflow; body.style.overflow = "hidden"; }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      if (--activePanels === 0) body.style.overflow = savedOverflow;
    };
  };
}
