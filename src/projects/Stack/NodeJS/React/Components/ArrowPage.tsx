import React from "react";
import Arrow_Config from "../../../components/Icons/Arrow/Arrow.config";
import CodeShowcase from "../../../components/CodeShowcase/CodeShowcase";

function ArrowPage() {
  return (
    <div className="ArrowPage" style={{ height: "100vh", backgroundColor: "#121212" }}>
      <CodeShowcase
        component={Arrow_Config.Component}
        exampleProps={Arrow_Config.defaultProps}
        propOptions={{ direction: ["top", "bottom", "left", "right"] }}
      />
    </div>
  );
}

export default ArrowPage;