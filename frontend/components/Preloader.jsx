"use client";

export default function Preloader() {
  return (
    <div className="preloader-wrapper">
      <div className="preloader-logo">
        <span className="logo-an">AN</span>
      </div>

      <div className="preloader-bars">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className="preloader-text">
        ARTIST<span>NATION</span>
      </div>
    </div>
  );
}