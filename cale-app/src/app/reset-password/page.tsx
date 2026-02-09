import ResetPasswordForm from './ResetPasswordForm';

export const dynamic = 'force-dynamic';

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = typeof params?.token === 'string' ? params.token : '';

  return <ResetPasswordForm token={token} />;
}
