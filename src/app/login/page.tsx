import { authProviderServer } from "@providers/auth-provider/auth-provider.server";
import { redirect } from "next/navigation";
import LoginClient from "./login-client";

export default async function Login() {
  const data = await getData();
  
  if (data.authenticated) {
    redirect(data?.redirectTo || "/");
  }
  
  return <LoginClient />;
}

async function getData() {
  const { authenticated, redirectTo, error } = await authProviderServer.check();
  
  return {
    authenticated,
    redirectTo,
    error,
  };
}