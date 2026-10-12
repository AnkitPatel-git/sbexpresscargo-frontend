import { redirect } from "next/navigation";

export default function CustomerChangePasswordRedirect() {
  redirect("/change-password");
}
