import React from "react";
import "./modal.css";

interface ModalProps {
  handleClose: () => void;
  show: boolean;
  children: React.ReactNode;
  bgClass?: string;
}

const Modal: React.FC<ModalProps> = ({ handleClose, show, children, bgClass }) => {
  const showHideClassName = show ? "modal display-block" : "modal display-none";

  return (
    <div className={showHideClassName}>
      <section className={`modal-main ${bgClass ?? ""}`}>
        {children}
        <span onClick={handleClose} className="modal-close">&times;</span>
      </section>
    </div>
  );
};

export default Modal;