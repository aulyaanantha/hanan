"use client";
import { useEffect, useState } from "react";
export default function PlaceUploadPreview({ file }: { file: File | null }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const timer = setTimeout(() => setUrl(objectUrl), 0);
    return () => { clearTimeout(timer); URL.revokeObjectURL(objectUrl); };
  }, [file]);
  if (!file) return null;
  return <div className="places-upload-preview" key={file.name}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {url && <img src={url} alt="Selected photo preview" />}
    <div><p>{file.name}</p><span>{(file.size / 1024 / 1024).toFixed(1)} MB · Ready to upload</span></div>
  </div>;
}
