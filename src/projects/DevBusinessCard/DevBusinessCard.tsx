import './DevBusinessCard.css';

import SectionScreen from '../../components/SectionScreen/SectionScreen';

import Img_1 from './Img_1.png';

import Img_2_1 from './Img_2_1.png';
import Img_2_2 from './Img_2_2.png';
import Img_2_3 from './Img_2_3.png';

import Stack_0 from './Stack_0.jpg';




const DevBusinessCard = () => {
  return (
    <main>


      <SectionScreen
        id="DevBusinessCard"
        Image={{item:Img_1, stagger: true}}
        header1={{ text: "Maksym Pawlowski", stagger: true }} 
        p={{ text: "Software developer", stagger: true }} 
        HeaderFading={true} 
      />


      <SectionScreen
        id="RecentProjects"
        //header1={{ text: "Recent Updates", stagger: true }}
        HeaderFading={true}
        

        childrenSections={[
          <SectionScreen
            key="Project1"
            id="Project1"
            header1={{ text: "Linguana", stagger: true }}
            p={{ text: "New main page", stagger: true }}
            buttonLabel={{
              text: "View Project",
              href: "#",
              stagger: true
            }}
            Image={{ item: Img_2_1 }}
          />,
          <SectionScreen
            key="Project1"
            id="Project1"
            header1={{ text: "WTFD", stagger: true }}
            p={{ text: "New main page", stagger: true }}
            buttonLabel={{
              text: "View Project",
              href: "",
              stagger: true
            }}
            Image={{ item: Img_2_2 }}
          />,
          <SectionScreen
            key="Project1"
            id="Project1"
            header1={{ text: "Dev businesscard website", stagger: true }}
            p={{ text: "New main page", stagger: true }}
            buttonLabel={{
              text: "View Project",
              href: "#",
              stagger: true
            }}
            Image={{ item: Img_2_3 }}
          />,

        ]}
      />

      <SectionScreen
        key="Project1"
        id="Project1"
        header1={{ text: "My Stack", stagger: true }}
        p={{ text: "How to write very good quality website", stagger: true }}
        buttonLabel={{
          text: "Learn More",
          href: "/Stack",
          stagger: true
        }}
        Image={{ item: Stack_0 }}
      />
      <SectionScreen
        id="Reviews"
        header1={{ text: "Reviews", stagger: true }}
        HeaderFading={false}
      />
      <SectionScreen
        id="Contact"
        header1={{ text: "Contact", stagger: true }}
        HeaderFading={false}
      />
    </main>
  );
};

export default DevBusinessCard;
