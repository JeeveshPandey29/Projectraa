export const dynamic = "force-dynamic";

import ResetPasswordClient from "./reset-password-client";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { oobCode?: string };
}) {
  return (
    <ResetPasswordClient oobCode={searchParams.oobCode ?? null} />
  );
}
