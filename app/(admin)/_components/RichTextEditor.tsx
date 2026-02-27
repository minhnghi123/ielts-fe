import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";

export interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const QuillEditor = useMemo(
        () => dynamic(() => import("react-quill-new"), { ssr: false }),
        []
    );

    return (
        <div className="bg-white rounded-md mb-8 pb-10">
            <QuillEditor
                theme="snow"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={{ height: "300px" }}
                modules={{
                    toolbar: [
                        [{ header: [1, 2, 3, 4, 5, 6, false] }],
                        ["bold", "italic", "underline", "strike"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["link", "image"],
                        ["clean"],
                    ],
                }}
            />
        </div>
    );
}