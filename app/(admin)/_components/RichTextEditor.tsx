import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// Dynamically import ReactQuill and Register ImageResize
const QuillEditor = dynamic(async () => {
    const { default: ReactQuill, Quill } = await import("react-quill-new");
    const { default: ImageResize } = await import("quill-image-resize-module-react");

    (window as any).Quill = Quill; // Needed for quill-image-resize-module-react
    Quill.register("modules/imageResize", ImageResize);

    return function ForwardedReactQuill(props: any) {
        return <ReactQuill {...props} />;
    };
}, { ssr: false, loading: () => <div className="h-[300px] flex items-center justify-center bg-slate-50 text-slate-400">Loading editor...</div> });

export interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const modules = useMemo(() => ({
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet", indent: "-1" }, { indent: "+1" }],
            [{ align: [] }],
            ["link", "image"],
            ["clean"],
        ],
        imageResize: {
            parchment: {
                image: {
                    attribute: ['width', 'height']
                }
            },
            modules: ['Resize', 'DisplaySize', 'Toolbar']
        }
    }), []);

    return (
        <div className="bg-white rounded-md mb-8 pb-10">
            <style jsx global>{`
                .ql-editor img {
                    max-width: 100%;
                    height: auto;
                }
            `}</style>
            <QuillEditor
                theme="snow"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={{ height: "300px" }}
                modules={modules}
            />
        </div>
    );
}