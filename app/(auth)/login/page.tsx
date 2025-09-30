import LoginForm from "@/components/LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { message?: string };
}) {
  const message = searchParams?.message ?? undefined;
  return <LoginForm message={message} />;
}
