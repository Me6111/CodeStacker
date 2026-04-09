import React, { useRef, useState, useEffect } from 'react';
import Slider from '../../components/Sliders/Slider/Slider';
import LearnMoreButton from '../../components/Buttons/LearnMoreButton/LearnMoreButton';
import Nav from '../../components/Nav/Nav';
import MainMenu from './MainMenu/MainMenu';

import Footer from '../../Footer';

import img0 from './images/0.png';
import img1 from './images/1.png';
import img2 from './images/2.png';
import img3 from './images/3.png';

const fields = [
  {
    Image: img0,
    header1: 'Maksym Pawlowski',
    p: 'Software Developer',
    buttonLabel: 'Learn More',
    href: '/DevBusinessCard',
  },
  {
    Image: img1,
    header1: 'Perfect UI',
    p: 'Get beauty and functionality',
    buttonLabel: 'Learn More',
  },
  {
    Image: img2,
    header1: 'Solid Construction',
    p: 'Make it strong like nature itself',
    buttonLabel: 'Learn More',
  },
  {
    Image: img3,
    header1: 'Scalability',
    p: 'Make it ready to grow',
    buttonLabel: 'Learn More',
  },
];

const MainPage = () => {
  const sliderPadRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className="MainPage"
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <div
        className="field"
        style={{
          backgroundColor: 'white',
          position: 'relative',
          width: isMobile ? '0px' : '200px',
          minWidth: isMobile ? '0px' : '200px',
          height: '100%',
          opacity: isMobile ? 0 : 1,
          pointerEvents: isMobile ? 'none' : 'auto',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <MainMenu />
      </div>

      <Slider
        orientation="horizontal"
        SliderPadContent={
          <div
            ref={sliderPadRef}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              top: '0',
            }}
          >
            <Nav fieldContainer={sliderPadRef.current} />
          </div>
        }
      >
        {fields.map((field, index) => (
          <Slide key={index}>
            <div
              style={{
                width: '100%',
                height: '100%',
                background: `url(${field.Image}) no-repeat center center`,
                backgroundSize: 'cover',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              <h1 style={{ fontSize: '36px', fontWeight: 'bold' }}>
                {field.header1}
              </h1>
              <p style={{ fontSize: '18px', marginBottom: '20px' }}>{field.p}</p>
              <LearnMoreButton text={field.buttonLabel} href={field.href || '#'} />
            </div>
          </Slide>
        ))}
        <Slide>
          <Footer />
        </Slide>
      </Slider>
    </div>
  );
};

export default MainPage;