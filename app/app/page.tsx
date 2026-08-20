import { redirect } from "next/navigation";

/** The starter app lived at /app. Keep the path working for old links and
 *  bookmarks — the menu is the front door now. */
export default function AppPage() {
  redirect("/menu");
}
