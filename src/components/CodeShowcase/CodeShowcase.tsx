import React, {
  useState,
  useEffect,
  ReactElement,
  isValidElement,
  cloneElement,
} from "react";
import CodeBlock from "../CodeBlock/CodeBlock";
import PropsEditor from "./PropsEditor";

export type InputSetter<T> = (value: T | "") => void;

export interface InputField<T> {
  name: string;
  value: T | "";
  setter: InputSetter<T>;
  options?: (string | number)[];
  isNumber?: boolean;
}

interface CodeShowcaseProps<T> {
  component: React.ComponentType<T>;
  exampleProps: T;
  propOptions?: { [K in keyof T]?: (string | number)[] };
}

const CodeShowcase = <T extends {}>({
  component: Component,
  exampleProps,
  propOptions = {},
}: CodeShowcaseProps<T>) => {
  const schema: InputField<any>[] = Object.entries(exampleProps).map(
    ([key, value]) => ({
      name: key,
      value,
      setter: () => {},
      isNumber: typeof value === "number",
      options: propOptions[key as keyof T],
    })
  );

  const [propsState, setPropsState] = useState<Partial<T>>(
    Object.fromEntries(schema.map((f) => [f.name, f.value]))
  );

  const [isDesktop, setIsDesktop] = useState<boolean>(
    window.innerWidth >= 1024
  );

  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");

  useEffect(() => {
    const onResize = () =>
      setIsDesktop(window.innerWidth >= 1024);

    window.addEventListener("resize", onResize);

    return () =>
      window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const componentName =
      Component.displayName ||
      Component.name ||
      "Component";

    const propStrings = Object.entries(propsState)
      .filter(([, v]) => v !== "" && v !== undefined)
      .map(([key, value]) =>
        typeof value === "string"
          ? `  ${key}="${value}"`
          : `  ${key}={${value}}`
      );

    setCode(
      `<${componentName}\n${propStrings.join("\n")}\n/>`
    );
  }, [propsState, Component]);

  const fields: InputField<any>[] = schema.map((field) => ({
    ...field,
    value: propsState[field.name] ?? "",
    setter: (value: any) =>
      setPropsState((prev) => ({
        ...prev,
        [field.name]: value,
      })),
  }));

  const renderedElement: ReactElement = (
    <Component {...(propsState as T)} />
  );

  const elementWithClass =
    isValidElement(renderedElement)
      ? cloneElement(renderedElement, {
          className: `${
            renderedElement.props.className ?? ""
          } RENDEREDINNER`.trim(),
        })
      : renderedElement;

  return (
    <div
      className="CodeShowcase_Outer"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#000",
        color: "#fff",
        boxSizing: "border-box",
      }}
    >
      <div
        className="CodeShowcase_Title"
        style={{
          flex: "0 0 10%",
          display: "flex",
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: "1px solid #222",
          boxSizing: "border-box",
        }}
      >
        <h2
          style={{
            margin: 0,
          }}
        >
          {Component.displayName || Component.name}
        </h2>
      </div>

      <div
        className="CodeShowcase_Content"
        style={{
          backgroundColor: "darkBlue",

          width: "100%",
          height: "100%", 

          display: "flex",
          flexDirection: isDesktop ? "row" : "column",

          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: 1,
            border: "1px solid #222",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "auto",
          }}
        >
          {elementWithClass}
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() =>
              setShowCode((v) => !v)
            }
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid #555",
              backgroundColor: "#111",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {showCode
              ? "Show Settings"
              : "Show Code"}
          </button>

          {showCode ? (
            <div
              style={{
                flex: 1,
                overflow: "auto",
              }}
            >
              <CodeBlock
                code={code}
                language="tsx"
              />
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                overflow: "auto",
              }}
            >
              <PropsEditor fields={fields} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeShowcase;