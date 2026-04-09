import React from 'react';
import './Stack.css';


import SectionScreen from '../../components/SectionScreen/SectionScreen';


import Stack_0 from './Stack_0.jpg';
import ReadyComponentsMain from './ReadyComponents/ReadyComponentsMain.png';


const Stack = () => {
  return (
    <main>
      <SectionScreen
        id="Stack"
        Image={{item: Stack_0, stagger: true}}
        header1={{ text: "My - Stack", stagger: true }} 
        p={{ text: "How to create the best websites", stagger: true }} 
        HeaderFading={true} 
        CenteredHeader={true}

      />
      <SectionScreen
        id="readyComponents"
        Image={{item: ReadyComponentsMain, stagger: false}}
        header1={{ text: "Ready Components", stagger: true }} 
        p={{ text: "just copy and paste", stagger: true }} 
        buttonLabel={{
          text: "Explore",
          href: "/Stack/ReadyComponents",
          stagger: true
        }}
        HeaderFading={false}       
      />
      </main>
  );
};

export default Stack;