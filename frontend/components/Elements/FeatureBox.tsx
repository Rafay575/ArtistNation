import React from "react";
import styled from "styled-components";
// Assets
import CatalogIcon from "../../assets/svg/features/catalog";
import ContentIcon from "../../assets/svg/features/content";
import EventsIcon from "../../assets/svg/features/events";
import MerchandiseIcon from "../../assets/svg/features/merchandise";
import ProfileIcon from "../../assets/svg/features/profile";
import PhotoGalleryIcon from "../../assets/svg/features/photo-gallery";

interface FeatureBoxProps {
  icon: string;
  title: string;
  subtitle: string;
}

const FeatureBox: React.FC<FeatureBoxProps> = ({ icon, title, subtitle }) => {
  let getIcon;

  switch (icon) {
    case "catalog":
      getIcon = <CatalogIcon />;
      break;
    case "content":
      getIcon = <ContentIcon />;
      break;
    case "events":
      getIcon = <EventsIcon />;
      break;
    case "merchandise":
      getIcon = <MerchandiseIcon />;
      break;
    case "profile":
      getIcon = <ProfileIcon />;
      break;
    case "photo-gallery":
      getIcon = <PhotoGalleryIcon />;
      break;
    default:
      getIcon = <CatalogIcon />;
      break;
  }

  return (
    <Wrapper className="flex flexColumn">
      <IconStyle>{getIcon}</IconStyle>
      <TitleStyle className="font18 extraBold">{title}</TitleStyle>
      <SubtitleStyle className="font13">{subtitle}</SubtitleStyle>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  padding: 30px;
  width: 100%;
  @media (max-width: 468px) {
    padding: 10px;
  }
`;

const IconStyle = styled.div`
  @media (max-width: 860px) {
    margin: 0 auto;
  }
`;

const TitleStyle = styled.h2`
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  padding: 20px 0;
  margin-top: 12px;
  @media (max-width: 860px) {
    padding: 20px 0;
  }
`;

const SubtitleStyle = styled.p`
  width: 100%;
  margin: 0 auto;
  font-family: Inter;
  font-size: 16px;
  font-weight: 400;
  line-height: 25px;
  letter-spacing: 0px;
  text-align: center;
`;

export default FeatureBox;