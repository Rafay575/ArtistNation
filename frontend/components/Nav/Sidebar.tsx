import React from "react";
import styled from "styled-components";
import { Link } from "react-scroll";
// Assets
import CloseIcon from "../../assets/svg/CloseIcon";
import LogoIcon from "../../assets/svg/Logo";

interface SidebarProps {
  sidebarOpen: boolean;
  toggleSidebar: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, toggleSidebar }) => {
  const appName = process.env.APP_NAME;
  return (
    <Wrapper className="animate darkBg" sidebarOpen={sidebarOpen}>
      <SidebarHeader className="flexSpaceCenter">
        <div className="flexNullCenter">
          {/* <LogoIcon /> */}
          <h1 className="whiteColor font20" style={{ marginLeft: "15px" }}>
            {appName}
          </h1>
        </div>
        <CloseBtn
          onClick={() => toggleSidebar(!sidebarOpen)}
          className="animate pointer"
        >
          <CloseIcon />
        </CloseBtn>
      </SidebarHeader>

      <UlStyle>
        <li className="semiBold pointer">
          <Link
            onClick={() => toggleSidebar(!sidebarOpen)}
            activeClass="active"
            className="whiteColor font35"
            style={{ padding: "10px 15px" }}
            to="home"
            spy={true}
            smooth={true}
            offset={-60}
          >
            Home
          </Link>
        </li>
        <li className="semiBold pointer">
          <Link
            onClick={() => toggleSidebar(!sidebarOpen)}
            activeClass="active"
            className="whiteColor font35"
            style={{ padding: "10px 15px" }}
            to="aboutus"
            spy={true}
            smooth={true}
            offset={-60}
          >
            About Us
          </Link>
        </li>
        <li className="semiBold pointer">
          <Link
            onClick={() => toggleSidebar(!sidebarOpen)}
            activeClass="active"
            className="whiteColor font35"
            style={{ padding: "10px 15px" }}
            to="features"
            spy={true}
            smooth={true}
            offset={-60}
          >
            Features
          </Link>
        </li>
        <li className="semiBold pointer">
          <Link
            onClick={() => toggleSidebar(!sidebarOpen)}
            activeClass="active"
            className="whiteColor font35"
            style={{ padding: "10px 15px" }}
            to="contact"
            spy={true}
            smooth={true}
            offset={-60}
          >
            Contact Us
          </Link>
        </li>
        <li className="semiBold pointer">
          <Link
            onClick={() => toggleSidebar(!sidebarOpen)}
            activeClass="active"
            className="whiteColor font35"
            style={{ padding: "10px 15px" }}
            to="pricing"
            spy={true}
            smooth={true}
            offset={-60}
          >
            Pricing
          </Link>
        </li>
      </UlStyle>
    </Wrapper>
  );
};

const Wrapper = styled.nav<{ sidebarOpen: boolean }>`
  width: 100%;
  height: 100vh;
  position: fixed;
  top: 0;
  padding: 0 30px;
  left: 0;
  z-index: 9999;
  @media (max-width: 400px) {
    width: 100%;
  }
`;

const SidebarHeader = styled.div`
  padding: 20px 0;
`;

const CloseBtn = styled.button`
  border: 0px;
  outline: none;
  background-color: transparent;
  padding: 10px;
`;

const UlStyle = styled.ul`
  display: flex;
  flex-direction: column;
  li {
    margin: 20px 0;
  }
`;

export default Sidebar;