import { createFileRoute } from "@tanstack/react-router";
import { RouterConsole } from "@/components/router-console";

export const Route = createFileRoute("/")({ component: RouterConsole });
