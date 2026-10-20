import React from "react";
import styled from "styled-components";

interface FullButtonProps {
  title: string;
  action?: () => void;
  border?: string;
}

const FullButton: React.FC<FullButtonProps> = ({ title, action, border }) => {
  return (
    <Wrapper
      className="animate pointer radius6"
     
      border={border}
    >
      {title}
    </Wrapper>
  );
};

const Wrapper = styled.button<{ border?: string }>`
  border: 1px solid ${(props) => (props.border ? props.border : "#4F057C")};
  background-color: ${(props) => (props.border ? "transparent" : "#fff")};
  width: 100%;
  padding: 15px 30px;
  outline: none;
  color: ${(props) => (props.border ? "#707070" : "#4F057C")};
  :hover {
    background-color: ${(props) => (props.border ? "transparent" : "#580cd2")};
    border: 1px solid #7620ff;
    color: ${(props) => (props.border ? "#7620ff" : "#fff")};
  }
`;

export default FullButton;