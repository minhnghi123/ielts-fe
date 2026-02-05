import { redirect } from "next/navigation";

export default function PracticeRedirectPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    // Generate a random ID for the test session if none provided
    const randomId = Math.floor(Math.random() * 1000000).toString();
    const moduleParam = searchParams.module;

    if (moduleParam) {
        redirect(`/practice/${randomId}?module=${moduleParam}`);
    } else {
        redirect(`/practice/${randomId}`);
    }
}
