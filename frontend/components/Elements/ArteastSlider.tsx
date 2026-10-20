import React from "react";
import Slider from "react-slick";
import styled from "styled-components";
// Assets
import logo01 from "../../assets/img/arteasts/dua-lipa.png"
import logo02 from "../../assets/img/arteasts/justin-bieber.png"
import logo03 from "../../assets/img/arteasts/javier.png"
import logo04 from "../../assets/img/arteasts/tayler.png"


export default function ArteastSlider() {
  const settings = {
    infinite: true,
    autoplaySpeed: 2000,
    autoplay: false,
    slidesToShow: 4,
    slidesToScroll: 1,
    cssEase: "linear",
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll:1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };
  return (
    <div className="mt-[4rem]">
      <Slider {...settings}>
        <LogoWrapper className="flexCenter">
          <ImgStyle src={logo01.src} alt="client logo" />
        </LogoWrapper>
        <LogoWrapper className="flexCenter">
          <ImgStyle src={logo03.src} alt="client logo" />
        </LogoWrapper>
        <LogoWrapper className="flexCenter">
          <ImgStyle src={logo02.src} alt="client logo" />
        </LogoWrapper>
        <LogoWrapper className="flexCenter">
          <ImgStyle src={logo03.src} alt="client logo" />
        </LogoWrapper>
        <LogoWrapper className="flexCenter">
          <ImgStyle src={logo01.src} alt="client logo" />
        </LogoWrapper>
        <LogoWrapper className="flexCenter">
          <ImgStyle src={logo03.src} alt="client logo" />
        </LogoWrapper>
        <LogoWrapper className="flexCenter">
          <ImgStyle src={logo02.src} alt="client logo" />
        </LogoWrapper>
        <LogoWrapper className="flexCenter">
          <ImgStyle src={logo01.src} alt="client logo" />
        </LogoWrapper>
      </Slider>
    </div>
  );
}

const LogoWrapper = styled.div`
  width: 100%;
  cursor: pointer;
  :focus-visible {
    outline: none;
    border: 0px;
  }
`;
const ImgStyle = styled.img`
  width: 100%;
  height: 100%;
  padding: 0;
`;