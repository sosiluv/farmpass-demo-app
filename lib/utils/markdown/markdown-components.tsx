import React from "react";
import type { Components } from "react-markdown";

/**
 * 마크다운 렌더링을 위한 커스텀 컴포넌트 설정
 */
export const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-xl font-bold mt-6 mb-3">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold mt-5 mb-2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold mt-4 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold mt-3 mb-1">{children}</h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-sm font-medium mt-2 mb-1">{children}</h5>
  ),
  h6: ({ children }) => (
    <h6 className="text-xs font-medium mt-2 mb-1">{children}</h6>
  ),
  p: ({ children }) => <p className="mb-3">{children}</p>,
  ul: ({ children }) => <ul className="list-disc ml-4 mb-3">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal ml-4 mb-3">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children, className }) => {
    const isInline = !className;
    return isInline ? (
      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
        {children}
      </code>
    ) : (
      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
        <code>{children}</code>
      </pre>
    );
  },
  a: ({ children, href }) => (
    <a
      href={href || "#"}
      className="text-blue-600 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-3">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-gray-300" />,
};
