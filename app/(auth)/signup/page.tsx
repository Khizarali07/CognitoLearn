import SignUpForm from "@/components/SignUpForm";

export default function SignUpPage({
  searchParams,
}: {
  searchParams?: { message?: string };
}) {
  const message = searchParams?.message ?? undefined;
  return <SignUpForm message={message} />;
}
