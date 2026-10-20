import React from "react";
import styled from "styled-components";

interface BlogBoxProps {
  tag: string;
  title: string;
  text: string;
  author: string;
  action?: () => void;
}

const BlogBox: React.FC<BlogBoxProps> = ({ tag, title, text, action, author }) => {
  return (
    <WrapperBtn className="animate pointer" >
      <Wrapper className="whiteBg radius8 shadow">
        <h3 className="font20 extraBold">{title}</h3>
        <p className="font13" style={{ padding: "30px 0" }}>
          {text}
        </p>
        <p className="font13 extraBold">{author}</p>
        <div className="flex">
          <p className="tag coralBg radius6 font13 extraBold">{tag}</p>
        </div>
      </Wrapper>
    </WrapperBtn>
  );
};

const Wrapper = styled.div`
  width: 100%;
  text-align: left;
  padding: 20px 30px;
  margin-top: 30px;
`;

const WrapperBtn = styled.button`
  border: 0px;
  outline: none;
  background-color: transparent;
  :hover {
    opacity: 0.5;
  }
`;

export default BlogBox;