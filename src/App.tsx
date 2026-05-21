import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./projects/MainPage/MainPage";

import Components from "./projects/Stack/NodeJS/React/Components/Components";
//import SVGcreator from "./projects/SVGcreator/SVGcreator"; 
//<Route path="/SVGcreator/*" element={<SVGcreator />} />



//import SVGcreator from "./projects/SVGcreator/SVGcreator/src/"; 
import SVGCreator from "./projects/SVGcreator/src/features/svgcreator";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage orientation="vertical" />} />
        <Route path="/Stack/NodeJS/React/Components/*" element={<Components />} />

        <Route path="/SVGcreator/*" element={<SVGCreator />} />


      </Routes>
    </Router>
  );
}

export default App;

// <Route path="/" element={<MainPage orientation="vertical" />} />
/*



              <Route path="/projects/wtfd" element={<WTFD_page />} />
              <Route path="/projects/linguana" element={<Linguana_page />} />
              <Route path="/projects/metal-games" element={<ClashOfMetal_page />} />
              <Route path="/projects/tarots" element={<Tarots_page />} />
              <Route path="/projects/shop" element={<Shop_page />} />
              <Route path="/DevBusinessCard" element={<DevBusinessCard />} />
              <Route path="/Stack" element={<Stack />} />


*/